import EDITOR_DEFAULTS from './editor-defaults.js';
export const SloopDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/sloop/sloop.js',
  id: 'sloop',
  design: {
    id: 'sloop',
    label: 'Loguivy decked lobster boat',
    era: 'North Brittany, surveyed 1866',
    hullLength: 15.30,
    beam: 2.55,
    draft: 1.20,
    freeboard: 1.30,
    rig: 'Single-masted fore-and-aft homardier rig: gaff mainsail aft, one headsail forward, and a long bowsprit.',
    hullProfile: 'Long, narrow decked fishing hull; fine rising bow, nearly parallel middle and aft waterlines, broad rounded transom, deep curved bilges and strongly flared upper sides.',
    reference: 'Côte Nord de Bretagne — decked Loguivy homardier, measured by Armand Pâris in 1866. This Sloop is reconstructed from the supplied plan of forms; dimensions are taken from the drawing where legible and offsets are proportionally traced from its plan and body views.',
    hullFormNote: 'Blueprint-derived station loft from the top plan, body plan and sheer/lines drawing. The 1866 sheet is a scanned historical drawing, so the mesh is a faithful proportional reconstruction rather than a certified CAD transcription.',
    modelScaleNote: 'Principal reference: 15.30 m waterline length and approximately 2.50 m keel-to-deck depth. The preview beam is adjusted from 2.35 m to 2.55 m after visual review to remove the overly stretched appearance; the station shape is unchanged.',
    sources: [
      { label: 'Patrimoine Bretagne — Jean Le Bot after Armand Pâris, 1866 homardier plan of forms (IVR53_20082207618NUCB)', url: 'https://www.patrimoine.bzh/gertrude-diffusion/illustration/IVR53_20082207618NUCB' },
      { label: 'Patrimoine Bretagne — Homardiers and langoustiers of Loguivy and Camaret', url: 'https://patrimoine.bzh/gertrude-diffusion/dossier/IM22005807' },
      { label: 'Service historique de la Défense — Armand Pâris sketch album, 1840–1880', url: 'https://www.servicehistorique.sga.defense.gouv.fr/ark/1495165' }
    ],
    hull: {
      type: 'Loguivy homardier',
      depth: 2.50,
      stern: 'broad rounded transom',
      sternCutStation: 1,
      sheer: 0.34,
      bowRise: 0.62,
      sternRise: 0.34,
      deckCamber: 0.10,
      stemRake: 0.035,
      sternRake: 0.035,
      tumblehome: 0.015
    },
    vivier: { length: 4.40, width: 1.10, startStation: 0.40, endStation: 0.69, ventCount: 18 },
    bowspritLength: 2.70,
    sternwork: 'transom',
    sternTiers: [],
    bowwork: 'long-bowsprit',
    keelDetails: { pointOffset: 0.035, minimumRadius: 0.05, radiusFactor: 0.012, stemPosts: true, label: 'Loguivy-keel-and-deadwood' },
    rudderDetails: { pivotOffset: 0.12, yFactor: 0.38, breadthFactor: 0.14, depthFactor: 0.92 },
    sailingSpeed: 8.2,
    handling: 1.15,
    masts: [{ id: 'single', z: 0.08, height: 9.6, rig: 'gaff', span: 0.42, squares: 0 }],
    headsails: 1,
    oars: false
  },
  structure: {
    frameCount: 42,
    beamStation: 0.64,
    forebody: 0.72,
    aftbody: 0.88,
    foreTip: 0.018,
    aftTip: 0.80,
    bottomFlat: 0.08,
    bilge: 0.24,
    flare: 0.19,
    tumble: 0.015,
    sheer: 1.0,
    lowerMastRatio: 0.68,
    shroudPairs: 2,
    ratlines: 9,
    yardSpread: 0.92
  }
}, EDITOR_DEFAULTS);

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
import { buildVivier } from './generators/interior/vivier-generator.js';
import { buildAnchors } from './generators/anchors/anchor-generator.js';
import { buildMast } from './generators/masts/mast-frame-generator.js';
import { buildHeadSails } from './generators/sails/head-sails-generator.js';
import { buildSinglemast } from './generators/masts/singlemast-generator.js';

const MAST_GENERATORS = Object.freeze({ single: buildSinglemast });
const ARCHITECTURE = SLOOP_ARCHITECTURE;

function applyMastArchitecture(design){
  const stations=new Map(ARCHITECTURE.mastInstances.map(item=>[item.id,item]));
  return {...design,masts:design.masts.map(mast=>{
    const station=stations.get(mast.id);
    if(!station)throw new Error('sloop: no architecture station for mast '+mast.id);
    return {
      ...mast,
      z:station.foreAftStation,
      height:mast.height*(station.heightScale??1),
      radiusScale:(mast.radiusScale??1)*(station.radiusScale??1),
      yardScale:(mast.yardScale??1)*(station.yardScale??1)
    };
  })};
}

function assembleSloop(vessel,componentTransforms={},savedState={}){
  const design=applyMastArchitecture(vessel.design),resolved={...vessel,design};
  const ctx=createShipContext(resolved,{"hull":0x302821,"plank":0x795a3d,"deck":0xb69a70,"sail":0xd9c6a5});
  const generators={
    "hull":()=>buildHull(design,ctx),
    "keel":()=>buildKeel(design,ctx),
    "stem":()=>buildStem(design,ctx),
    "deck":()=>buildDeck(design,ctx),
    "vivier":()=>buildVivier(design,ctx),
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
    "masts":()=>{for(const mast of design.masts){const generator=MAST_GENERATORS[mast.id];if(!generator)throw new Error('sloop: no generator for mast '+mast.id);generator(design,ctx,mast);}},
    "head-sails":()=>buildHeadSails(design,ctx)
  };
  for(const component of ARCHITECTURE.assemblyOrder){
    const generate=generators[component];
    if(typeof generate!=='function')throw new Error('sloop: missing assembly instruction '+component);
    generate();
  }
  const root=finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture=ARCHITECTURE;
  root.userData.shipAssemblyOrder=[...ARCHITECTURE.assemblyOrder];
  return root;
}
export function createSloopModel(componentTransforms={},savedState={}){return assembleSloop(resolveVesselForGeneration(SloopDefinition),componentTransforms,savedState);}
export function generateSloop(componentTransforms={},savedState={}){return createSloopModel(componentTransforms,savedState);}
export const Sloop=Object.freeze({id:SloopDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,definition:SloopDefinition,design:SloopDefinition.design,structure:SloopDefinition.structure,editorModulePath:SloopDefinition.editorModulePath,architecture:ARCHITECTURE,createModel:createSloopModel,generate:generateSloop});
export const id=Sloop.id,design=Sloop.design,structure=Sloop.structure,createModel=Sloop.createModel,generate=Sloop.generate;
export default Sloop;
