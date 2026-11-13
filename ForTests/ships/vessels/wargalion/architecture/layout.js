/**
 * Wargalion — ship-local assembly blueprint.
 * Forward -Z, aft +Z, port -X, starboard +X, up +Y.
 * The silhouette is reconstructed from the San Martín (1580) plan set;
 * dimensions and undocumented fittings remain explicit reconstruction estimates.
 */
export const WARGALION_ARCHITECTURE = Object.freeze({
  id: 'wargalion',
  schemaVersion: 1,
  coordinateSystem: Object.freeze({
    forward: '-z', aft: '+z', port: '-x', starboard: '+x',
    up: '+y', origin: 'keel-midships'
  }),
  assemblyOrder: Object.freeze([
    'hull', 'keel', 'stem', 'frames', 'hull-planking',
    'main-deck', 'deck-planking', 'sternworks', 'bowworks',
    'rudder', 'helm', 'railings', 'deck-fittings', 'anchors',
    'masts', 'head-sails'
  ]),
  components: Object.freeze({
    hull: { generator: './generators/hull/hull-generator.js', mount: 'keel-midships' },
    keel: { generator: './generators/hull/keel-generator.js', mount: 'bottom-centreline' },
    stem: { generator: './generators/hull/stem-generator.js', mount: 'fore-and-aft-posts' },
    frames: { generator: './generators/hull-structure/frame-generator.js', mount: 'internal-hull-stations' },
    'hull-planking': { generator: './generators/hull-structure/planking-generator.js', mount: 'outer-hull-surface' },
    'main-deck': { generator: './generators/decks/deck-generator.js', mount: 'sheer-line' },
    'deck-planking': { generator: './generators/decks/deck-planking-generator.js', mount: 'deck-surface' },
    sternworks: { generator: './generators/stern/stern-generator.js', mount: 'aft-transom-and-sterncastle' },
    bowworks: { generator: './generators/bow/bow-generator.js', mount: 'fore-stem-and-forecastle' },
    rudder: { generator: './generators/steering/rudder-generator.js', mount: 'sternpost' },
    helm: { generator: './generators/steering/helm-generator.js', mount: 'quarterdeck' },
    railings: { generator: './generators/deck-equipment/railing-generator.js', mount: 'deck-edge' },
    'deck-fittings': { generator: './generators/deck-equipment/fittings-generator.js', mount: 'open-deck-plan' },
    anchors: { generator: './generators/anchors/anchor-generator.js', mount: 'bow-quarters' },
    masts: { generator: './generators/masts/mast-frame-generator.js', mount: 'keel-and-deck-mast-stations' },
    'head-sails': { generator: './generators/sails/head-sails-generator.js', mount: 'bowsprit-and-foremast' },
    standingRigging: { generator: './generators/rigging/standing-rigging-generator.js', mount: 'mastheads-to-hull-rail' }
  }),
  mastInstances: Object.freeze([
    Object.freeze({ id: 'fore', foreAftStation: -0.305, heightScale: 1.00, radiusScale: 1.00, yardScale: 1.00 }),
    Object.freeze({ id: 'main', foreAftStation: -0.045, heightScale: 1.00, radiusScale: 1.08, yardScale: 1.06 }),
    Object.freeze({ id: 'mizzen', foreAftStation: 0.335, heightScale: 0.88, radiusScale: 0.86, yardScale: 0.88 })
  ]),
  dependencyGraph: Object.freeze({
    frames: ['hull'], 'hull-planking': ['hull'],
    'main-deck': ['hull'], 'deck-planking': ['main-deck'],
    sternworks: ['hull', 'main-deck'], bowworks: ['hull', 'main-deck'],
    rudder: ['hull', 'sternworks'], helm: ['main-deck', 'sternworks'],
    railings: ['main-deck', 'sternworks', 'bowworks'],
    'deck-fittings': ['main-deck'], anchors: ['hull', 'bowworks'],
    masts: ['hull', 'main-deck'], 'head-sails': ['masts', 'bowworks']
  })
});
