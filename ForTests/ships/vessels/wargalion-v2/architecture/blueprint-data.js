/**
 * Wargalion V2 — provenance-labelled reconstruction inputs.
 *
 * These are working geometry offsets, not an archival offsets table. The
 * published San Martín reproductions disagree on principal dimensions and
 * do not provide a calibrated digital lines plan. Keep that uncertainty
 * visible until a traceable plan can be measured.
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
      note: 'Cites estimated San Martín dimensions from Augusto Salgado and Casado Soto; Casado Soto values are 35.24 × 10.51 × 5.60 m. The source explicitly presents these as estimates, not an original lines plan.'
    }),
    Object.freeze({
      title: 'Spanish Navy — Revista General de Marina, July 2007: San Martín model and dimensions',
      url: 'https://www.shipmodell.com/index_files/0PLAN1B.html',
      sourceType: 'secondary-plan-reproduction',
      note: 'Useful profile and section reference; its web reproduction has not been calibrated into offsets.'
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
 * 1 = aft transom. All ordinates are dimensionless estimates.
 *
 * halfBreadth is relative to maximum half-beam. floorRatio is the flat-floor
 * half-breadth fraction. floorHeight and maxBreadthHeight are measured from
 * the local keel-to-deck section height. deckRatio describes the upper
 * tumblehome at deck edge.
 */
export const WARGALION_V2_HULL_STATIONS = Object.freeze([
  Object.freeze({ station: 0.000, halfBreadth: 0.012, floorRatio: 0.035, floorHeight: 0.085, maxBreadthHeight: 0.307, deckRatio: 0.58, keelDepthRatio: 0.42, sheerRiseRatio: 0.44, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.035, halfBreadth: 0.165, floorRatio: 0.070, floorHeight: 0.060, maxBreadthHeight: 0.350, deckRatio: 0.64, keelDepthRatio: 0.49, sheerRiseRatio: 0.38, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.080, halfBreadth: 0.365, floorRatio: 0.115, floorHeight: 0.040, maxBreadthHeight: 0.404, deckRatio: 0.70, keelDepthRatio: 0.58, sheerRiseRatio: 0.30, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.150, halfBreadth: 0.585, floorRatio: 0.160, floorHeight: 0.020, maxBreadthHeight: 0.454, deckRatio: 0.76, keelDepthRatio: 0.65, sheerRiseRatio: 0.19, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.245, halfBreadth: 0.785, floorRatio: 0.190, floorHeight: 0.006, maxBreadthHeight: 0.493, deckRatio: 0.80, keelDepthRatio: 0.69, sheerRiseRatio: 0.08, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.360, halfBreadth: 0.930, floorRatio: 0.210, floorHeight: 0.000, maxBreadthHeight: 0.513, deckRatio: 0.83, keelDepthRatio: 0.71, sheerRiseRatio: 0.025, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.500, halfBreadth: 1.000, floorRatio: 0.220, floorHeight: 0.000, maxBreadthHeight: 0.523, deckRatio: 0.84, keelDepthRatio: 0.72, sheerRiseRatio: 0.00, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.640, halfBreadth: 0.990, floorRatio: 0.215, floorHeight: 0.000, maxBreadthHeight: 0.509, deckRatio: 0.83, keelDepthRatio: 0.70, sheerRiseRatio: 0.025, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.755, halfBreadth: 0.920, floorRatio: 0.190, floorHeight: 0.006, maxBreadthHeight: 0.482, deckRatio: 0.81, keelDepthRatio: 0.66, sheerRiseRatio: 0.08, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.855, halfBreadth: 0.800, floorRatio: 0.160, floorHeight: 0.025, maxBreadthHeight: 0.434, deckRatio: 0.78, keelDepthRatio: 0.60, sheerRiseRatio: 0.19, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.925, halfBreadth: 0.670, floorRatio: 0.130, floorHeight: 0.050, maxBreadthHeight: 0.369, deckRatio: 0.73, keelDepthRatio: 0.50, sheerRiseRatio: 0.30, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 0.975, halfBreadth: 0.530, floorRatio: 0.110, floorHeight: 0.080, maxBreadthHeight: 0.316, deckRatio: 0.68, keelDepthRatio: 0.42, sheerRiseRatio: 0.38, sourceState: 'visual-estimate' }),
  Object.freeze({ station: 1.000, halfBreadth: 0.520, floorRatio: 0.090, floorHeight: 0.100, maxBreadthHeight: 0.286, deckRatio: 0.64, keelDepthRatio: 0.38, sheerRiseRatio: 0.44, sourceState: 'visual-estimate' })
]);

export const WARGALION_V2_SECTION = Object.freeze({
  floorBand: 0.16,
  bilgeEnd: 0.68,
  interpolation: 'shape-preserving-cubic-hermite',
  description: 'A broad flat floor rises through a rounded turn of bilge to maximum breadth, then returns inward through the upper tumblehome.'
});

export const WARGALION_V2_DECKS = Object.freeze({
  camberRatio: 0.065,
  forecastle: Object.freeze({ rise: 0.52, start: 0.035, riseStart: 0.085, fallStart: 0.205, end: 0.275, widthScale: 0.84 }),
  quarterdeck: Object.freeze({ rise: 0.72, start: 0.675, riseStart: 0.735, fallStart: 0.985, end: 1.0, widthScale: 0.86 })
});

export const WARGALION_V2_CASTLE_TIERS = Object.freeze([
  Object.freeze({ id: 1, t0: 0.680, t1: 0.975, widthScale: 0.84, baseOffset: 0.00, wallHeight: 1.52, roofRise: 0.075, roofStyle: 'deck', topInset: 0.105, endCrown: 0.10, galleryDepth: 0.82, sideCamber: 0.075 }),
  Object.freeze({ id: 2, t0: 0.785, t1: 0.962, widthScale: 0.72, baseOffset: 1.60, wallHeight: 1.34, roofRise: 0.065, roofStyle: 'deck', topInset: 0.13, endCrown: 0.08, galleryDepth: 0.63, sideCamber: 0.06 }),
  Object.freeze({ id: 3, t0: 0.875, t1: 0.945, widthScale: 0.58, baseOffset: 3.01, wallHeight: 1.12, roofRise: 0.24, roofStyle: 'cap', topInset: 0.16, endCrown: 0.06, galleryDepth: 0.44, sideCamber: 0.045 })
]);
