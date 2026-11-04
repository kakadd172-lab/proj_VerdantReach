import { freezeVesselSpec } from './freeze.js';

/**
 * brig — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Brig = freezeVesselSpec({
  id: 'brig',
  design: {
    id: 'brig', label: 'Full-rigged brig', era: 'Late 18th–early 19th century',
    hullLength: 33.7, beam: 9.75, draft: 3.7, freeboard: 2.0,
    rig: 'Two square-rigged masts, with staysails and a spanker aft.',
    hullProfile: 'Deep working hull, rounded floor, transom counter and raised quarterdeck.',
    reference: 'Representative size envelope informed by documented early-19th-century brigs; USS Niagara dimensions are 33.7 m LBP × 9.8 m beam.',
    sources: [{ label: 'Tall Ship Guide — USS Niagara brig dimensions', url: 'https://classic-sailing.com/wp-content/uploads/2021/03/Tall-Ship-Guide-Online-Version-22-03-2021.pdf' }],
    hull: { fullness: 0.7, entry: 0.65, stern: 'counter', sternWidth: 0.36, tumblehome: 0.1, sheer: 0.14, bowRise: 0.3, sternRise: 0.3, keelDepth: 0.13, deckCamber: 0.16 },
    sternwork: 'quarterdeck', bowwork: 'bowsprit', sailingSpeed: 7.4, handling: 0.86,
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

export default Brig;
