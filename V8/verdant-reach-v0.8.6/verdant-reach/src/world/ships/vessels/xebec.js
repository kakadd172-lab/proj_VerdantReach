import { freezeVesselSpec } from './freeze.js';

/**
 * xebec — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Xebec = freezeVesselSpec({
  id: 'xebec',
  design: {
    id: 'xebec', label: 'Mediterranean xebec', era: '17th–18th century; uncommon Atlantic visitor',
    hullLength: 27.0, beam: 6.2, draft: 2.15, freeboard: 1.15,
    rig: 'Three long lateen yards; low profile and optional banks of oars.',
    hullProfile: 'Very slender shallow-water hull, overhanging beak, low freeboard and projecting stern platform.',
    reference: 'Dimensions are a game-design estimate. The Channel Islands Maritime Museum documents the narrow hull, projecting head and stern platform, and usual three-lateen-mast family.',
    sources: [{ label: 'Channel Islands Maritime Museum — L’Indiscret xebec', url: 'https://maritime-museum.org/north-gallery/lindiscret-xebec/' }],
    hull: { fullness: 0.48, entry: 0.9, stern: 'counter', sternWidth: 0.22, tumblehome: 0.0, sheer: 0.06, bowRise: 0.18, sternRise: 0.14, keelDepth: 0.02, deckCamber: 0.08 },
    sternwork: 'xebec-platform', bowwork: 'long-beak', sailingSpeed: 9.2, handling: 1.16,
    masts: [
      { id: 'fore', z: -0.3, height: 17.0, rig: 'lateen', span: 0.46, squares: 0 },
      { id: 'main', z: -0.015, height: 20.0, rig: 'lateen', span: 0.52, squares: 0 },
      { id: 'mizzen', z: 0.28, height: 15.5, rig: 'lateen', span: 0.38, squares: 0 },
    ],
    headsails: 0, oars: true,
  },
  structure: { frameCount: 30, beamStation: .49, forebody: 1.3, aftbody: 1.18, foreTip: .001, aftTip: .025, bottomFlat: .11, bilge: .055, flare: .045, tumble: .005, sheer: .78, lowerMastRatio: .58, shroudPairs: 2, ratlines: 7, yardSpread: 1.13 },
  generate(createShipModel) {
    return createShipModel('xebec');
  },
});

export default Xebec;
