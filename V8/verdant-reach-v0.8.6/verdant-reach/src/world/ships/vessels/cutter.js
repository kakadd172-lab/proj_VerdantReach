import { freezeVesselSpec } from './freeze.js';

/**
 * cutter — independent vessel specification and generator entry point.
 * Dimensions, hull form, rig and structural profile are defined here.
 * The generator delegates shared mesh construction to the common engine.
 */
export const Cutter = freezeVesselSpec({
  id: 'cutter',
  design: {
    id: 'cutter', label: 'Caribbean cutter', era: '18th century coastal service',
    hullLength: 16.8, beam: 5.1, draft: 2.0, freeboard: 1.35,
    rig: 'Single tall gaff mast with a large headsail spread from a long bowsprit.',
    hullProfile: 'Fine entry, full forefoot, low freeboard, compact counter stern.',
    reference: 'Representative cutter reconstruction; dimensions and mast height are game-design estimates for a period coastal vessel.',
    sources: [{ label: 'Royal Museums Greenwich — historical cutter collection records', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.6, entry: 0.72, stern: 'counter', sternWidth: 0.27, tumblehome: 0.04, sheer: 0.11, bowRise: 0.22, sternRise: 0.22, keelDepth: 0.08, deckCamber: 0.1 },
    sternwork: 'low-cabin', bowwork: 'long-bowsprit', sailingSpeed: 9.6, handling: 1.42,
    masts: [{ id: 'single', z: -0.03, height: 16.1, rig: 'gaff', span: 0.5, squares: 0 }],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 21, beamStation: .47, forebody: .69, aftbody: 1.04, foreTip: .003, aftTip: .045, bottomFlat: .16, bilge: .09, flare: .17, tumble: .025, sheer: 1.14, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .96 },
  generate(createShipModel) {
    return createShipModel('cutter');
  },
});

export default Cutter;
