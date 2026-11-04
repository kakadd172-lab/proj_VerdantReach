/**
 * first-rate — standalone ForTests ship definition and generator.
 * Owns this vessel's dimensions, hull, structure, stern/bow details, rig plan
 * and generator entry points.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const FirstRateDefinition = defineVesselSpec({
  id: 'first-rate',
  design: {
    id: 'first-rate', label: 'First-rate ship of the line', era: 'Late 18th century reference form',
    hullLength: 56.73, beam: 15.79, draft: 5.9, freeboard: 3.05,
    rig: 'Three very tall square-rigged masts with a full course, topsail and topgallant sequence.',
    hullProfile: 'Very long, deep three-deck hull with a fine entrance, full central body, pronounced sheer and stepped stern.',
    reference: 'HMS Victory is the dimensional anchor: the model uses the 186 ft (56.73 m) gun-deck length and 52 ft (15.79 m) extreme breadth. The 151 ft keel length is a separate measure; 227 ft (about 68.88 m) overall length is a reasonableness check including the projecting bow. Draft, freeboard, mast heights and detailed hull offsets are reconstruction estimates.',
    sources: [
      { label: 'The Mariners’ Museum — HMS Victory gun-deck and keel dimensions', url: 'https://catalogs.marinersmuseum.org/object/CL13073' },
      { label: 'Guinness World Records — HMS Victory breadth and overall length', url: 'https://www.guinnessworldrecords.com/world-records/62817-widest-sailing-ship-in-service' },
      { label: 'National Historic Ships — HMS Victory overall dimensions', url: 'https://www.nationalhistoricships.org.uk/register/499/hms-victory' },
    ],
    hull: { fullness: 0.78, entry: 0.82, stern: 'transom', sternWidth: 0.38, tumblehome: 0.17, sheer: 0.11, bowRise: 0.25, sternRise: 0.30, keelDepth: 0.14, deckCamber: 0.17 },
    sternwork: 'first-rate-aftercastle',
    sternTiers: [{"w":0.57,"d":0.17,"h":2.2},{"w":0.47,"d":0.145,"h":1.65},{"w":0.35,"d":0.12,"h":1.35}], bowwork: 'bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 8.1, handling: 0.42,
    masts: [
      { id: 'fore', z: -0.30, height: 43.5, rig: 'square', squares: 3 },
      { id: 'main', z: -0.02, height: 48.5, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 40.0, rig: 'square', squares: 2, spanker: true },
    ],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 42, beamStation: .52, forebody: 1.08, aftbody: 1.04, foreTip: .002, aftTip: .095, bottomFlat: .32, bilge: .2, flare: .07, tumble: .17, sheer: .95, lowerMastRatio: .66, shroudPairs: 5, ratlines: 12, yardSpread: 1.1 },
  generate(createShipModel) {
    return createShipModel('first-rate');
  },
});
export function createFirstRateModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(FirstRateDefinition, componentTransforms, savedState);
}
export function generateFirstRate(componentTransforms = {}, savedState = {}) {
  return createFirstRateModel(componentTransforms, savedState);
}
export const FirstRate = Object.freeze({
  id:FirstRateDefinition.id, definition:FirstRateDefinition,
  design:FirstRateDefinition.design, structure:FirstRateDefinition.structure,
  editorModulePath:FirstRateDefinition.editorModulePath,
  createModel:createFirstRateModel, generate:generateFirstRate,
});
export const id=FirstRate.id, design=FirstRate.design, structure=FirstRate.structure;
export const createModel=FirstRate.createModel, generate=FirstRate.generate;
export default FirstRate;
