/**
 * carrack — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const CarrackDefinition = defineVesselSpec({
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
  generate(createShipModel) {
    return createShipModel('carrack');
  },
});

export function createCarrackModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(CarrackDefinition, componentTransforms, savedState);
}
export function generateCarrack(componentTransforms = {}, savedState = {}) {
  return createCarrackModel(componentTransforms, savedState);
}
export const Carrack = Object.freeze({
  id: CarrackDefinition.id,
  definition: CarrackDefinition,
  design: CarrackDefinition.design,
  structure: CarrackDefinition.structure,
  editorModulePath: CarrackDefinition.editorModulePath,
  createModel: createCarrackModel,
  generate: generateCarrack,
});
export const id = Carrack.id;
export const design = Carrack.design;
export const structure = Carrack.structure;
export const createModel = Carrack.createModel;
export const generate = Carrack.generate;
export default Carrack;
