import { sampleStationCurve, V } from '../../architecture/hull-surface.js';

export function buildSternpost(d, ctx) {
  const sternpost = ctx.part('sternpost');
  const points = sampleStationCurve(d, 1, 1, 48).map(point => V(0, point.y, point.z));
  ctx.tube(sternpost, points, 0.17, ctx.materials.lower, 'wargalion-v2-raked-sternpost', 64);
  sternpost.userData.surfaceAuthority = 'architecture/hull-surface.js';
}
