import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec,resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext,finishShipModel } from '../../shared/ship-editor-kit.js';
import { SLOOP_V2_ARCHITECTURE } from './architecture/layout.js';
const ARCHITECTURE=SLOOP_V2_ARCHITECTURE;
import { buildHull } from './generators/hull/hull-generator.js';
import { buildKeel } from './generators/hull/keel-generator.js';
import { buildStem } from './generators/hull/stem-generator.js';
import { buildDeck } from './generators/decks/deck-generator.js';
import { buildFrames } from './generators/hull-structure/frame-generator.js';
import { buildHullPlanking } from './generators/hull-structure/hull-planking-generator.js';
import { buildDeckPlanking } from './generators/decks/deck-planking-generator.js';
import { buildStern } from './generators/stern/stern-generator.js';
import { buildAftCabin } from './generators/cabins/aft-cabin-generator.js';
import { buildCockpit } from './generators/cockpit/cockpit-generator.js';
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
  label:'Maid of Endor · Sloop V2',
  era:'1953 John Atkin keel-cruising pocket sloop',
  hullLength:6.18,
  waterlineLength:5.64,
  beam:2.34,
  draft:1.02,
  freeboard:0.58,
  displacement:2359,
  leadKeelBallast:500,
  internalBallast:180,
  sailArea:31.0,
  sailAreaSquareFeet:333,
  sailPlan:Object.freeze({mainsail:214,outerJib:60.5,innerStaysail:58.5}),
  rig:'Single-masted gaff cutter: gaff mainsail, outer jib and inner staysail, with running backstays.',
  hullProfile:'Full midbody and generous beam, easy cut-away bow, little overhang, strong sheer, nearly straight keel line and a compact transom with outboard rudder.',
  reference:'Maid of Endor, designed by John Atkin in 1953. Principal dimensions and rig arrangement follow the supplied Atkin specification drawing. Unlisted offsets and scantlings are reconstructed from the drawing rather than represented as surveyed CAD data.',
  sources:[
   {label:'Atkin & Co. — Maid of Endor design and principal specifications',url:'https://atkin.mysticseaport.org/Sail/MaidOfEndor.html'},
   {label:'Atkin & Co. — The Picture Perfect Pocket Cruiser? (design history, rig and construction)',url:'https://atkin.mysticseaport.org/Articles/Maid-2/index.html'},
   {label:'Atkin & Co. — photographs of Maid of Endor / Robelia under sail',url:'https://atkin.mysticseaport.org/Photos/MaidOfEndor/index.html'}
  ],
  hullFormNote:'The station curve is a purpose-built approximation of the supplied plan: full sections around the middle, an easy fine entrance, mild tumblehome and little end overhang. The keel profile remains nearly straight through the middle.',
  modelScaleNote:'LOA 6.18 m, LWL 5.64 m, beam 2.34 m and draft 1.02 m are copied from the supplied specification. Mast, bowsprit and individual sail corner offsets are proportional reconstructions from the elevation.',
  hull:{
   type:'Atkin keel-cruising pocket sloop',
   depth:1.60,
   stern:'compact transom with outboard rudder',
   fullness:0.78,
   entry:0.88,
   flare:0.085,
   tumblehome:0.045,
   sheer:0.30,
   bowRise:0.12,
   sternRise:0.10,
   deckCamber:0.075,
   stemRake:0.065,
   sternRake:0.025
  },
  sternwork:'compact aft cockpit and small transom',
  sternTiers:[{w:0.42,d:0.22,h:0.55}],
  bowwork:'slender projecting bowsprit',
  bowspritLength:1.35,
  keelDetails:{pointOffset:0.018,minimumRadius:0.045,radiusFactor:0.010,stemPosts:true,label:'Maid-of-Endor-straight-keel-and-deadwood'},
  rudderDetails:{pivotOffset:0.14,yFactor:0.36,breadthFactor:0.10,depthFactor:0.76},
  sailingSpeed:6.2,
  handling:1.08,
  masts:[{id:'single',z:-0.16,height:6.4,rakeDegrees:4.2,rig:'gaff',span:0.54,squares:0,runningBraces:false}],
  headsails:2,
  oars:false,
  runningBackstays:true
 },
 structure:{
  frameCount:30,
  beamStation:0.54,
  forebody:0.70,
  aftbody:0.90,
  foreTip:0.025,
  aftTip:0.58,
  bottomFlat:0.09,
  bilge:0.25,
  flare:0.085,
  tumble:0.045,
  sheer:1.0,
  lowerMastRatio:0.68,
  shroudPairs:2,
  ratlines:6,
  yardSpread:0.70
 }
},EDITOR_DEFAULTS);

function resolveArchitecture(design){
 const stations=new Map(SLOOP_V2_ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
 return {...design,masts:design.masts.map(mast=>{
  const station=stations.get(mast.id);
  if(!station)throw new Error('sloop-v2: missing architecture station for mast '+mast.id);
  return {...mast,z:station.foreAftStation,height:mast.height*(station.heightScale??1),
   radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),yardScale:(mast.yardScale??1)*(station.yardScale??1)};
 })};
}
function assembleSloopV2(vessel,componentTransforms={},savedState={}){
 const design=resolveArchitecture(vessel.design);
 const resolved={...vessel,design};
 const ctx=createShipContext(resolved,{
  hull:0x253a33,lower:0x202b28,plank:0x35443d,deck:0xb69a72,
  trim:0x835a3a,rope:0x9b8a70,sail:0xe9e2d1,sailShade:0x743438,
  iron:0x44494a,brass:0x947447
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
  cockpit:()=>buildCockpit(design,ctx),
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
 root.userData.vesselProvenance={designer:'John Atkin',designYear:1953,designName:'Maid of Endor',
  specification:{loaMetres:6.18,lwlMetres:5.64,beamMetres:2.34,draftMetres:1.02,sailAreaSquareFeet:333}};
 return root;
}
export function createSloopV2Model(componentTransforms={},savedState={}){
 return assembleSloopV2(resolveVesselForGeneration(SloopV2Definition),componentTransforms,savedState);
}
export function generateSloopV2(componentTransforms={},savedState={}){return createSloopV2Model(componentTransforms,savedState);}
export const SloopV2=Object.freeze({
 id:SloopV2Definition.id,editorDefaults: EDITOR_DEFAULTS,definition:SloopV2Definition,
 design:SloopV2Definition.design,structure:SloopV2Definition.structure,
 editorModulePath:SloopV2Definition.editorModulePath,architecture:SLOOP_V2_ARCHITECTURE,
 createModel:createSloopV2Model,generate:generateSloopV2
});
export const id=SloopV2.id,design=SloopV2.design,structure=SloopV2.structure,
 createModel=SloopV2.createModel,generate=SloopV2.generate;
export default SloopV2;
