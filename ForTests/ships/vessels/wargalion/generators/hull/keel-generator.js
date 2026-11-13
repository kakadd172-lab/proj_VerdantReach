import { keelY, V } from '../../architecture/hull-geometry.js';

export function buildKeel(d, ctx) {
  const { part, tube, materials } = ctx;
  const group = part('keel');
  const line = [];
  for (let i = 0; i <= 48; i++) {
    const t = 0.012 + 0.976 * i / 48;
    line.push(V(0, keelY(d, t) - d.keelDetails.pointOffset, (t - 0.5) * d.hullLengthUnits));
  }
  tube(group, line, Math.max(d.keelDetails.minimumRadius, d.beamUnits * d.keelDetails.radiusFactor),
    materials.lower, 'longitudinal-keel-and-keelson', 96);
}
