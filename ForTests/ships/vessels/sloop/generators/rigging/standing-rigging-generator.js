import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
 const {part,tube,beam,materials,V}=ctx;
 const mastStation=.5+mast.z;
 const standing=part('standing-rigging-'+mast.id,mastGroup);
 const shrouds=part('shrouds-'+mast.id,standing);
 const ratlines=part('ratlines-'+mast.id,standing);
 const mastStays=part('mast-stays-'+mast.id,standing);
 const backstays=part('backstays-'+mast.id,mastStays);
 const railX=halfBreadth(d,mastStation)*.82;
 const pairs=Math.max(2,d.structure.shroudPairs??2);
 const maxSpread=d.beamUnits*.09;
 const deckLocalY=deckY(d,mastStation)-baseY+.22;

 // Port and starboard shrouds run from the mast hounds to separate channels.
 for(const side of [-1,1]){
  for(let pair=0;pair<pairs;pair++){
   const spread=pairs===1?0:(pair/(pairs-1)-.5)*2;
   const attachZ=spread*maxSpread;
   tube(shrouds,[V(side*.08,totalHeight-.10,0),V(side*railX,deckLocalY,attachZ)],
    .014,materials.rope,'standing-shroud-'+side+'-'+pair,28);
  }

  // Ratlines form two short ladders between the shrouds on each side.
  const count=d.structure.ratlines??9;
  for(let r=0;r<count;r++){
   const y=deckLocalY+(lowerHeight-deckLocalY)*(r+1)/(count+1);
   const t=Math.max(0,Math.min(1,(y-deckLocalY)/Math.max(.001,lowerHeight-deckLocalY)));
   const x=.08+(railX-.08)*t;
   const spread=maxSpread*t;
   beam(ratlines,V(side*x,y,-spread),V(side*x,y,spread),
    .008,materials.rope,'ratline-'+side+'-'+r,7);
  }
 }

 // Paired backstays terminate aft of the mast. Convert the hull station into
 // mast-local Z because this entire rigging assembly moves with the mast.
 const aftStation=Math.min(.96,mastStation+.30);
 const aftZ=stationZ(d,aftStation,1)-z;
 const aftY=deckY(d,aftStation)-baseY+.16;
 const aftRail=halfBreadth(d,aftStation)*.76;
 for(const side of [-1,1]){
  tube(backstays,[V(side*.08,totalHeight*.985,0),V(side*aftRail,aftY,aftZ)],
   .013,materials.rope,'backstay-'+(side<0?'port':'starboard'),30);
 }
}
