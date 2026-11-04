import { freezeVesselSpec } from './freeze.js';

/**
 * sloop — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Sloop = freezeVesselSpec({
  id: 'sloop',
  design: {
    id: 'sloop', label: 'Caribbean merchant sloop', era: 'Late 17th–18th century Caribbean',
    hullLength: 17.22, beam: 4.34, draft: 1.9, freeboard: 1.35,
    rig: 'Single gaff mainsail with headsails; local rigs varied by island and decade.',
    hullProfile: 'Fine entry, moderately full working body, low quarter, shallow-to-moderate draft.',
    reference: 'Reader’s Point, Jamaica: surviving hull length 17.22 m and maximum beam 4.34 m; original rig is not preserved, so the single-mast sail plan is a regional reconstruction.',
    sources: [
      { label: 'Texas A&M — Reader’s Point Jamaican merchant sloop', url: 'https://oaktrust.library.tamu.edu/items/bfbc382b-2aea-4705-bf65-67e97ec2b87b' },
      { label: 'Cambridge — Caribbean sloops in Atlantic material culture', url: 'https://www.cambridge.org/core/books/an-archaeology-of-the-english-atlantic-world-1600-1700/atlantic-material-culture-boats-ships-and-navigation/6936CAA998793EDC9005054893D500F5' },
    ],
    hull: { fullness: 0.58, entry: 0.68, stern: 'counter', sternWidth: 0.3, tumblehome: 0.04, sheer: 0.12, bowRise: 0.3, sternRise: 0.26, keelDepth: 0.12, deckCamber: 0.12 },
    sternwork: 'low-cabin', bowwork: 'bowsprit', sailingSpeed: 9.0, handling: 1.35,
    masts: [{ id: 'single', z: -0.035, height: 13.8, rig: 'gaff', span: 0.42, squares: 0 }],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 22, beamStation: .49, forebody: .76, aftbody: 1.02, foreTip: .008, aftTip: .055, bottomFlat: .21, bilge: .12, flare: .12, tumble: .035, sheer: 1.08, lowerMastRatio: .64, shroudPairs: 2, ratlines: 8, yardSpread: .94 },
  generate(createShipModel) {
    return createShipModel('sloop');
  },
});

export default Sloop;
