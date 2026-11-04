import { freezeVesselSpec } from './freeze.js';

/**
 * fluyt — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Fluyt = freezeVesselSpec({
  id: 'fluyt',
  design: {
    id: 'fluyt', label: 'Dutch fluyt merchantman', era: '17th century Atlantic trade',
    hullLength: 30.7, beam: 7.2, draft: 2.5, freeboard: 1.75,
    rig: 'Two masts: a square-rigged mainmast and a lateen mizzen, with a spritsail; rig details varied by period.',
    hullProfile: 'Bulbous capacious lower hull, pinched-in upper deck, round stern and no high forecastle.',
    reference: 'Zeehaen (1639) model: 30.7 m × 7.2 m; the German Historical Museum notes a long, shallow-draft, bulbous hull narrowing toward the deck.',
    sources: [{ label: 'Deutsches Historisches Museum — Fluyt', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/09-fluyt/' }, { label: 'The Mariners’ Museum — Fluit cargo vessel', url: 'https://exploration.marinersmuseum.org/watercraft/fluit/' }],
    hull: { fullness: 0.96, entry: 0.5, stern: 'round', sternWidth: 0.26, tumblehome: 0.25, sheer: 0.08, bowRise: 0.18, sternRise: 0.17, keelDepth: 0.04, deckCamber: 0.12 },
    sternwork: 'fluyt-roundhouse', bowwork: 'spritsail-platform', sailingSpeed: 5.8, handling: 0.62,
    masts: [
      { id: 'main', z: -0.055, height: 22.5, rig: 'square', squares: 2 },
      { id: 'mizzen', z: 0.29, height: 15.4, rig: 'lateen', span: 0.26, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 34, beamStation: .54, forebody: .68, aftbody: .75, foreTip: .01, aftTip: .08, bottomFlat: .51, bilge: .36, flare: .035, tumble: .27, sheer: .82, lowerMastRatio: .65, shroudPairs: 2, ratlines: 9, yardSpread: .94 },
  generate(createShipModel) {
    return createShipModel('fluyt');
  },
});

export default Fluyt;
