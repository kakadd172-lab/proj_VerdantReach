import { deckSurfaceY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
import { buildCanvasSail } from '../sails/sail-cloth-generator.js';

export function buildMast(d, ctx, mast) {
  const { THREE, part, beam, mesh, materials } = ctx;
  const mastStation = 0.5 + mast.z;
  const z = hullLongitudinalZ(d, mastStation, 1);
  const baseY = deckSurfaceY(d, mastStation) + 0.16;
  const totalHeight = mast.height * (4 / 3);
  const lowerHeight = totalHeight * (d.structure.lowerMastRatio ?? 0.66);
  const radius = d.beamUnits * (mast.id === 'main' ? 0.022 : 0.019) * (mast.radiusScale ?? 1);
  const group = part('mast-' + mast.id);
  group.position.set(0, baseY, z);
  group.userData.mastControl = { mastId: mast.id };

  const step = part('mast-step-' + mast.id);
  beam(step, V(-0.30, baseY - 0.14, z), V(0.30, baseY - 0.14, z),
    Math.max(0.060, radius * 1.45), materials.trim, 'mast-step-crossbeam');

  const lower = part('mast-lower-' + mast.id, group);
  const topmast = part('mast-topmast-' + mast.id, group);
  const lowerSpar = mesh(lower,
    new THREE.CylinderGeometry(Math.max(0.07, radius * 0.66), Math.max(0.11, radius), lowerHeight, 16, 2),
    materials.trim, 'tapered-lower-mast');
  lowerSpar.position.y = lowerHeight * 0.5;
  const topLength = totalHeight - lowerHeight + 0.12;
  const topSpar = mesh(topmast,
    new THREE.CylinderGeometry(Math.max(0.035, radius * 0.32), Math.max(0.065, radius * 0.66), topLength, 14, 2),
    materials.trim, 'topmast');
  topSpar.position.y = lowerHeight + topLength * 0.5 - 0.07;

  const cap = part('mast-cap-' + mast.id, group);
  const capMesh = mesh(cap, new THREE.CylinderGeometry(radius * 1.18, radius * 1.18, 0.13, 14),
    materials.trim, 'mast-cap');
  capMesh.position.y = lowerHeight - 0.10;

  buildStandingRigging(d, ctx, mast, group, z, baseY, totalHeight, lowerHeight);

  if (mast.rig === 'square') {
    const levels = ['course', 'topsail', 'topgallant'].slice(0, mast.squares ?? 3);
    const yardBeamRatios = [1.42, 1.16, 0.92];
    const heights = [0.10, 0.36, 0.60];
    levels.forEach((level, index) => {
      const width = d.beamUnits * yardBeamRatios[index]
        * (d.structure.yardSpread ?? 1) * (mast.yardScale ?? 1);
      const y0 = totalHeight * heights[index];
      const y1 = y0 + totalHeight * 0.19;
      const yard = part('yard-' + mast.id + '-' + level, group);
      const yardRadius = Math.max(0.045, radius * 0.68);
      beam(yard, V(-width * 0.5, y1, 0), V(0, y1, 0),
        yardRadius * 0.72, materials.trim, 'square-yard-port-half');
      beam(yard, V(0, y1, 0), V(width * 0.5, y1, 0),
        yardRadius * 0.72, materials.trim, 'square-yard-starboard-half');
      buildCanvasSail(ctx, 'sail-' + mast.id + '-' + level, mast.id,
        [V(-width * 0.49, y0, 0), V(-width * 0.45, y1, 0),
         V(width * 0.45, y1, 0), V(width * 0.49, y0, 0)],
        0.095 - index * 0.008, group, 'z');
      const sheets = part('sheets-' + mast.id + '-' + level, group);
      for (const side of [-1, 1]) {
        beam(sheets, V(side * width * 0.46, y0, 0),
          V(side * width * 0.46, y0 - 0.18, 0.15),
          0.013, materials.rope, 'sail-sheet');
      }
    });
    const platform = part('mast-platform-' + mast.id, group);
    const disk = mesh(platform,
      new THREE.CylinderGeometry(Math.max(0.32, d.beamUnits * 0.048), Math.max(0.38, d.beamUnits * 0.052), 0.11, 20),
      materials.trim, 'top-platform');
    disk.position.y = lowerHeight * 0.88;
  } else if (mast.rig === 'lateen') {
    const span = d.hullLengthUnits * (mast.span ?? 0.33) * 0.82;
    const low = totalHeight * 0.12, high = totalHeight * 0.88;
    const yard = part('lateen-yard-' + mast.id, group);
    beam(yard, V(0, high, -span * 0.28), V(0, low, span),
      0.060, materials.trim, 'lateen-yard');
    buildCanvasSail(ctx, 'sail-' + mast.id + '-lateen', mast.id,
      [V(0, low, 0), V(0, high, -span * 0.28),
       V(0, low, span), V(0, low + 0.10, span * 0.92)],
      0.105, group, 'x');
  }
  return group;
}
