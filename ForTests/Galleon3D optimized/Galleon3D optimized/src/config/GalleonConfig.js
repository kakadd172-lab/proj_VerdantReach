/**
 * Parametric configuration calibrated to the Golden Hind (ex Pelycan, c. 1575)
 * naval architecture blueprints: ~22m hull length, ~6.2m beam, race-built
 * Elizabethan sheer, pronounced tumblehome, stepped castles, single central
 * poop lantern, whipstaff steering, and 3-mast + spritsail rig.
 */
export const DEFAULT_GALLEON_CONFIG = {
  seed: 1575,
  scale: 1.0,
  detailLevel: 'high', // 'low' | 'medium' | 'high'

  hull: {
    length: 22.0,
    beam: 6.2,
    depth: 3.9,
    draft: 2.25,
    keelThickness: 0.34,
    keelWidth: 0.32,
    bowOverhang: 2.4,
    sternOverhang: 2.1,
    sternHeight: 7.4,
    forecastleHeight: 4.5,
    tumblehome: 0.28,
    bilgeFullness: 0.70,
    sheerAft: 2.45,
    sheerForward: 1.05,
    plankStrakes: 22,
    plankSeamRatio: 0.05,
    waleCount: 3,
    ribSpacing: 0.68,
    gunportsPerSide: 6,
  },

  decks: {
    count: 4,
    plankWidth: 0.19,
    camber: 0.14,
  },

  masts: {
    count: 3,
    bowsprit: { angle: 28, length: 9.8, baseRadius: 0.22 },
    fore: { station: 0.78, height: 17.5, baseRadius: 0.28 },
    main: { station: 0.48, height: 21.0, baseRadius: 0.34 },
    mizzen: { station: 0.19, height: 14.0, baseRadius: 0.22 },
  },

  figureheadStyle: 'skullSword',
  sails: {
    deployment: 'full', // 'full' | 'half' | 'battle' | 'furled' | 'none'
    billow: 0.95,
    curvature: 0.85,
    windDirection: 0.25,
    windStrength: 0.78,
    panelColumns: 7,
  },

  rigging: {
    detailLevel: 'high',
    shroudsPerSide: { fore: 5, main: 7, mizzen: 3 },
    ratlineSpacing: 0.34,
    ropeThickness: 0.018,
  },

  weapons: {
    lowerDeckCannons: 10,
    upperDeckCannons: 4,
    sternChasers: 2,
    swivelGuns: 4,
  },

  materials: {
    woodVariation: 0.38,
    weathering: 0.45,
  },
};

export function createGalleonConfig(overrides = {}) {
  const detailLevel = overrides.detailLevel || DEFAULT_GALLEON_CONFIG.detailLevel;
  return {
    ...DEFAULT_GALLEON_CONFIG,
    ...overrides,
    detailLevel,
    hull: { ...DEFAULT_GALLEON_CONFIG.hull, ...(overrides.hull || {}) },
    decks: { ...DEFAULT_GALLEON_CONFIG.decks, ...(overrides.decks || {}) },
    masts: {
      ...DEFAULT_GALLEON_CONFIG.masts,
      ...(overrides.masts || {}),
      bowsprit: {
        ...DEFAULT_GALLEON_CONFIG.masts.bowsprit,
        ...((overrides.masts && overrides.masts.bowsprit) || {}),
      },
      fore: {
        ...DEFAULT_GALLEON_CONFIG.masts.fore,
        ...((overrides.masts && overrides.masts.fore) || {}),
      },
      main: {
        ...DEFAULT_GALLEON_CONFIG.masts.main,
        ...((overrides.masts && overrides.masts.main) || {}),
      },
      mizzen: {
        ...DEFAULT_GALLEON_CONFIG.masts.mizzen,
        ...((overrides.masts && overrides.masts.mizzen) || {}),
      },
    },
    sails: { ...DEFAULT_GALLEON_CONFIG.sails, ...(overrides.sails || {}) },
    rigging: {
      detailLevel,
      ...DEFAULT_GALLEON_CONFIG.rigging,
      ...(overrides.rigging || {}),
      shroudsPerSide: {
        ...DEFAULT_GALLEON_CONFIG.rigging.shroudsPerSide,
        ...((overrides.rigging && overrides.rigging.shroudsPerSide) || {}),
      },
    },
    weapons: { ...DEFAULT_GALLEON_CONFIG.weapons, ...(overrides.weapons || {}) },
    materials: { ...DEFAULT_GALLEON_CONFIG.materials, ...(overrides.materials || {}) },
  };
}
