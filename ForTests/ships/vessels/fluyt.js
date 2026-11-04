/**
 * fluyt — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const FluytDefinition = defineVesselSpec({
  id: 'fluyt',
  design: {
    id: 'fluyt', label: 'Dutch fluyt merchantman', era: '17th century Atlantic trade',
    hullLength: 30.7, beam: 7.2, draft: 2.5, freeboard: 1.75,
    rig: 'Two masts: a square-rigged mainmast and a lateen mizzen, with a spritsail; rig details varied by period.',
    hullProfile: 'Bulbous capacious lower hull, pinched-in upper deck, round stern and no high forecastle.',
    reference: 'Zeehaen (1639) model: 30.7 m × 7.2 m; the German Historical Museum notes a long, shallow-draft, bulbous hull narrowing toward the deck.',
    sources: [{ label: 'Deutsches Historisches Museum — Fluyt', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/09-fluyt/' }, { label: 'The Mariners’ Museum — Fluit cargo vessel', url: 'https://exploration.marinersmuseum.org/watercraft/fluit/' }],
    hull: { fullness: 0.96, entry: 0.5, stern: 'round', sternWidth: 0.26, tumblehome: 0.25, sheer: 0.08, bowRise: 0.18, sternRise: 0.17, keelDepth: 0.04, deckCamber: 0.12 },
    sternwork: 'fluyt-roundhouse',
    sternTiers: [{"w":0.52,"d":0.15,"h":1.55},{"w":0.35,"d":0.12,"h":0.85}], bowwork: 'spritsail-platform',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 5.8, handling: 0.62,
    masts: [
      { id: 'main', z: -0.055, height: 22.5, rig: 'square', squares: 2 },
      { id: 'mizzen', z: 0.29, height: 15.4, rig: 'lateen', span: 0.26, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 34, beamStation: .54, forebody: .68, aftbody: .75, foreTip: .01, aftTip: .08, bottomFlat: .51, bilge: .36, flare: .035, tumble: .27, sheer: .82, lowerMastRatio: .65, shroudPairs: 2, ratlines: 9, yardSpread: .94 },
  generate(createShipModel) {
    return createShipModel('fluyt');
  },
});

export function createFluytModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(FluytDefinition, componentTransforms, savedState);
}
export function generateFluyt(componentTransforms = {}, savedState = {}) {
  return createFluytModel(componentTransforms, savedState);
}
export const Fluyt = Object.freeze({
  id: FluytDefinition.id,
  definition: FluytDefinition,
  design: FluytDefinition.design,
  structure: FluytDefinition.structure,
  editorModulePath: FluytDefinition.editorModulePath,
  createModel: createFluytModel,
  generate: generateFluyt,
});
export const id = Fluyt.id;
export const design = Fluyt.design;
export const structure = Fluyt.structure;
export const createModel = Fluyt.createModel;
export const generate = Fluyt.generate;
export default Fluyt;
