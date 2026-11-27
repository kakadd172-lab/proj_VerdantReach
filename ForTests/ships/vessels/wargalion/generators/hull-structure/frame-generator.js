import { hullPoint, keelY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

function sampleFrameStations(d, count) {
  const samples = 640;
  const t0 = 0.025, t1 = 0.975;
  const stations = [];
  let previous = null;
  let distance = 0;

  for (let i = 0; i <= samples; i++) {
    const t = t0 + (t1 - t0) * i / samples;
    const point = V(0, keelY(d, t), hullLongitudinalZ(d, t, 0));
    if (previous) distance += point.distanceTo(previous);
    stations.push({ t, distance });
    previous = point;
  }

  const result = [];
  for (let frame = 0; frame < count; frame++) {
    const target = distance * (frame + 0.5) / count;
    let index = 1;
    while (index < stations.length - 1 && stations[index].distance < target) index += 1;
    const a = stations[index - 1], b = stations[index];
    const span = b.distance - a.distance;
    const u = span > 1e-8 ? (target - a.distance) / span : 0;
    result.push(a.t + (b.t - a.t) * u);
  }
  return result;
}

export function buildFrames(d, ctx) {
  const { part, tube, materials, registry } = ctx;
  const hull = registry.get('hull');
  if (!hull) throw new Error('Wargalion hull skin must be generated before its frames.');

  const stations = sampleFrameStations(d, d.structure.frameCount);
  stations.forEach((t, index) => {
    const frame = part('frame-' + String(index + 1).padStart(2, '0'), hull);
    const points = [];

    // Port deck edge down around the floor and back to the starboard deck edge.
    for (let j = 32; j >= 0; j--) {
      const point = hullPoint(d, t, j / 32, -1, 0.965);
      points.push(V(point.x, point.y, point.z));
    }
    for (let j = 1; j <= 32; j++) {
      const point = hullPoint(d, t, j / 32, 1, 0.965);
      points.push(V(point.x, point.y, point.z));
    }

    const master = Math.abs(t - 0.5) < 0.5 / d.structure.frameCount;
    frame.userData.frameStation = t;
    frame.userData.frameRole = master ? 'master' : (t < 0.5 ? 'fore-tail' : 'after-tail');
    const fullness = Math.max(0.60, Math.sin(Math.PI * t) ** 0.55);
    tube(frame, points,
      Math.max(0.020, d.beamUnits * 0.0035 * fullness),
      materials.lower, master ? 'oak-master-frame' : 'oak-tail-frame', 76);
  });
}
