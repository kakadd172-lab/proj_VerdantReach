import { hullPoint, hullLongitudinalZ, deckLevelY } from '../../architecture/hull-surface.js';

const clamp01 = value => Math.max(0, Math.min(1, value));

export function aftercastleStationU(t, tier) {
  return clamp01((t - tier.t0) / (tier.t1 - tier.t0));
}

/**
 * Shared aftercastle section functions.
 * Side walls, end walls, roofs, windows and galleries all use these values so
 * upper levels taper into one another instead of becoming offset boxes.
 */
export function aftercastleHalfWidth(d, t, tier, wallFraction = 0, overhang = 0) {
  const u = aftercastleStationU(t, tier);
  const longitudinalTaper = 0.93 + 0.07 * Math.sin(Math.PI * u);
  const deckHalf = Math.abs(hullPoint(d, t, 1, 1).x);
  return deckHalf * tier.widthScale * longitudinalTaper
    * (1 - tier.topInset * clamp01(wallFraction)) + overhang;
}

export function aftercastleWallY(d, t, tier, wallFraction = 0) {
  const u = aftercastleStationU(t, tier);
  const v = clamp01(wallFraction);
  const base = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset;
  return base + tier.wallHeight * v + tier.sideCamber * Math.sin(Math.PI * u) * v;
}

export function aftercastleWallZ(d, t, tier, wallFraction = 0) {
  const u = aftercastleStationU(t, tier);
  return hullLongitudinalZ(d, t, 1)
    + tier.longitudinalInset * clamp01(wallFraction) * (1 - 2 * u);
}
