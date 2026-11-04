import { freezeVesselSpec } from './freeze.js';

/**
 * caravel — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Caravel = freezeVesselSpec({
  id: 'caravel',
  design: {
    id: 'caravel', label: 'Atlantic caravel redonda', era: '15th–16th century',
    hullLength: 20.5, beam: 7.0, draft: 2.4, freeboard: 1.6,
    rig: 'Three masts: square foremast with lateen sails aft; lateen-only variants also existed.',
    hullProfile: 'Rounded carvel-built hull, deep bow flare, modest freeboard and narrow transom.',
    reference: 'Caravel c. 1450 model at the German Historical Museum: 20.5 m × 7.0 m. The museum describes two- or three-mast variants with square fore and lateen aft sails.',
    sources: [{ label: 'Deutsches Historisches Museum — Caravel', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/05-caravel/' }, { label: 'The Mariners’ Museum — Caravel', url: 'https://exploration.marinersmuseum.org/watercraft/caravel/' }],
    hull: { fullness: 0.65, entry: 0.6, stern: 'round', sternWidth: 0.18, tumblehome: 0.08, sheer: 0.15, bowRise: 0.34, sternRise: 0.24, keelDepth: 0.14, deckCamber: 0.14 },
    sternwork: 'quarterdeck', bowwork: 'short-bowsprit', sailingSpeed: 8.5, handling: 1.08,
    masts: [
      { id: 'fore', z: -0.29, height: 15.9, rig: 'square', squares: 2 },
      { id: 'main', z: -0.015, height: 18.2, rig: 'lateen', span: 0.46, squares: 0 },
      { id: 'mizzen', z: 0.28, height: 14.4, rig: 'lateen', span: 0.38, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 26, beamStation: .49, forebody: .82, aftbody: 1.22, foreTip: .003, aftTip: .035, bottomFlat: .16, bilge: .1, flare: .18, tumble: .075, sheer: 1.2, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .92 },
  generate(createShipModel) {
    return createShipModel('caravel');
  },
});

export default Caravel;
