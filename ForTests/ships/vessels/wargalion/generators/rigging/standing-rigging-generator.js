import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildStandingRigging(d, ctx, mast, mastGroup, baseY, totalHeight) {
  const { part, tube, materials } = ctx;
  const root = part('standing-rigging-' + mast.id, mastGroup);
  const shrouds = part('shrouds-' + mast.id, root);
  const stays = part('mast-stays-' + mast.id, root);
  const station = 0.5 + mast.z * 0.45;
  const railX = halfBreadth(d, station) * 0.82;
  const pairs = d.structure.shroudPairs;
  for (const side of [-1, 1]) {
    for (let pair = 0; pair < pairs; pair++) {
      const spread = (pair - (pairs - 1) / 2) * d.beamUnits * 0.09;
      const foot = V(side * railX, deckY(d, station) - baseY + 0.42, spread);
      const mid = V(side * railX * 0.58, totalHeight * 0.56, spread * 0.4);
      const head = V(side * 0.06, totalHeight * 0.98, 0);
      tube(shrouds, [head, mid, foot], 0.018, materials.rope, 'standing-shroud-' + side + '-' + pair, 24);
    }
  }
  tube(stays, [V(0, totalHeight, 0), V(0, 0.35, -d.hullLengthUnits * 0.44 - mast.z * d.hullLengthUnits)],
    0.019, materials.rope, 'fore-and-aft-stay', 30);
  if (mast.id !== 'fore') {
    tube(stays, [V(0, totalHeight * 0.91, 0), V(0, 0.28, d.hullLengthUnits * 0.44)],
      0.017, materials.rope, 'backstay', 28);
  }
}
