import { deckY, V } from '../../architecture/hull-geometry.js';
export function buildAnchors(d,ctx){
  const anchors=ctx.part('anchors');
  for(const side of [-1,1]){
    const label=side<0?'port':'starboard',anchor=ctx.part('anchor-'+label,anchors),x=side*d.beamUnits*.47,y=deckY(d,.11)-.30,z=-d.hullLengthUnits*.39,span=d.beamUnits*.095;
    ctx.beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),.075,ctx.materials.iron,'anchor-shank');
    ctx.beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),.070,ctx.materials.iron,'anchor-stock');
    ctx.beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.40,y-d.draftUnits*.57,z),.055,ctx.materials.iron,'anchor-fluke-port');
    ctx.beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.40,y-d.draftUnits*.57,z),.055,ctx.materials.iron,'anchor-fluke-starboard');
    const rode=ctx.part('anchor-chain-'+label,anchors);
    ctx.tube(rode,[V(x,y,z),V(x,y-.22,z-.20),V(x*.92,y-.44,z-.40)],.020,ctx.materials.iron,'anchor-rode',24);
  }
}
