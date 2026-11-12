import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec,resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext,finishShipModel } from '../../shared/ship-editor-kit.js';
import { SLOOP_V2_ARCHITECTURE } from './architecture/layout.js';
const ARCHITECTURE = SLOOP_V2_ARCHITECTURE;
import { buildHull } from './generators/hull/hull-generator.js';
import { buildKeel } from './generators/hull/keel-generator.js';
import { buildStem } from './generators/hull/stem-generator.js';
import { buildDeck } from './generators/decks/deck-generator.js';
import { buildFrames } from './generators/hull-structure/frame-generator.js';
import { buildHullPlanking } from './generators/hull-structure/hull-planking-generator.js';
import { buildDeckPlanking } from './generators/decks/deck-planking-generator.js';
import { buildStern } from './generators/stern/stern-generator.js';
import { buildAftCabin } from './generators/cabins/aft-cabin-generator.js';
import { buildBow } from './generators/bow/bow-generator.js';
import { buildRudder } from './generators/steering/rudder-generator.js';
import { buildHelm } from './generators/steering/helm-generator.js';
import { buildRailings } from './generators/deck-equipment/railing-generator.js';
import { buildDeckEquipment } from './generators/deck-equipment/fittings-generator.js';
import { buildAnchors } from './generators/anchors/anchor-generator.js';
import { buildSingleMast } from './generators/masts/singlemast-generator.js';
import { buildHeadSails } from './generators/sails/head-sails-generator.js';

export const SloopV2Definition=defineVesselSpec({
  id:'sloop-v2',
  editorModulePath:'ForTests/ships/vessels/sloop-v2/sloop-v2.js',
  design:{
    id:'sloop-v2',
    label:'Coastal trading sloop · V2',
    era:'Late 18th-century inspired civilian sailing vessel',
    hullLength:19.2,
    beam:5.25,
    draft:2.05,
    freeboard:1.34,
    rig:'Single-masted gaff rig with mainsail, outer jib and inner staysail.',
    hullProfile:'Full working midbody, fine bow entry, rounded lower sections and a compact counter stern. A separate design from the 1866 Loguivy fishing-boat Sloop.',
    reference:'Preliminary civilian-sloop reconstruction. The two supplied Pinterest pin pages could not be inspected by the connected browser, so dimensions and details are provisional rather than claimed blueprint traces.',
    sources:[
      {label:'User-supplied Pinterest blueprint 1 (page inaccessible to the connected browser)',url:'https://in.pinterest.com/pin/604960162432299596/'},
      {label:'User-supplied Pinterest blueprint 2 (page inaccessible to the connected browser)',url:'https://in.pinterest.com/pin/458522805787729445/'},
      {label:'Herreshoff 1870 sloop Shadow — lines plan (secondary hull-form reference)',url:'https://herreshoff.info/Docs/ES187106_Shadow.htm'},
      {label:'Musée Maritime de La Rochelle — François Sergent cruising-sloop lines plan, 1950 (secondary reference)',url:'https://www.histoiresmaritimesrochelaises.fr/sloop-de-croisiere-925-m-1950'}
    ],
    hullFormNote:'Sloop V2 has its own authored station and section profile in architecture/hull-geometry.js. Refine those local curves against direct blueprint images once the pin images are available.',
    modelScaleNote:'Dimensions are initial reconstruction estimates; they are not verified measurements from the inaccessible Pinterest plans.',
    hull:{
      type:'civilian coastal trading sloop',
      depth:3.39,
      stern:'rounded counter with compact transom',
      fullness:0.68,
      entry:0.82,
      flare:0.13,
      tumblehome:0.025,
      sheer:0.17,
      bowRise:0.42,
      sternRise:0.24,
      deckCamber:0.10,
      stemRake:0.07,
      sternRake:0.035
    },
    sternwork:'low-aft-deckhouse',
    sternTiers:[{w:0.48,d:0.15,h:1.24}],
    bowwork:'bowsprit',
    bowspritLength:2.55,
    keelDetails:{pointOffset:0.035,minimumRadius:0.06,radiusFactor:0.014,stemPosts:true,label:'Sloop-V2-keel-and-deadwood'},
    rudderDetails:{pivotOffset:0.16,yFactor:0.36,breadthFactor:0.12,depthFactor:0.84},
    sailingSpeed:8.6,
    handling:1.12,
    masts:[{id:'single',z:0.045,height:13.8,rig:'gaff',span:0.43,squares:0,runningBraces:false}],
    headsails:2,
    oars:false
  },
  structure:{
    frameCount:32,
    beamStation:0.63,
    forebody:0.73,
    aftbody:0.91,
    foreTip:0.025,
    aftTip:0.57,
    bottomFlat:0.10,
    bilge:0.22,
    flare:0.13,
    tumble:0.025,
    sheer:1,
    lowerMastRatio:0.68,
    shroudPairs:2,
    ratlines:8,
    yardSpread:0.90
  }
},EDITOR_DEFAULTS);

