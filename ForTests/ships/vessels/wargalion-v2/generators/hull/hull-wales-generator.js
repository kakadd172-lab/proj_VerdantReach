import { hullPoint } from '../../architecture/hull-surface.js';

/** Separate timber wale bands sampled from the authoritative hull surface. */
export function buildHullWales(d, ctx, parent) {
  const root = ctx.part('hull-wales', parent);
  const bands = [
    { id: 'lower', section: 0.70, radius: 0.075, offset: 0.035, lift: 0.025, material: ctx.materials.lower },
    { id: 'middle', section: 0.84, radius: 0.060, offset: 0.038, lift: 0.025, material: ctx.materials.trim },
    { id: 'sheer', section: 0.965, radius: 0.050, offset: 0.035, lift: 0.020, material: ctx.materials.trim }
  ];
  for (const side of [-1, 1]) for (const band of bands) {
    const points = [];
    for (let i = 0; i <= 176; i++) {
      const t = 0.045 + 0.91 * i / 176;
      const p = hullPoint(d, t, band.section, side);
      p.x += side * band.offset;
      p.y += band.lift;
      points.push(p);
    }
    ctx.tube(root, points, band.radius, band.material, 'hull-wale-' + band.id + '-' + side, 12);
  }
  root.userData.surfaceAuthority = 'architecture/hull-surface.js';
  root.userData.form = 'three individually editable continuous wale bands per side';
}
