/** Independent civilian Sloop V2 architecture. Forward -Z, aft +Z, port -X, starboard +X, up +Y. */
export const SLOOP_V2_ARCHITECTURE=Object.freeze({
 id:'sloop-v2',schemaVersion:1,
 referenceDrawing:'Preliminary civilian coastal-sloop reconstruction; supplied blueprint proportions pending direct image inspection',
 coordinateSystem:Object.freeze({forward:'-z',aft:'+z',port:'-x',starboard:'+x',up:'+y',origin:'keel-midships'}),
 assemblyOrder:Object.freeze(['hull','keel','stem','deck','frames','hull-planking','deck-planking','stern','aft-cabins','bow','rudder','helm','railings','deck-equipment','anchors','masts','head-sails']),
 components:Object.freeze({
  hull:{generator:'./generators/hull/hull-generator.js',mount:'independent-full-loft'},
  keel:{generator:'./generators/hull/keel-generator.js',mount:'rockered-keel-line'},
  stem:{generator:'./generators/hull/stem-generator.js',mount:'raked-bow-stem'},
  deck:{generator:'./generators/decks/deck-generator.js',mount:'cambered-working-deck'},
  frames:{generator:'./generators/hull-structure/frame-generator.js',mount:'transverse-section-ribs'},
  'hull-planking':{generator:'./generators/hull-structure/hull-planking-generator.js',mount:'curved-side-strakes'},
  'deck-planking':{generator:'./generators/decks/deck-planking-generator.js',mount:'longitudinal-deck-seams'},
  stern:{generator:'./generators/stern/stern-generator.js',mount:'rounded-counter-transom'},
  'aft-cabins':{generator:'./generators/cabins/aft-cabin-generator.js',mount:'low-folded-aft-deckhouse'},
  bow:{generator:'./generators/bow/bow-generator.js',mount:'bowsprit-and-stem-finish'},
  rudder:{generator:'./generators/steering/rudder-generator.js',mount:'transom-hung-rudder'},
  helm:{generator:'./generators/steering/helm-generator.js',mount:'aft-wheel-and-axle'},
  railings:{generator:'./generators/deck-equipment/railing-generator.js',mount:'port-starboard-rails'},
  'deck-equipment':{generator:'./generators/deck-equipment/fittings-generator.js',mount:'cargo-hatches-and-cleats'},
  anchors:{generator:'./generators/anchors/anchor-generator.js',mount:'stowed-anchoring-equipment'},
  masts:{generator:'./generators/masts/singlemast-generator.js',mount:'single-gaff-mast'},
  'head-sails':{generator:'./generators/sails/head-sails-generator.js',mount:'independent-jib-and-staysail'}
 }),
 mastInstances:Object.freeze([Object.freeze({id:'single',foreAftStation:0.045,heightScale:1,radiusScale:1,yardScale:1,generator:'./generators/masts/singlemast-generator.js'})]),
 dependencyGraph:Object.freeze({deck:['hull'],frames:['hull'],'hull-planking':['hull'],'deck-planking':['deck'],stern:['hull','deck'],'aft-cabins':['stern','deck'],bow:['hull','deck'],rudder:['hull','stern'],helm:['deck'],railings:['deck'],'deck-equipment':['deck'],anchors:['hull','bow'],masts:['hull','deck'],'head-sails':['masts','bow']})
});
