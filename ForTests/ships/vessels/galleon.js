/**
 * galleon — standalone ForTests ship definition and generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, createVesselModel } from '../shared/vessel-definition.js';

export const GalleonDefinition = defineVesselSpec({
  id: 'galleon',
  design: {
    id: 'galleon', label: 'Iberian merchant galleon', era: '16th–17th century',
    hullLength: 30.5, beam: 10.0, draft: 4.1, freeboard: 2.25,
    rig: 'Three masts: square fore and main, lateen mizzen, bowsprit and spritsail.',
    hullProfile: 'Elongated ocean hull, lowered forecastle, pronounced beakhead and stepped sterncastle.',
    reference: 'Santa Maria del Pilar (c. 1535) reference: 30.5 m × 10 m. San Salvador replica measurements provide a second three-mast early-galleon comparison.',
    sources: [{ label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' }, { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' }, { label: 'Maritime Museum of San Diego — San Salvador dimensions and sail plan', url: 'https://sdmaritime.org/visit/the-ships/san-salvador/' }],
    hull: { fullness: 0.78, entry: 0.63, stern: 'transom', sternWidth: 0.38, tumblehome: 0.12, sheer: 0.16, bowRise: 0.31, sternRise: 0.48, keelDepth: 0.13, deckCamber: 0.16 },
    sternwork: 'galleon-castle',
    sternTiers: [{"w":0.58,"d":0.16,"h":2.15},{"w":0.44,"d":0.135,"h":1.55},{"w":0.32,"d":0.11,"h":1.2}], bowwork: 'beakhead',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 6.2, handling: 0.58,
    masts: [
      { id: 'fore', z: -0.28, height: 22.0, rig: 'square', squares: 3 },
      { id: 'main', z: -0.025, height: 25.1, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 17.0, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 36, beamStation: .51, forebody: .86, aftbody: .91, foreTip: .003, aftTip: .14, bottomFlat: .39, bilge: .24, flare: .12, tumble: .12, sheer: 1.2, lowerMastRatio: .64, shroudPairs: 3, ratlines: 10, yardSpread: 1.04 },
  generate(createShipModel) {
    return createShipModel('galleon');
  },
});

export function createGalleonModel(componentTransforms = {}, savedState = {}) {
  return createVesselModel(GalleonDefinition, componentTransforms, savedState);
}
export function generateGalleon(componentTransforms = {}, savedState = {}) {
  return createGalleonModel(componentTransforms, savedState);
}
export const Galleon = Object.freeze({
  id: GalleonDefinition.id,
  definition: GalleonDefinition,
  design: GalleonDefinition.design,
  structure: GalleonDefinition.structure,
  editorModulePath: GalleonDefinition.editorModulePath,
  createModel: createGalleonModel,
  generate: generateGalleon,
});
export const id = Galleon.id;
export const design = Galleon.design;
export const structure = Galleon.structure;
export const createModel = Galleon.createModel;
export const generate = Galleon.generate;
export default Galleon;
