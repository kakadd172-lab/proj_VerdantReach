import { hullPoint, V } from '../../architecture/hull-geometry.js';

export function buildHullPlanking(d, ctx) {
  const { part, tube, materials, registry } = ctx;
  const hull = registry.get('hull');
  if (!hull) throw new Error('Wargalion hull skin must be generated before its strakes.');

  const strakes = part('hull-strakes', hull);
  const rows = 22;

  // Each strake follows the actual faired section rather than a straight
  // cylinder line. Light wood seams sit just proud of the skin so they remain
  // legible in the studio's default broadside lighting.
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row++) {
      const v = 0.115 + row * 0.035;
      const line = [];
      for (let i = 0; i <= 160; i++) {
        const t = 0.010 + 0.980 * i / 160;
        const point = hullPoint(d, t, v, side, 1.0014);
        point.y += 0.0035;
        line.push(point);
      }
      tube(strakes, line,
        Math.max(0.0048, d.beamUnits * 0.00031),
        materials.plank,
        'hull-plank-seam-' + side + '-' + row, 168);
    }

    // Three moulded wales provide clear, restrained horizontal structure.
    for (const [index, v] of [0.235, 0.555, 0.835].entries()) {
      const wale = [];
      for (let i = 0; i <= 160; i++) {
        const t = 0.018 + 0.964 * i / 160;
        const point = hullPoint(d, t, v, side, 1.004);
        point.y += 0.009;
        wale.push(point);
      }
      const radius = index === 1
        ? Math.max(0.022, d.beamUnits * 0.00155)
        : Math.max(0.015, d.beamUnits * 0.00108);
      tube(strakes, wale, radius, materials.trim,
        'continuous-hull-wale-' + side + '-' + index, 168);
    }

    // Short butt seams are staggered and kept visually subordinate to the
    // continuous plank strakes.
    for (let row = 0; row < 14; row++) {
      const v = 0.16 + row * 0.048;
      for (let joint = 0; joint < 7; joint++) {
        const t = 0.10 + joint * 0.125 + ((row + joint) % 2) * 0.055;
        const points = [];
        for (let i = 0; i <= 5; i++) {
          const station = t + (i / 5 - 0.5) * 0.012;
          const point = hullPoint(d, station, v, side, 1.002);
          point.y += 0.004;
          points.push(point);
        }
        tube(strakes, points, 0.0038, materials.lower,
          'hull-plank-butt-' + side + '-' + row + '-' + joint, 8);
      }
    }

    const sheerWale = [];
    for (let i = 0; i <= 96; i++) {
      const t = 0.035 + 0.93 * i / 96;
      const point = hullPoint(d, t, 0.965, side, 1.003);
      point.y += 0.012;
      sheerWale.push(point);
    }
    tube(strakes, sheerWale, 0.028, materials.trim,
      'upper-sheer-wale-' + side, 104);
  }

  strakes.userData.planking = {
    longitudinalStrakesPerSide: rows,
    structuralWalesPerSide: 4,
    staggeredButtSeams: true,
    followsFairedHull: true
  };
}
