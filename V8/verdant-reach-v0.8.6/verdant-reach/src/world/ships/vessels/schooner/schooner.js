import EDITOR_DEFAULTS from './editor-defaults.js';
export const SchoonerDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/schooner/schooner.js',
  id: 'schooner',
  design: {
    id: 'schooner', label: 'West Indies schooner', era: 'Late 18th century',
    hullLength: 22.17, beam: 6.30, draft: 2.25, freeboard: 1.48,
    rig: 'Two fore-and-aft gaff masts with staysails; a fast, manageable trading rig.',
    hullProfile: 'Long working hull, fine bow, modest counter stern and low deckhouse.',
    reference: 'Smithsonian HMS Berbice record: typical late-18th-century schooner 72 ft 9 in × 20 ft 8 in (22.17 × 6.30 m).',
    sources: [{ label: 'Smithsonian — Schooner HMS Berbice', url: 'https://collections.si.edu/search/detail/edanmdm%3Anmah_844171?print=yes' }],
    hull: { fullness: 0.56, entry: 0.74, stern: 'counter', sternWidth: 0.31, tumblehome: 0.07, sheer: 0.1, bowRise: 0.22, sternRise: 0.24, keelDepth: 0.08, deckCamber: 0.1 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.5, handling: 1.24,
    masts: [
      { id: 'fore', z: -0.22, height: 17.0, rig: 'gaff', span: 0.36, squares: 0 },
      { id: 'main', z: 0.13, height: 19.3, rig: 'gaff', span: 0.42, squares: 0 },
    ],
    headsails: 3, oars: false,
  },
  structure: { frameCount: 26, beamStation: .48, forebody: .72, aftbody: .96, foreTip: .006, aftTip: .075, bottomFlat: .18, bilge: .11, flare: .15, tumble: .06, sheer: 1.0, lowerMastRatio: .62, shroudPairs: 2, ratlines: 9, yardSpread: .92 },
}, EDITOR_DEFAULTS);

import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { SCHOONER_ARCHITECTURE } from './architecture/layout.js';
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
import { buildSchoonerDeckhouse } from './generators/special/schooner-deckhouse-generator.js';

const MAST_GENERATORS = Object.freeze({
 "fore": buildForemast,
 "main": buildMainmast
});

const ARCHITECTURE = SCHOONER_ARCHITECTURE;
function applyMastArchitecture(design){
 const stations=new Map(ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
 return {...design,masts:design.masts.map(mast=>{const station=stations.get(mast.id);if(!station)throw new Error('schooner: no architecture station for mast '+mast.id);return {...mast,z:station.foreAftStation,height:mast.height*(station.heightScale??1),radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),yardScale:(mast.yardScale??1)*(station.yardScale??1)};})};
}
function assembleSchooner(vessel,componentTransforms={},savedState={}){
 const design=applyMastArchitecture(vessel.design),resolved={...vessel,design};
 const ctx=createShipContext(resolved,{"hull":6834999,"plank":10188112,"deck":12427384,"sail":15261645});
 const generators={
 "hull": ()=>buildHull(design,ctx),
 "keel": ()=>buildKeel(design,ctx),
 "stem": ()=>buildStem(design,ctx),
 "deck": ()=>buildDeck(design,ctx),
 "frames": ()=>buildFrames(design,ctx),
 "hull-planking": ()=>buildHullPlanking(design,ctx),
 "deck-planking": ()=>buildDeckPlanking(design,ctx),
 "stern": ()=>buildStern(design,ctx),
 "aft-cabins": ()=>ensureSternTierComponents(design,ctx),
 "bow": ()=>buildBow(design,ctx),
 "rudder": ()=>buildRudder(design,ctx),
 "helm": ()=>buildHelm(design,ctx),
 "railings": ()=>buildRailings(design,ctx),
 "deck-equipment": ()=>buildDeckEquipment(design,ctx),
 "deckhouse": ()=>buildSchoonerDeckhouse(design,ctx),
 "anchors": ()=>buildAnchors(design,ctx),
 "masts": ()=>{for(const mast of design.masts){const generator=MAST_GENERATORS[mast.id];if(!generator)throw new Error('schooner: no generator for mast '+mast.id);generator(design,ctx,mast);}},
 "head-sails": ()=>buildHeadSails(design,ctx)
 };
 for(const component of ARCHITECTURE.assemblyOrder){const generate=generators[component];if(typeof generate!=='function')throw new Error('schooner: missing assembly instruction '+component);generate();}
 const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture=ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;
}
export function createSchoonerModel(componentTransforms={},savedState={}){return assembleSchooner(resolveVesselForGeneration(SchoonerDefinition),componentTransforms,savedState);}
export function generateSchooner(componentTransforms={},savedState={}){return createSchoonerModel(componentTransforms,savedState);}
export const Schooner=Object.freeze({id:SchoonerDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:SchoonerDefinition,design:SchoonerDefinition.design,structure:SchoonerDefinition.structure,editorModulePath:SchoonerDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createSchoonerModel,generate:generateSchooner});
export const id=Schooner.id,design=Schooner.design,structure=Schooner.structure,createModel=Schooner.createModel,generate=Schooner.generate;
export default Schooner;
