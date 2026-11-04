import { freezeVesselSpec } from './freeze.js';

/**
 * snow — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Snow = freezeVesselSpec({
  id: 'snow',
  design: {
    id: 'snow', label: 'Snow brig', era: '18th century', primaryMastCount: 2,
    hullLength: 28.5, beam: 7.8, draft: 3.0, freeboard: 1.8,
    rig: 'Square fore and main; a separate trysail mast sits immediately abaft the mainmast.',
    hullProfile: 'Compact two-masted working hull with a rounded bow and low counter stern.',
    reference: 'Dimensions are a representative game reconstruction; the defining snow-mast and trysail arrangement follows the Society for Nautical Research description.',
    sources: [{ label: 'Society for Nautical Research — The Snow', url: 'https://snr.org.uk/snow/' }],
    hull: { fullness: 0.67, entry: 0.66, stern: 'counter', sternWidth: 0.32, tumblehome: 0.1, sheer: 0.12, bowRise: 0.24, sternRise: 0.28, keelDepth: 0.12, deckCamber: 0.14 },
    sternwork: 'quarterdeck', bowwork: 'bowsprit', sailingSpeed: 7.2, handling: 0.88,
    masts: [
      { id: 'fore', z: -0.24, height: 21.0, rig: 'square', squares: 3 },
      { id: 'main', z: 0.075, height: 22.4, rig: 'square', squares: 3 },
      { id: 'trysail', z: 0.11, height: 16.2, rig: 'trysail', span: 0.31, auxiliary: true },
    ],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 28, beamStation: .50, forebody: .91, aftbody: 1.08, foreTip: .004, aftTip: .07, bottomFlat: .29, bilge: .17, flare: .1, tumble: .09, sheer: 1.04, lowerMastRatio: .64, shroudPairs: 3, ratlines: 9, yardSpread: .98 },
  generate(createShipModel) {
    return createShipModel('snow');
  },
});

export default Snow;
