/** War Galleon-specific component plan; forward -Z, aft +Z, port -X, starboard +X, up +Y. */
export const WAR_GALLEON_ARCHITECTURE = Object.freeze({
  id: 'war-galleon', schemaVersion: 1,
  coordinateSystem: Object.freeze({ forward: '-z', aft: '+z', port: '-x', starboard: '+x', up: '+y', origin: 'keel-midships' }),
  assemblyOrder: Object.freeze(['hull','keel','stem','deck','frames','hull-planking','deck-planking','stern','aft-cabins','bow','rudder','helm','railings','deck-equipment','anchors','masts','head-sails']),
  components: Object.freeze({
    hull:{generator:'./generators/hull/hull-generator.js',mount:'keel-midships'},
    keel:{generator:'./generators/hull/keel-generator.js',mount:'keel-line'},
    stem:{generator:'./generators/hull/stem-generator.js',mount:'stem-posts'},
    deck:{generator:'./generators/decks/deck-generator.js',mount:'main-deck-sheer'},
    frames:{generator:'./generators/hull-structure/frame-generator.js',mount:'transverse-stations'},
    'hull-planking':{generator:'./generators/hull-structure/hull-planking-generator.js',mount:'lofted-hull-surface'},
    'deck-planking':{generator:'./generators/decks/deck-planking-generator.js',mount:'main-deck-surface'},
    stern:{generator:'./generators/stern/stern-generator.js',mount:'square-transom-and-sterncastle'},
    'aft-cabins':{generator:'./generators/cabins/aft-cabin-generator.js',mount:'poop-and-quarterdeck'},
    bow:{generator:'./generators/bow/bow-generator.js',mount:'low-forecastle-and-beakhead'},
    rudder:{generator:'./generators/steering/rudder-generator.js',mount:'sternpost'},
    helm:{generator:'./generators/steering/helm-generator.js',mount:'aft-quarterdeck'},
    railings:{generator:'./generators/deck-equipment/railing-generator.js',mount:'sheer-rails-and-castle-rails'},
    'deck-equipment':{generator:'./generators/deck-equipment/fittings-generator.js',mount:'main-deck-plan'},
    anchors:{generator:'./generators/anchors/anchor-generator.js',mount:'forward-hawse-area'},
    masts:{generator:'./generators/masts/mast-frame-generator.js',mount:'three-independent-mast-stations'},
    'head-sails':{generator:'./generators/sails/head-sails-generator.js',mount:'bowsprit-and-foremast'},
    'standing-rigging':{generator:'./generators/rigging/standing-rigging-generator.js',mount:'mast-to-chainwale-and-stays'}
  }),
  mastInstances:Object.freeze([
    Object.freeze({id:'fore',longitudinalOffset:-0.285,heightScale:1,radiusScale:1,yardScale:1,generator:'./generators/masts/foremast-generator.js'}),
    Object.freeze({id:'main',longitudinalOffset:-0.015,heightScale:1,radiusScale:1.06,yardScale:1.04,generator:'./generators/masts/mainmast-generator.js'}),
    Object.freeze({id:'mizzen',longitudinalOffset:0.315,heightScale:0.94,radiusScale:0.92,yardScale:0.88,generator:'./generators/masts/mizzenmast-generator.js'})
  ]),
  dependencyGraph:Object.freeze({
    deck:['hull'],frames:['hull'],'hull-planking':['hull'],'deck-planking':['deck'],
    stern:['hull','deck'],'aft-cabins':['stern','deck'],bow:['hull','deck'],
    rudder:['hull','stern'],helm:['deck','aft-cabins'],railings:['deck','stern','bow'],
    'deck-equipment':['deck'],anchors:['hull','bow'],masts:['hull','deck'],
    'head-sails':['masts','bow'],'standing-rigging':['masts','deck']
  })
});
