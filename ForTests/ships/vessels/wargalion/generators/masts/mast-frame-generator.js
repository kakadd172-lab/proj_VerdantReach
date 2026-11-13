import { deckY, V } from '../../architecture/hull-geometry.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
import { buildSail } from '../sails/sail-cloth-generator.js';

export function buildMast(d, ctx, mast) {
  const { THREE, part, beam, mesh, materials } = ctx;
  const z = mast.z * d.hullLengthUnits;
  const baseY = deckY(d, 0.5 + mast.z * 0.45) + 0.18;
  const totalHeight = mast.height * (4 / 3);
  const group = part('mast-' + mast.id);
  group.position.set(0, baseY, z);
  group.userData.mastControl = { mastId: mast.id };
  const lowerHeight = totalHeight * 0.66;
  const radius = d.beamUnits * (mast.id === 'main' ? 0.022 : 0.019);
  const lower = part('mast-lower-' + mast.id, group);
  const upper = part('mast-topmast-' + mast.id, group);
  const lowerSpar = mesh(lower, new THREE.CylinderGeometry(radius * 0.68, radius, lowerHeight, 14),
    materials.trim, 'tapered-lower-mast');
  lowerSpar.position.y = lowerHeight * 0.5;
  const topLength = totalHeight - lowerHeight + 0.15;
  const topSpar = mesh(upper, new THREE.CylinderGeometry(radius * 0.34, radius * 0.68, topLength, 12),
    materials.trim, 'topmast');
  topSpar.position.y = lowerHeight + topLength * 0.5 - 0.08;
  const cap = part('mast-cap-' + mast.id, group);
  const capMesh = mesh(cap, new THREE.CylinderGeometry(radius * 1.3, radius * 1.3, 0.16, 12),
    materials.trim, 'mast-cap');
  capMesh.position.y = lowerHeight - 0.12;
  buildStandingRigging(d, ctx, mast, group, baseY, totalHeight);

  if (mast.rig === 'square') {
    const levels = ['course', 'topsail', 'topgallant'].slice(0, mast.squares);
    const widths = [0.42, 0.34, 0.26];
    const heights = [0.10, 0.36, 0.60];
    levels.forEach((level, index) => {
      const width = d.hullLengthUnits * widths[index] * (mast.yardScale || 1);
      const y0 = totalHeight * heights[index];
      const y1 = y0 + totalHeight * 0.19;
      const yard = part('yard-' + mast.id + '-' + level, group);
      beam(yard, V(-width * 0.5, y1, 0), V(width * 0.5, y1, 0),
        Math.max(0.055, radius * 0.72), materials.trim, 'square-yard');
      buildSail(ctx, 'sail-' + mast.id + '-' + level, mast.id,
        [V(-width * 0.49, y0, 0), V(-width * 0.45, y1, 0),
         V(width * 0.45, y1, 0), V(width * 0.49, y0, 0)],
        0.082 - index * 0.012, group);
    });
    const top = part('mast-platform-' + mast.id, group);
    const platform = mesh(top, new THREE.CylinderGeometry(d.beamUnits * 0.055, d.beamUnits * 0.062, 0.13, 18),
      materials.trim, 'top-platform');
    platform.position.y = lowerHeight * 0.88;
  } else {
    const span = d.hullLengthUnits * 0.31;
    const low = totalHeight * 0.12, high = totalHeight * 0.87;
    const yard = part('lateen-yard-' + mast.id, group);
    beam(yard, V(0, high, -span * 0.38), V(0, low, span), 0.075, materials.trim, 'lateen-yard');
    buildSail(ctx, 'sail-' + mast.id + '-lateen', mast.id,
      [V(0, low, 0), V(0, high, -span * 0.38), V(0, low, span), V(0, low + 0.12, span * 0.92)],
      0.10, group, 'x');
  }
  return group;
}
