import {
  hullPointAcross,
  sampleStationCurve
} from '../../architecture/hull-surface.js';

export function buildStem(d, ctx) {
  const { part, tube, materials, V } = ctx;
  const stem = part('stem');
  const points = sampleStationCurve(d, 0, 1, 48);
  const centreline = points.map(point => V(0, point.y, point.z));
  tube(stem, centreline, 0.19, materials.lower, 'wargalion-v2-raked-stem', 64);
  const forefoot = hullPointAcross(d, 0.035, 0.12, 0);
  stem.userData.forefoot = forefoot.toArray();
  stem.userData.surfaceAuthority = 'architecture/hull-surface.js';
}
