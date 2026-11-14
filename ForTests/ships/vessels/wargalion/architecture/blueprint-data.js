/**
 * Wargalion's source and reconstructed geometry data.
 *
 * IMPORTANT: this is not a surveyed offset table. It is a deliberately
 * provenance-labelled interpretation of the published San Martín 1580 plan
 * reproduction. Keep the source values and the fitted geometry separate.
 * Replace the estimated ordinates only when a calibrated lines-plan trace is
 * available. Units for dimensions are metres; station/section values are
 * normalized fractions.
 */
export const WARGALION_BLUEPRINT_SOURCE = Object.freeze({
  schemaVersion: 1,
  vesselId: 'wargalion',
  referenceLabel: 'Galleon San Martín 1580',
  sourceTitle: 'Galleon San Martín 1580 — reproduced ship-modelling plan sheet',
  sourcePublisher: 'Shipmodell.com, Free Plans: Tall Ships',
  sourceRecordUrl: 'https://www.shipmodell.com/index_files/0PLAN1B.html',
  sourceImageUrl: 'https://www.shipmodell.com/imgplan/I_SAN_MARTIN_galleon_1580.jpg',
  userVisualLead: Object.freeze({
    pinUrl: 'https://in.pinterest.com/pin/789678115886237379/',
    searchUrl: 'https://in.pinterest.com/search/pins/?q=galleon%20plans&rs=typed',
    accessStatus: 'Pinterest page was not fetchable during this research pass; original pin author/source remains unverified.'
  }),
  availableViews: Object.freeze([
    'longitudinal profile and deck elevation',
    'bow and stern section drawings',
    'transverse body/section drawing',
    'visible scale bar labelled in metres'
  ]),
  provenanceClass: 'secondary-plan-reproduction',
  calibration: Object.freeze({
    status: 'not-calibrated',
    unit: 'metres',
    pixelToMetre: null,
    calibrationMarks: [],
    note: 'The source image is suitable for visual cross-checking, but its low-resolution web reproduction has not been calibrated or traced into measured offsets.'
  }),
  offsetStatus: 'visually-interpreted-estimates',
  confidence: 'low',
  lastReviewed: '2026-11-14',
  restrictions: Object.freeze([
    'Do not label any current station ordinate as measured or archival.',
    'Do not infer a historical ship identity from the Pinterest pin until its original source is verified.',
    'The 39.0 m by 11.7 m model dimensions are working scale choices, not validated offsets from the reproduced drawing.'
  ])
});

/**
 * Stations are normalized along the model length: 0 = stem extremity,
 * 0.5 = master frame, 1 = sternpost extremity. Values are estimated from the
 * reproduced profile/section family and from the existing Wargalion blockout.
 *
 * halfBreadth: maximum half-breadth / maximum half-beam
 * floorRatio: flat-floor half-breadth / local half-breadth
 * floorHeight: floor/keel baseline height / local section height
 * maxBreadthHeight: height of maximum breadth / local section height
 * deckRatio: deck-edge half-breadth / local half-breadth
 * keelDepthRatio: keel depth below baseline / design draft
 * sheerRiseRatio: sheer rise above the midship deck datum / design freeboard
 *
 * Each field includes sourceState so later calibration can replace estimates
 * without silently changing their provenance.
 */
