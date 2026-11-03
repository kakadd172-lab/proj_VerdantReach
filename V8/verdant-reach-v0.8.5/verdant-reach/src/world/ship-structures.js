import { getCrossSectionHalfBreadthRatio, getKeelLineHeight, getLongitudinalHalfBeamRatio } from './ship-hull-parameterization.js?v=0.8.5';
/**
 * Ship-specific hull-line and framing profiles for the v0.8.5 modular fleet.
 * Profiles are dimensionless reconstruction controls. Real-world length,
 * beam, draft and freeboard remain in ship-designs.js.
 */
const profiles = {
  sloop:      { frameCount: 22, beamStation: .49, forebody: .76, aftbody: 1.02, foreTip: .008, aftTip: .055, bottomFlat: .21, bilge: .12, flare: .12, tumble: .035, sheer: 1.08, lowerMastRatio: .64, shroudPairs: 2, ratlines: 8, yardSpread: .94 },
  schooner:   { frameCount: 26, beamStation: .48, forebody: .72, aftbody: .96, foreTip: .006, aftTip: .075, bottomFlat: .18, bilge: .11, flare: .15, tumble: .06, sheer: 1.0, lowerMastRatio: .62, shroudPairs: 2, ratlines: 9, yardSpread: .92 },
  brigantine: { frameCount: 30, beamStation: .51, forebody: .94, aftbody: .98, foreTip: .004, aftTip: .09, bottomFlat: .32, bilge: .19, flare: .09, tumble: .10, sheer: 1.02, lowerMastRatio: .65, shroudPairs: 3, ratlines: 9, yardSpread: 1.02 },
  brig:       { frameCount: 32, beamStation: .52, forebody: .98, aftbody: 1.0, foreTip: .003, aftTip: .10, bottomFlat: .35, bilge: .22, flare: .08, tumble: .11, sheer: 1.0, lowerMastRatio: .64, shroudPairs: 3, ratlines: 10, yardSpread: 1.04 },
  snow:       { frameCount: 28, beamStation: .50, forebody: .91, aftbody: 1.08, foreTip: .004, aftTip: .07, bottomFlat: .29, bilge: .17, flare: .1, tumble: .09, sheer: 1.04, lowerMastRatio: .64, shroudPairs: 3, ratlines: 9, yardSpread: .98 },
  cutter:     { frameCount: 21, beamStation: .47, forebody: .69, aftbody: 1.04, foreTip: .003, aftTip: .045, bottomFlat: .16, bilge: .09, flare: .17, tumble: .025, sheer: 1.14, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .96 },
  frigate:    { frameCount: 36, beamStation: .52, forebody: 1.13, aftbody: 1.14, foreTip: .002, aftTip: .08, bottomFlat: .22, bilge: .11, flare: .05, tumble: .19, sheer: .9, lowerMastRatio: .66, shroudPairs: 4, ratlines: 11, yardSpread: 1.08 },
  barque:     { frameCount: 32, beamStation: .52, forebody: .9, aftbody: 1.01, foreTip: .005, aftTip: .10, bottomFlat: .34, bilge: .22, flare: .09, tumble: .08, sheer: .99, lowerMastRatio: .64, shroudPairs: 3, ratlines: 10, yardSpread: 1.02 },
  caravel:    { frameCount: 26, beamStation: .49, forebody: .82, aftbody: 1.22, foreTip: .003, aftTip: .035, bottomFlat: .16, bilge: .1, flare: .18, tumble: .075, sheer: 1.2, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .92 },
  carrack:    { frameCount: 34, beamStation: .53, forebody: .76, aftbody: .78, foreTip: .006, aftTip: .17, bottomFlat: .45, bilge: .29, flare: .15, tumble: .08, sheer: 1.33, lowerMastRatio: .62, shroudPairs: 3, ratlines: 10, yardSpread: 1.12 },
  galleon:    { frameCount: 36, beamStation: .51, forebody: .86, aftbody: .91, foreTip: .003, aftTip: .14, bottomFlat: .39, bilge: .24, flare: .12, tumble: .12, sheer: 1.2, lowerMastRatio: .64, shroudPairs: 3, ratlines: 10, yardSpread: 1.04 },
  fluyt:      { frameCount: 34, beamStation: .54, forebody: .68, aftbody: .75, foreTip: .01, aftTip: .08, bottomFlat: .51, bilge: .36, flare: .035, tumble: .27, sheer: .82, lowerMastRatio: .65, shroudPairs: 2, ratlines: 9, yardSpread: .94 },
  xebec:      { frameCount: 30, beamStation: .49, forebody: 1.3, aftbody: 1.18, foreTip: .001, aftTip: .025, bottomFlat: .11, bilge: .055, flare: .045, tumble: .005, sheer: .78, lowerMastRatio: .58, shroudPairs: 2, ratlines: 7, yardSpread: 1.13 },
  junk:       { frameCount: 32, beamStation: .5, forebody: .82, aftbody: .84, foreTip: .08, aftTip: .12, bottomFlat: .62, bilge: .09, flare: .035, tumble: .015, sheer: 1.24, lowerMastRatio: .7, shroudPairs: 0, ratlines: 0, yardSpread: 1.02 },
  'first-rate': { frameCount: 42, beamStation: .52, forebody: 1.08, aftbody: 1.04, foreTip: .002, aftTip: .095, bottomFlat: .32, bilge: .2, flare: .07, tumble: .17, sheer: .95, lowerMastRatio: .66, shroudPairs: 5, ratlines: 12, yardSpread: 1.1 },
  pinnace:    { frameCount: 16, beamStation: .5, forebody: .84, aftbody: .85, foreTip: .002, aftTip: .004, bottomFlat: .18, bilge: .075, flare: .08, tumble: .035, sheer: .91, lowerMastRatio: .6, shroudPairs: 1, ratlines: 5, yardSpread: .74 },
};

for (const profile of Object.values(profiles)) Object.freeze(profile);
export const SHIP_STRUCTURE_BLUEPRINTS = Object.freeze(profiles);

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
export function getShipStructureBlueprint(id) {
  return SHIP_STRUCTURE_BLUEPRINTS[String(id ?? '').replace(/^ship-/, '')] ?? null;
}

export function getHullHalfBeam(design, station) {
  const profile = getShipStructureBlueprint(design?.id);
  if (!profile) return (design?.beamUnits ?? 0) * .5;
  return design.beamUnits * .5 * getLongitudinalHalfBeamRatio(design, profile, station);
}

export function getHullSectionWidth(design, vertical) {
  const profile = getShipStructureBlueprint(design?.id);
  if (!profile) return 1;
  return getCrossSectionHalfBreadthRatio(design, profile, vertical);
}

export function getHullKeelY(design, station) {
  const profile = getShipStructureBlueprint(design?.id);
  if (!profile) return -(design?.draftUnits ?? 0);
  return getKeelLineHeight(design, profile, station);
}

export function getDeckSheer(design, station) {
  const t = clamp01(station);
  const edge = Math.pow(Math.abs(t - .5) * 2, 1.28);
  const bowRise = t < .5 ? design.hull.bowRise : design.hull.sternRise;
  const profile = getShipStructureBlueprint(design.id);
  return design.deckHeightUnits
    + design.hull.sheer * design.deckHeightUnits * edge
    + bowRise * design.deckHeightUnits * Math.pow(edge, 1.18) * (profile?.sheer ?? 1);
}

export function getHullFrameCount(design) {
  return getShipStructureBlueprint(design?.id)?.frameCount ?? 18;
}
