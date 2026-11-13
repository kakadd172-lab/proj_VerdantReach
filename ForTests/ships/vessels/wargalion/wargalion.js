import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { WARGALION_ARCHITECTURE } from './architecture/layout.js';
import { buildHull } from './generators/hull/hull-generator.js';
import { buildKeel } from './generators/hull/keel-generator.js';
import { buildStem } from './generators/hull/stem-generator.js';
import { buildFrames } from './generators/hull-structure/frame-generator.js';
import { buildHullPlanking } from './generators/hull-structure/hull-planking-generator.js';
import { buildDeck } from './generators/decks/deck-generator.js';
import { buildDeckPlanking } from './generators/decks/deck-planking-generator.js';
import { buildStern } from './generators/stern/stern-generator.js';
import { ensureSternTierComponents } from './generators/cabins/aft-cabin-generator.js';
import { buildBow } from './generators/bow/bow-generator.js';
import { buildRudder } from './generators/steering/rudder-generator.js';
import { buildHelm } from './generators/steering/helm-generator.js';
import { buildRailings } from './generators/deck-equipment/railing-generator.js';
import { buildFittings } from './generators/deck-equipment/fittings-generator.js';
import { buildAnchors } from './generators/anchors/anchor-generator.js';
import { buildForemast } from './generators/masts/foremast-generator.js';
import { buildMainmast } from './generators/masts/mainmast-generator.js';
import { buildMizzenmast } from './generators/masts/mizzenmast-generator.js';
import { buildHeadSails } from './generators/sails/head-sails-generator.js';

export const WargalionDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/wargalion/wargalion.js',
  id: 'wargalion',
  design: {
    id: 'wargalion',
    label: 'Wargalion',
    era: 'Late 16th-century Iberian war galleon reconstruction',
    hullLength: 39.0, beam: 11.7, draft: 5.2, freeboard: 3.8,
    rig: 'Three masts: square-rigged fore and main, lateen mizzen, bowsprit and headsails.',
    hullProfile: 'Station-faired Iberian galleon hull with a broad flat-floored master frame, circular futtock run, tumblehome, raked transom, raised forecastle, quarterdeck and stepped aftercastle.',
    hullFormNote: 'Plan-led reconstruction using the San Martín 1580 sheet profile and fore/aft section families. The master section uses a flat floor, a circular futtock arc and a separate upper tumblehome; the bow and stern tail frames are progressively faired. Intermediate offsets and dimensions not stated by the sheet are reconstruction estimates, not surveyed offsets.',
    modelScaleNote: "39.0 m length and 11.7 m beam are the dimensions reported for the San Martín by the Spanish Navy's Revista General de Marina (2007). Draft, freeboard, rig heights and intermediate station offsets remain interpreted reconstruction values, not surveyed offsets from the plan sheet.",
    reference: 'Historical reconstruction guided by the Galleon San Martín (1580) plan set. The plan set informs the general hull and profile; Wargalion dimensions and unshown construction details are reconstruction estimates, not claimed San Martín measurements.',
    sources: [
      { label: 'Shipmodell — Free Plans: Tall Ships (San Martín 1580 plan set)', url: 'https://www.shipmodell.com/index_files/0PLAN1B.html' },
      { label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' },
      { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' },
      { label: 'R. Visiers Bañón — Virtual Reconstruction of a 400-ton Iberian Vessel (1587 methodology)', url: 'https://oa.upm.es/38264/7/nautica_reconstruction_R03.pdf' },
      { label: 'Spanish Navy Revista General de Marina — San Martín model dimensions (2007)', url: 'https://armada.defensa.gob.es/archivo/rgm/2007/200707.pdf' }
    ],
    hull: {
      fullness: 0.86, entry: 0.52, stern: 'transom', sternWidth: 0.44,
      tumblehome: 0.13, sheer: 0.12, bowRise: 0.34, sternRise: 0.49,
      keelDepth: 0.13, deckCamber: 0.075, forecastleRise: 0.55, quarterdeckRise: 0.82, poopRise: 0.38
    },
    sternwork: 'high-stepped-galleon-aftercastle-with-quarter-galleries',
    sternTiers: [
      { w: 0.64, d: 0.205, h: 2.10, start: 0.735, rise: 0.00 },
      { w: 0.49, d: 0.148, h: 1.62, start: 0.820, rise: 1.42 },
      { w: 0.35, d: 0.105, h: 1.26, start: 0.890, rise: 2.75 }
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
    frameCount: 44, beamStation: 0.52, forebody: 0.84, aftbody: 0.92,
    foreTip: 0.004, aftTip: 0.14, bottomFlat: 0.36, bilge: 0.26,
    flare: 0.13, tumble: 0.13, sheer: 1.15, lowerMastRatio: 0.66,
    shroudPairs: 3, ratlines: 12, yardSpread: 1.06
  }
}, EDITOR_DEFAULTS);

const MAST_GENERATORS = Object.freeze({
  fore: buildForemast,
  main: buildMainmast,
  mizzen: buildMizzenmast
});

function applyMastArchitecture(design) {
  const stations = new Map(WARGALION_ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('Wargalion architecture is missing mast station: ' + mast.id);
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

function assembleWargalion(vessel, componentTransforms = {}, savedState = {}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {
    hull: 0x49352b, lower: 0x302a25, plank: 0x876344,
    deck: 0xb99a6c, trim: 0x49372b, sail: 0xe4dbc7,
    sailShade: 0xb9ad94, brass: 0xb28a4c, iron: 0x59605d,
    glass: 0x769b9b, rope: 0x6a5540
  });
  const generators = {
    hull: () => buildHull(design, ctx),
    keel: () => buildKeel(design, ctx),
    stem: () => buildStem(design, ctx),
    deck: () => buildDeck(design, ctx),
    frames: () => buildFrames(design, ctx),
    'hull-planking': () => buildHullPlanking(design, ctx),
    'deck-planking': () => buildDeckPlanking(design, ctx),
    stern: () => buildStern(design, ctx),
    'aft-cabins': () => ensureSternTierComponents(design, ctx),
    bow: () => buildBow(design, ctx),
    rudder: () => buildRudder(design, ctx),
    helm: () => buildHelm(design, ctx),
    railings: () => buildRailings(design, ctx),
    'deck-equipment': () => buildFittings(design, ctx),
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
  id: WargalionDefinition.id,
  editorDefaults: EDITOR_DEFAULTS,
  definition: WargalionDefinition,
  design: WargalionDefinition.design,
  structure: WargalionDefinition.structure,
  editorModulePath: WargalionDefinition.editorModulePath,
  architecture: WARGALION_ARCHITECTURE,
  createModel: createWargalionModel,
  generate: generateWargalion
});
export const id = Wargalion.id, design = Wargalion.design,
  structure = Wargalion.structure, createModel = Wargalion.createModel,
  generate = Wargalion.generate;
export default Wargalion;
