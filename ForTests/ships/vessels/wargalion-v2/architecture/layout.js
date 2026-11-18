/**
 * Wargalion V2 physical assembly map.
 * Forward -Z, aft +Z, port -X, starboard +X, up +Y.
 *
 * hull-surface.js is the sole hull-form authority. Every hull skin, keel
 * alignment, deck edge and superstructure station samples that evaluator.
 */
export const WARGALION_V2_ARCHITECTURE = Object.freeze({
  id: 'wargalion-v2',
  schemaVersion: 2,
  coordinateSystem: Object.freeze({
    forward: '-z', aft: '+z', port: '-x', starboard: '+x',
    up: '+y', origin: 'keel-midships',
    stationAxis: 't=0 forward stem; t=0.5 master frame; t=1 aft transom',
    sectionAxis: 'v=0 keel centre; floor band; rounded turn of bilge; v=1 deck edge',
    units: 'metres converted to editor world units by WORLD_UNITS_PER_METRE=4/3'
  }),
  surfaceAuthority: './architecture/hull-surface.js',
  lineFamilies: Object.freeze({
    stations: 'sampleStationCurve(d,t,side) — transverse sections',
    waterlines: 'sampleWaterlineCurve(d,y,side) — horizontal intersections',
    buttocks: 'sampleButtockCurve(d,x,side,branch) — longitudinal vertical-plane intersections'
  }),
  blueprintData: Object.freeze({
    module: './architecture/blueprint-data.js',
    stationTable: 'WARGALION_V2_HULL_STATIONS',
    sectionProfile: 'WARGALION_V2_SECTION',
    calibration: 'required-before-historical-offset-claims',
    offsetState: 'reconstruction-estimates-not-calibrated',
    fairing: 'bivariate shape-preserving cubic Hermite interpolation'
  }),
  assemblyOrder: Object.freeze(['hull', 'keel', 'stem', 'sternpost', 'transom', 'deck', 'forecastle-bulwark', 'aftercastle']),
  components: Object.freeze({
    hull: Object.freeze({ generator: './generators/hull/hull-generator.js', source: 'shared hull surface, two separate skins and wale bands' }),
    hullWales: Object.freeze({ generator: './generators/hull/hull-wales-generator.js', source: 'three continuous timber bands per side sampled from shared hull surface' }),
    keel: Object.freeze({ generator: './generators/hull/keel-generator.js', source: 'keel centreline sampled from hull surface' }),
    stem: Object.freeze({ generator: './generators/hull/stem-generator.js', source: 'forward centreline sampled from hull surface' }),
    sternpost: Object.freeze({ generator: './generators/hull/sternpost-generator.js', source: 'aft centreline sampled from hull surface' }),
    transom: Object.freeze({ generator: './generators/hull/transom-generator.js', source: 'aft station surface sampled from the same hull evaluator' }),
    deck: Object.freeze({ generator: './generators/decks/deck-generator.js', source: 'main sheer plus separately raised deck platforms' }),
    forecastleBulwark: Object.freeze({ generator: './generators/cabins/forecastle-bulwark-generator.js', source: 'separate side bulwarks framing the raised foredeck' }),
    aftercastle: Object.freeze({ generator: './generators/cabins/aftercastle-generator.js', source: 'assembly-only coordinator for dedicated cabin component generators' }),
    aftercastleSideWalls: Object.freeze({ generator: './generators/cabins/aftercastle-side-walls-generator.js', source: 'tier-specific side wall meshes' }),
    aftercastleEndWalls: Object.freeze({ generator: './generators/cabins/aftercastle-end-walls-generator.js', source: 'tier-specific fore and aft wall meshes' }),
    aftercastleRoofs: Object.freeze({ generator: './generators/cabins/aftercastle-roof-generator.js', source: 'independent polygonal gabled roof surfaces' }),
    aftercastleWindows: Object.freeze({ generator: './generators/cabins/aftercastle-windows-generator.js', source: 'independent glazed window and frame geometry' }),
    quarterGalleries: Object.freeze({ generator: './generators/cabins/quarter-gallery-generator.js', source: 'port and starboard gallery deck and rail geometry' })
  }),
  assemblyDependencies: Object.freeze({
    hull: ['blueprint-data', 'hull-surface'],
    keel: ['hull-surface'],
    stem: ['hull-surface'],
    sternpost: ['hull-surface'],
    transom: ['hull-surface'],
    deck: ['hull-surface'],
    aftercastle: ['hull-surface', 'deck']
  }),
  mastInstances: Object.freeze([]),
  editorPartNames: Object.freeze([
    'hull-skin-port', 'hull-skin-starboard', 'hull-wales',
    'keel', 'stem', 'sternpost', 'stern-transom',
    'main-deck', 'forecastle-deck', 'quarterdeck', 'forecastle-bulwark', 'forecastle-bulwark-port', 'forecastle-bulwark-starboard',
    'aftercastle', 'aftercastle-tier-1', 'aftercastle-tier-2', 'aftercastle-tier-3',
    'aftercastle-side-port-tier-1', 'aftercastle-side-starboard-tier-1',
    'aftercastle-side-port-tier-2', 'aftercastle-side-starboard-tier-2',
    'aftercastle-side-port-tier-3', 'aftercastle-side-starboard-tier-3',
    'aftercastle-front-wall-tier-1', 'aftercastle-aft-wall-tier-1',
    'aftercastle-front-wall-tier-2', 'aftercastle-aft-wall-tier-2',
    'aftercastle-front-wall-tier-3', 'aftercastle-aft-wall-tier-3',
    'aftercastle-roof-tier-1', 'aftercastle-roof-tier-2', 'aftercastle-roof-tier-3',
    'aftercastle-windows', 'quarter-gallery-port', 'quarter-gallery-starboard'
  ])
});
