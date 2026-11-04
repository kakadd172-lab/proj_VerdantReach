import { freezeVesselSpec } from './freeze.js';

/**
 * brigantine — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Brigantine = freezeVesselSpec({
  id: 'brigantine',
  design: {
    id: 'brigantine', label: 'Brigantine', era: '18th–early 19th century',
    hullLength: 30.0, beam: 8.5, draft: 3.15, freeboard: 1.95,
    rig: 'Square foremast; mainmast with fore-and-aft sail and a square topsail.',
    hullProfile: 'Balanced single-deck hull with rounded bilges, compact counter and modest quarterdeck.',
    reference: 'Mercurio reconstruction (laid down 1805): approximately 30 m × 8.5 m; the museum describes a two-masted rig with square sails and a large trapezoidal sail.',
    sources: [{ label: 'Museo nazionale di archeologia del mare — Mercurio reconstruction', url: 'https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/' }],
    hull: { fullness: 0.68, entry: 0.62, stern: 'counter', sternWidth: 0.38, tumblehome: 0.11, sheer: 0.13, bowRise: 0.25, sternRise: 0.35, keelDepth: 0.12, deckCamber: 0.14 },
    sternwork: 'quarterdeck', bowwork: 'bowsprit', sailingSpeed: 8.2, handling: 0.98,
    masts: [
      { id: 'fore', z: -0.24, height: 22.0, rig: 'square', squares: 3 },
      { id: 'main', z: 0.12, height: 20.1, rig: 'brigantine', squares: 1, span: 0.46 },
    ],
    headsails: 3, oars: false,
  },
  structure: { frameCount: 30, beamStation: .51, forebody: .94, aftbody: .98, foreTip: .004, aftTip: .09, bottomFlat: .32, bilge: .19, flare: .09, tumble: .10, sheer: 1.02, lowerMastRatio: .65, shroudPairs: 3, ratlines: 9, yardSpread: 1.02 },
  generate(createShipModel) {
    return createShipModel('brigantine');
  },
});

export default Brigantine;
