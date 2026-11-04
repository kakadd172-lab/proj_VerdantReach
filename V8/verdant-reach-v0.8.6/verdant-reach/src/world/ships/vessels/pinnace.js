import { freezeVesselSpec } from './freeze.js';

/**
 * pinnace — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Pinnace = freezeVesselSpec({
  id: 'pinnace',
  design: {
    id: 'pinnace', label: 'Ship’s pinnace', era: '16th–18th century tender',
    hullLength: 9.2, beam: 2.65, draft: 0.72, freeboard: 0.72,
    rig: 'Open tender with rowing benches and a small removable lateen sail.',
    hullProfile: 'Open double-ended tender hull with fine ends, shallow draft and narrow beam.',
    reference: 'Dimensions are a game-design reconstruction for a generic ship’s pinnace; local pinnaces varied considerably.',
    sources: [{ label: 'Royal Museums Greenwich — maritime collection records and boat types', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.48, entry: 0.84, stern: 'double-ended', sternWidth: 0.06, tumblehome: 0.04, sheer: 0.06, bowRise: 0.12, sternRise: 0.12, keelDepth: 0.03, deckCamber: 0.05 },
    sternwork: 'open-boat', bowwork: 'open-bow', sailingSpeed: 4.6, handling: 1.52,
    masts: [{ id: 'single', z: -0.02, height: 7.2, rig: 'lateen', span: 0.3, squares: 0 }],
    headsails: 0, oars: true,
  },
  structure: { frameCount: 16, beamStation: .5, forebody: .84, aftbody: .85, foreTip: .002, aftTip: .004, bottomFlat: .18, bilge: .075, flare: .08, tumble: .035, sheer: .91, lowerMastRatio: .6, shroudPairs: 1, ratlines: 5, yardSpread: .74 },
  generate(createShipModel) {
    return createShipModel('pinnace');
  },
});

export default Pinnace;
