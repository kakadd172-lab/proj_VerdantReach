/** Wargalion's ship-local component blueprint. Forward -Z, aft +Z, port -X, starboard +X, up +Y. */
export const WARGALION_ARCHITECTURE = Object.freeze({
  id: 'wargalion',
  schemaVersion: 1,
  coordinateSystem: Object.freeze({
    forward: '-z', aft: '+z', port: '-x', starboard: '+x',
    up: '+y', origin: 'keel-midships'
  }),
  assemblyOrder: Object.freeze([
    'hull', 'keel', 'stem', 'deck', 'frames', 'hull-planking',
    'deck-planking', 'stern', 'aft-cabins', 'bow', 'rudder', 'helm',
    'railings', 'deck-equipment', 'anchors', 'masts', 'head-sails'
  ]),
  components: Object.freeze({
    hull: { generator: './generators/hull/hull-generator.js', mount: 'keel-midships' },
    keel: { generator: './generators/hull/keel-generator.js', mount: 'bottom-centreline' },
    stem: { generator: './generators/hull/stem-generator.js', mount: 'fore-and-aft-posts' },
    deck: { generator: './generators/decks/deck-generator.js', mount: 'sheer-line' },
    frames: { generator: './generators/hull-structure/frame-generator.js', mount: 'internal-hull-stations' },
    'hull-planking': { generator: './generators/hull-structure/hull-planking-generator.js', mount: 'outer-hull-surface' },
    'deck-planking': { generator: './generators/decks/deck-planking-generator.js', mount: 'deck-surface' },
    stern: { generator: './generators/stern/stern-generator.js', mount: 'aft-transom-and-sterncastle' },
    'aft-cabins': { generator: './generators/cabins/aft-cabin-generator.js', mount: 'sterncastle-roof-and-galleries' },
    bow: { generator: './generators/bow/bow-generator.js', mount: 'fore-stem-and-forecastle' },
    rudder: { generator: './generators/steering/rudder-generator.js', mount: 'sternpost' },
    helm: { generator: './generators/steering/helm-generator.js', mount: 'quarterdeck' },
    railings: { generator: './generators/deck-equipment/railing-generator.js', mount: 'deck-edge' },
    'deck-equipment': { generator: './generators/deck-equipment/fittings-generator.js', mount: 'open-deck-plan' },
    anchors: { generator: './generators/anchors/anchor-generator.js', mount: 'bow-quarters' },
    masts: { generator: './generators/masts/mast-frame-generator.js', mount: 'keel-and-deck-mast-stations' },
    'head-sails': { generator: './generators/sails/head-sails-generator.js', mount: 'bowsprit-and-foremast' },
    'standing-rigging': { generator: './generators/rigging/standing-rigging-generator.js', mount: 'mastheads-to-hull-rail' }
  }),
  mastInstances: Object.freeze([
    Object.freeze({ id: 'fore', foreAftStation: -0.305, heightScale: 1, radiusScale: 1, yardScale: 1 }),
    Object.freeze({ id: 'main', foreAftStation: -0.045, heightScale: 1, radiusScale: 1.08, yardScale: 1.06 }),
    Object.freeze({ id: 'mizzen', foreAftStation: 0.335, heightScale: 0.88, radiusScale: 0.86, yardScale: 0.88 })
  ]),
  dependencyGraph: Object.freeze({
    deck: ['hull'], frames: ['hull'], 'hull-planking': ['hull'],
    'deck-planking': ['deck'], stern: ['hull', 'deck'],
    'aft-cabins': ['stern', 'deck'], bow: ['hull', 'deck'],
    rudder: ['hull', 'stern'], helm: ['deck', 'stern'],
    railings: ['deck', 'stern', 'bow'], 'deck-equipment': ['deck'],
    anchors: ['hull', 'bow'], masts: ['hull', 'deck'],
    'head-sails': ['masts', 'bow'], 'standing-rigging': ['masts', 'deck']
  })
});
