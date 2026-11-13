import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { WAR_GALLEON_2_ARCHITECTURE } from './architecture/layout.js';
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
import { buildForemast } from './generators/masts/foremast-generator.js';
import { buildMainmast } from './generators/masts/mainmast-generator.js';
import { buildMizzenmast } from './generators/masts/mizzenmast-generator.js';

export const WarGalleon2Definition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/war-galleon-2/war-galleon-2.js',
  id: 'war-galleon-2',
  design: {
    id: 'war-galleon-2',
    label: 'Late-16th-century War Galleon II',
    era: 'c. 1580–1620',
    hullLength: 38.0,
    beam: 10.6,
    draft: 4.7,
    freeboard: 2.75,
    rig: 'Three masts: square-rigged fore and main, lateen mizzen, bowsprit and two headsails.',
    hullProfile: 'Long deep-water hull with a fine entrance, full central body, broad transom and a high stepped sterncastle.',
    reference: 'Composite late-sixteenth-century Iberian war-galleon reconstruction using a 38.0 m × 10.6 m × 4.7 m design envelope. It is not attributed to one surviving vessel or presented as a traced lines plan.',
    sources: [
      { label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' },
      { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' },
      { label: 'Maritime Museum of San Diego — San Salvador dimensions and sail plan', url: 'https://sdmaritime.org/visit/the-ships/san-salvador/' }
    ],
    hull: {
      fullness: 0.84, entry: 0.67, stern: 'transom', sternWidth: 0.42,
      tumblehome: 0.14, sheer: 0.19, bowRise: 0.36, sternRise: 0.55,
      keelDepth: 0.16, deckCamber: 0.18
    },
    sternwork: 'galleon-castle',
    sternTiers: [
      { w: 0.62, d: 0.17, h: 2.35 },
      { w: 0.47, d: 0.145, h: 1.75 },
      { w: 0.34, d: 0.12, h: 1.28 }
    ],
    bowwork: 'beakhead',
    keelDetails: {
      pointOffset: 0.065, minimumRadius: 0.085, radiusFactor: 0.019,
      stemPosts: true, label: 'war-galleon-2-keel-and-keelson'
    },
    rudderDetails: {
      pivotOffset: 0.23, yFactor: 0.38, breadthFactor: 0.125, depthFactor: 0.82
    },
    sailingSpeed: 6.0,
    handling: 0.52,
    masts: [
      { id: 'fore', z: -0.305, height: 23.5, rig: 'square', squares: 3 },
      { id: 'main', z: -0.018, height: 27.5, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.315, height: 18.5, rig: 'lateen', span: 0.35, squares: 0 }
    ],
    headsails: 2,
    oars: false
  },
  structure: {
    frameCount: 42,
    beamStation: 0.52,
    forebody: 0.85,
    aftbody: 0.91,
    foreTip: 0.002,
    aftTip: 0.12,
    bottomFlat: 0.42,
    bilge: 0.26,
    flare: 0.15,
    tumble: 0.14,
    sheer: 1.25,
    lowerMastRatio: 0.66,
    shroudPairs: 3,
    ratlines: 11,
    yardSpread: 1.08
  }
}, EDITOR_DEFAULTS);

const MAST_GENERATORS = Object.freeze({
  fore: buildForemast,
  main: buildMainmast,
  mizzen: buildMizzenmast
});
const ARCHITECTURE = WAR_GALLEON_2_ARCHITECTURE;

function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map((item) => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map((mast) => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('war-galleon-2: missing mast station ' + mast.id);
      return {
        ...mast,
        z: station.longitudinalOffset,
        height: mast.height * (station.heightScale ?? 1),
        radiusScale: (mast.radiusScale ?? 1) * (station.radiusScale ?? 1),
        yardScale: (mast.yardScale ?? 1) * (station.yardScale ?? 1)
      };
    })
  };
}

function assembleWarGalleon2(vessel, componentTransforms = {}, savedState = {}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const context = createShipContext(resolved, {
    hull: 0x65412c, lower: 0x3e2a20, plank: 0x98704b, deck: 0xc8a978,
    trim: 0x563521, sail: 0xd8c59c, sailShade: 0xb49b70, rope: 0x514538,
    iron: 0x45413b, brass: 0xb28a43, glass: 0x425654, flag: 0x883d35
  });
  const generators = {
    hull: () => buildHull(design, context),
    keel: () => buildKeel(design, context),
    stem: () => buildStem(design, context),
    deck: () => buildDeck(design, context),
    frames: () => buildFrames(design, context),
    'hull-planking': () => buildHullPlanking(design, context),
    'deck-planking': () => buildDeckPlanking(design, context),
    stern: () => buildStern(design, context),
    'aft-cabins': () => ensureSternTierComponents(design, context),
    bow: () => buildBow(design, context),
    rudder: () => buildRudder(design, context),
    helm: () => buildHelm(design, context),
    railings: () => buildRailings(design, context),
    'deck-equipment': () => buildDeckEquipment(design, context),
    anchors: () => buildAnchors(design, context),
    masts: () => {
      for (const mast of design.masts) {
        const generator = MAST_GENERATORS[mast.id];
        if (!generator) throw new Error('war-galleon-2: no mast generator for ' + mast.id);
        generator(design, context, mast);
      }
    },
    'head-sails': () => buildHeadSails(design, context)
  };

  for (const component of ARCHITECTURE.assemblyOrder) {
    const generate = generators[component];
    if (typeof generate !== 'function') {
      throw new Error('war-galleon-2: missing assembly instruction ' + component);
    }
    generate();
  }

  const root = finishShipModel(context, componentTransforms, savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  root.userData.vesselProvenance = {
    designName: 'Late-16th-century War Galleon II',
    referenceStatus: 'composite reconstruction; not a traced surviving lines plan'
  };
  return root;
}

export function createWarGalleon2Model(componentTransforms = {}, savedState = {}) {
  return assembleWarGalleon2(
    resolveVesselForGeneration(WarGalleon2Definition),
    componentTransforms,
    savedState
  );
}

export function generateWarGalleon2(componentTransforms = {}, savedState = {}) {
  return createWarGalleon2Model(componentTransforms, savedState);
}

export const WarGalleon2 = Object.freeze({
  id: WarGalleon2Definition.id,
  editorDefaults: EDITOR_DEFAULTS,
  definition: WarGalleon2Definition,
  design: WarGalleon2Definition.design,
  structure: WarGalleon2Definition.structure,
  editorModulePath: WarGalleon2Definition.editorModulePath,
  architecture: ARCHITECTURE,
  createModel: createWarGalleon2Model,
  generate: generateWarGalleon2
});

export const id = WarGalleon2.id;
export const design = WarGalleon2.design;
export const structure = WarGalleon2.structure;
export const createModel = WarGalleon2.createModel;
export const generate = WarGalleon2.generate;
export default WarGalleon2;
