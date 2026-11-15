import {
  deckPoint, deckSurfaceY, deckY, halfBreadth, sectionBreadthRatio, V
} from '../../architecture/hull-geometry.js';

export function buildFittings(d, ctx) {
  const { part, beam, box, materials } = ctx;
  const fittings = part('deck-fittings');
  const stations = [0.15, 0.34, 0.55, 0.72];
  const liftAt = t => deckSurfaceY(d, t) - deckY(d, t);

  for (const [index, t] of stations.entries()) {
    const half = halfBreadth(d, t) * sectionBreadthRatio(d, t, 1) * 0.74;
    const centre = deckPoint(d, t, 0, liftAt(t) + 0.08);

    for (const side of [-1, 1]) {
      const x = side * half * 0.79;
      const base = V(x, centre.y + 0.035, centre.z);
      const top = V(x, centre.y + 0.51, centre.z);
      box(fittings, 0.20, 0.10, 0.18, materials.lower, 'mooring-bitt-foot')
        .position.set(x, centre.y + 0.05, centre.z);
      beam(fittings, base, top, 0.068, materials.trim, 'mooring-bitt-post');
      beam(fittings, V(x - 0.15, centre.y + 0.49, centre.z),
        V(x + 0.15, centre.y + 0.49, centre.z),
        0.052, materials.trim, 'mooring-bitt-crosshead');
      box(fittings, 0.23, 0.055, 0.21, materials.plank, 'mooring-bitt-cap')
        .position.set(x, centre.y + 0.53, centre.z);
    }

    if (index < 3) {
      const hatchLength = d.hullLengthUnits * (index === 1 ? 0.060 : 0.047);
      const hatchWidth = half * 0.64;
      const hatchZ = centre.z + hatchLength * 0.10;

      const coaming = box(fittings, hatchWidth, 0.14, hatchLength,
        materials.trim, 'deck-hatch-coaming');
      coaming.position.set(0, centre.y + 0.085, hatchZ);

      const cover = box(fittings, hatchWidth * 0.93, 0.075, hatchLength * 0.92,
        materials.deck, 'deck-hatch-wood-cover');
      cover.position.set(0, centre.y + 0.175, hatchZ);

      for (let plank = 0; plank < 5; plank++) {
        const u = -0.40 + plank * 0.20;
        beam(fittings,
          V(u * hatchWidth, centre.y + 0.218, hatchZ - hatchLength * 0.43),
          V(u * hatchWidth, centre.y + 0.218, hatchZ + hatchLength * 0.43),
          0.012, materials.plank, 'hatch-cover-board-seam');
      }
      for (const side of [-1, 1]) {
        beam(fittings, V(side * hatchWidth * 0.46, centre.y + 0.23, hatchZ - hatchLength * 0.45),
          V(side * hatchWidth * 0.46, centre.y + 0.23, hatchZ + hatchLength * 0.45),
          0.021, materials.trim, 'hatch-cover-cleat');
      }
    }
  }
  fittings.userData.deckDetailStyle = 'raised-timber-coamings-and-boarded-hatch-covers';
}
