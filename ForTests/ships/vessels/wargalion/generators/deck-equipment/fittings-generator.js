import { deckPoint, deckSurfaceY, deckY, halfBreadth, sectionBreadthRatio, V } from '../../architecture/hull-geometry.js';

export function buildFittings(d, ctx) {
  const { part, beam, box, materials } = ctx;
  const fittings = part('deck-fittings');
  const stations = [0.16, 0.34, 0.56, 0.72];

  for (const [index, t] of stations.entries()) {
    const width = halfBreadth(d, t) * sectionBreadthRatio(d, t, 1) * 0.72;
    const lift = deckSurfaceY(d, t) - deckY(d, t);
    const centre = deckPoint(d, t, 0, lift + 0.10);
    for (const side of [-1, 1]) {
      const bitt = box(fittings, 0.105, 0.46, 0.105, materials.trim, 'mooring-bitt');
      bitt.position.set(side * width * 0.76, centre.y + 0.23, centre.z);
    }

    if (index < 3) {
      const hatch = box(fittings, width * 0.62, 0.055, d.hullLengthUnits * 0.038,
        materials.lower, 'deck-hatch-coaming');
      hatch.position.set(0, centre.y + 0.06, centre.z + d.hullLengthUnits * 0.022);
      for (const side of [-1, 1]) {
        beam(fittings, V(side * width * 0.31, centre.y + 0.10, centre.z - d.hullLengthUnits * 0.018),
          V(side * width * 0.31, centre.y + 0.10, centre.z + d.hullLengthUnits * 0.060),
          0.018, materials.trim, 'hatch-edge');
      }
    }
  }
}
