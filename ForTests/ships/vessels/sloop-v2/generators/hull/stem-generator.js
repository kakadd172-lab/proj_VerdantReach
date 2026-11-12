import { deckY,keelY,V } from '../../architecture/hull-geometry.js';
export function buildStem(d,ctx){
 const {part,beam,materials}=ctx,stem=part('stem'),z0=-d.hullLengthUnits*.495,z1=-d.hullLengthUnits*.445;
 beam(stem,V(0,keelY(d,.015),z0),V(0,deckY(d,.015)+.16,z1),
  Math.max(.11,d.beamUnits*.023),materials.trim,'sloop-v2-raked-stempost',12);
}
