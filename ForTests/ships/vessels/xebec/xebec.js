import EDITOR_DEFAULTS from './editor-defaults.js';
export const XebecDefinition = defineVesselSpec({
 editorModulePath: 'ForTests/ships/vessels/xebec/xebec.js',
  id: 'xebec',
  design: {
    id: 'xebec', label: 'Mediterranean xebec', era: '17th–18th century; uncommon Atlantic visitor',
    hullLength: 27.0, beam: 6.2, draft: 2.15, freeboard: 1.15,
    rig: 'Three long lateen yards; low profile and optional banks of oars.',
    hullProfile: 'Very slender shallow-water hull, overhanging beak, low freeboard and projecting stern platform.',
    reference: 'Dimensions are a game-design estimate. The Channel Islands Maritime Museum documents the narrow hull, projecting head and stern platform, and usual three-lateen-mast family.',
    sources: [{ label: 'Channel Islands Maritime Museum — L’Indiscret xebec', url: 'https://maritime-museum.org/north-gallery/lindiscret-xebec/' }],
    hull: { fullness: 0.48, entry: 0.9, stern: 'counter', sternWidth: 0.22, tumblehome: 0.0, sheer: 0.06, bowRise: 0.18, sternRise: 0.14, keelDepth: 0.02, deckCamber: 0.08 },
    sternwork: 'xebec-platform',
    sternTiers: [{"w":0.38,"d":0.12,"h":0.85}], bowwork: 'long-beak',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.2, handling: 1.16,
    masts: [
      { id: 'fore', z: -0.3, height: 17.0, rig: 'lateen', span: 0.46, squares: 0 },
      { id: 'main', z: -0.015, height: 20.0, rig: 'lateen', span: 0.52, squares: 0 },
      { id: 'mizzen', z: 0.28, height: 15.5, rig: 'lateen', span: 0.38, squares: 0 },
    ],
    headsails: 0, oars: true,
  },
  structure: { frameCount: 30, beamStation: .49, forebody: 1.3, aftbody: 1.18, foreTip: .001, aftTip: .025, bottomFlat: .11, bilge: .055, flare: .045, tumble: .005, sheer: .78, lowerMastRatio: .58, shroudPairs: 2, ratlines: 7, yardSpread: 1.13 },
}, EDITOR_DEFAULTS);
import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { XEBEC_ARCHITECTURE } from './architecture/layout.js';
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
import { buildOarBanks } from './generators/special/oar-banks-generator.js';
const MAST_GENERATORS=Object.freeze({"fore":buildForemast,"main":buildMainmast,"mizzen":buildMizzenmast}),ARCHITECTURE=XEBEC_ARCHITECTURE;
function applyMastArchitecture(design){const stations=new Map(ARCHITECTURE.mastInstances.map(x=>[x.id,x]));return {...design,masts:design.masts.map(m=>{const a=stations.get(m.id);if(!a)throw new Error('xebec: missing mast station '+m.id);return {...m,z:a.foreAftStation,height:m.height*(a.heightScale??1),radiusScale:(m.radiusScale??1)*(a.radiusScale??1),yardScale:(m.yardScale??1)*(a.yardScale??1)};})};}
function assembleXebec(vessel,componentTransforms={},savedState={}){const design=applyMastArchitecture(vessel.design),resolved={...vessel,design},ctx=createShipContext(resolved,{"hull":6766638,"plank":9790280,"deck":11373157,"sail":15327176}),generators={
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
"oar-banks":()=>buildOarBanks(design,ctx),
"anchors":()=>buildAnchors(design,ctx),
"masts":()=>{for(const mast of design.masts){const g=MAST_GENERATORS[mast.id];if(!g)throw new Error('No xebec mast generator registered for '+mast.id);g(design,ctx,mast);}},
"head-sails":()=>buildHeadSails(design,ctx)
};for(const k of ARCHITECTURE.assemblyOrder){const g=generators[k];if(typeof g!=="function")throw new Error('xebec: missing assembly instruction '+k);g();}const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture=ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;}
export function createXebecModel(componentTransforms={},savedState={}){return assembleXebec(resolveVesselForGeneration(XebecDefinition),componentTransforms,savedState);}
export function generateXebec(componentTransforms={},savedState={}){return createXebecModel(componentTransforms,savedState);}
export const Xebec=Object.freeze({id:XebecDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:XebecDefinition,design:XebecDefinition.design,structure:XebecDefinition.structure,editorModulePath:XebecDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createXebecModel,generate:generateXebec});
export const id=Xebec.id,design=Xebec.design,structure=Xebec.structure,createModel=Xebec.createModel,generate=Xebec.generate;
export default Xebec;
