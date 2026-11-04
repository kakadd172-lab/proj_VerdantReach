import { freezeVesselSpec } from './freeze.js';

/**
 * schooner — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Schooner = freezeVesselSpec({
  id: 'schooner',
  design: {
    id: 'schooner', label: 'West Indies schooner', era: 'Late 18th century',
    hullLength: 22.17, beam: 6.30, draft: 2.25, freeboard: 1.48,
    rig: 'Two fore-and-aft gaff masts with staysails; a fast, manageable trading rig.',
    hullProfile: 'Long working hull, fine bow, modest counter stern and low deckhouse.',
    reference: 'Smithsonian HMS Berbice record: typical late-18th-century schooner 72 ft 9 in × 20 ft 8 in (22.17 × 6.30 m).',
    sources: [{ label: 'Smithsonian — Schooner HMS Berbice', url: 'https://collections.si.edu/search/detail/edanmdm%3Anmah_844171?print=yes' }],
    hull: { fullness: 0.56, entry: 0.74, stern: 'counter', sternWidth: 0.31, tumblehome: 0.07, sheer: 0.1, bowRise: 0.22, sternRise: 0.24, keelDepth: 0.08, deckCamber: 0.1 },
    sternwork: 'low-cabin', bowwork: 'bowsprit', sailingSpeed: 9.5, handling: 1.24,
    masts: [
      { id: 'fore', z: -0.22, height: 17.0, rig: 'gaff', span: 0.36, squares: 0 },
      { id: 'main', z: 0.13, height: 19.3, rig: 'gaff', span: 0.42, squares: 0 },
    ],
    headsails: 3, oars: false,
  },
  structure: { frameCount: 26, beamStation: .48, forebody: .72, aftbody: .96, foreTip: .006, aftTip: .075, bottomFlat: .18, bilge: .11, flare: .15, tumble: .06, sheer: 1.0, lowerMastRatio: .62, shroudPairs: 2, ratlines: 9, yardSpread: .92 },
  generate(createShipModel) {
    return createShipModel('schooner');
  },
});

export default Schooner;
