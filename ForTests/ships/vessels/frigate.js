/**
 * frigate — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const FrigateDefinition = defineVesselSpec({
  id: 'frigate',
  design: {
    id: 'frigate', label: '18th-century frigate', era: '18th century',
    hullLength: 31.0, beam: 6.9, draft: 3.5, freeboard: 2.05,
    rig: 'Three full-rigged masts; low continuous upper profile rather than tall end-castles.',
    hullProfile: 'Long fine hull, low quarterdeck, pronounced tumblehome and restrained stern gallery.',
    reference: 'La Renommée (1744) model dimensions: 31.0 m × 6.9 m; three-masted full-rigged arrangement follows the German Historical Museum summary.',
    sources: [{ label: 'Deutsches Historisches Museum — Frigate', url: 'https://www.dhm.de/mediathek/en/web/ship-types/milestones-in-the-history-of-european-shipbuilding/12-frigate/' }],
    hull: { fullness: 0.62, entry: 0.78, stern: 'counter', sternWidth: 0.3, tumblehome: 0.17, sheer: 0.09, bowRise: 0.21, sternRise: 0.18, keelDepth: 0.1, deckCamber: 0.12 },
    sternwork: 'low-quarter',
    sternTiers: [{"w":0.48,"d":0.14,"h":1.2},{"w":0.35,"d":0.1,"h":0.6}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.2, handling: 0.76,
    masts: [
      { id: 'fore', z: -0.29, height: 28.2, rig: 'square', squares: 3 },
      { id: 'main', z: -0.015, height: 31.0, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.28, height: 25.3, rig: 'square', squares: 2, spanker: true },
    ],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 36, beamStation: .52, forebody: 1.13, aftbody: 1.14, foreTip: .002, aftTip: .08, bottomFlat: .22, bilge: .11, flare: .05, tumble: .19, sheer: .9, lowerMastRatio: .66, shroudPairs: 4, ratlines: 11, yardSpread: 1.08 },
  generate(createShipModel) {
    return createShipModel('frigate');
  },
});

export function createFrigateModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(FrigateDefinition, componentTransforms, savedState);
}
export function generateFrigate(componentTransforms = {}, savedState = {}) {
  return createFrigateModel(componentTransforms, savedState);
}
export const Frigate = Object.freeze({
  id: FrigateDefinition.id,
  definition: FrigateDefinition,
  design: FrigateDefinition.design,
  structure: FrigateDefinition.structure,
  editorModulePath: FrigateDefinition.editorModulePath,
  createModel: createFrigateModel,
  generate: generateFrigate,
});
export const id = Frigate.id;
export const design = Frigate.design;
export const structure = Frigate.structure;
export const createModel = Frigate.createModel;
export const generate = Frigate.generate;
export default Frigate;
