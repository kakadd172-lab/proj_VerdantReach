export const SnowDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/snow/snow.js',
  id: 'snow',
  design: {
    id: 'snow', label: 'Snow brig', era: '18th century', primaryMastCount: 2,
    hullLength: 28.5, beam: 7.8, draft: 3.0, freeboard: 1.8,
    rig: 'Square fore and main; a separate trysail mast sits immediately abaft the mainmast.',
    hullProfile: 'Compact two-masted working hull with a rounded bow and low counter stern.',
    reference: 'Dimensions are a representative game reconstruction; the defining snow-mast and trysail arrangement follows the Society for Nautical Research description.',
    sources: [{ label: 'Society for Nautical Research — The Snow', url: 'https://snr.org.uk/snow/' }],
    hull: { fullness: 0.67, entry: 0.66, stern: 'counter', sternWidth: 0.32, tumblehome: 0.1, sheer: 0.12, bowRise: 0.24, sternRise: 0.28, keelDepth: 0.12, deckCamber: 0.14 },
    sternwork: 'quarterdeck',
    sternTiers: [{"w":0.5,"d":0.145,"h":1.7},{"w":0.37,"d":0.12,"h":0.9}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 7.2, handling: 0.88,
    masts: [
      { id: 'fore', z: -0.24, height: 21.0, rig: 'square', squares: 3 },
      { id: 'main', z: 0.075, height: 22.4, rig: 'square', squares: 3 },
      { id: 'trysail', z: 0.11, height: 16.2, rig: 'trysail', span: 0.31, auxiliary: true },
    ],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 28, beamStation: .50, forebody: .91, aftbody: 1.08, foreTip: .004, aftTip: .07, bottomFlat: .29, bilge: .17, flare: .1, tumble: .09, sheer: 1.04, lowerMastRatio: .64, shroudPairs: 3, ratlines: 9, yardSpread: .98 },
});

import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { SNOW_ARCHITECTURE } from './architecture/layout.js';
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
import { buildTrysailmast } from './generators/masts/trysailmast-generator.js';
import { buildSnowTrysailSupports } from './generators/special/snow-trysail-supports-generator.js';

const MAST_GENERATORS = Object.freeze({
 "fore": buildForemast,
 "main": buildMainmast,
 "trysail": buildTrysailmast
});

const ARCHITECTURE = SNOW_ARCHITECTURE;
function applyMastArchitecture(design){
 const stations=new Map(ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
 return {...design,masts:design.masts.map(mast=>{const station=stations.get(mast.id);if(!station)throw new Error('snow: no architecture station for mast '+mast.id);return {...mast,z:station.foreAftStation,height:mast.height*(station.heightScale??1),radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),yardScale:(mast.yardScale??1)*(station.yardScale??1)};})};
}
function assembleSnow(vessel,componentTransforms={},savedState={}){
 const design=applyMastArchitecture(vessel.design),resolved={...vessel,design};
 const ctx=createShipContext(resolved,{"hull":6506035,"plank":10056269,"deck":11900779,"sail":15326663});
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
 "masts": ()=>{for(const mast of design.masts){const generator=MAST_GENERATORS[mast.id];if(!generator)throw new Error('snow: no generator for mast '+mast.id);generator(design,ctx,mast);}},
 "head-sails": ()=>buildHeadSails(design,ctx),
 "trysail-supports": ()=>buildSnowTrysailSupports(design,ctx)
 };
 for(const component of ARCHITECTURE.assemblyOrder){const generate=generators[component];if(typeof generate!=='function')throw new Error('snow: missing assembly instruction '+component);generate();}
 const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture=ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;
}
export function createSnowModel(componentTransforms={},savedState={}){return assembleSnow(resolveVesselForGeneration(SnowDefinition),componentTransforms,savedState);}
export function generateSnow(componentTransforms={},savedState={}){return createSnowModel(componentTransforms,savedState);}
export const Snow=Object.freeze({id:SnowDefinition.id,definition:SnowDefinition,design:SnowDefinition.design,structure:SnowDefinition.structure,editorModulePath:SnowDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createSnowModel,generate:generateSnow});
export const id=Snow.id,design=Snow.design,structure=Snow.structure,createModel=Snow.createModel,generate=Snow.generate;
export default Snow;
