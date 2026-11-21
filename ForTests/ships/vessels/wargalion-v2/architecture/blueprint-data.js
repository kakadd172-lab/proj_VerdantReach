/**
 * Wargalion V2 — provenance-labelled reconstruction inputs.
 *
 * These are working geometry offsets, not an archival offsets table. The
 * reproduced San Martín plan is used as a visual control for the hull sheer,
 * rising keel, tumblehome and tiered stern works; no pixel-to-metre calibration
 * has been claimed. Keep that uncertainty visible until the sheet is traced.
 */
export const WARGALION_V2_SOURCE = Object.freeze({
  schemaVersion: 1,
  vesselId: 'wargalion-v2',
  referenceVessel: 'San Martín / São Martinho',
  referenceBuildDate: 'late 16th century; reported dates differ by source',
  primaryWorkingDimensions: Object.freeze({ length: 39.0, beam: 11.7, sourceYear: 2007 }),
  alternativePublishedDimensions: Object.freeze({
    length: 35.24, beam: 10.51, mouldedDepth: 5.60,
    source: 'Casado Soto figures cited in Revista de Historia Naval, Supplement 16 (2012)'
  }),
  derivedWorkingMouldedDepth: Object.freeze({
    metres: 6.20,
    method: '5.60 m × (39.0 m / 35.24 m)',
    status: 'proportional-scaling-estimate-not-a-directly-reported-measurement'
  }),
  alternativeSalgadoDimensions: Object.freeze({
    keelLength: 27.0, beam: 11.15, firstDeckDepth: 4.0,
    source: 'Augusto Salgado figures cited in Revista de Historia Naval, Supplement 16 (2012)'
  }),
  dimensionStatus: 'conflicting-estimated-dimensions; 39.0 × 11.7 m retained as working model scale; moulded depth scaled proportionally from Casado Soto estimate',
  offsetsStatus: 'reconstruction-estimates-not-calibrated',
  provenance: 'secondary-plan-reproduction-and-historical-comparison',
  limitations: Object.freeze([
    'No verified original San Martín offsets table has been digitized.',
    'The 6.20 m working moulded depth is proportionally scaled from Casado Soto’s 5.60 m estimate to the 39.0 m working length; it is not a separate documented measurement.',
    'The reproduced plan is a secondary modelling plan, not a surviving shipyard draught.',
    'Station ordinates below are authored reconstruction estimates, not measured archival values.',
    'Portuguese 16th-century rising-and-narrowing research is contextual evidence, not proof of this exact vessel method.',
    'The aftercastle arrangement is a geometry study and should be checked against attributable contemporary depictions.'
  ]),
  sources: Object.freeze([
    Object.freeze({
      title: 'Revista General de Marina, July 2007 — San Martín model and dimensions',
      url: 'https://armada.defensa.gob.es/archivo/rgm/2007/200707.pdf',
      sourceType: 'naval-periodical-model-report',
      note: 'Reports a model representing the ship built in Portugal in 1580 and gives approximately 39 m × 11.7 m.'
    }),
    Object.freeze({
      title: 'González-Aller Hierro — Resumen del historial de los navíos portugueses que participaron en la jornada de Inglaterra de 1588, Revista de Historia Naval Supplement 16 (2012)',
      url: 'https://armada.defensa.gob.es/archivo/mardigitalrevistas/rhn/2012/201216.pdf',
      sourceType: 'official-naval-historical-publication',
      note: 'Cites estimated San Martín dimensions from Augusto Salgado and Casado Soto; Casado Soto values are 35.24 × 10.51 × 5.60 m. The source presents these as estimates, not an original lines plan.'
    }),
    Object.freeze({
      title: 'Shipmodell — Galleon San Martín 1580 reproduced plan set',
      url: 'https://www.shipmodell.com/index_files/0PLAN1B.html',
      sourceType: 'secondary-plan-reproduction',
      note: 'Side elevation, end views and sections are used for visual comparison; the reproduction has not been calibrated into offsets.'
    }),
    Object.freeze({
      title: 'Filipe Castro — Rising and Narrowing: 16th-Century Geometric Algorithms used to Design the Bottom of Ships in Portugal (2007)',
      url: 'https://doi.org/10.1111/j.1095-9270.2006.00116.x',
      sourceType: 'peer-reviewed-nautical-archaeology',
      note: 'Context for Portuguese turn-of-bilge construction geometry; not vessel-specific proof.'
    }),
    Object.freeze({
      title: 'National Historic Ships UK — Understanding Historic Vessels, Volume 1 (2nd edition, 2025)',
      url: 'https://www.nationalhistoricships.org.uk/',
      sourceType: 'recording-guidance',
      note: 'Supports consistent body-plan, waterline and buttock cross-checking.'
    })
  ])
});

/**
 * Normalized station positions: 0 = forward stem, 0.5 = master frame,
 * 1 = aft transom. All ordinates are dimensionless reconstruction estimates.
 *
 * The new side-profile pass increases the rising keel and sheer at both ends,
 * while drawing the upper hull inward. The central body remains full and
 * rounded rather than being pinched into a modern narrow yacht section.
 */
