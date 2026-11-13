import { hullPoint } from '../../architecture/hull-geometry.js';

export function buildHullPlanking(d, ctx) {
  const { part, tube, materials, registry } = ctx;
  const hull = registry.get('hull');
  if (!hull) throw new Error('Wargalion hull skin must be generated before its strakes.');
  const strakes = part('hull-strakes', hull);
  const rows = 14;

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row++) {
      const v = 0.075 + row * 0.061;
      const line = [];
      for (let i = 0; i <= 116; i++) {
        const t = 0.012 + 0.976 * i / 116;
        const p = hullPoint(d, t, v, side, 1.004);
        p.y += 0.010;
        line.push(p);
      }
      const material = row === 0 || row === rows - 1
        ? materials.lower
        : (row % 2 ? materials.plank : materials.hull);
      tube(strakes, line,
        Math.max(0.010, d.beamUnits * (row % 3 === 0 ? 0.0019 : 0.00145)),
        material, 'longitudinal-hull-strake-' + side + '-' + row, 124);
    }
  }
}
