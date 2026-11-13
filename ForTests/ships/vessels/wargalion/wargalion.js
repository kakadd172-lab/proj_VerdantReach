import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { WARGALION_ARCHITECTURE } from './architecture/layout.js';
import { buildHull } from './generators/hull/hull-generator.js';
import { buildKeel } from './generators/hull/keel-generator.js';
import { buildStem } from './generators/hull/stem-generator.js';
import { buildFrames } from './generators/hull-structure/frame-generator.js';
import { buildHullPlanking } from './generators/hull-structure/planking-generator.js';
import { buildDeck } from './generators/decks/deck-generator.js';
import { buildDeckPlanking } from './generators/decks/deck-planking-generator.js';
import { buildStern } from './generators/stern/stern-generator.js';
import { buildBow } from './generators/bow/bow-generator.js';
import { buildRudder } from './generators/steering/rudder-generator.js';
import { buildHelm } from './generators/steering/helm-generator.js';
import { buildRailings } from './generators/deck-equipment/railing-generator.js';
import { buildFittings } from './generators/deck-equipment/fittings-generator.js';
import { buildAnchors } from './generators/anchors/anchor-generator.js';
import { buildMast } from './generators/masts/mast-frame-generator.js';
import { buildHeadSails } from './generators/sails/head-sails-generator.js';

export const WargalionDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/wargalion/wargalion.js',
  id: 'wargalion',
  design: {
    id: 'wargalion',
    label: 'Wargalion',
    era: 'Late 16th-century Iberian war galleon reconstruction',
    hullLength: 39.0, beam: 12.2, draft: 5.0, freeboard: 2.8,
    rig: 'Three masts: square-rigged fore and main, lateen mizzen, bowsprit and headsails.',
    hullProfile: 'Full ocean-going lower hull, fine rising bow, strong sheer, high stepped sterncastle and raised forecastle.',
    reference: 'Historical reconstruction guided by the Galleon San Martín (1580) plan set. The selected plan sheet informs silhouette and sectional form; Wargalion dimensions are design estimates, not claimed San Martín measurements.',
    sources: [
      { label: 'Shipmodell — Free Plans: Tall Ships (San Martín 1580 plan set)', url: 'https://www.shipmodell.com/index_files/0PLAN1B.html' },
      { label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' },
      { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' }
    ],
    hull: {
      fullness: 0.86, entry: 0.52, stern: 'transom', sternWidth: 0.44,
      tumblehome: 0.13, sheer: 0.18, bowRise: 0.38, sternRise: 0.53,
      keelDepth: 0.16, deckCamber: 0.13, forecastleRise: 0.72, quarterdeckRise: 0.96
    },
    sternwork: 'high-stepped-galleon-aftercastle-with-quarter-galleries',
    sternTiers: [
      { w: 0.64, d: 0.18, h: 2.15 },
      { w: 0.49, d: 0.145, h: 1.58 },
      { w: 0.35, d: 0.115, h: 1.20 }
    ],
    bowwork: 'raked-stem-beakhead-and-raised-forecastle',
    keelDetails: { pointOffset: 0.08, minimumRadius: 0.09, radiusFactor: 0.016, label: 'wargalion-keel-and-keelson' },
    rudderDetails: { pivotOffset: 0.20, yFactor: 0.36, breadthFactor: 0.105, depthFactor: 0.78 },
    masts: [
      { id: 'fore', z: -0.305, height: 25.5, rig: 'square', squares: 3 },
      { id: 'main', z: -0.045, height: 29.0, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.335, height: 21.0, rig: 'lateen', span: 0.43, squares: 0 }
    ],
    headsails: 2, oars: false,
    sailingSpeed: 5.8, handling: 0.48
  },
  structure: {
    frameCount: 42, beamStation: 0.52, forebody: 0.84, aftbody: 0.92,
    foreTip: 0.004, aftTip: 0.14, bottomFlat: 0.36, bilge: 0.26,
    flare: 0.13, tumble: 0.13, sheer: 1.15, lowerMastRatio: 0.66,
    shroudPairs: 3, ratlines: 12, yardSpread: 1.06
  }
}, EDITOR_DEFAULTS);

const MAST_GENERATORS = Object.freeze({
  fore: (d, ctx, mast) => buildMast(d, ctx, mast),
  main: (d, ctx, mast) => buildMast(d, ctx, mast),
  mizzen: (d, ctx, mast) => buildMast(d, ctx, mast)
});

function applyMastArchitecture(design) {
  const stations = new Map(WARGALION_ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('Wargalion architecture is missing mast station: ' + mast.id);
      return {
        ...mast, z: station.foreAftStation,
        height: mast.height * (station.heightScale ?? 1),
        radiusScale: station.radiusScale ?? 1,
        yardScale: station.yardScale ?? 1
      };
    })
  };
}

function assembleWargalion(vessel, componentTransforms = {}, savedState = {}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {
    hull: 0x49352b, lower: 0x302a25, plank: 0x876344,
    deck: 0xb99a6c, trim: 0x49372b, sail: 0xe4dbc7,
    sailShade: 0xb9ad94, brass: 0xb28a4c
  });
  const generators = {
    hull: () => buildHull(design, ctx),
    keel: () => buildKeel(design, ctx),
    stem: () => buildStem(design, ctx),
    frames: () => buildFrames(design, ctx),
    'hull-planking': () => buildHullPlanking(design, ctx),
    'main-deck': () => buildDeck(design, ctx),
    'deck-planking': () => buildDeckPlanking(design, ctx),
    sternworks: () => buildStern(design, ctx),
    bowworks: () => buildBow(design, ctx),
    rudder: () => buildRudder(design, ctx),
    helm: () => buildHelm(design, ctx),
    railings: () => buildRailings(design, ctx),
    'deck-fittings': () => buildFittings(design, ctx),
    anchors: () => buildAnchors(design, ctx),
    masts: () => {
      for (const mast of design.masts) {
        const generator = MAST_GENERATORS[mast.id];
        if (!generator) throw new Error('Wargalion has no mast generator for ' + mast.id);
        generator(design, ctx, mast);
      }
    },
    'head-sails': () => buildHeadSails(design, ctx)
  };
  for (const key of WARGALION_ARCHITECTURE.assemblyOrder) {
    const generator = generators[key];
    if (typeof generator !== 'function') throw new Error('Wargalion assembly is missing: ' + key);
    generator();
  }
  const root = finishShipModel(ctx, componentTransforms, savedState);
  root.userData.shipArchitecture = WARGALION_ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...WARGALION_ARCHITECTURE.assemblyOrder];
  return root;
}

export function createWargalionModel(componentTransforms = {}, savedState = {}) {
  return assembleWargalion(resolveVesselForGeneration(WargalionDefinition), componentTransforms, savedState);
}
export function generateWargalion(componentTransforms = {}, savedState = {}) {
  return createWargalionModel(componentTransforms, savedState);
}
export const Wargalion = Object.freeze({
  id: WargalionDefinition.id, editorDefaults: EDITOR_DEFAULTS,
  definition: WargalionDefinition, design: WargalionDefinition.design,
  structure: WargalionDefinition.structure,
  editorModulePath: WargalionDefinition.editorModulePath,
  architecture: WARGALION_ARCHITECTURE,
  createModel: createWargalionModel, generate: generateWargalion
});
export const id = Wargalion.id, design = Wargalion.design,
  structure = Wargalion.structure, createModel = Wargalion.createModel,
  generate = Wargalion.generate;
export default Wargalion;
