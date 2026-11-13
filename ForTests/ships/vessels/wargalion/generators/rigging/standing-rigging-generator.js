import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildStandingRigging(d, ctx, mast, mastGroup, z, baseY, totalHeight, lowerHeight) {
  const { part, tube, beam, materials } = ctx;
  const standing = part('standing-rigging-' + mast.id, mastGroup);
  const shrouds = part('shrouds-' + mast.id, standing);
  const ratlines = part('ratlines-' + mast.id, standing);
  const stays = part('mast-stays-' + mast.id, standing);
  const running = part('running-rigging-' + mast.id, mastGroup);
  const braces = part('running-braces-' + mast.id, running);
  const railX = halfBreadth(d, 0.5 + mast.z * 0.2) * 0.82;
  const pairs = d.structure.shroudPairs ?? 3;

  for (const side of [-1, 1]) {
    for (let pair = 0; pair < pairs; pair++) {
      const spread = pairs <= 1 ? 0 : pair / (pairs - 1) - 0.5;
      const attachZ = spread * d.beamUnits * 0.25;
      tube(shrouds, [
        V(side * 0.08, totalHeight - 0.1, 0),
        V(side * railX * 0.30, lowerHeight * 0.72, attachZ * 0.55),
        V(side * railX, deckY(d, 0.5 + mast.z * 0.45) - baseY + 0.32, attachZ)
      ], 0.019, materials.rope, 'standing-shroud-' + side + '-' + pair, 26);
    }
  }

  for (let r = 0; r < (d.structure.ratlines ?? 10); r++) {
    const y = lowerHeight * (r + 1) / ((d.structure.ratlines ?? 10) + 1);
    const half = railX * 0.46;
    beam(ratlines, V(-half, y, 0), V(half, y, 0), 0.012, materials.rope, 'ratline-' + r);
  }

  tube(stays, [
    V(0, totalHeight, 0),
    V(0, 0.18, -d.hullLengthUnits * 0.43 - z)
  ], 0.018, materials.rope, 'fore-and-aft-stay', 30);

  if (mast.id !== 'fore') {
    tube(stays, [
      V(0, totalHeight * 0.91, 0),
      V(0, 0.22, d.hullLengthUnits * 0.43 - z)
    ], 0.017, materials.rope, 'backstay', 28);
  }

  for (const side of [-1, 1]) {
    tube(braces, [
      V(0, totalHeight * 0.88, 0),
      V(side * d.beamUnits * 0.40, totalHeight * 0.83, d.hullLengthUnits * 0.045)
    ], 0.014, materials.rope, 'yard-brace-' + side, 24);
  }
}
