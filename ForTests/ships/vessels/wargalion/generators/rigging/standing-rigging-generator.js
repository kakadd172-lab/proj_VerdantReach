import { deckSurfaceY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildStandingRigging(d, ctx, mast, mastGroup, z, baseY, totalHeight, lowerHeight) {
  const { part, tube, beam, materials } = ctx;
  const standing = part('standing-rigging-' + mast.id, mastGroup);
  const shrouds = part('shrouds-' + mast.id, standing);
  const ratlines = part('ratlines-' + mast.id, standing);
  const stays = part('mast-stays-' + mast.id, standing);
  const running = part('running-rigging-' + mast.id, mastGroup);
  const braces = part('running-braces-' + mast.id, running);
  const mastStation = 0.5 + mast.z;
  const railX = halfBreadth(d, mastStation) * 0.82;
  const pairs = d.structure.shroudPairs ?? 3;
  const shroudSpreads = [];

  for (const side of [-1, 1]) {
    const sideSpreads = [];
    for (let pair = 0; pair < pairs; pair++) {
      const spread = pairs <= 1 ? 0 : pair / (pairs - 1) - 0.5;
      const attachZ = spread * d.beamUnits * 0.25;
      sideSpreads.push(attachZ);
      tube(shrouds, [
        V(side * 0.08, totalHeight - 0.1, 0),
        V(side * railX * 0.30, lowerHeight * 0.72, attachZ * 0.55),
        V(side * railX, deckSurfaceY(d, mastStation) - baseY + 0.32, attachZ)
      ], 0.017, materials.rope, 'standing-shroud-' + side + '-' + pair, 28);
    }
    shroudSpreads.push({ side, positions: sideSpreads });
  }

  // Ratlines are ladder rungs between neighbouring shrouds on the same side.
  // The previous cross-ship rungs connected port to starboard through the mast.
  for (const sideSet of shroudSpreads) {
    for (let pair = 0; pair < sideSet.positions.length - 1; pair++) {
      const z0 = sideSet.positions[pair];
      const z1 = sideSet.positions[pair + 1];
      for (let r = 0; r < (d.structure.ratlines ?? 10); r++) {
        const y = lowerHeight * (r + 1) / ((d.structure.ratlines ?? 10) + 1);
        const climb = 1 - y / Math.max(0.001, lowerHeight);
        const x = sideSet.side * (0.08 + (railX - 0.08) * climb * 0.78);
        beam(ratlines, V(x, y, z0), V(x, y, z1),
          0.009, materials.rope, 'ratline-' + sideSet.side + '-' + pair + '-' + r);
      }
    }
  }

  tube(stays, [
    V(0, totalHeight, 0),
    V(0, 0.18, -d.hullLengthUnits * 0.43 - z)
  ], 0.016, materials.rope, 'fore-and-aft-stay', 32);

  if (mast.id !== 'fore') {
    tube(stays, [
      V(0, totalHeight * 0.91, 0),
      V(0, 0.22, d.hullLengthUnits * 0.43 - z)
    ], 0.015, materials.rope, 'backstay', 30);
  }

  for (const side of [-1, 1]) {
    tube(braces, [
      V(0, totalHeight * 0.88, 0),
      V(side * d.beamUnits * 0.36, totalHeight * 0.83, d.hullLengthUnits * 0.04)
    ], 0.012, materials.rope, 'yard-brace-' + side, 26);
  }
}
