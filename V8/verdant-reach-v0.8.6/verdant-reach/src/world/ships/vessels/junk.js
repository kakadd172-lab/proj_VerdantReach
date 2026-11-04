import { freezeVesselSpec } from './freeze.js';

/**
 * junk — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Junk = freezeVesselSpec({
  id: 'junk',
  design: {
    id: 'junk', label: 'Chinese ocean junk', era: 'Historically varied; broad reference model',
    hullLength: 34.0, beam: 8.8, draft: 2.45, freeboard: 2.15,
    rig: 'Three heavy, largely unstayed masts with broad battened lug sails and independent sheet groups.',
    hullProfile: 'Broad, comparatively flat-bottomed hull with rocker, high bow and stern, and overhanging upper works.',
    reference: 'Original Verdant Reach reconstruction inspired by the Chinese Junk added to the reference game. The three-mast rig and hull family are supported by museum models; 34.0 × 8.8 m is a game-scale estimate, not a measurement of the game vessel.',
    sources: [
      { label: 'Royal Museums Greenwich — Chinese pole junk model', url: 'https://www.rmg.co.uk/collections/objects/rmgc-object-68643' },
      { label: 'Channel Islands Maritime Museum — Chinese Junk', url: 'https://maritime-museum.org/north-gallery/chinese-junk/' },
      { label: 'App Store — The Pirate: Plague of the Dead version history', url: 'https://apps.apple.com/in/app/the-pirate-plague-of-the-dead/id1242811938' },
    ],
    hull: { fullness: 0.84, entry: 0.52, stern: 'transom', sternWidth: 0.46, tumblehome: 0.035, sheer: 0.19, bowRise: 0.48, sternRise: 0.42, keelDepth: 0.045, deckCamber: 0.085 },
    sternwork: 'low-cabin', bowwork: 'none', sailingSpeed: 7.4, handling: 0.84,
    masts: [
      { id: 'fore', z: -0.29, height: 20.5, rig: 'junk', span: 0.72 },
      { id: 'main', z: -0.015, height: 24.2, rig: 'junk', span: 0.78 },
      { id: 'mizzen', z: 0.29, height: 18.2, rig: 'junk', span: 0.66 },
    ],
    headsails: 0, oars: false,
  },
  structure: { frameCount: 32, beamStation: .5, forebody: .82, aftbody: .84, foreTip: .08, aftTip: .12, bottomFlat: .62, bilge: .09, flare: .035, tumble: .015, sheer: 1.24, lowerMastRatio: .7, shroudPairs: 0, ratlines: 0, yardSpread: 1.02 },
  generate(createShipModel) {
    return createShipModel('junk');
  },
});

export default Junk;
