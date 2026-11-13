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

    for (let j = 24; j >= 0; j--) {
      const v = 0.025 + 0.95 * j / 24;
      const p = hullPoint(d, t, v, -1, 0.965);
      points.push(V(p.x, p.y, p.z));
    }
    for (let j = 0; j <= 24; j++) {
      const v = 0.025 + 0.95 * j / 24;
      const p = hullPoint(d, t, v, 1, 0.965);
      points.push(V(p.x, p.y, p.z));
    }

    const stationFactor = Math.max(0.60, Math.sin(Math.PI * t) ** 0.55);
    tube(frame, points,
      Math.max(0.022, d.beamUnits * 0.0037 * stationFactor),
      materials.lower, 'oak-master-and-tail-frame', 64);

    const floorPort = hullPoint(d, t, 0.075, -1, 0.965);
    const floorStarboard = hullPoint(d, t, 0.075, 1, 0.965);
    tube(frame, [V(floorPort.x, floorPort.y, floorPort.z),
      V(floorStarboard.x, floorStarboard.y, floorStarboard.z)],
      Math.max(0.025, d.beamUnits * 0.0042), materials.lower,
      'transverse-floor-timber', 28);
  }
}
