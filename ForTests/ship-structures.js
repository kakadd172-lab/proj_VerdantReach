import { getCrossSectionHalfBreadthRatio, getKeelLineHeight, getLongitudinalHalfBeamRatio, getOpenHullPoint } from './ship-hull-parameterization.js?v=0.8.5';
/**
 * Ship-specific hull-line and framing profiles for the v0.8.5 modular fleet.
 * Profiles are dimensionless reconstruction controls. Real-world length,
 * beam, draft and freeboard remain in ship-designs.js.
 *
 * Sheer is applied once: design.hull.sheer / bowRise / sternRise are amplitudes
 * in metres-relative units, multiplied by profile.sheer.
 */
const profiles = {
  sloop: {
    frameCount: 22, beamStation: .49, forebody: .76, aftbody: 1.02, foreTip: .008, aftTip: .055,
    bottomFlat: .18, bilge: .1, flare: .14, tumble: .03, sheer: 1.12, entryVee: .7,
    stemRake: .045, cutwater: .42, sternRake: .018, counterOverhang: .035,
    forecastleLength: 0, quarterdeckLength: .14, visibleDecks: 1, waleHeights: [.42],
    mastRakeDeg: 3.5, courseYardToBeam: 1.55, topsailYardRatio: .72, topgallantYardRatio: .5,
    lowerMastRatio: .62, shroudPairs: 2, ratlines: 8, yardSpread: .94,
  },
  schooner: {
    frameCount: 26, beamStation: .48, forebody: .72, aftbody: .96, foreTip: .006, aftTip: .075,
    bottomFlat: .17, bilge: .1, flare: .16, tumble: .055, sheer: 1.06, entryVee: .68,
    stemRake: .05, cutwater: .4, sternRake: .02, counterOverhang: .04,
    forecastleLength: 0, quarterdeckLength: .16, visibleDecks: 1, waleHeights: [.4, .78],
    mastRakeDeg: 4.2, courseYardToBeam: 1.48, topsailYardRatio: .7, topgallantYardRatio: .48,
    lowerMastRatio: .61, shroudPairs: 2, ratlines: 9, yardSpread: .92,
  },
  brigantine: {
    frameCount: 30, beamStation: .51, forebody: .94, aftbody: .98, foreTip: .004, aftTip: .09,
    bottomFlat: .3, bilge: .18, flare: .09, tumble: .1, sheer: 1.0, entryVee: .5,
    stemRake: .04, cutwater: .32, sternRake: .022, counterOverhang: .048,
    forecastleLength: .08, quarterdeckLength: .22, visibleDecks: 1, waleHeights: [.38, .72],
    mastRakeDeg: 3.8, courseYardToBeam: 1.72, topsailYardRatio: .7, topgallantYardRatio: .48,
    lowerMastRatio: .64, shroudPairs: 3, ratlines: 9, yardSpread: 1.02,
  },
  brig: {
    frameCount: 32, beamStation: .52, forebody: .98, aftbody: 1.0, foreTip: .003, aftTip: .1,
    bottomFlat: .34, bilge: .21, flare: .08, tumble: .11, sheer: .98, entryVee: .48,
    stemRake: .038, cutwater: .3, sternRake: .024, counterOverhang: .05,
    forecastleLength: .09, quarterdeckLength: .24, visibleDecks: 1, waleHeights: [.36, .7],
    mastRakeDeg: 3.6, courseYardToBeam: 1.78, topsailYardRatio: .68, topgallantYardRatio: .46,
    lowerMastRatio: .63, shroudPairs: 3, ratlines: 10, yardSpread: 1.04,
  },
  snow: {
    frameCount: 28, beamStation: .5, forebody: .91, aftbody: 1.08, foreTip: .004, aftTip: .07,
    bottomFlat: .28, bilge: .16, flare: .1, tumble: .09, sheer: 1.02, entryVee: .52,
    stemRake: .04, cutwater: .33, sternRake: .02, counterOverhang: .042,
    forecastleLength: .08, quarterdeckLength: .2, visibleDecks: 1, waleHeights: [.38, .7],
    mastRakeDeg: 3.5, courseYardToBeam: 1.7, topsailYardRatio: .7, topgallantYardRatio: .47,
    lowerMastRatio: .63, shroudPairs: 3, ratlines: 9, yardSpread: .98,
  },
  cutter: {
    frameCount: 21, beamStation: .47, forebody: .66, aftbody: 1.04, foreTip: .003, aftTip: .045,
    bottomFlat: .14, bilge: .08, flare: .18, tumble: .02, sheer: 1.16, entryVee: .78,
    stemRake: .055, cutwater: .5, sternRake: .016, counterOverhang: .03,
    forecastleLength: 0, quarterdeckLength: .12, visibleDecks: 1, waleHeights: [.44],
    mastRakeDeg: 5.5, courseYardToBeam: 1.42, topsailYardRatio: .7, topgallantYardRatio: .48,
    lowerMastRatio: .6, shroudPairs: 2, ratlines: 8, yardSpread: .96,
  },
  frigate: {
    frameCount: 36, beamStation: .52, forebody: 1.16, aftbody: 1.16, foreTip: .002, aftTip: .078,
    bottomFlat: .2, bilge: .1, flare: .05, tumble: .2, sheer: .86, entryVee: .62,
    stemRake: .048, cutwater: .38, sternRake: .028, counterOverhang: .055,
    forecastleLength: .12, quarterdeckLength: .26, visibleDecks: 1, waleHeights: [.32, .58, .84],
    mastRakeDeg: 3.2, courseYardToBeam: 1.92, topsailYardRatio: .66, topgallantYardRatio: .44,
    lowerMastRatio: .65, shroudPairs: 4, ratlines: 11, yardSpread: 1.08,
  },
  barque: {
    frameCount: 32, beamStation: .52, forebody: .9, aftbody: 1.01, foreTip: .005, aftTip: .1,
    bottomFlat: .36, bilge: .22, flare: .08, tumble: .08, sheer: .96, entryVee: .42,
    stemRake: .036, cutwater: .28, sternRake: .02, counterOverhang: .046,
    forecastleLength: .07, quarterdeckLength: .18, visibleDecks: 1, waleHeights: [.4, .74],
    mastRakeDeg: 3.4, courseYardToBeam: 1.74, topsailYardRatio: .68, topgallantYardRatio: .46,
    lowerMastRatio: .63, shroudPairs: 3, ratlines: 10, yardSpread: 1.02,
  },
  caravel: {
    frameCount: 26, beamStation: .49, forebody: .82, aftbody: 1.22, foreTip: .003, aftTip: .035,
    bottomFlat: .15, bilge: .1, flare: .2, tumble: .07, sheer: 1.28, entryVee: .58,
    stemRake: .06, cutwater: .48, sternRake: .03, counterOverhang: .028,
    forecastleLength: .16, quarterdeckLength: .22, visibleDecks: 1, waleHeights: [.46],
    mastRakeDeg: 4.8, courseYardToBeam: 1.38, topsailYardRatio: .72, topgallantYardRatio: .52,
    lowerMastRatio: .6, shroudPairs: 2, ratlines: 8, yardSpread: .92,
  },
  carrack: {
    frameCount: 34, beamStation: .53, forebody: .74, aftbody: .76, foreTip: .006, aftTip: .18,
    bottomFlat: .46, bilge: .3, flare: .16, tumble: .08, sheer: 1.42, entryVee: .35,
    stemRake: .032, cutwater: .22, sternRake: .04, counterOverhang: .06,
    forecastleLength: .22, quarterdeckLength: .32, visibleDecks: 2, waleHeights: [.34, .62, .88],
    mastRakeDeg: 2.8, courseYardToBeam: 1.62, topsailYardRatio: .7, topgallantYardRatio: .5,
    lowerMastRatio: .61, shroudPairs: 3, ratlines: 10, yardSpread: 1.12,
  },
  galleon: {
    frameCount: 36, beamStation: .51, forebody: .86, aftbody: .9, foreTip: .003, aftTip: .145,
    bottomFlat: .38, bilge: .24, flare: .12, tumble: .13, sheer: 1.22, entryVee: .4,
    stemRake: .055, cutwater: .34, sternRake: .045, counterOverhang: .07,
    forecastleLength: .14, quarterdeckLength: .3, visibleDecks: 2, waleHeights: [.32, .58, .84],
    mastRakeDeg: 3.0, courseYardToBeam: 1.68, topsailYardRatio: .68, topgallantYardRatio: .48,
    lowerMastRatio: .63, shroudPairs: 3, ratlines: 10, yardSpread: 1.04,
  },
  fluyt: {
    frameCount: 34, beamStation: .54, forebody: .66, aftbody: .72, foreTip: .01, aftTip: .07,
    bottomFlat: .58, bilge: .38, flare: .02, tumble: .3, sheer: .78, entryVee: .28,
    stemRake: .028, cutwater: .2, sternRake: .015, counterOverhang: .055,
    forecastleLength: 0, quarterdeckLength: .16, visibleDecks: 1, waleHeights: [.48, .8],
    mastRakeDeg: 2.6, courseYardToBeam: 1.52, topsailYardRatio: .72, topgallantYardRatio: .5,
    lowerMastRatio: .64, shroudPairs: 2, ratlines: 9, yardSpread: .94,
  },
  xebec: {
    frameCount: 30, beamStation: .49, forebody: 1.32, aftbody: 1.2, foreTip: .001, aftTip: .022,
    bottomFlat: .1, bilge: .05, flare: .05, tumble: .0, sheer: .72, entryVee: .88,
    stemRake: .09, cutwater: .7, sternRake: .05, counterOverhang: .08,
    forecastleLength: 0, quarterdeckLength: .1, visibleDecks: 1, waleHeights: [.5],
    mastRakeDeg: 6.5, courseYardToBeam: 1.2, topsailYardRatio: .7, topgallantYardRatio: .5,
    lowerMastRatio: .58, shroudPairs: 2, ratlines: 7, yardSpread: 1.13,
  },
  junk: {
    frameCount: 32, beamStation: .5, forebody: .82, aftbody: .84, foreTip: .08, aftTip: .14,
    bottomFlat: .66, bilge: .08, flare: .03, tumble: .012, sheer: 1.32, entryVee: .22,
    stemRake: .02, cutwater: .15, sternRake: .02, counterOverhang: .08,
    forecastleLength: .08, quarterdeckLength: .12, visibleDecks: 1, waleHeights: [.55],
    mastRakeDeg: 1.2, courseYardToBeam: 1.35, topsailYardRatio: .8, topgallantYardRatio: .6,
    lowerMastRatio: .7, shroudPairs: 0, ratlines: 0, yardSpread: 1.02,
  },
  'first-rate': {
    frameCount: 42, beamStation: .52, forebody: 1.1, aftbody: 1.06, foreTip: .002, aftTip: .1,
    bottomFlat: .3, bilge: .19, flare: .06, tumble: .18, sheer: .92, entryVee: .55,
    stemRake: .042, cutwater: .3, sternRake: .032, counterOverhang: .065,
    forecastleLength: .14, quarterdeckLength: .28, visibleDecks: 3, waleHeights: [.28, .48, .68, .88],
    mastRakeDeg: 2.8, courseYardToBeam: 2.05, topsailYardRatio: .64, topgallantYardRatio: .42,
    lowerMastRatio: .66, shroudPairs: 5, ratlines: 12, yardSpread: 1.1,
  },
  pinnace: {
    frameCount: 16, beamStation: .5, forebody: .84, aftbody: .85, foreTip: .002, aftTip: .004,
    bottomFlat: .16, bilge: .07, flare: .09, tumble: .03, sheer: .88, entryVee: .8,
    stemRake: .04, cutwater: .55, sternRake: .04, counterOverhang: .008,
    forecastleLength: 0, quarterdeckLength: 0, visibleDecks: 1, waleHeights: [],
    mastRakeDeg: 2.0, courseYardToBeam: .9, topsailYardRatio: .7, topgallantYardRatio: .5,
    lowerMastRatio: .6, shroudPairs: 1, ratlines: 5, yardSpread: .74,
  },
};

