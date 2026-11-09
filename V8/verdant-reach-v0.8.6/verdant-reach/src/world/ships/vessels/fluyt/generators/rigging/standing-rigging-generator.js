import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildStandingRigging(d,ctx,mast,z,baseY,totalHeight,lowerHeight){const {part,tube,beam,materials,V}=ctx;
const standing=part('standing-rigging-'+mast.id),shrouds=part('shrouds-'+mast.id,standing),ratlines=part('ratlines-'+mast.id,standing),stays=part('mast-stays-'+mast.id,standing),running=part('running-rigging-'+mast.id),braces=part('running-braces-'+mast.id,running);
  const railX=halfBreadth(d,.5+mast.z*.2)*.82,pairs=d.structure.shroudPairs??2;
  for(let side of [-1,1])for(let pair=0;pair<pairs;pair++){const spread=pairs<=1?0:pair/(pairs-1)-.5,attachZ=spread*d.beamUnits*.25;tube(shrouds,[V(side*.08,totalHeight-.1,0),V(side*.21,lowerHeight*.58,spread*d.beamUnits*.08),V(side*railX,deckY(d,.5+mast.z*.45)-baseY+.28,attachZ)],.019,materials.rope,'standing-shroud-'+side+'-'+pair,24);}
  for(let r=0;r<(d.structure.ratlines??8);r++){const y=lowerHeight*(r+1)/((d.structure.ratlines??8)+1),half=railX*.5;beam(ratlines,V(-half,y,0),V(half,y,0),.012,materials.rope,'ratline-'+r);}
  tube(stays,[V(0,totalHeight,0),V(0,.18,-d.hullLengthUnits*.43-z)],.018,materials.rope,'mast-stay',28);
  for(let side of [-1,1])tube(braces,[V(0,totalHeight*.88,0),V(side*d.beamUnits*.42,totalHeight*.83,d.hullLengthUnits*.055)],.014,materials.rope,'yard-brace-'+side,22);
}
