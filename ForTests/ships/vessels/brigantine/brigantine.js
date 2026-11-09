import { defineVesselSpec } from '../../shared/vessel-definition.js';
/**
 * brigantine — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */

export const BrigantineDefinition = defineVesselSpec({
  editorModulePath: 'ForTests/ships/vessels/brigantine/brigantine.js',
  id: 'brigantine',
  design: {
    id: 'brigantine', label: 'Brigantine', era: '18th–early 19th century',
    hullLength: 30.0, beam: 8.5, draft: 3.15, freeboard: 1.95,
    rig: 'Square foremast; mainmast with fore-and-aft sail and a square topsail.',
    hullProfile: 'Balanced single-deck hull with rounded bilges, compact counter and modest quarterdeck.',
    reference: 'Mercurio reconstruction (laid down 1805): approximately 30 m × 8.5 m; the museum describes a two-masted rig with square sails and a large trapezoidal sail.',
    sources: [{ label: 'Museo nazionale di archeologia del mare — Mercurio reconstruction', url: 'https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/' }],
    hull: { fullness: 0.68, entry: 0.62, stern: 'counter', sternWidth: 0.38, tumblehome: 0.11, sheer: 0.13, bowRise: 0.25, sternRise: 0.35, keelDepth: 0.12, deckCamber: 0.14 },
    sternwork: 'quarterdeck',
    sternTiers: [{"w":0.5,"d":0.145,"h":1.7},{"w":0.37,"d":0.12,"h":0.9}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 8.2, handling: 0.98,
    masts: [
      { id: 'fore', z: -0.24, height: 22.0, rig: 'square', squares: 3 },
      { id: 'main', z: 0.12, height: 20.1, rig: 'brigantine', squares: 1, span: 0.46 },
    ],
    headsails: 3, oars: false,
  },
  structure: { frameCount: 30, beamStation: .51, forebody: .94, aftbody: .98, foreTip: .004, aftTip: .09, bottomFlat: .32, bilge: .19, flare: .09, tumble: .10, sheer: 1.02, lowerMastRatio: .65, shroudPairs: 3, ratlines: 9, yardSpread: 1.02 },
});


import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { BRIGANTINE_ARCHITECTURE } from './architecture/layout.js';
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
const ARCHITECTURE = BRIGANTINE_ARCHITECTURE;

function applyMastArchitecture(design) {
  const stations = new Map(ARCHITECTURE.mastInstances.map(item => [item.id, item]));
  return {
    ...design,
    masts: design.masts.map(mast => {
      const station = stations.get(mast.id);
      if (!station) throw new Error('brigantine: no architecture station for mast ' + mast.id);
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

function assembleBrigantine(vessel, componentTransforms={}, savedState={}) {
  const design = applyMastArchitecture(vessel.design);
  const resolved = { ...vessel, design };
  const ctx = createShipContext(resolved, {"hull":7162162,"plank":9661254,"deck":11570274,"sail":15260868});
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
    if (typeof generate !== 'function') throw new Error('brigantine: missing assembly instruction ' + component);
    generate();
  }
  const root = finishShipModel(ctx,componentTransforms,savedState);
  root.userData.shipArchitecture = ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...ARCHITECTURE.assemblyOrder];
  return root;
}

export function createBrigantineModel(componentTransforms={},savedState={}) {
  const vessel = resolveVesselForGeneration(BrigantineDefinition);
  return assembleBrigantine(vessel,componentTransforms,savedState);
}
export function generateBrigantine(componentTransforms={},savedState={}) {
  return createBrigantineModel(componentTransforms,savedState);
}
export const Brigantine = Object.freeze({
  id: BrigantineDefinition.id,
  definition: BrigantineDefinition,
  design: BrigantineDefinition.design,
  structure: BrigantineDefinition.structure,
  editorModulePath: BrigantineDefinition.editorModulePath,
  architecture: ARCHITECTURE,
  createModel: createBrigantineModel,
  generate: generateBrigantine
});
export const id = Brigantine.id;
export const design = Brigantine.design;
export const structure = Brigantine.structure;
export const createModel = Brigantine.createModel;
export const generate = Brigantine.generate;
export default Brigantine;
