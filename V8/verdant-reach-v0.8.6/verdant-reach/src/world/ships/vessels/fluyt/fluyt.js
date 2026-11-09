import EDITOR_DEFAULTS from './editor-defaults.js';
export const FluytDefinition = defineVesselSpec({
 editorModulePath: 'src/world/ships/vessels/fluyt/fluyt.js',
  id: 'fluyt',
  design: {
    id: 'fluyt', label: 'Dutch fluyt merchantman', era: '17th century Atlantic trade',
    hullLength: 30.7, beam: 7.2, draft: 2.5, freeboard: 1.75,
    rig: 'Two masts: a square-rigged mainmast and a lateen mizzen, with a spritsail; rig details varied by period.',
    hullProfile: 'Bulbous capacious lower hull, pinched-in upper deck, round stern and no high forecastle.',
    reference: 'Zeehaen (1639) model: 30.7 m × 7.2 m; the German Historical Museum notes a long, shallow-draft, bulbous hull narrowing toward the deck.',
    sources: [{ label: 'Deutsches Historisches Museum — Fluyt', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/09-fluyt/' }, { label: 'The Mariners’ Museum — Fluit cargo vessel', url: 'https://exploration.marinersmuseum.org/watercraft/fluit/' }],
    hull: { fullness: 0.96, entry: 0.5, stern: 'round', sternWidth: 0.26, tumblehome: 0.25, sheer: 0.08, bowRise: 0.18, sternRise: 0.17, keelDepth: 0.04, deckCamber: 0.12 },
    sternwork: 'fluyt-roundhouse',
    sternTiers: [{"w":0.52,"d":0.15,"h":1.55},{"w":0.35,"d":0.12,"h":0.85}], bowwork: 'spritsail-platform',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 5.8, handling: 0.62,
    masts: [
      { id: 'main', z: -0.055, height: 22.5, rig: 'square', squares: 2 },
      { id: 'mizzen', z: 0.29, height: 15.4, rig: 'lateen', span: 0.26, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 34, beamStation: .54, forebody: .68, aftbody: .75, foreTip: .01, aftTip: .08, bottomFlat: .51, bilge: .36, flare: .035, tumble: .27, sheer: .82, lowerMastRatio: .65, shroudPairs: 2, ratlines: 9, yardSpread: .94 },
}, EDITOR_DEFAULTS);
import { defineVesselSpec, resolveVesselForGeneration } from '../../core/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../core/ship-editor-kit.js';
import { FLUYT_ARCHITECTURE } from './architecture/layout.js';
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
import { buildMainmast } from './generators/masts/mainmast-generator.js';
import { buildMizzenmast } from './generators/masts/mizzenmast-generator.js';
import { buildCargoDeck } from './generators/special/cargo-deck-generator.js';
import { buildFluytSpritsail } from './generators/special/fluyt-spritsail-generator.js';
const MAST_GENERATORS=Object.freeze({"main":buildMainmast,"mizzen":buildMizzenmast});
const ARCHITECTURE=FLUYT_ARCHITECTURE;
function applyMastArchitecture(design){const stations=new Map(ARCHITECTURE.mastInstances.map(x=>[x.id,x]));return {...design,masts:design.masts.map(m=>{const a=stations.get(m.id);if(!a)throw new Error('fluyt: missing mast station '+m.id);return {...m,z:a.foreAftStation,height:m.height*(a.heightScale??1),radiusScale:(m.radiusScale??1)*(a.radiusScale??1),yardScale:(m.yardScale??1)*(a.yardScale??1)};})};}
function assembleFluyt(vessel,componentTransforms={},savedState={}){const design=applyMastArchitecture(vessel.design),resolved={...vessel,design},ctx=createShipContext(resolved,{"hull":7033661,"plank":9993049,"deck":12165500,"sail":15065039}),generators={
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
"cargo-deck":()=>buildCargoDeck(design,ctx),
"anchors":()=>buildAnchors(design,ctx),
"masts":()=>{for(const mast of design.masts){const g=MAST_GENERATORS[mast.id];if(!g)throw new Error('No fluyt mast generator registered for '+mast.id);g(design,ctx,mast);}},
"head-sails":()=>buildHeadSails(design,ctx),
"spritsail":()=>buildFluytSpritsail(design,ctx)
};for(const k of ARCHITECTURE.assemblyOrder){const g=generators[k];if(typeof g!=="function")throw new Error('fluyt: missing assembly instruction '+k);g();}const root=finishShipModel(ctx,componentTransforms,savedState);root.userData.shipArchitecture = ARCHITECTURE;root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];return root;}
export function createFluytModel(componentTransforms={},savedState={}){return assembleFluyt(resolveVesselForGeneration(FluytDefinition),componentTransforms,savedState);}
export function generateFluyt(componentTransforms={},savedState={}){return createFluytModel(componentTransforms,savedState);}
export const Fluyt=Object.freeze({id:FluytDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:FluytDefinition,design:FluytDefinition.design,structure:FluytDefinition.structure,editorModulePath:FluytDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createFluytModel,generate:generateFluyt});
export const id=Fluyt.id,design=Fluyt.design,structure=Fluyt.structure,createModel=Fluyt.createModel,generate=Fluyt.generate;
export default Fluyt;
