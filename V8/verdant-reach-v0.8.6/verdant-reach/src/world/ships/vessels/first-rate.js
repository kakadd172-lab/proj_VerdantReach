import { freezeVesselSpec } from './freeze.js';

/**
 * first-rate — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const FirstRate = freezeVesselSpec({
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
    sternwork: 'first-rate-aftercastle', bowwork: 'bowsprit', sailingSpeed: 8.1, handling: 0.42,
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

export default FirstRate;
