import EDITOR_DEFAULTS from './editor-defaults.js';
export const CutterDefinition = defineVesselSpec({
  editorModulePath: 'src/world/ships/vessels/cutter/cutter.js',
  id: 'cutter',
  design: {
    id: 'cutter', label: 'Caribbean cutter', era: '18th century coastal service',
    hullLength: 16.8, beam: 5.1, draft: 2.0, freeboard: 1.35,
    rig: 'Single tall gaff mast with a large headsail spread from a long bowsprit.',
    hullProfile: 'Fine entry, full forefoot, low freeboard, compact counter stern.',
    reference: 'Representative cutter reconstruction; dimensions and mast height are game-design estimates for a period coastal vessel.',
    sources: [{ label: 'Royal Museums Greenwich — historical cutter collection records', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.6, entry: 0.72, stern: 'counter', sternWidth: 0.27, tumblehome: 0.04, sheer: 0.11, bowRise: 0.22, sternRise: 0.22, keelDepth: 0.08, deckCamber: 0.1 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'long-bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.6, handling: 1.42,
    masts: [{ id: 'single', z: -0.03, height: 16.1, rig: 'gaff', span: 0.5, squares: 0 }],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 21, beamStation: .47, forebody: .69, aftbody: 1.04, foreTip: .003, aftTip: .045, bottomFlat: .16, bilge: .09, flare: .17, tumble: .025, sheer: 1.14, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .96 },
}, EDITOR_DEFAULTS);

import { defineVesselSpec, resolveVesselForGeneration } from '../../core/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../core/ship-editor-kit.js';
import { CUTTER_ARCHITECTURE } from './architecture/layout.js';
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

const MAST_GENERATORS = Object.freeze({
 "single": buildSinglemast
});

const ARCHITECTURE = CUTTER_ARCHITECTURE;
function applyMastArchitecture(design){
 const stations=new Map(ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
 return {...design,masts:design.masts.map(mast=>{const station=stations.get(mast.id);if(!station)throw new Error('cutter: no architecture station for mast '+mast.id);return {...mast,z:station.foreAftStation,height:mast.height*(station.heightScale??1),radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),yardScale:(mast.yardScale??1)*(station.yardScale??1)};})};
}
function assembleCutter(vessel,componentTransforms={},savedState={}){
 const design=applyMastArchitecture(vessel.design),resolved={...vessel,design};
 const ctx=createShipContext(resolved,{"hull":7754298,"plank":10846041,"deck":12690556,"sail":15787990});
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
 "anchors": ()=>buildAnchors(design,ctx),
 "masts": ()=>{for(const mast of design.masts){const generator=MAST_GENERATORS[mast.id];if(!generator)throw new Error('cutter: no generator for mast '+mast.id);generator(design,ctx,mast);}},
 "head-sails": ()=>buildHeadSails(design,ctx)
 };
 for(const component of ARCHITECTURE.assemblyOrder){const generate=generators[component];if(typeof generate!=='function')throw new Error('cutter: missing assembly instruction '+component);generate();}
 const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture=ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;
}
export function createCutterModel(componentTransforms={},savedState={}){return assembleCutter(resolveVesselForGeneration(CutterDefinition),componentTransforms,savedState);}
export function generateCutter(componentTransforms={},savedState={}){return createCutterModel(componentTransforms,savedState);}
export const Cutter=Object.freeze({id:CutterDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:CutterDefinition,design:CutterDefinition.design,structure:CutterDefinition.structure,editorModulePath:CutterDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createCutterModel,generate:generateCutter});
export const id=Cutter.id,design=Cutter.design,structure=Cutter.structure,createModel=Cutter.createModel,generate=Cutter.generate;
export default Cutter;
