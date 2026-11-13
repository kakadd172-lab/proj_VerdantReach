/** Independent component layout for the late-sixteenth-century War Galleon II. */
export const WAR_GALLEON_2_ARCHITECTURE = Object.freeze({
  id: 'war-galleon-2',
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
    keel: { generator: './generators/hull/keel-generator.js', mount: 'hull-keel-line' },
    stem: { generator: './generators/hull/stem-generator.js', mount: 'fore-and-aft-stem-posts' },
    deck: { generator: './generators/decks/deck-generator.js', mount: 'hull-sheer-line' },
    frames: { generator: './generators/hull-structure/frame-generator.js', mount: 'hull-stations' },
    'hull-planking': { generator: './generators/hull-structure/hull-planking-generator.js', mount: 'hull-surface' },
    'deck-planking': { generator: './generators/decks/deck-planking-generator.js', mount: 'deck-surface' },
    stern: { generator: './generators/stern/stern-generator.js', mount: 'aft-transom-and-quarter-galleries' },
    'aft-cabins': { generator: './generators/cabins/aft-cabin-generator.js', mount: 'sterncastle-and-quarterdeck' },
    bow: { generator: './generators/bow/bow-generator.js', mount: 'fore-stem-and-beakhead' },
    rudder: { generator: './generators/steering/rudder-generator.js', mount: 'sternpost' },
    helm: { generator: './generators/steering/helm-generator.js', mount: 'quarterdeck' },
    railings: { generator: './generators/deck-equipment/railing-generator.js', mount: 'deck-edge' },
    'deck-equipment': { generator: './generators/deck-equipment/fittings-generator.js', mount: 'deck-plan' },
    anchors: { generator: './generators/anchors/anchor-generator.js', mount: 'forward-hawse-area' },
    masts: { generator: './generators/masts/mast-frame-generator.js', mount: 'keel-and-deck-stepped-mast-stations' },
    'head-sails': { generator: './generators/sails/head-sails-generator.js', mount: 'bowsprit-and-foremast' },}),
  mastInstances: Object.freeze([
    Object.freeze({ id: 'fore', longitudinalOffset: -0.305, heightScale: 1.02, radiusScale: 1.02, yardScale: 1.04 }),
    Object.freeze({ id: 'main', longitudinalOffset: -0.018, heightScale: 1.05, radiusScale: 1.04, yardScale: 1.06 }),
    Object.freeze({ id: 'mizzen', longitudinalOffset: 0.315, heightScale: 1.02, radiusScale: 0.98, yardScale: 1.02 })
  ]),
  dependencyGraph: Object.freeze({
    deck: ['hull'], frames: ['hull'], 'hull-planking': ['hull'],
    'deck-planking': ['deck'], stern: ['hull', 'deck'],
    'aft-cabins': ['stern', 'deck'], bow: ['hull', 'deck'],
    rudder: ['hull', 'stern'], helm: ['deck'], railings: ['deck'],
    'deck-equipment': ['deck'], anchors: ['hull', 'bow'],
    masts: ['hull', 'deck'], 'head-sails': ['masts', 'bow']
  })
});
