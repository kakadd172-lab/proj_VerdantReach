import EDITOR_DEFAULTS from './editor-defaults.js';
import { defineVesselSpec, resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { WAR_GALLEON_ARCHITECTURE } from './architecture/layout.js';
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
import { buildForemast } from './generators/masts/foremast-generator.js';
import { buildMainmast } from './generators/masts/mainmast-generator.js';
import { buildMizzenmast } from './generators/masts/mizzenmast-generator.js';
import { buildHeadSails } from './generators/sails/head-sails-generator.js';

export const WarGalleonDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/war-galleon/war-galleon.js',
  id: 'war-galleon',
  design: {
    id: 'war-galleon',
    label: 'Late-16th-century War Galleon',
    era: 'Late 16th century',
    hullLength: 38.0,
    beam: 10.6,
    draft: 4.7,
    freeboard: 2.20,
    rig: 'Three masts: square-rigged fore and main, lateen mizzen, long bowsprit and two headsails.',
    hullProfile: 'Long ocean-going hull with fine entrance, rounded midship sections, square transom, low forward castle and a high narrowing sterncastle.',
    reference: 'Proportional reconstruction informed by late-sixteenth-century Atlantic galleon descriptions and comparative ship studies. Dimensions and unrecorded construction details are model-design estimates, not a traced surviving lines plan.',
    sources: [
      { label: 'Western Ledge Reef Wreck — late-sixteenth-century Spanish ship reconstruction', url: 'https://core.ac.uk/download/pdf/9069438.pdf' },
      { label: 'Archival investigations — historical galleon hull form overview', url: 'https://digital.library.unt.edu/ark:/67531/metadc955793/m2/1/high_res_d/5109.pdf' },
      { label: 'Royal Museums Greenwich — 16th-century galleon plan record', url: 'https://www.rmg.co.uk/collections/objects/rmgc-object-460994' }
    ],
    hull: { fullness: 0.91, entry: 0.58, stern: 'transom', sternWidth: 0.39, tumblehome: 0.20, sheer: 0.19, bowRise: 0.34, sternRise: 0.56, keelDepth: 0.16, deckCamber: 0.12 },
    sternwork: 'high-three-tier-sterncastle',
    sternTiers: [{ w: 0.60, d: 0.19, h: 2.18 }, { w: 0.47, d: 0.15, h: 1.58 }, { w: 0.34, d: 0.11, h: 1.08 }],
    bowwork: 'low-raised-forecastle-and-beakhead',
    keelDetails: { pointOffset: 0.055, minimumRadius: 0.085, radiusFactor: 0.017, stemPosts: true, label: 'war-galleon-keelson' },
    rudderDetails: { pivotOffset: 0.20, yFactor: 0.39, breadthFactor: 0.115, depthFactor: 0.84 },
    sailingSpeed: 6.8,
    handling: 0.56,
    masts: [
      { id: 'fore', z: -0.285, height: 20.8, rig: 'square', squares: 3 },
      { id: 'main', z: -0.015, height: 24.0, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.315, height: 17.0, rig: 'lateen', span: 0.40, squares: 0 }
    ],
    headsails: 2,
    oars: false
  },
  structure: {
    frameCount: 42, beamStation: 0.50, forebody: 0.84, aftbody: 0.92,
    foreTip: 0.004, aftTip: 0.10, bottomFlat: 0.34, bilge: 0.26,
    flare: 0.085, tumble: 0.20, sheer: 1.16, lowerMastRatio: 0.65,
    shroudPairs: 3, ratlines: 11, yardSpread: 1.02
  }
}, EDITOR_DEFAULTS);

const MAST_GENERATORS = Object.freeze({ fore: buildForemast, main: buildMainmast, mizzen: buildMizzenmast });
const ARCHITECTURE = WAR_GALLEON_ARCHITECTURE;
function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return { ...design, masts: design.masts.map(mast => {
    const station = stations.get(mast.id);
    if (!station) throw new Error('war-galleon: missing mast station ' + mast.id);
    return { ...mast, z: station.longitudinalOffset, height: mast.height * (station.heightScale ?? 1),
      radiusScale: (mast.radiusScale ?? 1) * (station.radiusScale ?? 1),
      yardScale: (mast.yardScale ?? 1) * (station.yardScale ?? 1) };
  }) };
}
function assembleWarGalleon(vessel, componentTransforms = {}, savedState = {}) {
  const design = applyMastArchitecture(vessel.design), resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {
    hull: 0x65412c, lower: 0x3e2a20, plank: 0x98704b, deck: 0xc8a978,
    trim: 0x563521, sail: 0xd8c59c, sailShade: 0xb49b70, rope: 0x514538,
    iron: 0x45413b, brass: 0xb28a43, glass: 0x425654, flag: 0x883d35
  });
  const generators = {
    hull: () => buildHull(design,ctx), keel: () => buildKeel(design,ctx),
    stem: () => buildStem(design,ctx), deck: () => buildDeck(design,ctx),
    frames: () => buildFrames(design,ctx), 'hull-planking': () => buildHullPlanking(design,ctx),
    'deck-planking': () => buildDeckPlanking(design,ctx), stern: () => buildStern(design,ctx),
    'aft-cabins': () => ensureSternTierComponents(design,ctx), bow: () => buildBow(design,ctx),
    rudder: () => buildRudder(design,ctx), helm: () => buildHelm(design,ctx),
    railings: () => buildRailings(design,ctx), 'deck-equipment': () => buildDeckEquipment(design,ctx),
    anchors: () => buildAnchors(design,ctx),
    masts: () => { for (const mast of design.masts) {
      const generator = MAST_GENERATORS[mast.id];
      if (!generator) throw new Error('war-galleon: no generator registered for mast ' + mast.id);
      generator(design,ctx,mast);
    } },
    'head-sails': () => buildHeadSails(design,ctx)
  };
  for (const component of ARCHITECTURE.assemblyOrder) {
    const build = generators[component];
    if (typeof build !== 'function') throw new Error('war-galleon: missing assembly step ' + component);
    build();
  }
  const root = finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  root.userData.vesselProvenance = {
    designName: 'Late-16th-century Atlantic galleon reconstruction',
    referenceStatus: 'proportional reconstruction; not a traced surviving lines plan'
  };
  return root;
}
export function createWarGalleonModel(componentTransforms = {}, savedState = {}) {
  return assembleWarGalleon(resolveVesselForGeneration(WarGalleonDefinition),componentTransforms,savedState);
}
export function generateWarGalleon(componentTransforms = {}, savedState = {}) {
  return createWarGalleonModel(componentTransforms,savedState);
}
export const WarGalleon = Object.freeze({
  id: WarGalleonDefinition.id, editorDefaults: EDITOR_DEFAULTS, definition: WarGalleonDefinition,
  design: WarGalleonDefinition.design, structure: WarGalleonDefinition.structure,
  editorModulePath: WarGalleonDefinition.editorModulePath, architecture: ARCHITECTURE,
  createModel: createWarGalleonModel, generate: generateWarGalleon
});
export const id = WarGalleon.id, design = WarGalleon.design, structure = WarGalleon.structure,
  createModel = WarGalleon.createModel, generate = WarGalleon.generate;
export default WarGalleon;
