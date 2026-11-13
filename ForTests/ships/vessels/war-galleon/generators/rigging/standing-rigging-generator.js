import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';
export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
  const standing=ctx.part('standing-rigging-'+mast.id,mastGroup),shrouds=ctx.part('shrouds-'+mast.id,standing),ratlines=ctx.part('ratlines-'+mast.id,standing),stays=ctx.part('mast-stays-'+mast.id,standing),running=ctx.part('running-rigging-'+mast.id,mastGroup),braces=ctx.part('running-braces-'+mast.id,running);
  const railX=halfBreadth(d,.5+mast.z*.22)*.84,pairs=d.structure.shroudPairs||3;
  for(const side of [-1,1])for(let pair=0;pair<pairs;pair++){const spread=pairs<=1?0:pair/(pairs-1)-.5,attachZ=spread*d.beamUnits*.30;ctx.tube(shrouds,[V(side*.08,totalHeight-.12,0),V(side*.20,lowerHeight*.66,spread*d.beamUnits*.08),V(side*railX,deckY(d,.5+mast.z*.45)-baseY+.28,attachZ)],.018,ctx.materials.rope,'standing-shroud-'+side+'-'+pair,28);}
  for(let row=0;row<(d.structure.ratlines||10);row++){const y=lowerHeight*(row+1)/((d.structure.ratlines||10)+1);ctx.beam(ratlines,V(-railX*.5,y,0),V(railX*.5,y,0),.011,ctx.materials.rope,'ratline-'+row);}
  ctx.tube(stays,[V(0,totalHeight,0),V(0,.22,-d.hullLengthUnits*.43-z)],.018,ctx.materials.rope,'fore-and-aft-mast-stay',32);
  for(const side of [-1,1])ctx.tube(braces,[V(0,totalHeight*.86,0),V(side*d.beamUnits*.43,totalHeight*.81,d.hullLengthUnits*.06)],.013,ctx.materials.rope,'yard-brace-'+side,24);
}
