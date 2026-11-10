import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
 const {part,tube,beam,materials,V}=ctx;
 const mastStation=0.5+mast.z;
 const standing=part('standing-rigging-'+mast.id,mastGroup);
 const shrouds=part('shrouds-'+mast.id,standing);
 const ratlines=part('ratlines-'+mast.id,standing);
 const stays=part('mast-stays-'+mast.id,standing);
 const backstays=part('backstays-'+mast.id,standing);
 const railX=halfBreadth(d,mastStation)*.82;
 const pairs=d.structure.shroudPairs??2;
 const deckLocalY=deckY(d,mastStation)-baseY+.22;

 // Port and starboard shrouds run from the topmast to separate channels at
 // the working gunwale; the ratlines stay in the same mast-local frame.
 for(const side of [-1,1]){
  for(let pair=0;pair<pairs;pair++){
   const spread=pairs<=1?0:pair/(pairs-1)-.5;
   const attachZ=spread*d.beamUnits*.18;
   tube(shrouds,[
    V(side*.08,totalHeight-.10,0),
    V(side*.23,lowerHeight*.58,spread*d.beamUnits*.07),
    V(side*railX,deckLocalY,attachZ)
   ],.016,materials.rope,'standing-shroud-'+side+'-'+pair,28);
  }
 }

 const ratlineCount=d.structure.ratlines??9;
 for(let r=0;r<ratlineCount;r++){
  const y=lowerHeight*(r+1)/(ratlineCount+1);
  const half=railX*.48;
  beam(ratlines,V(-half,y,0),V(half,y,0),.010,materials.rope,'ratline-'+r);
 }

 // Forestay and paired aft backstays triangulate the single mast.
 const bowspritLength=(d.bowspritLength??2.7)*(4/3);
 const bowZ=stationZ(d,.012,1)-bowspritLength-z;
 const bowY=deckY(d,.035)+.22-baseY;
 tube(stays,[V(0,totalHeight-.05,0),V(0,bowY,bowZ)],.016,materials.rope,'forestay-single',36);

 const aftStation=Math.min(.96,mastStation+.28);
 const aftZ=stationZ(d,aftStation,1)-z;
 const aftY=deckY(d,aftStation)-baseY+.16;
 const aftRail=halfBreadth(d,aftStation)*.72;
 for(const side of [-1,1]){
  tube(backstays,[V(0,totalHeight*.98,0),V(side*aftRail,aftY,aftZ)],.014,materials.rope,
   'backstay-'+(side<0?'port':'starboard'),32);
 }
}
