import {
  deckSurfaceY, halfBreadth, hullLongitudinalZ, V
} from '../../architecture/hull-geometry.js';

function makeChainplate(d, ctx, parent, side, x, deckY, z, name) {
  const { beam, materials } = ctx;
  const bottom = V(side * x, deckY + 0.025, z);
  const top = V(side * x, deckY + 0.43, z);
  beam(parent, bottom, top, 0.027, materials.iron, name);
  beam(parent, V(side * (x - 0.075), deckY + 0.12, z),
    V(side * (x + 0.075), deckY + 0.12, z),
    0.020, materials.trim, 'chainplate-lower-crossbar');
  beam(parent, V(side * (x - 0.075), deckY + 0.36, z),
    V(side * (x + 0.075), deckY + 0.36, z),
    0.020, materials.trim, 'chainplate-upper-crossbar');
}

export function buildStandingRigging(d, ctx, mast, mastGroup, z, baseY, totalHeight, lowerHeight) {
  const { part, tube, beam, materials } = ctx;
  const id = mast.id;
  const standing = part('standing-rigging-' + id, mastGroup);
  const shrouds = part('shrouds-' + id, standing);
  const ratlines = part('ratlines-' + id, standing);
  const stays = part('mast-stays-' + id, standing);
  const backstays = part('backstays-' + id, standing);
  const running = part('running-rigging-' + id, mastGroup);
  const braces = part('running-braces-' + id, running);
  const chainplates = part('chainplates-' + id);
  const backstayPlates = part('backstay-chainplates-' + id);

  const mastStation = 0.5 + mast.z;
  const railX = halfBreadth(d, mastStation) * 0.84;
  const deckY = deckSurfaceY(d, mastStation);
  const anchorY = deckY + 0.30 - baseY;
  const pairCount = d.structure.shroudPairs ?? 4;
  const spreads = [];

  for (const side of [-1, 1]) {
    const sidePositions = [];
    for (let pair = 0; pair < pairCount; pair++) {
      const spread = pairCount <= 1 ? 0 : pair / (pairCount - 1) - 0.5;
      const attachZ = spread * d.beamUnits * 0.30;
      sidePositions.push(attachZ);
      makeChainplate(d, ctx, chainplates, side, railX, deckY, z + attachZ,
        'shroud-chainplate-' + side + '-' + pair);

      tube(shrouds, [
        V(side * 0.075, totalHeight * 0.94, 0),
        V(side * railX * 0.38, lowerHeight * 0.69, attachZ * 0.60),
        V(side * railX, anchorY, attachZ)
      ], 0.0165, materials.rope,
      'standing-shroud-' + side + '-' + pair, 34);
    }
    spreads.push({ side, positions: sidePositions });
  }

  const ratlineCount = d.structure.ratlines ?? 14;
  for (const sideSet of spreads) {
    for (let pair = 0; pair < sideSet.positions.length - 1; pair++) {
      const z0 = sideSet.positions[pair];
      const z1 = sideSet.positions[pair + 1];
      for (let row = 0; row < ratlineCount; row++) {
        const fraction = (row + 1) / (ratlineCount + 1);
        const y = lowerHeight * (0.17 + fraction * 0.70);
        const spread = (y / Math.max(0.001, lowerHeight));
        const x = sideSet.side * (0.075 + (railX - 0.075) * spread * 0.80);
        beam(ratlines, V(x, y, z0), V(x, y, z1),
          0.0085, materials.rope, 'ratline-' + sideSet.side + '-' + pair + '-' + row);
      }
    }
  }

  const forwardStation = Math.max(0.045, mastStation - (id === 'fore' ? 0.15 : 0.18));
  const forwardZ = hullLongitudinalZ(d, forwardStation, 1);
  const forwardY = deckSurfaceY(d, forwardStation) + 0.22;
  const foreStay = tube(stays, [
    V(0, totalHeight * 0.95, 0),
    V(0, forwardY - baseY, forwardZ - z)
  ], 0.015, materials.rope, 'mast-fore-stay', 42);
  if (foreStay?.userData.dynamicMastStay) {
    foreStay.userData.dynamicMastStay.resolveAgainstChainplates = false;
  }

  if (id !== 'fore') {
    const aftStation = Math.min(0.982, mastStation + 0.15);
    const aftZ = hullLongitudinalZ(d, aftStation, 1);
    const aftY = deckSurfaceY(d, aftStation) + 0.26;

    for (const side of [-1, 1]) {
      const attachZ = aftZ + side * d.beamUnits * 0.08;
      const localZ = attachZ - z;
      const x = railX * 0.92;
      makeChainplate(d, ctx, backstayPlates, side, x, aftY - 0.10, attachZ,
        'backstay-chainplate-' + side);

      tube(backstays, [
        V(side * 0.045, totalHeight * 0.93, 0),
        V(side * railX * 0.52, lowerHeight * 0.60, localZ * 0.42),
        V(side * x, aftY + 0.30 - baseY, localZ)
      ], 0.0145, materials.rope, 'standing-backstay-' + side, 38);
    }
  }

  for (const side of [-1, 1]) {
    tube(braces, [
      V(0, totalHeight * 0.80, 0),
      V(side * d.beamUnits * 0.29, totalHeight * 0.76, d.hullLengthUnits * 0.035)
    ], 0.011, materials.rope, 'yard-brace-' + side, 28);
  }

  standing.userData.riggingArchitecture = {
    mastId: id,
    shroudPairs: pairCount,
    ratlineCount,
    hasChainplates: true,
    foreStayAnchorStation: forwardStation,
    backstayAnchorStation: id === 'fore' ? null : Math.min(0.982, mastStation + 0.15)
  };
}
