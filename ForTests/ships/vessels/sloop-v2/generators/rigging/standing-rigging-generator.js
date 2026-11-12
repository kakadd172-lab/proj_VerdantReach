import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';

/**
 * Sloop V2 standing rigging. The stay endpoints use the mast's component frame:
 * masthead pivots can move, while fixed deck attachments remain hull-anchored.
 */
export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
 const {part,tube,beam,materials}=ctx;
 const mastStation=.5+mast.z;
 const standing=part('standing-rigging-'+mast.id,mastGroup);
 const shrouds=part('shrouds-'+mast.id,standing);
 const ratlines=part('ratlines-'+mast.id,standing);
 const mastStays=part('mast-stays-'+mast.id,standing);
 const backstays=part('backstays-'+mast.id,mastStays);
 const chainplates=part('chainplates-'+mast.id,standing);
 const localZ=station=>stationZ(d,station,1)-z;
 const deckLocalY=station=>deckY(d,station)-baseY;
 const markStay=(line,points,radius,segments)=>{
  line.userData.dynamicMastStay={
   mastId:mast.id,coordinateSpace:'mast-group',
   points:points.map(point=>point.toArray()),
   fixedEndIndex:points.length-1,
   fixedPoint:points[points.length-1].toArray(),
   radius,segments,radialSegments:7
  };
  return line;
 };
 const houndsY=lowerHeight*.92,upperX=.085;
 const foreStation=Math.max(.08,mastStation-.055),aftStation=Math.min(.90,mastStation+.055);
 const foreZ=localZ(foreStation),aftZ=localZ(aftStation);
 const foreY=deckLocalY(foreStation)+.08,aftY=deckLocalY(aftStation)+.08;
 const foreRail=halfBreadth(d,foreStation)*.84,aftRail=halfBreadth(d,aftStation)*.84;

 for(const side of [-1,1]){
  const foreTop=V(side*upperX,houndsY,-.15),aftTop=V(side*upperX,houndsY,.15);
  const foreFoot=V(side*foreRail,foreY,foreZ),aftFoot=V(side*aftRail,aftY,aftZ);
  markStay(tube(shrouds,[foreTop,foreFoot],.015,materials.rope,
   'sloop-v2-standing-shroud-'+(side<0?'port':'starboard')+'-forward',36),
   [foreTop,foreFoot],.015,36);
  markStay(tube(shrouds,[aftTop,aftFoot],.015,materials.rope,
   'sloop-v2-standing-shroud-'+(side<0?'port':'starboard')+'-after',36),
   [aftTop,aftFoot],.015,36);

  beam(chainplates,V(side*(foreRail+.012),foreY-.34,foreZ),
   V(side*(foreRail+.012),foreY+.09,foreZ),.017,materials.iron,'sloop-v2-chainplate-forward-'+side,7);
  beam(chainplates,V(side*(aftRail+.012),aftY-.34,aftZ),
   V(side*(aftRail+.012),aftY+.09,aftZ),.017,materials.iron,'sloop-v2-chainplate-after-'+side,7);

  const count=d.structure.ratlines??8;
  for(let r=0;r<count;r++){
   const t=(r+1)/(count+1),y=foreY+(houndsY-foreY)*t;
   const xFore=foreRail+(upperX-foreRail)*t,xAft=aftRail+(upperX-aftRail)*t;
   const zFore=foreZ+(-.15-foreZ)*t,zAft=aftZ+(.15-aftZ)*t;
   beam(ratlines,V(side*xFore,y,zFore),V(side*xAft,y,zAft),.007,
    materials.rope,'sloop-v2-ratline-'+side+'-'+r,7);
  }
 }

 const backstayStation=Math.min(.955,mastStation+.36);
 const backstayZ=localZ(backstayStation),backstayY=deckLocalY(backstayStation)+.10;
 const backstayRail=halfBreadth(d,backstayStation)*.82;
 const backstayPlates=part('backstay-chainplates-'+mast.id,standing);
 for(const side of [-1,1]){
  const head=V(side*.105,totalHeight*.985,0);
  const foot=V(side*backstayRail,backstayY,backstayZ);
  markStay(tube(backstays,[head,foot],.015,materials.rope,
   'sloop-v2-backstay-'+(side<0?'port':'starboard'),40),[head,foot],.015,40);
  beam(backstayPlates,V(side*(backstayRail+.012),backstayY-.32,backstayZ),
   V(side*(backstayRail+.012),backstayY+.08,backstayZ),.017,materials.iron,
   'sloop-v2-backstay-chainplate-'+side,7);
 }
 standing.userData.riggingType='sloop-v2-gaff-standing-rig';
 standing.userData.backstayCount=2;
}
