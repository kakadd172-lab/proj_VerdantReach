import { hullPoint, V } from '../../architecture/hull-geometry.js';

export function buildFrames(d, ctx) {
  const { part, tube, materials } = ctx;
  const count = d.structure.frameCount;
  for (let i = 0; i < count; i++) {
    const t = 0.055 + 0.89 * (i + 0.5) / count;
    const frame = part('frame-' + String(i + 1).padStart(2, '0'));
    const points = [];
    for (let j = 22; j >= 0; j--) {
      const v = 0.04 + 0.92 * j / 22;
      const p = hullPoint(d, t, v, -1, 0.965);
      points.push(V(p.x, p.y, p.z));
    }
    for (let j = 0; j <= 22; j++) {
      const v = 0.04 + 0.92 * j / 22;
      const p = hullPoint(d, t, v, 1, 0.965);
      points.push(V(p.x, p.y, p.z));
    }
    tube(frame, points, Math.max(0.025, d.beamUnits * 0.0035),
      materials.lower, 'oak-frame-rib', 54);
  }
}