function resolveArchitecture(design){
  const stations=new Map(SLOOP_V2_ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
  return {
    ...design,
    masts:design.masts.map(mast=>{
      const station=stations.get(mast.id);
      if(!station)throw new Error('sloop-v2: missing architecture station for mast '+mast.id);
      return {
        ...mast,
        z:station.foreAftStation,
        height:mast.height*(station.heightScale??1),
        radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),
        yardScale:(mast.yardScale??1)*(station.yardScale??1)
      };
    })
  };
}

function assembleSloopV2(vessel,componentTransforms={},savedState={}){
  const design=resolveArchitecture(vessel.design);
  const resolved={...vessel,design};
  const ctx=createShipContext(resolved,{
    hull:0x5b4030,lower:0x342e2a,plank:0x8a6544,
    deck:0xb6976a,sail:0xe2d6bd
  });
  const generators={
    hull:()=>buildHull(design,ctx),
    keel:()=>buildKeel(design,ctx),
    stem:()=>buildStem(design,ctx),
    deck:()=>buildDeck(design,ctx),
    frames:()=>buildFrames(design,ctx),
    'hull-planking':()=>buildHullPlanking(design,ctx),
    'deck-planking':()=>buildDeckPlanking(design,ctx),
    stern:()=>buildStern(design,ctx),
    'aft-cabins':()=>buildAftCabin(design,ctx),
    bow:()=>buildBow(design,ctx),
    rudder:()=>buildRudder(design,ctx),
    helm:()=>buildHelm(design,ctx),
    railings:()=>buildRailings(design,ctx),
    'deck-equipment':()=>buildDeckEquipment(design,ctx),
    anchors:()=>buildAnchors(design,ctx),
    masts:()=>{for(const mast of design.masts)buildSingleMast(design,ctx,mast);},
    'head-sails':()=>buildHeadSails(design,ctx)
  };
  for(const component of ARCHITECTURE.assemblyOrder){
    const generate=generators[component];
    if(typeof generate!=='function')throw new Error('sloop-v2: missing assembly instruction '+component);
    generate();
  }
  const root=finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture=ARCHITECTURE;
  root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];
  return root;
}

export function createSloopV2Model(componentTransforms={},savedState={}){
  return assembleSloopV2(resolveVesselForGeneration(SloopV2Definition),componentTransforms,savedState);
}
export function generateSloopV2(componentTransforms={},savedState={}){
  return createSloopV2Model(componentTransforms,savedState);
}
export const SloopV2=Object.freeze({
  id:SloopV2Definition.id,
  editorDefaults: EDITOR_DEFAULTS,
  definition:SloopV2Definition,
  design:SloopV2Definition.design,
  structure:SloopV2Definition.structure,
  editorModulePath:SloopV2Definition.editorModulePath,
  architecture:SLOOP_V2_ARCHITECTURE,
  createModel:createSloopV2Model,
  generate:generateSloopV2
});
export const id=SloopV2.id;
export const design=SloopV2.design;
export const structure=SloopV2.structure;
export const createModel=SloopV2.createModel;
export const generate=SloopV2.generate;
export default SloopV2;