export const WARGALION_V2_HULL_STATIONS = Object.freeze([
  Object.freeze({ station: 0.000, halfBreadth: 0.012, floorRatio: 0.035, floorHeight: 0.085, maxBreadthHeight: 0.307, deckRatio: 0.52, keelDepthRatio: 0.26, sheerRiseRatio: 0.68, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.035, halfBreadth: 0.165, floorRatio: 0.070, floorHeight: 0.060, maxBreadthHeight: 0.350, deckRatio: 0.60, keelDepthRatio: 0.29, sheerRiseRatio: 0.60, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.080, halfBreadth: 0.365, floorRatio: 0.115, floorHeight: 0.040, maxBreadthHeight: 0.404, deckRatio: 0.66, keelDepthRatio: 0.36, sheerRiseRatio: 0.47, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.150, halfBreadth: 0.585, floorRatio: 0.160, floorHeight: 0.020, maxBreadthHeight: 0.454, deckRatio: 0.71, keelDepthRatio: 0.47, sheerRiseRatio: 0.31, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.245, halfBreadth: 0.785, floorRatio: 0.190, floorHeight: 0.006, maxBreadthHeight: 0.493, deckRatio: 0.75, keelDepthRatio: 0.60, sheerRiseRatio: 0.13, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.360, halfBreadth: 0.930, floorRatio: 0.210, floorHeight: 0.000, maxBreadthHeight: 0.513, deckRatio: 0.77, keelDepthRatio: 0.68, sheerRiseRatio: 0.04, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.500, halfBreadth: 1.000, floorRatio: 0.220, floorHeight: 0.000, maxBreadthHeight: 0.523, deckRatio: 0.79, keelDepthRatio: 0.72, sheerRiseRatio: 0.00, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.640, halfBreadth: 0.990, floorRatio: 0.215, floorHeight: 0.000, maxBreadthHeight: 0.509, deckRatio: 0.79, keelDepthRatio: 0.70, sheerRiseRatio: 0.03, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.755, halfBreadth: 0.920, floorRatio: 0.190, floorHeight: 0.006, maxBreadthHeight: 0.482, deckRatio: 0.77, keelDepthRatio: 0.65, sheerRiseRatio: 0.10, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.855, halfBreadth: 0.800, floorRatio: 0.160, floorHeight: 0.025, maxBreadthHeight: 0.434, deckRatio: 0.72, keelDepthRatio: 0.56, sheerRiseRatio: 0.24, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.925, halfBreadth: 0.670, floorRatio: 0.130, floorHeight: 0.050, maxBreadthHeight: 0.369, deckRatio: 0.66, keelDepthRatio: 0.43, sheerRiseRatio: 0.42, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.975, halfBreadth: 0.530, floorRatio: 0.110, floorHeight: 0.080, maxBreadthHeight: 0.316, deckRatio: 0.60, keelDepthRatio: 0.32, sheerRiseRatio: 0.57, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 1.000, halfBreadth: 0.520, floorRatio: 0.090, floorHeight: 0.100, maxBreadthHeight: 0.286, deckRatio: 0.56, keelDepthRatio: 0.28, sheerRiseRatio: 0.65, sourceState: 'visual-estimate' })
]);

export const WARGALION_V2_SECTION = Object.freeze({
  floorBand: 0.16,
  bilgeEnd: 0.68,
  interpolation: 'shape-preserving-cubic-hermite',
  description: 'A broad, low floor rises through a rounded turn of bilge to maximum breadth, then returns inward through pronounced upper tumblehome.'
});

export const WARGALION_V2_DECKS = Object.freeze({
  camberRatio: 0.065,
  forecastle: Object.freeze({ rise: 1.02, start: 0.025, riseStart: 0.085, fallStart: 0.235, end: 0.320, widthScale: 0.82 }),
  quarterdeck: Object.freeze({ rise: 1.12, start: 0.650, riseStart: 0.735, fallStart: 0.985, end: 1.000, widthScale: 0.82 })
});

export const WARGALION_V2_CASTLE_TIERS = Object.freeze([
  Object.freeze({
    id: 1, t0: 0.665, t1: 0.975, widthScale: 0.78,
    baseOffset: 0.00, baseRise: 0.00, wallHeight: 1.55, aftRise: 0.62,
    roofRise: 0.13, roofStyle: 'deck', topInset: 0.22, endCrown: 0.18,
    galleryDepth: 0.72, sideCamber: 0.11, longitudinalInset: 0.95, transomProjection: 0.48
  }),
  Object.freeze({
    id: 2, t0: 0.775, t1: 0.962, widthScale: 0.65,
    baseOffset: 1.77, baseRise: 0.37, wallHeight: 1.38, aftRise: 0.48,
    roofRise: 0.11, roofStyle: 'deck', topInset: 0.26, endCrown: 0.15,
    galleryDepth: 0.54, sideCamber: 0.09, longitudinalInset: 0.75, transomProjection: 0.36
  }),
  Object.freeze({
    id: 3, t0: 0.855, t1: 0.945, widthScale: 0.52,
    baseOffset: 3.52, baseRise: 0.41, wallHeight: 1.16, aftRise: 0.32,
    roofRise: 0.24, roofStyle: 'cap', topInset: 0.30, endCrown: 0.12,
    galleryDepth: 0.36, sideCamber: 0.07, longitudinalInset: 0.52, transomProjection: 0.24
  })
]);
