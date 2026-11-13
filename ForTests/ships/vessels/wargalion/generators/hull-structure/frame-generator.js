import { hullPoint, V } from '../../architecture/hull-geometry.js';

export function buildFrames(d, ctx) {
  const { part, tube, materials, registry } = ctx;
  const hull = registry.get('hull');
  if (!hull) throw new Error('Wargalion hull skin must be generated before its frames.');
  const count = d.structure.frameCount;

  for (let i = 0; i < count; i++) {
    const t = 0.045 + 0.91 * (i + 0.5) / count;
    const frame = part('frame-' + String(i + 1).padStart(2, '0'), hull);
    const points = [];

    // One continuous bent frame: port deck edge -> flat floor -> starboard edge.
    for (let j = 24; j >= 0; j--) {
      const v = j / 24;
      const p = hullPoint(d, t, v, -1, 0.965);
      points.push(V(p.x, p.y, p.z));
    }
    for (let j = 1; j <= 24; j++) {
      const v = j / 24;
      const p = hullPoint(d, t, v, 1, 0.965);
      points.push(V(p.x, p.y, p.z));
    }

    const stationFactor = Math.max(0.60, Math.sin(Math.PI * t) ** 0.55);
    tube(frame, points,
      Math.max(0.022, d.beamUnits * 0.0037 * stationFactor),
      materials.lower, 'oak-master-and-tail-frame', 64);
  }
}
