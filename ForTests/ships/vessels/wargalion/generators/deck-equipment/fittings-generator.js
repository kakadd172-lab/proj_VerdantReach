import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildFittings(d, ctx) {
  const { part, beam, box, materials } = ctx;
  const fittings = part('deck-fittings');
  for (const [index, t] of [0.16, 0.34, 0.56, 0.72].entries()) {
    const width = halfBreadth(d, t) * 0.72;
    const z = (t - 0.5) * d.hullLengthUnits;
    const y = deckY(d, t) + 0.14;
    for (const side of [-1, 1]) {
      const bitt = box(fittings, 0.13, 0.54, 0.13, materials.trim, 'mooring-bitt');
      bitt.position.set(side * width * 0.76, y + 0.27, z);
    }
    if (index < 3) {
      const hatch = box(fittings, width * 0.68, 0.07, d.hullLengthUnits * 0.045,
        materials.lower, 'deck-hatch-coaming');
      hatch.position.set(0, y + 0.08, z + d.hullLengthUnits * 0.025);
      for (const side of [-1, 1]) {
        beam(fittings, V(side * width * 0.34, y + 0.14, z - d.hullLengthUnits * 0.02),
          V(side * width * 0.34, y + 0.14, z + d.hullLengthUnits * 0.07),
          0.025, materials.trim, 'hatch-edge');
      }
    }
  }
}
