import { deckSurfaceY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
import { buildCanvasSail } from '../sails/sail-cloth-generator.js';

function addTopPlatform(d, ctx, mastGroup, mastId, y, radius) {
  const { THREE, part, mesh, beam, materials } = ctx;
  const platform = part('mast-platform-' + mastId, mastGroup);
  const floor = mesh(platform,
    new THREE.CylinderGeometry(radius, radius * 0.92, 0.13, 24, 1),
    materials.trim, 'top-platform-floor');
  floor.position.y = y;

  const rim = mesh(platform,
    new THREE.TorusGeometry(radius * 0.94, 0.035, 7, 28),
    materials.trim, 'top-platform-rim');
  rim.rotation.x = Math.PI / 2;
  rim.position.y = y + 0.10;

  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const x = Math.cos(angle) * radius * 0.91;
    const z = Math.sin(angle) * radius * 0.91;
    beam(platform, V(x, y + 0.08, z), V(x, y + 0.44, z),
      0.022, materials.trim, 'top-platform-stanchion');
  }
  return platform;
}

function addSquareYard(d, ctx, mast, mastGroup, level, width, y, yaw) {
  const { part, beam, tube, materials } = ctx;
  const half = width * 0.5;
  const radius = Math.max(0.044, d.beamUnits * 0.0037);

  // The yard component's origin is at the yard's sling, so brace rotation
  // turns around the mast at yard height rather than orbiting the mast foot.
  const yard = part('yard-' + mast.id + '-' + level, mastGroup);
  yard.position.y = y;
  yard.rotation.y = yaw;

  const yardCurve = [
    V(-half, 0, 0),
    V(-half * 0.50, 0.045, 0),
    V(0, 0.075, 0),
    V(half * 0.50, 0.045, 0),
    V(half, 0, 0)
  ];
  tube(yard, yardCurve, radius, materials.trim, 'cambered-square-yard-spar', 44);
  beam(yard, V(0, -0.08, 0), V(0, 0.12, 0),
    radius * 0.72, materials.trim, 'yard-slings');

  const footropes = part('footropes-' + mast.id + '-' + level, yard);
  const footLine = [
    V(-half * 0.82, -0.27, 0.06),
    V(-half * 0.42, -0.30, 0.06),
    V(0, -0.31, 0.06),
    V(half * 0.42, -0.30, 0.06),
    V(half * 0.82, -0.27, 0.06)
  ];
  tube(footropes, footLine, 0.010, materials.rope, 'yard-footrope', 40);
  for (let i = 0; i < 7; i++) {
    const u = -0.75 + i * 0.25;
    beam(footropes, V(u * half, -0.015, 0.035),
      V(u * half, -0.29, 0.06), 0.008, materials.rope, 'footrope-stirrup');
  }

  const sailBottom = -width * 0.34;
  const sail = buildCanvasSail(ctx, 'sail-' + mast.id + '-' + level, mast.id, [
    V(-width * 0.49, sailBottom, 0),
    V(-width * 0.46, 0, 0),
    V(width * 0.46, 0, 0),
    V(width * 0.49, sailBottom, 0)
  ], level === 'course' ? 0.090 : 0.078, mastGroup, 'z');
  sail.position.y = y;
  sail.rotation.y = yaw;
  const cloth = ctx.registry.get('cloth-sail-' + mast.id + '-' + level);
  if (cloth) cloth.userData.sailBraceAngle = yaw;

  const sheets = part('sheets-' + mast.id + '-' + level, yard);
  for (const side of [-1, 1]) {
    beam(sheets, V(side * width * 0.47, sailBottom, 0),
      V(side * width * 0.50, sailBottom - 0.22, 0.12),
      0.014, materials.rope, 'square-sail-sheet');
  }
}
export function buildMast(d, ctx, mast) {
  const { THREE, part, beam, mesh, materials } = ctx;
  const mastStation = 0.5 + mast.z;
  const z = hullLongitudinalZ(d, mastStation, 1);
  const baseY = deckSurfaceY(d, mastStation) + 0.16;
  const totalHeight = mast.height * (4 / 3);
  const lowerHeight = totalHeight * (d.structure.lowerMastRatio ?? 0.64);
  const topmastHeight = totalHeight * 0.235;
  const topgallantHeight = totalHeight - lowerHeight - topmastHeight;
  const radius = d.beamUnits * (mast.id === 'main' ? 0.022 : 0.019) * (mast.radiusScale ?? 1);

  const group = part('mast-' + mast.id);
  group.position.set(0, baseY, z);
  group.userData.mastControl = {
    mastId: mast.id,
    windHeelMaxDeg: mast.id === 'mizzen' ? 2.2 : 2.7,
    windRakeMaxDeg: 1.25
  };

  const step = part('mast-step-' + mast.id);
  beam(step, V(-0.36, baseY - 0.16, z), V(0.36, baseY - 0.16, z),
    Math.max(0.065, radius * 1.45), materials.trim, 'mast-step-crossbeam');
  beam(step, V(0, baseY - 0.16, z - 0.28), V(0, baseY - 0.16, z + 0.28),
    Math.max(0.055, radius * 1.10), materials.lower, 'mast-step-longitudinal-knee');

  const lower = part('mast-lower-' + mast.id, group);
  const topmast = part('mast-topmast-' + mast.id, group);
  const topgallantPart = part('mast-topgallant-' + mast.id, group);
  const lowerSpar = mesh(lower,
    new THREE.CylinderGeometry(Math.max(0.075, radius * 0.62), Math.max(0.12, radius), lowerHeight, 20, 3),
    materials.trim, 'tapered-lower-mast');
  lowerSpar.position.y = lowerHeight * 0.5;

  const topSpar = mesh(topmast,
    new THREE.CylinderGeometry(Math.max(0.050, radius * 0.38), Math.max(0.075, radius * 0.64), topmastHeight, 16, 2),
    materials.trim, 'topmast');
  topSpar.position.y = lowerHeight + topmastHeight * 0.5;

  const topgallant = mesh(topgallantPart,
    new THREE.CylinderGeometry(Math.max(0.030, radius * 0.24), Math.max(0.050, radius * 0.39), topgallantHeight, 14, 2),
    materials.trim, 'topgallant-mast');
  topgallant.position.y = lowerHeight + topmastHeight + topgallantHeight * 0.5;

  const cap = part('mast-cap-' + mast.id, group);
  const capMesh = mesh(cap,
    new THREE.CylinderGeometry(radius * 1.24, radius * 1.24, 0.14, 16),
    materials.trim, 'mast-cap');
  capMesh.position.y = lowerHeight - 0.08;

  const crossTrees = part('mast-cross-trees-' + mast.id, group);
  beam(crossTrees, V(-radius * 3.2, lowerHeight - 0.06, 0),
    V(radius * 3.2, lowerHeight - 0.06, 0),
    0.055, materials.trim, 'lower-crosstree');
  beam(crossTrees, V(0, lowerHeight - 0.06, -radius * 2.2),
    V(0, lowerHeight - 0.06, radius * 2.2),
    0.045, materials.trim, 'fore-aft-trestletree');
  beam(crossTrees, V(-radius * 2.2, lowerHeight + topmastHeight - 0.10, 0),
    V(radius * 2.2, lowerHeight + topmastHeight - 0.10, 0),
    0.036, materials.trim, 'topmast-crosstree');

  buildStandingRigging(d, ctx, mast, group, z, baseY, totalHeight, lowerHeight);

  if (mast.rig === 'square') {
    const levels = ['course', 'topsail', 'topgallant'].slice(0, mast.squares ?? 3);
    const ratios = [1.36, 1.12, 0.88];
    const lowerRatios = [0.08, 0.34, 0.57];
    const upperRatios = [0.30, 0.53, 0.74];
    const yaw = mast.id === 'fore' ? 0.58 : 0.62;

    levels.forEach((level, index) => {
      const width = d.beamUnits * ratios[index]
        * (d.structure.yardSpread ?? 1) * (mast.yardScale ?? 1);
      const yardY = totalHeight * upperRatios[index];
      addSquareYard(d, ctx, mast, group, level, width, yardY, yaw);
      // The broadside editor view otherwise looks exactly down the neutral
      // square-sail plane. A measured brace angle keeps the cloth readable
      // while preserving a cross-yard rig and a consistent fore/main rake.
      const sail = ctx.registry.get('sail-' + mast.id + '-' + level);
      if (sail) sail.rotation.y = yaw;
      const cloth = ctx.registry.get('cloth-sail-' + mast.id + '-' + level);
      if (cloth) cloth.userData.sailBraceAngle = yaw;

      const lowerY = totalHeight * lowerRatios[index];
      const lifts = part('yard-lifts-' + mast.id + '-' + level, group);
      beam(lifts, V(-width * 0.44, lowerY - 0.10, 0),
        V(-width * 0.44, yardY + 0.04, 0), 0.010, materials.rope, 'yard-lift-port');
      beam(lifts, V(width * 0.44, lowerY - 0.10, 0),
        V(width * 0.44, yardY + 0.04, 0), 0.010, materials.rope, 'yard-lift-starboard');
    });

    addTopPlatform(d, ctx, group, mast.id, lowerHeight * 0.95,
      Math.max(0.48, d.beamUnits * 0.043));
  } else if (mast.rig === 'lateen') {
    const span = d.hullLengthUnits * (mast.span ?? 0.29) * 0.76;
    const low = totalHeight * 0.12;
    const high = totalHeight * 0.87;
    const yard = part('lateen-yard-' + mast.id, group);
    beam(yard, V(0, high, -span * 0.24), V(0, low, span),
      Math.max(0.050, radius * 0.58), materials.trim, 'lateen-yard');
    const sail = buildCanvasSail(ctx, 'sail-' + mast.id + '-lateen', mast.id, [
      V(0, low, 0),
      V(0, high, -span * 0.24),
      V(0, low, span),
      V(0, low + 0.10, span * 0.94)
    ], 0.085, group, 'x');
    const sheets = part('sheets-' + mast.id + '-lateen', group);
    beam(sheets, V(0, low, span * 0.94), V(0, low - 0.26, span * 1.02),
      0.013, materials.rope, 'lateen-sheet');
  }

  group.userData.mastArchitecture = {
    mastStation,
    totalHeight,
    lowerMastHeight: lowerHeight,
    topmastHeight,
    topgallantHeight,
    rig: mast.rig
  };
  return group;
}
