import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
import { straightRiggingPath } from '../../architecture/rigging-geometry.js';

export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
 const {part,beam,materials}=ctx;
 const mastStation=.5+mast.z;
 const standing=part('standing-rigging-'+mast.id,mastGroup);
 const shrouds=part('shrouds-'+mast.id,standing);
 const ratlines=part('ratlines-'+mast.id,standing);
 const stays=part('mast-stays-'+mast.id,standing);
 // Retain the explicit group for editor compatibility. The actual aft stays
 // are the two adjustable running backstays below; fixed duplicates are not
 // added because they clutter the cutter rig and do not serve a second purpose.
 const backstays=part('backstays-'+mast.id,stays);
 const chainplates=part('chainplates-'+mast.id,standing);
 const runningBackstays=part('running-backstays-'+mast.id,standing);
 const localZ=station=>stationZ(d,station,1)-z;
 const localY=station=>deckY(d,station)-baseY;
 const markStay=(line,points,radius,segments)=>{
  if(!line)return null;
  line.userData.dynamicMastStay={mastId:mast.id,coordinateSpace:'mast-group',
   points:points.map(point=>point.toArray()),fixedEndIndex:points.length-1,
   fixedPoint:points[points.length-1].toArray(),radius,segments,radialSegments:7};
  return line;
 };
 const houndsY=lowerHeight*.91,upperX=.075;
 const foreStation=Math.max(.07,mastStation-.055),aftStation=Math.min(.92,mastStation+.06);
 const foreZ=localZ(foreStation),aftZ=localZ(aftStation);
 const foreY=localY(foreStation)+.06,aftY=localY(aftStation)+.06;
 const foreRail=halfBreadth(d,foreStation)*.86,aftRail=halfBreadth(d,aftStation)*.86;

 // Two shroud leads per side, both tensioned directly to separate chainplates.
 // Straight spans avoid the slack-looking Catmull-Rom bends in the old build.
 for(const side of [-1,1]){
  const foreTop=V(side*upperX,houndsY,-.12),aftTop=V(side*upperX,houndsY,.12);
  const foreFoot=V(side*foreRail,foreY,foreZ),aftFoot=V(side*aftRail,aftY,aftZ);
  markStay(straightRiggingPath(ctx,shrouds,[foreTop,foreFoot],.010,materials.rope,
   'maid-of-endor-forward-shroud-'+side,34),[foreTop,foreFoot],.010,34);
  markStay(straightRiggingPath(ctx,shrouds,[aftTop,aftFoot],.010,materials.rope,
   'maid-of-endor-after-shroud-'+side,34),[aftTop,aftFoot],.010,34);
  beam(chainplates,V(side*(foreRail+.012),foreY-.18,foreZ),
   V(side*(foreRail+.012),foreY+.04,foreZ),.010,materials.iron,'shroud-chainplate-forward-'+side,7);
  beam(chainplates,V(side*(aftRail+.012),aftY-.18,aftZ),
   V(side*(aftRail+.012),aftY+.04,aftZ),.010,materials.iron,'shroud-chainplate-after-'+side,7);

  // A restrained six-rung ladder on each side, between the forward and aft
  // shrouds. The rungs are small straight spans, not sagging rope curves.
  for(let r=0;r<(d.structure.ratlines??6);r++){
   const q=(r+1)/((d.structure.ratlines??6)+1);
   const y=foreY+(houndsY-foreY)*q;
   const x1=foreRail+(upperX-foreRail)*q,x2=aftRail+(upperX-aftRail)*q;
   const z1=foreZ+(-.12-foreZ)*q,z2=aftZ+(.12-aftZ)*q;
   beam(ratlines,V(side*x1,y,z1),V(side*x2,y,z2),.0045,materials.rope,'mast-ratline-'+side+'-'+r,6);
  }
 }

 // One working running backstay to each quarter. The old generator made both
 // a fixed standing backstay and a running backstay on the same side, creating
 // duplicate parallel cables. Keep only the controllable pair.
 const backstayStation=.91,backstayZ=localZ(backstayStation);
 const backstayY=localY(backstayStation)+.055;
 const backstayRail=halfBreadth(d,backstayStation)*.84;
 const tackleGroup=part('backstay-chainplates-'+mast.id,standing);
 for(const side of [-1,1]){
  const running=part('running-backstay-'+(side<0?'port':'starboard'),runningBackstays);
  const head=V(side*.085,totalHeight*.985,.015);
  const foot=V(side*backstayRail,backstayY,backstayZ);
  markStay(straightRiggingPath(ctx,running,[head,foot],.009,materials.rope,
   'running-backstay-line-'+side,36),[head,foot],.009,36);
  beam(tackleGroup,V(side*(backstayRail+.012),backstayY-.17,backstayZ),
   V(side*(backstayRail+.012),backstayY+.045,backstayZ),.010,materials.iron,
   'running-backstay-chainplate-'+side,7);
  beam(running,V(side*backstayRail,backstayY+.015,backstayZ),
   V(side*backstayRail,backstayY+.10,backstayZ),.014,materials.brass,
   'running-backstay-tackle-'+side,7);
 }
 backstays.userData.role='running-backstay-routing-group';
 standing.userData.riggingType='maid-of-endor-gaff-cutter-rig';
 standing.userData.fixedBackstayCount=0;
 standing.userData.runningBackstayCount=2;
 standing.userData.runningBackstays=true;
}

export function buildStandingRiggingForMast(d,ctx,mast){
 const mastGroup=ctx.registry.get('mast-'+mast.id);
 const config=mastGroup?.userData.mastRiggingConfig;
 if(!mastGroup||!config)throw new Error('sloop-v2: mast rigging requires a completed mast assembly for '+mast.id);
 return buildStandingRigging(d,ctx,mast,mastGroup,config.z,config.baseY,config.totalHeight,config.lowerHeight);
}
