/** Maid of Endor (John Atkin, 1953) — pocket-cruiser architecture.
 * Coordinates: forward -Z, aft +Z, port -X, starboard +X, up +Y.
 */
export const SLOOP_V2_ARCHITECTURE=Object.freeze({
 id:'sloop-v2',schemaVersion:2,
 referenceDrawing:'Maid of Endor specification and lines drawing supplied by the user; Atkin & Co. design profile cross-checked.',
 coordinateSystem:Object.freeze({forward:'-z',aft:'+z',port:'-x',starboard:'+x',up:'+y',origin:'keel-midships'}),
 assemblyOrder:Object.freeze(['hull','keel','stem','deck','frames','hull-planking','deck-planking','stern','aft-cabins','cockpit','bow','rudder','helm','railings','deck-equipment','anchors','masts','head-sails']),
 components:Object.freeze({
  hull:{generator:'./generators/hull/hull-generator.js',mount:'full-bodied-pocket-cruiser-loft'},
  keel:{generator:'./generators/hull/keel-generator.js',mount:'long-nearly-straight-keel-line'},
  stem:{generator:'./generators/hull/stem-generator.js',mount:'cut-away-raked-forefoot'},
  deck:{generator:'./generators/decks/deck-generator.js',mount:'cambered-deck-with-aft-cockpit-opening'},
  frames:{generator:'./generators/hull-structure/frame-generator.js',mount:'transverse-grown-frame-stations'},
  'hull-planking':{generator:'./generators/hull-structure/hull-planking-generator.js',mount:'fine-carvel-planking-strakes'},
  'deck-planking':{generator:'./generators/decks/deck-planking-generator.js',mount:'longitudinal-deck-seams'},
  stern:{generator:'./generators/stern/stern-generator.js',mount:'compact-transom-and-outboard-rudder-seat'},
  'aft-cabins':{generator:'./generators/cabins/aft-cabin-generator.js',mount:'small-central-trunk-cabin'},
  cockpit:{generator:'./generators/cockpit/cockpit-generator.js',mount:'aft-open-well-with-coamings-and-seats'},
  bow:{generator:'./generators/bow/bow-generator.js',mount:'graceful-projecting-bowsprit'},
  rudder:{generator:'./generators/steering/rudder-generator.js',mount:'outboard-transom-hung-rudder'},
  helm:{generator:'./generators/steering/helm-generator.js',mount:'aft-tiller-and-rudder-stock'},
  railings:{generator:'./generators/deck-equipment/railing-generator.js',mount:'low-toe-rails-not-guardrails'},
  'deck-equipment':{generator:'./generators/deck-equipment/fittings-generator.js',mount:'sparse-pocket-cruiser-deck-fittings'},
  anchors:{generator:'./generators/anchors/anchor-generator.js',mount:'modest-bow-stowed-anchor'},
  masts:{generator:'./generators/masts/singlemast-generator.js',mount:'single-raked-gaff-cutter-mast'},
  'head-sails':{generator:'./generators/sails/head-sails-generator.js',mount:'outer-jib-and-inner-staysail'}
 }),
 mastInstances:Object.freeze([
  Object.freeze({id:'single',foreAftStation:0.02,heightScale:1,radiusScale:1,yardScale:1,generator:'./generators/masts/singlemast-generator.js'})
 ]),
 dependencyGraph:Object.freeze({
  deck:['hull'],frames:['hull'],'hull-planking':['hull'],'deck-planking':['deck'],
  stern:['hull','deck'],'aft-cabins':['deck'],'cockpit':['deck','stern'],
  bow:['hull','deck'],rudder:['hull','stern'],helm:['cockpit','rudder'],
  railings:['deck'], 'deck-equipment':['deck'],'anchors':['hull','bow'],
  masts:['hull','deck'],'head-sails':['masts','bow']
 })
});
