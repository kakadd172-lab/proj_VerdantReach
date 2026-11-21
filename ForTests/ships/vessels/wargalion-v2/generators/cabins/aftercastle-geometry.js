import { hullPoint, hullLongitudinalZ, deckLevelY } from '../../architecture/hull-surface.js';

const clamp01 = value => Math.max(0, Math.min(1, value));

export function aftercastleStationU(t, tier) {
  return clamp01((t - tier.t0) / (tier.t1 - tier.t0));
}

/**
 * Shared aftercastle section functions.
 * Each tier is a real rising, narrowing structure: its base follows the level
 * below, its upper wall rises toward the stern, and both ends rake inward.
 * Roofs, wall rails, end walls, windows and galleries share these evaluators.
 */
export function aftercastleHalfWidth(d, t, tier, wallFraction = 0, overhang = 0) {
  const u = aftercastleStationU(t, tier);
  const v = clamp01(wallFraction);
  const longitudinalTaper = 0.93 + 0.07 * Math.sin(Math.PI * u);
  const deckHalf = Math.abs(hullPoint(d, t, 1, 1).x);
  return deckHalf * tier.widthScale * longitudinalTaper
    * (1 - tier.topInset * v) + overhang;
}

export function aftercastleWallY(d, t, tier, wallFraction = 0) {
  const u = aftercastleStationU(t, tier);
  const v = clamp01(wallFraction);
  const base = deckLevelY(d, t, 'quarterdeck')
    + tier.baseOffset
    + (tier.baseRise ?? 0) * u;
  const riseTowardStern = (tier.aftRise ?? 0) * u * v;
  return base + tier.wallHeight * v + riseTowardStern
    + tier.sideCamber * Math.sin(Math.PI * u) * v;
}

export function aftercastleWallZ(d, t, tier, wallFraction = 0) {
  const u = aftercastleStationU(t, tier);
  return hullLongitudinalZ(d, t, 1)
    + tier.longitudinalInset * clamp01(wallFraction) * (1 - 2 * u);
}

/** Convex aft gallery face; u runs from port (-1) to starboard (+1). */
export function aftercastleTransomZ(d, tier, u, wallFraction = 0) {
  const v = clamp01(wallFraction);
  const across = clamp01((u + 1) * 0.5) * 2 - 1;
  return aftercastleWallZ(d, tier, tier.t1, v)
    + (tier.transomProjection ?? 0) * (1 - across * across) * (0.85 + 0.15 * v);
}
