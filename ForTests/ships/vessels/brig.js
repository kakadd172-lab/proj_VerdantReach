/**
 * brig — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const BrigDefinition = defineVesselSpec({
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
  generate(createShipModel) {
    return createShipModel('brig');
  },
});

export function createBrigModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(BrigDefinition, componentTransforms, savedState);
}
export function generateBrig(componentTransforms = {}, savedState = {}) {
  return createBrigModel(componentTransforms, savedState);
}
export const Brig = Object.freeze({
  id: BrigDefinition.id,
  definition: BrigDefinition,
  design: BrigDefinition.design,
  structure: BrigDefinition.structure,
  editorModulePath: BrigDefinition.editorModulePath,
  createModel: createBrigModel,
  generate: generateBrig,
});
export const id = Brig.id;
export const design = Brig.design;
export const structure = Brig.structure;
export const createModel = Brig.createModel;
export const generate = Brig.generate;
export default Brig;
