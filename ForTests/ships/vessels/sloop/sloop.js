export const SloopDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/sloop/sloop.js',
  id: 'sloop',
  design: {
    id: 'sloop', label: 'Caribbean merchant sloop', era: 'Late 17th–18th century Caribbean',
    hullLength: 17.22, beam: 4.34, draft: 1.9, freeboard: 1.35,
    rig: 'Single gaff mainsail with headsails; local rigs varied by island and decade.',
    hullProfile: 'Fine entry, moderately full working body, low quarter, shallow-to-moderate draft.',
    reference: 'Reader’s Point, Jamaica: surviving hull length 17.22 m and maximum beam 4.34 m; original rig is not preserved, so the single-mast sail plan is a regional reconstruction.',
    sources: [
      { label: 'Texas A&M — Reader’s Point Jamaican merchant sloop', url: 'https://oaktrust.library.tamu.edu/items/bfbc382b-2aea-4705-bf65-67e97ec2b87b' },
      { label: 'Cambridge — Caribbean sloops in Atlantic material culture', url: 'https://www.cambridge.org/core/books/an-archaeology-of-the-english-atlantic-world-1600-1700/atlantic-material-culture-boats-ships-and-navigation/6936CAA998793EDC9005054893D500F5' },
    ],
    hull: { fullness: 0.58, entry: 0.68, stern: 'counter', sternWidth: 0.3, tumblehome: 0.04, sheer: 0.12, bowRise: 0.3, sternRise: 0.26, keelDepth: 0.12, deckCamber: 0.12 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.0, handling: 1.35,
    masts: [{ id: 'single', z: -0.035, height: 13.8, rig: 'gaff', span: 0.42, squares: 0 }],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 22, beamStation: .49, forebody: .76, aftbody: 1.02, foreTip: .008, aftTip: .055, bottomFlat: .21, bilge: .12, flare: .12, tumble: .035, sheer: 1.08, lowerMastRatio: .64, shroudPairs: 2, ratlines: 8, yardSpread: .94 },
});

import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { SLOOP_ARCHITECTURE } from './architecture/layout.js';
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

const ARCHITECTURE = SLOOP_ARCHITECTURE;
function applyMastArchitecture(design){
 const stations=new Map(ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
 return {...design,masts:design.masts.map(mast=>{const station=stations.get(mast.id);if(!station)throw new Error('sloop: no architecture station for mast '+mast.id);return {...mast,z:station.foreAftStation,height:mast.height*(station.heightScale??1),radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),yardScale:(mast.yardScale??1)*(station.yardScale??1)};})};
}
function assembleSloop(vessel,componentTransforms={},savedState={}){
 const design=applyMastArchitecture(vessel.design),resolved={...vessel,design};
 const ctx=createShipContext(resolved,{"hull":7688506,"plank":10648661,"deck":12163953,"sail":15261125});
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
 "masts": ()=>{for(const mast of design.masts){const generator=MAST_GENERATORS[mast.id];if(!generator)throw new Error('sloop: no generator for mast '+mast.id);generator(design,ctx,mast);}},
 "head-sails": ()=>buildHeadSails(design,ctx)
 };
 for(const component of ARCHITECTURE.assemblyOrder){const generate=generators[component];if(typeof generate!=='function')throw new Error('sloop: missing assembly instruction '+component);generate();}
 const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture=ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;
}
export function createSloopModel(componentTransforms={},savedState={}){return assembleSloop(resolveVesselForGeneration(SloopDefinition),componentTransforms,savedState);}
export function generateSloop(componentTransforms={},savedState={}){return createSloopModel(componentTransforms,savedState);}
export const Sloop=Object.freeze({id:SloopDefinition.id,definition:SloopDefinition,design:SloopDefinition.design,structure:SloopDefinition.structure,editorModulePath:SloopDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createSloopModel,generate:generateSloop});
export const id=Sloop.id,design=Sloop.design,structure=Sloop.structure,createModel=Sloop.createModel,generate=Sloop.generate;
export default Sloop;