export const WARGALION_HULL_STATIONS = Object.freeze([
  Object.freeze({ station: 0.000, halfBreadth: 0.012, floorRatio: 0.035, floorHeight: 0.100, maxBreadthHeight: 0.710, deckRatio: 0.72, keelDepthRatio: 0.42, sheerRiseRatio: 0.32, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.035, halfBreadth: 0.180, floorRatio: 0.075, floorHeight: 0.075, maxBreadthHeight: 0.675, deckRatio: 0.79, keelDepthRatio: 0.50, sheerRiseRatio: 0.27, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.080, halfBreadth: 0.355, floorRatio: 0.115, floorHeight: 0.050, maxBreadthHeight: 0.645, deckRatio: 0.83, keelDepthRatio: 0.60, sheerRiseRatio: 0.20, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.150, halfBreadth: 0.565, floorRatio: 0.155, floorHeight: 0.025, maxBreadthHeight: 0.620, deckRatio: 0.86, keelDepthRatio: 0.66, sheerRiseRatio: 0.12, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.245, halfBreadth: 0.765, floorRatio: 0.185, floorHeight: 0.008, maxBreadthHeight: 0.600, deckRatio: 0.885, keelDepthRatio: 0.69, sheerRiseRatio: 0.06, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.360, halfBreadth: 0.915, floorRatio: 0.205, floorHeight: 0.000, maxBreadthHeight: 0.585, deckRatio: 0.900, keelDepthRatio: 0.71, sheerRiseRatio: 0.02, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.500, halfBreadth: 1.000, floorRatio: 0.220, floorHeight: 0.000, maxBreadthHeight: 0.575, deckRatio: 0.910, keelDepthRatio: 0.72, sheerRiseRatio: 0.00, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.640, halfBreadth: 0.985, floorRatio: 0.215, floorHeight: 0.000, maxBreadthHeight: 0.585, deckRatio: 0.910, keelDepthRatio: 0.70, sheerRiseRatio: 0.02, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.755, halfBreadth: 0.905, floorRatio: 0.185, floorHeight: 0.008, maxBreadthHeight: 0.610, deckRatio: 0.895, keelDepthRatio: 0.66, sheerRiseRatio: 0.06, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.855, halfBreadth: 0.770, floorRatio: 0.145, floorHeight: 0.025, maxBreadthHeight: 0.645, deckRatio: 0.865, keelDepthRatio: 0.60, sheerRiseRatio: 0.12, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.925, halfBreadth: 0.600, floorRatio: 0.105, floorHeight: 0.050, maxBreadthHeight: 0.690, deckRatio: 0.825, keelDepthRatio: 0.50, sheerRiseRatio: 0.20, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.975, halfBreadth: 0.430, floorRatio: 0.065, floorHeight: 0.080, maxBreadthHeight: 0.735, deckRatio: 0.780, keelDepthRatio: 0.42, sheerRiseRatio: 0.27, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 1.000, halfBreadth: 0.270, floorRatio: 0.045, floorHeight: 0.100, maxBreadthHeight: 0.765, deckRatio: 0.745, keelDepthRatio: 0.38, sheerRiseRatio: 0.31, sourceState: 'visual-estimate' })
]);

export const WARGALION_SECTION_PROFILE = Object.freeze({
  floorBand: 0.14,
  bilgeEnd: 0.67,
  interpolation: 'shape-preserving-cubic-hermite',
  shapeNotes: 'The master section has a measurable flat floor, rounded bilge/futtock transition and separate inward tumblehome. Forward and aft floor rise are represented by station-specific floorHeight values.',
  sourceState: 'visual-estimate'
});

export const WARGALION_STERN_STATIONS = Object.freeze([
  Object.freeze({ station: 0.690, widthRatio: 0.62, wallHeight: 2.15 }),
  Object.freeze({ station: 0.735, widthRatio: 0.63, wallHeight: 2.32 }),
  Object.freeze({ station: 0.780, widthRatio: 0.61, wallHeight: 2.34 }),
  Object.freeze({ station: 0.820, widthRatio: 0.57, wallHeight: 2.38 }),
  Object.freeze({ station: 0.855, widthRatio: 0.52, wallHeight: 2.42 }),
  Object.freeze({ station: 0.890, widthRatio: 0.47, wallHeight: 2.55 }),
  Object.freeze({ station: 0.925, widthRatio: 0.41, wallHeight: 2.62 }),
  Object.freeze({ station: 0.955, widthRatio: 0.35, wallHeight: 2.40 }),
  Object.freeze({ station: 0.980, widthRatio: 0.29, wallHeight: 1.82 }),
  Object.freeze({ station: 1.000, widthRatio: 0.24, wallHeight: 1.10 })
]);

export const WARGALION_DECK_LEVELS = Object.freeze({
  main: Object.freeze({ baseRise: 0, camberRatio: 0.075 }),
  forecastle: Object.freeze({ rise: 0.55, start: 0.035, riseStart: 0.095, fallStart: 0.205, end: 0.275 }),
  quarterdeck: Object.freeze({ rise: 0.82, start: 0.695, riseStart: 0.775, fallStart: 0.885, end: 0.955 }),
  poop: Object.freeze({ rise: 0.38, start: 0.865, riseStart: 0.920, fallStart: 0.965, end: 0.997 })
});

export const WARGALION_RIG_REFERENCE = Object.freeze({
  sourceState: 'historical-type-inference',
  mastArrangement: 'three-mast arrangement: square fore and main, lateen mizzen',
  exactVesselRigPlanVerified: false,
  note: 'Retain as a plausible rig arrangement until a readable, attributable rig plan for the selected vessel is digitized.'
});
