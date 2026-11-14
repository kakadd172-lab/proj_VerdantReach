import { hullPoint } from '../../architecture/hull-geometry.js';

export function buildHullPlanking(d, ctx) {
  const { part, tube, materials, registry } = ctx;
  const hull = registry.get('hull');
  if (!hull) throw new Error('Wargalion hull skin must be generated before its strakes.');
  const strakes = part('hull-strakes', hull);
  const rows = 18;

  // Narrow, low-contrast seams follow the faired surface parameter lines.
  // Their radius is intentionally much smaller than the structural wales;
  // this prevents the old bright, rope-like plank lines.
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row++) {
      const v = 0.145 + row * 0.044;
      const line = [];
      for (let i = 0; i <= 144; i++) {
        const t = 0.006 + 0.988 * i / 144;
        const p = hullPoint(d, t, v, side, 1.001);
        p.y += 0.0025;
        line.push(p);
      }
      tube(strakes, line, Math.max(0.0028, d.beamUnits * 0.00018),
        materials.lower, 'hull-plank-seam-' + side + '-' + row, 152);
    }

    for (const [index, v] of [0.245, 0.575, 0.835].entries()) {
      const wale = [];
      for (let i = 0; i <= 144; i++) {
        const t = 0.018 + 0.964 * i / 144;
        const p = hullPoint(d, t, v, side, 1.004);
        p.y += 0.006;
        wale.push(p);
      }
      tube(strakes, wale, Math.max(0.012, d.beamUnits * (index === 1 ? 0.00105 : 0.00078)),
        materials.trim, 'continuous-hull-wale-' + side + '-' + index, 152);
    }
  }
}
