import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';

export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
 const {part,tube,beam,materials}=ctx;
 const mastStation=.5+mast.z;
 const standing=part('standing-rigging-'+mast.id,mastGroup);
 const shrouds=part('shrouds-'+mast.id,standing);
 const ratlines=part('ratlines-'+mast.id,standing);
 const stays=part('mast-stays-'+mast.id,standing);
 const backstays=part('backstays-'+mast.id,stays);
 const chainplates=part('chainplates-'+mast.id,standing);
 const runningBackstays=part('running-backstays-'+mast.id,standing);
 const localZ=station=>stationZ(d,station,1)-z;
 const localY=station=>deckY(d,station)-baseY;
 const markStay=(line,points,radius,segments)=>{
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
 for(const side of [-1,1]){
  const foreTop=V(side*upperX,houndsY,-.12),aftTop=V(side*upperX,houndsY,.12);
  const foreFoot=V(side*foreRail,foreY,foreZ),aftFoot=V(side*aftRail,aftY,aftZ);
  markStay(tube(shrouds,[foreTop,foreFoot],.012,materials.rope,
   'maid-of-endor-forward-shroud-'+side,34),[foreTop,foreFoot],.012,34);
  markStay(tube(shrouds,[aftTop,aftFoot],.012,materials.rope,
   'maid-of-endor-after-shroud-'+side,34),[aftTop,aftFoot],.012,34);
  beam(chainplates,V(side*(foreRail+.012),foreY-.20,foreZ),
   V(side*(foreRail+.012),foreY+.06,foreZ),.012,materials.iron,'shroud-chainplate-forward-'+side,7);
  beam(chainplates,V(side*(aftRail+.012),aftY-.20,aftZ),
   V(side*(aftRail+.012),aftY+.06,aftZ),.012,materials.iron,'shroud-chainplate-after-'+side,7);
  for(let r=0;r<(d.structure.ratlines??6);r++){
   const q=(r+1)/((d.structure.ratlines??6)+1);
   const y=foreY+(houndsY-foreY)*q;
   const x1=foreRail+(upperX-foreRail)*q,x2=aftRail+(upperX-aftRail)*q;
   const z1=foreZ+(-.12-foreZ)*q,z2=aftZ+(.12-aftZ)*q;
   beam(ratlines,V(side*x1,y,z1),V(side*x2,y,z2),.006,materials.rope,'mast-ratline-'+side+'-'+r,7);
  }
 }
 // Fixed standing backstays and separate running backstays lead aft from the
 // raked mast to the quarters, as shown on the cutter rig plan.
 const backstayStation=.87,backstayZ=localZ(backstayStation);
 const backstayY=localY(backstayStation)+.07,backstayRail=halfBreadth(d,backstayStation)*.82;
 const backstayPlates=part('backstay-chainplates-'+mast.id,standing);
 for(const side of [-1,1]){
  const head=V(side*.09,totalHeight*.97,0),foot=V(side*backstayRail,backstayY,backstayZ);
  markStay(tube(backstays,[head,foot],.012,materials.rope,'standing-backstay-'+side,36),[head,foot],.012,36);
  beam(backstayPlates,V(side*(backstayRail+.012),backstayY-.22,backstayZ),
   V(side*(backstayRail+.012),backstayY+.06,backstayZ),.012,materials.iron,'backstay-chainplate-'+side,7);
  const running=part('running-backstay-'+(side<0?'port':'starboard'),runningBackstays);
  const runningFoot=V(side*halfBreadth(d,.94)*.80,localY(.94)+.07,localZ(.94));
  const runningHead=V(side*.10,totalHeight*.985,.03);
  markStay(tube(running,[runningHead,runningFoot],
   .010,materials.rope,'running-backstay-line-'+side,36),
   [runningHead,runningFoot],.010,36);
  beam(running,V(side*halfBreadth(d,.94)*.80,localY(.94)+.02,localZ(.94)),
   V(side*halfBreadth(d,.94)*.80,localY(.94)+.13,localZ(.94)),.018,materials.brass,'running-backstay-tackle-'+side,8);
 }
 standing.userData.riggingType='maid-of-endor-gaff-cutter-rig';
 standing.userData.backstayCount=2;
 standing.userData.runningBackstays=true;
}
