import { freezeVesselSpec } from './freeze.js';

/**
 * frigate — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Frigate = freezeVesselSpec({
  id: 'frigate',
  design: {
    id: 'frigate', label: '18th-century frigate', era: '18th century',
    hullLength: 31.0, beam: 6.9, draft: 3.5, freeboard: 2.05,
    rig: 'Three full-rigged masts; low continuous upper profile rather than tall end-castles.',
    hullProfile: 'Long fine hull, low quarterdeck, pronounced tumblehome and restrained stern gallery.',
    reference: 'La Renommée (1744) model dimensions: 31.0 m × 6.9 m; three-masted full-rigged arrangement follows the German Historical Museum summary.',
    sources: [{ label: 'Deutsches Historisches Museum — Frigate', url: 'https://www.dhm.de/mediathek/en/web/ship-types/milestones-in-the-history-of-european-shipbuilding/12-frigate/' }],
    hull: { fullness: 0.62, entry: 0.78, stern: 'counter', sternWidth: 0.3, tumblehome: 0.17, sheer: 0.09, bowRise: 0.21, sternRise: 0.18, keelDepth: 0.1, deckCamber: 0.12 },
    sternwork: 'low-quarter', bowwork: 'bowsprit', sailingSpeed: 9.2, handling: 0.76,
    masts: [
      { id: 'fore', z: -0.29, height: 28.2, rig: 'square', squares: 3 },
      { id: 'main', z: -0.015, height: 31.0, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.28, height: 25.3, rig: 'square', squares: 2, spanker: true },
    ],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 36, beamStation: .52, forebody: 1.13, aftbody: 1.14, foreTip: .002, aftTip: .08, bottomFlat: .22, bilge: .11, flare: .05, tumble: .19, sheer: .9, lowerMastRatio: .66, shroudPairs: 4, ratlines: 11, yardSpread: 1.08 },
  generate(createShipModel) {
    return createShipModel('frigate');
  },
});

export default Frigate;
