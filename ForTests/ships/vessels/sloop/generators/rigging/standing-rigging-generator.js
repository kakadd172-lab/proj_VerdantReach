import { deckY, halfBreadth, V } from "../../architecture/hull-geometry.js";

export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
 const {part,tube,beam,materials,V}=ctx;
 const mastStation=.5+mast.z;
 const standing=part('standing-rigging-'+mast.id,mastGroup);
 const shrouds=part('shrouds-'+mast.id,standing);
 const ratlines=part('ratlines-'+mast.id,standing);
 const backstays=part('backstays-'+mast.id,standing);
 const railX=halfBreadth(d,mastStation)*.82;
 const pairs=Math.max(2,d.structure.shroudPairs??2);
 const maxSpread=d.beamUnits*.09;
 const deckLocalY=deckY(d,mastStation)-baseY+.22;

 // Straight port/starboard shrouds. Each pair lands at its own chainplate.
 for(const side of [-1,1]){
  for(let pair=0;pair<pairs;pair++){
   const spread=pairs===1?0:(pair/(pairs-1)-.5)*2;
   const attachZ=spread*maxSpread;
   tube(shrouds,[V(side*.08,totalHeight-.10,0),V(side*railX,deckLocalY,attachZ)],
    .014,materials.rope,'standing-shroud-'+side+'-'+pair,28);
  }

  // Ratlines are short ladder rungs between the shrouds on the same side,
  // not cross-ship bars passing through the mast.
  const count=d.structure.ratlines??9;
  for(let r=0;r<count;r++){
   const y=deckLocalY+(lowerHeight-deckLocalY)*(r+1)/(count+1);
   const t=THREE_SAFE_FRACTION(totalHeight,deckLocalY,y);
   const x=.08+(railX-.08)*t;
   const spread=maxSpread*t;
   beam(ratlines,V(side*x,y,-spread),V(side*x,y,spread),
    .008,materials.rope,'ratline-'+side+'-'+r,7);
  }
 }

 // Aft backstays provide the after support; the outer jib's luff is the
 // forestay, so a second masthead-to-bowsprit line would be redundant.
 const aftStation=Math.min(.96,mastStation+.30);
 const aftZ=d.hullLengthUnits*(aftStation-.5);
 const aftY=deckY(d,aftStation)-baseY+.16;
 const aftRail=halfBreadth(d,aftStation)*.76;
 for(const side of [-1,1]){
  tube(backstays,[V(side*.08,totalHeight*.985,0),V(side*aftRail,aftY,aftZ)],
   .013,materials.rope,'backstay-'+(side<0?'port':'starboard'),30);
 }
}

function THREE_SAFE_FRACTION(top,bottom,value){
 return Math.max(0,Math.min(1,(top-value)/Math.max(.001,top-bottom)));
}
