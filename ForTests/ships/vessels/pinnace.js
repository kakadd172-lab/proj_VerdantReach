/**
 * pinnace — standalone ForTests ship definition and generator.
 * Owns this vessel's dimensions, hull, structure, stern/bow details, rig plan
 * and generator entry points.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const PinnaceDefinition = defineVesselSpec({
  id: 'pinnace',
  design: {
    id: 'pinnace', label: 'Ship’s pinnace', era: '16th–18th century tender',
    hullLength: 9.2, beam: 2.65, draft: 0.72, freeboard: 0.72,
    rig: 'Open tender with rowing benches and a small removable lateen sail.',
    hullProfile: 'Open double-ended tender hull with fine ends, shallow draft and narrow beam.',
    reference: 'Dimensions are a game-design reconstruction for a generic ship’s pinnace; local pinnaces varied considerably.',
    sources: [{ label: 'Royal Museums Greenwich — maritime collection records and boat types', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.48, entry: 0.84, stern: 'double-ended', sternWidth: 0.06, tumblehome: 0.04, sheer: 0.06, bowRise: 0.12, sternRise: 0.12, keelDepth: 0.03, deckCamber: 0.05 },
    sternwork: 'open-boat',
    sternTiers: [], bowwork: 'open-bow',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 4.6, handling: 1.52,
    masts: [{ id: 'single', z: -0.02, height: 7.2, rig: 'lateen', span: 0.3, squares: 0 }],
    headsails: 0, oars: true,
  },
  structure: { frameCount: 16, beamStation: .5, forebody: .84, aftbody: .85, foreTip: .002, aftTip: .004, bottomFlat: .18, bilge: .075, flare: .08, tumble: .035, sheer: .91, lowerMastRatio: .6, shroudPairs: 1, ratlines: 5, yardSpread: .74 },
  generate(createShipModel) {
    return createShipModel('pinnace');
  },
});
export function createPinnaceModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(PinnaceDefinition, componentTransforms, savedState);
}
export function generatePinnace(componentTransforms = {}, savedState = {}) {
  return createPinnaceModel(componentTransforms, savedState);
}
export const Pinnace = Object.freeze({
  id:PinnaceDefinition.id, definition:PinnaceDefinition,
  design:PinnaceDefinition.design, structure:PinnaceDefinition.structure,
  editorModulePath:PinnaceDefinition.editorModulePath,
  createModel:createPinnaceModel, generate:generatePinnace,
});
export const id=Pinnace.id, design=Pinnace.design, structure=Pinnace.structure;
export const createModel=Pinnace.createModel, generate=Pinnace.generate;
export default Pinnace;
