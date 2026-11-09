import { defineVesselSpec } from '../../shared/vessel-definition.js';
/**
 * carrack — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */

export const CarrackDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/carrack/carrack.js',
  id: 'carrack',
  design: {
    id: 'carrack', label: 'Iberian carrack / nao', era: '15th–16th century',
    hullLength: 32.3, beam: 10.5, draft: 4.0, freeboard: 2.55,
    rig: 'Three masts: square fore and main; lateen mizzen.',
    hullProfile: 'Broad, deep bulbous hull, narrow upper works, high forecastle and tall aftercastle.',
    reference: 'Carrack c. 1480 model at the German Historical Museum: 32.3 m × 10.5 m; the Mariners’ Museum describes the wide, deep cargo hull and mixed square/lateen three-mast rig.',
    sources: [{ label: 'Deutsches Historisches Museum — Carrack', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/07-carrack/' }, { label: 'The Mariners’ Museum — Carrack / Nao', url: 'https://exploration.marinersmuseum.org/watercraft/carrack-nao/' }],
    hull: { fullness: 0.92, entry: 0.44, stern: 'transom', sternWidth: 0.42, tumblehome: 0.1, sheer: 0.18, bowRise: 0.44, sternRise: 0.5, keelDepth: 0.16, deckCamber: 0.2 },
    sternwork: 'high-aftercastle',
    sternTiers: [{"w":0.58,"d":0.16,"h":2.2},{"w":0.46,"d":0.14,"h":1.55},{"w":0.34,"d":0.12,"h":1.25}], bowwork: 'high-forecastle',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 6.5, handling: 0.55,
    masts: [
      { id: 'fore', z: -0.27, height: 22.8, rig: 'square', squares: 3 },
      { id: 'main', z: -0.035, height: 25.8, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 19.6, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 34, beamStation: .53, forebody: .76, aftbody: .78, foreTip: .006, aftTip: .17, bottomFlat: .45, bilge: .29, flare: .15, tumble: .08, sheer: 1.33, lowerMastRatio: .62, shroudPairs: 3, ratlines: 10, yardSpread: 1.12 },
});


import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { CARRACK_ARCHITECTURE } from './architecture/layout.js';
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
import { buildMizzenmast } from './generators/masts/mizzenmast-generator.js';

const MAST_GENERATORS = Object.freeze({
  "fore": buildForemast,
  "main": buildMainmast,
  "mizzen": buildMizzenmast
});
const ARCHITECTURE = CARRACK_ARCHITECTURE;

function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('carrack: no architecture station for mast ' + mast.id);
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

function assembleCarrack(vessel, componentTransforms={}, savedState={}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {"hull":6636334,"plank":9529922,"deck":11701600,"sail":15261126});
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
    if (typeof generate !== 'function') throw new Error('carrack: missing assembly instruction ' + component);
    generate();
  }
  const root = finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  return root;
}

export function createCarrackModel(componentTransforms={},savedState={}) {
  const vessel = resolveVesselForGeneration(CarrackDefinition);
  return assembleCarrack(vessel,componentTransforms,savedState);
}
export function generateCarrack(componentTransforms={},savedState={}) {
  return createCarrackModel(componentTransforms,savedState);
}
export const Carrack = Object.freeze({
  id: CarrackDefinition.id,
  definition: CarrackDefinition,
  design: CarrackDefinition.design,
  structure: CarrackDefinition.structure,
  editorModulePath: CarrackDefinition.editorModulePath,
  architecture: ARCHITECTURE,
  createModel: createCarrackModel,
  generate: generateCarrack
});
export const id = Carrack.id;
export const design = Carrack.design;
export const structure = Carrack.structure;
export const createModel = Carrack.createModel;
export const generate = Carrack.generate;
export default Carrack;
