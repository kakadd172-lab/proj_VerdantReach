/** Blueprint-derived architecture for the 1866 Loguivy homardier. Forward -Z, aft +Z, port -X, starboard +X, up +Y. */
export const SLOOP_ARCHITECTURE = Object.freeze({
 id:"sloop",
 schemaVersion:2,
 referenceDrawing:"Armand Pâris, Loguivy homardier, measured 1866 (Jean Le Bot redraw)",
 coordinateSystem:Object.freeze({forward:"-z",aft:"+z",port:"-x",starboard:"+x",up:"+y",origin:"keel-midships"}),
 assemblyOrder:Object.freeze(["hull","keel","stem","deck","vivier","frames","hull-planking","deck-planking","stern","aft-cabins","bow","rudder","helm","railings","deck-equipment","anchors","masts","head-sails"]),
 components:Object.freeze({
  "hull":{generator:"./generators/hull/hull-generator.js",mount:"1866-station-loft"},
  "keel":{generator:"./generators/hull/keel-generator.js",mount:"full-keel-rocker"},
  "stem":{generator:"./generators/hull/stem-generator.js",mount:"fine-rising-bow-stem"},
  "deck":{generator:"./generators/decks/deck-generator.js",mount:"sheer-line-with-vivier-opening"},
  "vivier":{generator:"./generators/interior/vivier-generator.js",mount:"4.40-by-1.10-metre-central-livewell"},
  "frames":{generator:"./generators/hull-structure/frame-generator.js",mount:"traced-body-plan-couples"},
  "hull-planking":{generator:"./generators/hull-structure/hull-planking-generator.js",mount:"curved-loguivy-planking"},
  "deck-planking":{generator:"./generators/decks/deck-planking-generator.js",mount:"open-deck-around-livewell"},
  "stern":{generator:"./generators/stern/stern-generator.js",mount:"broad-rounded-flat-transom"},
  "aft-cabins":{generator:"./generators/cabins/aft-cabin-generator.js",mount:"no-raised-aft-cabin-in-source-plan"},
  "bow":{generator:"./generators/bow/bow-generator.js",mount:"long-bowsprit-and-fine-stem"},
  "rudder":{generator:"./generators/steering/rudder-generator.js",mount:"transom-hung-rudder"},
  "helm":{generator:"./generators/steering/helm-generator.js",mount:"compact-aft-quarter-wheel-clear-of-locker"},
  "railings":{generator:"./generators/deck-equipment/railing-generator.js",mount:"low-working-gunwale"},
  "deck-equipment":{generator:"./generators/deck-equipment/fittings-generator.js",mount:"fore-and-aft-working-lockers"},
  "anchors":{generator:"./generators/anchors/anchor-generator.js",mount:"forward-hawse-and-bow-cheeks"},
  "masts":{generator:"./generators/masts/mast-frame-generator.js",mount:"single-mast-at-58-percent-from-bow"},
  "head-sails":{generator:"./generators/sails/head-sails-generator.js",mount:"fuller-outer-jib-and-inner-staysail-on-separate-stays"},
  "standing-rigging":{generator:"./generators/rigging/standing-rigging-generator.js",mount:"single-mast-standing-rigging"}
 }),
 mastInstances:Object.freeze([
  Object.freeze({id:"single",foreAftStation:0.08,heightScale:1,radiusScale:1,yardScale:1,generator:"./generators/masts/singlemast-generator.js"})
 ]),
 dependencyGraph:Object.freeze({
  deck:["hull"],vivier:["hull","deck"],frames:["hull"],"hull-planking":["hull"],"deck-planking":["deck","vivier"],
  stern:["hull","deck"],"aft-cabins":["stern","deck"],bow:["hull","deck"],rudder:["hull","stern"],
  helm:["deck"],railings:["deck"],"deck-equipment":["deck"],anchors:["hull","bow"],masts:["hull","deck"],
  "head-sails":["masts","bow"],"standing-rigging":["masts","deck"]
 })
});
