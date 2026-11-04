/**
 * barque — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const BarqueDefinition = defineVesselSpec({
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
  generate(createShipModel) {
    return createShipModel('barque');
  },
});

export function createBarqueModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(BarqueDefinition, componentTransforms, savedState);
}
export function generateBarque(componentTransforms = {}, savedState = {}) {
  return createBarqueModel(componentTransforms, savedState);
}
export const Barque = Object.freeze({
  id: BarqueDefinition.id,
  definition: BarqueDefinition,
  design: BarqueDefinition.design,
  structure: BarqueDefinition.structure,
  editorModulePath: BarqueDefinition.editorModulePath,
  createModel: createBarqueModel,
  generate: generateBarque,
});
export const id = Barque.id;
export const design = Barque.design;
export const structure = Barque.structure;
export const createModel = Barque.createModel;
export const generate = Barque.generate;
export default Barque;
