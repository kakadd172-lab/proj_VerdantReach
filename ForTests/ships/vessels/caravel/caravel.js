import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec } from '../../shared/vessel-definition.js';
/**
 * caravel — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */

export const CaravelDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/caravel/caravel.js',
  id: 'caravel',
  design: {
    id: 'caravel', label: 'Atlantic caravel redonda', era: '15th–16th century',
    hullLength: 20.5, beam: 7.0, draft: 2.4, freeboard: 1.6,
    rig: 'Three masts: square foremast with lateen sails aft; lateen-only variants also existed.',
    hullProfile: 'Rounded carvel-built hull, deep bow flare, modest freeboard and narrow transom.',
    reference: 'Caravel c. 1450 model at the German Historical Museum: 20.5 m × 7.0 m. The museum describes two- or three-mast variants with square fore and lateen aft sails.',
    sources: [{ label: 'Deutsches Historisches Museum — Caravel', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/05-caravel/' }, { label: 'The Mariners’ Museum — Caravel', url: 'https://exploration.marinersmuseum.org/watercraft/caravel/' }],
    hull: { fullness: 0.65, entry: 0.6, stern: 'round', sternWidth: 0.18, tumblehome: 0.08, sheer: 0.15, bowRise: 0.34, sternRise: 0.24, keelDepth: 0.14, deckCamber: 0.14 },
    sternwork: 'quarterdeck',
    sternTiers: [{"w":0.5,"d":0.145,"h":1.7},{"w":0.37,"d":0.12,"h":0.9}], bowwork: 'short-bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 8.5, handling: 1.08,
    masts: [
      { id: 'fore', z: -0.29, height: 15.9, rig: 'square', squares: 2 },
      { id: 'main', z: -0.015, height: 18.2, rig: 'lateen', span: 0.46, squares: 0 },
      { id: 'mizzen', z: 0.28, height: 14.4, rig: 'lateen', span: 0.38, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 26, beamStation: .49, forebody: .82, aftbody: 1.22, foreTip: .003, aftTip: .035, bottomFlat: .16, bilge: .1, flare: .18, tumble: .075, sheer: 1.2, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .92 },
}, EDITOR_DEFAULTS);


import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { CARAVEL_ARCHITECTURE } from './architecture/layout.js';
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
const ARCHITECTURE = CARAVEL_ARCHITECTURE;

function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('caravel: no architecture station for mast ' + mast.id);
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

function assembleCaravel(vessel, componentTransforms={}, savedState={}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {"hull":7359794,"plank":10253387,"deck":11900522,"sail":15261385});
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
    if (typeof generate !== 'function') throw new Error('caravel: missing assembly instruction ' + component);
    generate();
  }
  const root = finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  return root;
}

export function createCaravelModel(componentTransforms={},savedState={}) {
  const vessel = resolveVesselForGeneration(CaravelDefinition);
  return assembleCaravel(vessel,componentTransforms,savedState);
}
export function generateCaravel(componentTransforms={},savedState={}) {
  return createCaravelModel(componentTransforms,savedState);
}
export const Caravel = Object.freeze({
  id: CaravelDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,
  definition: CaravelDefinition,
  design: CaravelDefinition.design,
  structure: CaravelDefinition.structure,
  editorModulePath: CaravelDefinition.editorModulePath,
  architecture: ARCHITECTURE,
  createModel: createCaravelModel,
  generate: generateCaravel
});
export const id = Caravel.id;
export const design = Caravel.design;
export const structure = Caravel.structure;
export const createModel = Caravel.createModel;
export const generate = Caravel.generate;
export default Caravel;
