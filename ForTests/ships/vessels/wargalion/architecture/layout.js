/**
 * Wargalion's ship-local component blueprint.
 * Forward -Z, aft +Z, port -X, starboard +X, up +Y.
 * Every generator receives the same resolved design and createShipContext().
 * Child components are registered with ctx.part(name,parent), while hull,
 * deck, bow, stern, mast and sail assemblies remain independently editable.
 */
export const WARGALION_ARCHITECTURE = Object.freeze({
  id: 'wargalion',
  schemaVersion: 2,
  coordinateSystem: Object.freeze({
    forward: '-z', aft: '+z', port: '-x', starboard: '+x',
    up: '+y', origin: 'keel-midships',
    stationAxis: 't=0 stem extremity; t=0.5 master frame; t=1 sternpost extremity',
    sectionAxis: 'v=0 keel centreline; v=floor band; v=bilge end; v=1 deck edge',
    units: 'metres converted to world units by WORLD_UNITS_PER_METRE=4/3'
  }),
  blueprintData: Object.freeze({
    module: './architecture/blueprint-data.js',
    stationTable: 'WARGALION_HULL_STATIONS',
    sternTable: 'WARGALION_STERN_STATIONS',
    sectionProfile: 'WARGALION_SECTION_PROFILE',
    provenance: 'secondary-plan-reproduction',
    offsetState: 'visually-interpreted-estimates',
    calibrationRequired: true,
    fittedGeometry: 'PCHIP shape-preserving cubic Hermite interpolation'
  }),
  assemblyOrder: Object.freeze([
    'hull', 'keel', 'stem', 'deck', 'frames', 'hull-planking',
    'deck-planking', 'stern', 'aft-cabins', 'bow', 'rudder', 'helm',
    'railings', 'deck-equipment', 'anchors', 'masts', 'head-sails'
  ]),
  components: Object.freeze({
    hull: { generator: './generators/hull/hull-generator.js', mount: 'station-lofted-port-starboard-skins-and-raked-end-closures' },
    keel: { generator: './generators/hull/keel-generator.js', mount: 'bevelled-longitudinal-keel-sweep' },
    stem: { generator: './generators/hull/stem-generator.js', mount: 'raked-stempost-and-transom-rim' },
    deck: { generator: './generators/decks/deck-generator.js', mount: 'sheer-camber-and-raised-deck-surfaces' },
    frames: { generator: './generators/hull-structure/frame-generator.js', mount: 'keel-arc-length-spaced-master-and-tail-frames' },
    'hull-planking': { generator: './generators/hull-structure/hull-planking-generator.js', mount: 'subtle-strakes-and-three-structural-wales' },
    'deck-planking': { generator: './generators/decks/deck-planking-generator.js', mount: 'low-contrast-longitudinal-seams-and-butt-joints' },
    stern: { generator: './generators/stern/stern-generator.js', mount: 'tapered-lofted-aftercastle-transom-roof-and-quarter-gallery-walkways' },
    'aft-cabins': { generator: './generators/cabins/aft-cabin-generator.js', mount: 'independent-aftercastle-roof-frame-timbers' },
    bow: { generator: './generators/bow/bow-generator.js', mount: 'tapered-beakhead-and-bowsprit' },
    bowsprit: { generator: './generators/bow/bow-generator.js', mount: 'independent-bowsprit-spar-assembly' },
    rudder: { generator: './generators/steering/rudder-generator.js', mount: 'slender-shaped-aft-leaf-and-stock' },
    helm: { generator: './generators/steering/helm-generator.js', mount: 'quarterdeck-pedestal-wheel-and-axle' },
    railings: { generator: './generators/deck-equipment/railing-generator.js', mount: 'deck-edge-following-sheer-and-bulwarks' },
    'deck-equipment': { generator: './generators/deck-equipment/fittings-generator.js', mount: 'deck-plan-referenced-bitts-and-hatches' },
    anchors: { generator: './generators/anchors/anchor-generator.js', mount: 'port-and-starboard-bow-quarters-and-chain-leads' },
    masts: { generator: './generators/masts/mast-frame-generator.js', mount: 'mast-stations-and-rig-specific-yard-or-lateen-geometry' },
    'head-sails': { generator: './generators/sails/head-sails-generator.js', mount: 'bowsprit-and-foremast-supported-staysails' },
    'standing-rigging': { generator: './generators/rigging/standing-rigging-generator.js', mount: 'mast-to-hull-shrouds-stays-and-ladder-ratlines' }
  }),
  editorPartNames: Object.freeze([
    'hull-skin-port', 'hull-skin-starboard',
    'deck-forecastle', 'deck-quarter', 'deck-poop', 'deck-edge-trim',
    'stern-transom', 'sterncastle-roof',
    'beakhead', 'forecastle-bulwarks'
  ]),
  mastInstances: Object.freeze([
    Object.freeze({ id: 'fore', foreAftStation: -0.305, heightScale: 1, radiusScale: 1, yardScale: 1 }),
    Object.freeze({ id: 'main', foreAftStation: -0.045, heightScale: 1, radiusScale: 1.08, yardScale: 1.06 }),
    Object.freeze({ id: 'mizzen', foreAftStation: 0.335, heightScale: 0.88, radiusScale: 0.86, yardScale: 0.88 })
  ]),
  dependencyGraph: Object.freeze({
    hull: ['blueprint-data'],
    keel: ['hull'],
    stem: ['hull'],
    deck: ['hull'],
    frames: ['hull', 'keel'],
    'hull-planking': ['hull'],
    'deck-planking': ['deck'],
    stern: ['hull', 'deck'],
    'aft-cabins': ['stern', 'deck'],
    bow: ['hull', 'deck'],
    rudder: ['hull', 'stern'],
    helm: ['deck', 'stern'],
    railings: ['deck', 'stern', 'bow'],
    'deck-equipment': ['deck'],
    anchors: ['hull', 'bow'],
    masts: ['hull', 'deck'],
    'head-sails': ['masts', 'bow', 'bowsprit'],
    'standing-rigging': ['masts', 'deck']
  }),
  componentContracts: Object.freeze({
    hull: Object.freeze({
      inputs: ['WARGALION_HULL_STATIONS', 'WARGALION_SECTION_PROFILE', 'resolved dimensions'],
      outputs: ['hull', 'hull-skin-port', 'hull-skin-starboard', 'wargalion-bow-hull-closure', 'wargalion-stern-transom-shell'],
      validates: ['station order', 'port-starboard symmetry', 'raked end closure', 'finite normals and bounds']
    }),
    keel: Object.freeze({
      inputs: ['keelY', 'hullLongitudinalZ', 'keelDetails'],
      outputs: ['keel', 'tapered-keel-timber'],
      validates: ['continuous rocker', 'positive timber section', 'no zero-length sweep segments']
    }),
    frames: Object.freeze({
      inputs: ['hullPoint', 'keelY', 'keel arc-length station sampler', 'frameCount'],
      outputs: ['frame-01..frame-N'],
      validates: ['equal keel-distance distribution', 'section coincidence', 'master-frame identity']
    }),
    stern: Object.freeze({
      inputs: ['WARGALION_STERN_STATIONS', 'deckSurfaceY', 'hullLongitudinalZ'],
      outputs: ['sternworks', 'stern-tier-1..3', 'stern-transom', 'sterncastle-roof', 'stern-gallery', 'stern-windows'],
      validates: ['shared tier boundaries', 'roof and end-wall closure', 'gallery surface continuity']
    }),
    bow: Object.freeze({
      inputs: ['forward hull stations', 'deckSurfaceY', 'hullLongitudinalZ'],
      outputs: ['bowworks', 'beakhead', 'bowsprit', 'bowsprit-gammoning', 'forecastle-bulwarks'],
      validates: ['stem-to-beakhead meeting', 'bowsprit support endpoints', 'forecastle edge alignment']
    }),
    sails: Object.freeze({
      inputs: ['mast and yard support points', 'fullness', 'wind controls'],
      outputs: ['sail-*', 'cloth-sail-*', 'panel-seams-*', 'head-stays-*'],
      validates: ['non-zero cloth triangles', 'support-edge attachment', 'deployment-grid stability']
    }),
    steering: Object.freeze({
      inputs: ['sternpost station', 'keel profile', 'rudderDetails'],
      outputs: ['rudder', 'rudder-stock', 'rudder-tiller', 'helm', 'helm-wheel', 'helm-axle'],
      validates: ['rudder leaf behind sternpost', 'slender stock', 'preserved editor pivots']
    })
  })
});
