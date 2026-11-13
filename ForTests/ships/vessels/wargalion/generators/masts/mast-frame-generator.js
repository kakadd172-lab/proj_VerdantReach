import { deckSurfaceY, V } from '../../architecture/hull-geometry.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
import { buildCanvasSail } from '../sails/sail-cloth-generator.js';

export function buildMast(d, ctx, mast) {
  const { THREE, part, beam, mesh, materials } = ctx;
  const z = mast.z * d.hullLengthUnits;
  const mastStation = 0.5 + mast.z;
  const baseY = deckSurfaceY(d, mastStation) + 0.18;
  const totalHeight = mast.height * (4 / 3);
  const lowerHeight = totalHeight * (d.structure.lowerMastRatio ?? 0.66);
  const radius = d.beamUnits * (mast.id === 'main' ? 0.022 : 0.019) * (mast.radiusScale ?? 1);
  const group = part('mast-' + mast.id);
  group.position.set(0, baseY, z);
  group.userData.mastControl = { mastId: mast.id };

  const step = part('mast-step-' + mast.id);
  beam(step, V(-0.34, baseY - 0.16, z), V(0.34, baseY - 0.16, z),
    Math.max(0.075, radius * 1.6), materials.trim, 'mast-step-crossbeam');

  const lower = part('mast-lower-' + mast.id, group);
  const topmast = part('mast-topmast-' + mast.id, group);
  const lowerSpar = mesh(lower,
    new THREE.CylinderGeometry(Math.max(0.08, radius * 0.68), Math.max(0.12, radius), lowerHeight, 14, 1),
    materials.trim, 'tapered-lower-mast');
  lowerSpar.position.y = lowerHeight * 0.5;
  const topLength = totalHeight - lowerHeight + 0.14;
  const topSpar = mesh(topmast,
    new THREE.CylinderGeometry(Math.max(0.04, radius * 0.34), Math.max(0.07, radius * 0.68), topLength, 12, 1),
    materials.trim, 'topmast');
  topSpar.position.y = lowerHeight + topLength * 0.5 - 0.08;

  const cap = part('mast-cap-' + mast.id, group);
  const capMesh = mesh(cap, new THREE.CylinderGeometry(radius * 1.3, radius * 1.3, 0.16, 12),
    materials.trim, 'mast-cap');
  capMesh.position.y = lowerHeight - 0.12;

  buildStandingRigging(d, ctx, mast, group, z, baseY, totalHeight, lowerHeight);

  if (mast.rig === 'square') {
    const levels = ['course', 'topsail', 'topgallant'].slice(0, mast.squares ?? 3);
    const widths = [0.42, 0.34, 0.26];
    const heights = [0.10, 0.36, 0.60];
    levels.forEach((level, index) => {
      const width = d.hullLengthUnits * widths[index] * (d.structure.yardSpread ?? 1) * (mast.yardScale ?? 1);
      const y0 = totalHeight * heights[index];
      const y1 = y0 + totalHeight * 0.19;
      const yard = part('yard-' + mast.id + '-' + level, group);
      beam(yard, V(-width * 0.5, y1, 0), V(width * 0.5, y1, 0),
        Math.max(0.055, radius * 0.72), materials.trim, 'square-yard');
      buildCanvasSail(ctx, 'sail-' + mast.id + '-' + level, mast.id,
        [V(-width * 0.49, y0, 0), V(-width * 0.45, y1, 0),
         V(width * 0.45, y1, 0), V(width * 0.49, y0, 0)],
        0.082 - index * 0.012, group, 'z');
      const sheets = part('sheets-' + mast.id + '-' + level, group);
      for (const side of [-1, 1]) {
        beam(sheets, V(side * width * 0.46, y0, 0),
          V(side * width * 0.46, y0 - 0.22, 0.18),
          0.016, materials.rope, 'sail-sheet');
      }
    });
    const platform = part('mast-platform-' + mast.id, group);
    const disk = mesh(platform,
      new THREE.CylinderGeometry(Math.max(0.40, d.beamUnits * 0.055), Math.max(0.46, d.beamUnits * 0.062), 0.13, 18),
      materials.trim, 'top-platform');
    disk.position.y = lowerHeight * 0.88;
  } else {
    const span = d.hullLengthUnits * (mast.span ?? 0.43) * 0.94;
    const low = totalHeight * 0.09, high = totalHeight * 0.90;
    const yard = part('lateen-yard-' + mast.id, group);
    beam(yard, V(0, high, -span * 0.30), V(0, low, span),
      0.075, materials.trim, 'lateen-yard');
    buildCanvasSail(ctx, 'sail-' + mast.id + '-lateen', mast.id,
      [V(0, low, 0), V(0, high, -span * 0.30),
       V(0, low, span), V(0, low + 0.12, span * 0.92)],
      0.10, group, 'x');
  }
  return group;
}