for (const profile of Object.values(profiles)) Object.freeze(profile);
export const SHIP_STRUCTURE_BLUEPRINTS = Object.freeze(profiles);

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const activeStructureOverrides = Object.create(null);
export function setShipStructureOverrides(id, overrides = {}) {
  const key = String(id ?? '').replace(/^ship-/, '');
  if (!Object.hasOwn(SHIP_STRUCTURE_BLUEPRINTS, key)) return false;
  activeStructureOverrides[key] = overrides && typeof overrides === 'object' ? overrides : {};
  return true;
}
export function getShipStructureBlueprint(id) {
  const key = String(id ?? '').replace(/^ship-/, '');
  const base = SHIP_STRUCTURE_BLUEPRINTS[key];
  if (!base) return null;
  return { ...base, ...(activeStructureOverrides[key] || {}) };
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
  const profileSheer = profile?.sheer ?? 1;
  return design.deckHeightUnits
    + (design.hull.sheer ?? 0) * design.deckHeightUnits * edge
    + bowRise * design.deckHeightUnits * Math.pow(edge, 1.18) * profileSheer;
}

export function getHullFrameCount(design) {
  return getShipStructureBlueprint(design?.id)?.frameCount ?? 18;
}

export function getSheerPoint(design, station, side = 1) {
  const profile = getShipStructureBlueprint(design?.id);
  const deckY = getDeckSheer(design, station);
  if (!profile) {
    return { x: side * (design?.beamUnits ?? 0) * .5, y: deckY, z: (clamp01(station) - .5) * (design?.hullLengthUnits ?? 0) };
  }
  return getOpenHullPoint(design, profile, station, 1, side, deckY);
}
