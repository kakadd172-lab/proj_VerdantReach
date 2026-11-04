/**
 * cutter — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const CutterDefinition = defineVesselSpec({
  id: 'cutter',
  design: {
    id: 'cutter', label: 'Caribbean cutter', era: '18th century coastal service',
    hullLength: 16.8, beam: 5.1, draft: 2.0, freeboard: 1.35,
    rig: 'Single tall gaff mast with a large headsail spread from a long bowsprit.',
    hullProfile: 'Fine entry, full forefoot, low freeboard, compact counter stern.',
    reference: 'Representative cutter reconstruction; dimensions and mast height are game-design estimates for a period coastal vessel.',
    sources: [{ label: 'Royal Museums Greenwich — historical cutter collection records', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.6, entry: 0.72, stern: 'counter', sternWidth: 0.27, tumblehome: 0.04, sheer: 0.11, bowRise: 0.22, sternRise: 0.22, keelDepth: 0.08, deckCamber: 0.1 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'long-bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.6, handling: 1.42,
    masts: [{ id: 'single', z: -0.03, height: 16.1, rig: 'gaff', span: 0.5, squares: 0 }],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 21, beamStation: .47, forebody: .69, aftbody: 1.04, foreTip: .003, aftTip: .045, bottomFlat: .16, bilge: .09, flare: .17, tumble: .025, sheer: 1.14, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .96 },
  generate(createShipModel) {
    return createShipModel('cutter');
  },
});

export function createCutterModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(CutterDefinition, componentTransforms, savedState);
}
export function generateCutter(componentTransforms = {}, savedState = {}) {
  return createCutterModel(componentTransforms, savedState);
}
export const Cutter = Object.freeze({
  id: CutterDefinition.id,
  definition: CutterDefinition,
  design: CutterDefinition.design,
  structure: CutterDefinition.structure,
  editorModulePath: CutterDefinition.editorModulePath,
  createModel: createCutterModel,
  generate: generateCutter,
});
export const id = Cutter.id;
export const design = Cutter.design;
export const structure = Cutter.structure;
export const createModel = Cutter.createModel;
export const generate = Cutter.generate;
export default Cutter;
