import { deckY, keelY, V } from '../../architecture/hull-geometry.js';
export function buildStem(d,ctx){
  const stem=ctx.part('stem');
  ctx.beam(stem,V(0,keelY(d,.015),-d.hullLengthUnits*.49),V(0,deckY(d,.035)+d.deckHeightUnits*.20,-d.hullLengthUnits*.51),Math.max(.10,d.beamUnits*.022),ctx.materials.trim,'raked-galleon-stempost',12);
  ctx.beam(stem,V(0,keelY(d,.985),d.hullLengthUnits*.48),V(0,deckY(d,.985)+.20,d.hullLengthUnits*.49),Math.max(.08,d.beamUnits*.018),ctx.materials.trim,'sternpost',12);
}
