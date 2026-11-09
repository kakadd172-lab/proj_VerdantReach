import EDITOR_DEFAULTS from './editor-defaults.js';
export const FrigateDefinition = defineVesselSpec({
 editorModulePath: 'ForTests/ships/vessels/frigate/frigate.js',
  id: 'frigate',
  design: {
    id: 'frigate', label: '18th-century frigate', era: '18th century',
    hullLength: 31.0, beam: 6.9, draft: 3.5, freeboard: 2.05,
    rig: 'Three full-rigged masts; low continuous upper profile rather than tall end-castles.',
    hullProfile: 'Long fine hull, low quarterdeck, pronounced tumblehome and restrained stern gallery.',
    reference: 'La Renommée (1744) model dimensions: 31.0 m × 6.9 m; three-masted full-rigged arrangement follows the German Historical Museum summary.',
    sources: [{ label: 'Deutsches Historisches Museum — Frigate', url: 'https://www.dhm.de/mediathek/en/web/ship-types/milestones-in-the-history-of-european-shipbuilding/12-frigate/' }],
    hull: { fullness: 0.62, entry: 0.78, stern: 'counter', sternWidth: 0.3, tumblehome: 0.17, sheer: 0.09, bowRise: 0.21, sternRise: 0.18, keelDepth: 0.1, deckCamber: 0.12 },
    sternwork: 'low-quarter',
    sternTiers: [{"w":0.48,"d":0.14,"h":1.2},{"w":0.35,"d":0.1,"h":0.6}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.2, handling: 0.76,
    masts: [
      { id: 'fore', z: -0.29, height: 28.2, rig: 'square', squares: 3 },
      { id: 'main', z: -0.015, height: 31.0, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.28, height: 25.3, rig: 'square', squares: 2, spanker: true },
    ],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 36, beamStation: .52, forebody: 1.13, aftbody: 1.14, foreTip: .002, aftTip: .08, bottomFlat: .22, bilge: .11, flare: .05, tumble: .19, sheer: .9, lowerMastRatio: .66, shroudPairs: 4, ratlines: 11, yardSpread: 1.08 },
}, EDITOR_DEFAULTS);
import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { FRIGATE_ARCHITECTURE } from './architecture/layout.js';
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
import { buildForemast } from './generators/masts/foremast-generator.js';
import { buildMainmast } from './generators/masts/mainmast-generator.js';
import { buildMizzenmast } from './generators/masts/mizzenmast-generator.js';
const MAST_GENERATORS=Object.freeze({"fore":buildForemast,"main":buildMainmast,"mizzen":buildMizzenmast});
const ARCHITECTURE=FRIGATE_ARCHITECTURE;
function applyMastArchitecture(design){const stations=new Map(ARCHITECTURE.mastInstances.map(x=>[x.id,x]));return {...design,masts:design.masts.map(m=>{const a=stations.get(m.id);if(!a)throw new Error('frigate: missing mast station '+m.id);return {...m,z:a.foreAftStation,height:m.height*(a.heightScale??1),radiusScale:(m.radiusScale??1)*(a.radiusScale??1),yardScale:(m.yardScale??1)*(a.yardScale??1)};})};}
function assembleFrigate(vessel,componentTransforms={},savedState={}){const design=applyMastArchitecture(vessel.design),resolved={...vessel,design},ctx=createShipContext(resolved,{"hull":5323568,"plank":8412741,"deck":11111270,"sail":15196108}),generators={
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
"masts":()=>{for(const mast of design.masts){const g=MAST_GENERATORS[mast.id];if(!g)throw new Error('No frigate mast generator registered for '+mast.id);g(design,ctx,mast);}},
"head-sails":()=>buildHeadSails(design,ctx)
};for(const k of ARCHITECTURE.assemblyOrder){const g=generators[k];if(typeof g!=="function")throw new Error('frigate: missing assembly instruction '+k);g();}const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture = ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;}
export function createFrigateModel(componentTransforms={},savedState={}){return assembleFrigate(resolveVesselForGeneration(FrigateDefinition),componentTransforms,savedState);}
export function generateFrigate(componentTransforms={},savedState={}){return createFrigateModel(componentTransforms,savedState);}
export const Frigate=Object.freeze({id:FrigateDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:FrigateDefinition,design:FrigateDefinition.design,structure:FrigateDefinition.structure,editorModulePath:FrigateDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createFrigateModel,generate:generateFrigate});
export const id=Frigate.id,design=Frigate.design,structure=Frigate.structure,createModel=Frigate.createModel,generate=Frigate.generate;
export default Frigate;
