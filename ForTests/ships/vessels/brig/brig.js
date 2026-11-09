import { defineVesselSpec } from '../../shared/vessel-definition.js';
/**
 * brig — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */

export const BrigDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/brig/brig.js',
  id: 'brig',
  design: {
    id: 'brig', label: 'Full-rigged brig', era: 'Late 18th–early 19th century',
    hullLength: 33.7, beam: 9.75, draft: 3.7, freeboard: 2.0,
    rig: 'Two square-rigged masts, with staysails and a spanker aft.',
    hullProfile: 'Deep working hull, rounded floor, transom counter and raised quarterdeck.',
    reference: 'Representative size envelope informed by documented early-19th-century brigs; USS Niagara dimensions are 33.7 m LBP × 9.8 m beam.',
    sources: [{ label: 'Tall Ship Guide — USS Niagara brig dimensions', url: 'https://classic-sailing.com/wp-content/uploads/2021/03/Tall-Ship-Guide-Online-Version-22-03-2021.pdf' }],
    hull: { fullness: 0.7, entry: 0.65, stern: 'counter', sternWidth: 0.36, tumblehome: 0.1, sheer: 0.14, bowRise: 0.3, sternRise: 0.3, keelDepth: 0.13, deckCamber: 0.16 },
    sternwork: 'quarterdeck',
    sternTiers: [{"w":0.5,"d":0.145,"h":1.7},{"w":0.37,"d":0.12,"h":0.9}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 7.4, handling: 0.86,
    masts: [
      { id: 'fore', z: -0.23, height: 25.5, rig: 'square', squares: 3 },
      { id: 'main', z: 0.13, height: 27.0, rig: 'square', squares: 3, spanker: true },
    ],
    headsails: 3, oars: false,
  },
  structure: { frameCount: 32, beamStation: .52, forebody: .98, aftbody: 1.0, foreTip: .003, aftTip: .10, bottomFlat: .35, bilge: .22, flare: .08, tumble: .11, sheer: 1.0, lowerMastRatio: .64, shroudPairs: 3, ratlines: 10, yardSpread: 1.04 },
});


import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { BRIG_ARCHITECTURE } from './architecture/layout.js';
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
import { buildHeadSails } from './generators/sails/head-sails-generator.js';
import { buildMast } from './generators/masts/mast-frame-generator.js';
import { buildForemast } from './generators/masts/foremast-generator.js';
import { buildMainmast } from './generators/masts/mainmast-generator.js';

const MAST_GENERATORS = Object.freeze({
  "fore": buildForemast,
  "main": buildMainmast
});
const ARCHITECTURE = BRIG_ARCHITECTURE;

function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('brig: no architecture station for mast ' + mast.id);
      return {
        ...mast,
        z: station.foreAftStation,
        height: mast.height * (station.heightScale ?? 1),
        radiusScale: (mast.radiusScale ?? 1) * (station.radiusScale ?? 1),
        yardScale: (mast.yardScale ?? 1) * (station.yardScale ?? 1)
      };
    })
  };
}

function assembleBrig(vessel, componentTransforms={}, savedState={}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {"hull":6111022,"plank":9004103,"deck":11702889,"sail":14735042});
  const generators = {
    hull: () => buildHull(design,ctx),
    keel: () => buildKeel(design,ctx),
    stem: () => buildStem(design,ctx),
    deck: () => buildDeck(design,ctx),
    frames: () => buildFrames(design,ctx),
    'hull-planking': () => buildHullPlanking(design,ctx),
    'deck-planking': () => buildDeckPlanking(design,ctx),
    stern: () => buildStern(design,ctx),
    'aft-cabins': () => ensureSternTierComponents(design,ctx),
    bow: () => buildBow(design,ctx),
    rudder: () => buildRudder(design,ctx),
    helm: () => buildHelm(design,ctx),
    railings: () => buildRailings(design,ctx),
    'deck-equipment': () => buildDeckEquipment(design,ctx),
    anchors: () => buildAnchors(design,ctx),
    masts: () => {
      for (const mast of design.masts) {
        const generator = MAST_GENERATORS[mast.id];
        if (generator) generator(design,ctx,mast);
        else buildMast(design,ctx,mast);
      }
    },
    'head-sails': () => buildHeadSails(design,ctx)
  };
  for (const component of ARCHITECTURE.assemblyOrder) {
    const generate = generators[component];
    if (typeof generate !== 'function') throw new Error('brig: missing assembly instruction ' + component);
    generate();
  }
  const root = finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  return root;
}

export function createBrigModel(componentTransforms={},savedState={}) {
  const vessel = resolveVesselForGeneration(BrigDefinition);
  return assembleBrig(vessel,componentTransforms,savedState);
}
export function generateBrig(componentTransforms={},savedState={}) {
  return createBrigModel(componentTransforms,savedState);
}
export const Brig = Object.freeze({
  id: BrigDefinition.id,
  definition: BrigDefinition,
  design: BrigDefinition.design,
  structure: BrigDefinition.structure,
  editorModulePath: BrigDefinition.editorModulePath,
  architecture: ARCHITECTURE,
  createModel: createBrigModel,
  generate: generateBrig
});
export const id = Brig.id;
export const design = Brig.design;
export const structure = Brig.structure;
export const createModel = Brig.createModel;
export const generate = Brig.generate;
export default Brig;
