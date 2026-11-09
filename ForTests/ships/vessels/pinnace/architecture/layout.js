/** pinnace ship-specific layout; forward -Z, aft +Z, port -X, starboard +X, up +Y. */
export const PINNACE_ARCHITECTURE=Object.freeze({id:"pinnace",schemaVersion:1,coordinateSystem:Object.freeze({forward:"-z",aft:"+z",port:"-x",starboard:"+x",up:"+y",origin:"keel-midships"}),assemblyOrder:Object.freeze(["hull","keel","stem","deck","frames","hull-planking","deck-planking","stern","aft-cabins","bow","rudder","helm","railings","deck-equipment","anchors","masts","head-sails"]),components:Object.freeze({
"hull":{generator:"./generators/hull/hull-generator.js",mount:"keel-midships"},
"keel":{generator:"./generators/hull/keel-generator.js",mount:"hull-keel-line"},
"stem":{generator:"./generators/hull/stem-generator.js",mount:"fore-and-aft-stem-posts"},
"deck":{generator:"./generators/decks/deck-generator.js",mount:"hull-sheer-line"},
"frames":{generator:"./generators/hull-structure/frame-generator.js",mount:"hull-stations"},
"hull-planking":{generator:"./generators/hull-structure/hull-planking-generator.js",mount:"hull-surface"},
"deck-planking":{generator:"./generators/decks/deck-planking-generator.js",mount:"deck-surface"},
"stern":{generator:"./generators/stern/stern-generator.js",mount:"aft-transom-or-counter"},
"aft-cabins":{generator:"./generators/cabins/aft-cabin-generator.js",mount:"stern-and-quarterdeck"},
"bow":{generator:"./generators/bow/bow-generator.js",mount:"fore-stem"},
"rudder":{generator:"./generators/steering/rudder-generator.js",mount:"sternpost"},
"helm":{generator:"./generators/steering/helm-generator.js",mount:"quarterdeck"},
"railings":{generator:"./generators/deck-equipment/railing-generator.js",mount:"deck-edge"},
"deck-equipment":{generator:"./generators/deck-equipment/fittings-generator.js",mount:"deck-plan"},
"anchors":{generator:"./generators/anchors/anchor-generator.js",mount:"forward-hawse-area"},
"masts":{generator:"./generators/masts/mast-frame-generator.js",mount:"keel-and-deck-stepped-mast-stations"},
"head-sails":{generator:"./generators/sails/head-sails-generator.js",mount:"bowsprit-and-foremast"}
}),mastInstances:Object.freeze([
Object.freeze({id:"single",foreAftStation:-0.02,heightScale:1,radiusScale:1,yardScale:1,generator:"./generators/masts/singlemast-generator.js"})
]),dependencyGraph:Object.freeze({"deck":["hull"],"frames":["hull"],"hull-planking":["hull"],"deck-planking":["deck"],"stern":["hull","deck"],"aft-cabins":["stern","deck"],"bow":["hull","deck"],"rudder":["hull","stern"],"helm":["deck"],"railings":["deck"],"deck-equipment":["deck"],"anchors":["hull","bow"],"masts":["hull","deck"],"head-sails":["masts","bow"]})});
