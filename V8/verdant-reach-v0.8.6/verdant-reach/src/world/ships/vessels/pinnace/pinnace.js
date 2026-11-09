import EDITOR_DEFAULTS from './editor-defaults.js';
export const PinnaceDefinition = defineVesselSpec({
 editorModulePath: 'src/world/ships/vessels/pinnace/pinnace.js',
  id: 'pinnace',
  design: {
    id: 'pinnace', label: 'Ship’s pinnace', era: '16th–18th century tender',
    hullLength: 9.2, beam: 2.65, draft: 0.72, freeboard: 0.72,
    rig: 'Open tender with rowing benches and a small removable lateen sail.',
    hullProfile: 'Open double-ended tender hull with fine ends, shallow draft and narrow beam.',
    reference: 'Dimensions are a game-design reconstruction for a generic ship’s pinnace; local pinnaces varied considerably.',
    sources: [{ label: 'Royal Museums Greenwich — maritime collection records and boat types', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.48, entry: 0.84, stern: 'double-ended', sternWidth: 0.06, tumblehome: 0.04, sheer: 0.06, bowRise: 0.12, sternRise: 0.12, keelDepth: 0.03, deckCamber: 0.05 },
    sternwork: 'open-boat',
    sternTiers: [], bowwork: 'open-bow',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 4.6, handling: 1.52,
    masts: [{ id: 'single', z: -0.02, height: 7.2, rig: 'lateen', span: 0.3, squares: 0 }],
    headsails: 0, oars: true,
  },
  structure: { frameCount: 16, beamStation: .5, forebody: .84, aftbody: .85, foreTip: .002, aftTip: .004, bottomFlat: .18, bilge: .075, flare: .08, tumble: .035, sheer: .91, lowerMastRatio: .6, shroudPairs: 1, ratlines: 5, yardSpread: .74 },
}, EDITOR_DEFAULTS);
import { defineVesselSpec, resolveVesselForGeneration } from '../../core/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../core/ship-editor-kit.js';
import { PINNACE_ARCHITECTURE } from './architecture/layout.js';
import { buildHull } from './generators/hull/hull-generator.js';
import { buildKeel } from './generators/hull/keel-generator.js';
import { buildStem } from './generators/hull/stem-generator.js';
import { buildDeck } from './generators/decks/deck-generator.js';
import { buildFrames } from './generators/hull-structure/frame-generator.js';
import { buildHullPlanking } from './generators/hull-structure/hull-planking-generator.js';
import { buildDeckPlanking } from './generators/decks/deck-planking-generator.js';
import { buildStern } from './generators/stern/stern-generator.js';
import { ensureSternTierComponents } from './generators/cabins/aft-cabin-generator.js';
import { buildBow } from './generators/bow/bow-generator.js';
import { buildRudder } from './generators/steering/rudder-generator.js';
import { buildHelm } from './generators/steering/helm-generator.js';
import { buildRailings } from './generators/deck-equipment/railing-generator.js';
import { buildDeckEquipment } from './generators/deck-equipment/fittings-generator.js';
import { buildAnchors } from './generators/anchors/anchor-generator.js';
import { buildMast } from './generators/masts/mast-frame-generator.js';
import { buildHeadSails } from './generators/sails/head-sails-generator.js';
import { buildSinglemast } from './generators/masts/singlemast-generator.js';
const MAST_GENERATORS=Object.freeze({"single":buildSinglemast}),ARCHITECTURE=PINNACE_ARCHITECTURE;
function applyMastArchitecture(design){const stations=new Map(ARCHITECTURE.mastInstances.map(x=>[x.id,x]));return {...design,masts:design.masts.map(m=>{const a=stations.get(m.id);if(!a)throw new Error('pinnace: missing mast station '+m.id);return {...m,z:a.foreAftStation,height:m.height*(a.heightScale??1),radiusScale:(m.radiusScale??1)*(a.radiusScale??1),yardScale:(m.yardScale??1)*(a.yardScale??1)};})};}
function assemblePinnace(vessel,componentTransforms={},savedState={}){const design=applyMastArchitecture(vessel.design),resolved={...vessel,design},ctx=createShipContext(resolved,{"hull":8017723,"plank":10977106,"deck":12755318,"sail":15327178}),generators={
"hull":()=>buildHull(design,ctx),
"keel":()=>buildKeel(design,ctx),
"stem":()=>buildStem(design,ctx),
"deck":()=>buildDeck(design,ctx),
"frames":()=>buildFrames(design,ctx),
"hull-planking":()=>buildHullPlanking(design,ctx),
"deck-planking":()=>buildDeckPlanking(design,ctx),
"stern":()=>buildStern(design,ctx),
"aft-cabins":()=>ensureSternTierComponents(design,ctx),
"bow":()=>buildBow(design,ctx),
"rudder":()=>buildRudder(design,ctx),
"helm":()=>buildHelm(design,ctx),
"railings":()=>buildRailings(design,ctx),
"deck-equipment":()=>buildDeckEquipment(design,ctx),
"anchors":()=>buildAnchors(design,ctx),
"masts":()=>{for(const mast of design.masts){const g=MAST_GENERATORS[mast.id];if(!g)throw new Error('No pinnace mast generator registered for '+mast.id);g(design,ctx,mast);}},
"head-sails":()=>buildHeadSails(design,ctx)
};for(const k of ARCHITECTURE.assemblyOrder){const g=generators[k];if(typeof g!=="function")throw new Error('pinnace: missing assembly instruction '+k);g();}const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture=ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;}
export function createPinnaceModel(componentTransforms={},savedState={}){return assemblePinnace(resolveVesselForGeneration(PinnaceDefinition),componentTransforms,savedState);}
export function generatePinnace(componentTransforms={},savedState={}){return createPinnaceModel(componentTransforms,savedState);}
export const Pinnace=Object.freeze({id:PinnaceDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:PinnaceDefinition,design:PinnaceDefinition.design,structure:PinnaceDefinition.structure,editorModulePath:PinnaceDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createPinnaceModel,generate:generatePinnace});
export const id=Pinnace.id,design=Pinnace.design,structure=Pinnace.structure,createModel=Pinnace.createModel,generate=Pinnace.generate;
export default Pinnace;
