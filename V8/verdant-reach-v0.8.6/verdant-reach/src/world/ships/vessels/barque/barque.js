import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec } from '../../core/vessel-definition.js';
/**
 * barque — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */

export const BarqueDefinition = defineVesselSpec({
  editorModulePath: 'src/world/ships/vessels/barque/barque.js',
  id: 'barque',
  design: {
    id: 'barque', label: 'Atlantic barque', era: 'Late 18th century onward',
    hullLength: 29.8, beam: 8.9, draft: 3.5, freeboard: 1.8,
    rig: 'At least three masts; fore and main square, mizzen fore-and-aft.',
    hullProfile: 'Long cargo hull, full midbody, low working deck and rounded counter.',
    reference: 'Endeavour (1768) reference dimensions: 29.8 m × 8.9 m. This reconstruction uses the defining three-mast barque sail division.',
    sources: [{ label: 'Deutsches Historisches Museum — Barque / Endeavour', url: 'https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/15-barque/' }],
    hull: { fullness: 0.72, entry: 0.62, stern: 'counter', sternWidth: 0.35, tumblehome: 0.08, sheer: 0.12, bowRise: 0.24, sternRise: 0.28, keelDepth: 0.1, deckCamber: 0.13 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 7.8, handling: 0.82,
    masts: [
      { id: 'fore', z: -0.29, height: 24.6, rig: 'square', squares: 3 },
      { id: 'main', z: -0.02, height: 27.5, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.28, height: 22.0, rig: 'gaff', span: 0.28, squares: 0 },
    ],
    headsails: 3, oars: false,
  },
  structure: { frameCount: 32, beamStation: .52, forebody: .9, aftbody: 1.01, foreTip: .005, aftTip: .10, bottomFlat: .34, bilge: .22, flare: .09, tumble: .08, sheer: .99, lowerMastRatio: .64, shroudPairs: 3, ratlines: 10, yardSpread: 1.02 },
}, EDITOR_DEFAULTS);


import { createShipContext, finishShipModel } from '../../core/ship-editor-kit.js';
import { resolveVesselForGeneration } from '../../core/vessel-definition.js';
import { BARQUE_ARCHITECTURE } from './architecture/layout.js';
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
const ARCHITECTURE = BARQUE_ARCHITECTURE;

function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('barque: no architecture station for mast ' + mast.id);
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

function assembleBarque(vessel, componentTransforms={}, savedState={}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {"hull":6505775,"plank":9267527,"deck":11571561,"sail":15129540});
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
    if (typeof generate !== 'function') throw new Error('barque: missing assembly instruction ' + component);
    generate();
  }
  const root = finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  return root;
}

export function createBarqueModel(componentTransforms={},savedState={}) {
  const vessel = resolveVesselForGeneration(BarqueDefinition);
  return assembleBarque(vessel,componentTransforms,savedState);
}
export function generateBarque(componentTransforms={},savedState={}) {
  return createBarqueModel(componentTransforms,savedState);
}
export const Barque = Object.freeze({
  id: BarqueDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,
  definition: BarqueDefinition,
  design: BarqueDefinition.design,
  structure: BarqueDefinition.structure,
  editorModulePath: BarqueDefinition.editorModulePath,
  architecture: ARCHITECTURE,
  createModel: createBarqueModel,
  generate: generateBarque
});
export const id = Barque.id;
export const design = Barque.design;
export const structure = Barque.structure;
export const createModel = Barque.createModel;
export const generate = Barque.generate;
export default Barque;
