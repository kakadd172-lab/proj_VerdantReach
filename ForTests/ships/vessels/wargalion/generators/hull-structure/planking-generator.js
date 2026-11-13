import { hullPoint } from '../../architecture/hull-geometry.js';

export function buildHullPlanking(d, ctx) {
  const { part, tube, materials } = ctx;
  const strakes = part('hull-strakes');
  const rows = 10;
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row++) {
      const v = 0.105 + row * 0.083;
      const line = [];
      for (let i = 0; i <= 92; i++) {
        const t = 0.018 + 0.968 * i / 92;
        const p = hullPoint(d, t, v, side, 1.006);
        p.y += 0.012;
        line.push(p);
      }
      const material = row === 0 ? materials.lower : (row % 2 ? materials.plank : materials.hull);
      tube(strakes, line, Math.max(0.012, d.beamUnits * 0.0018), material,
        'longitudinal-hull-strake-' + side + '-' + row, 100);
    }
  }
}
