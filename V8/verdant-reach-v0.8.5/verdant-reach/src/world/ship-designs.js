/**
 * Caribbean / Atlantic Age-of-Sail vessel catalogue for Verdant Reach v0.8.
 *
 * Dimensions are hull length / maximum beam / loaded draft in metres. Where a
 * museum or archaeological record supplies dimensions, it is named in the
 * reference field. Missing dimensions and rig heights are labelled as
 * reconstruction estimates; class names alone do not imply one universal plan.
 *
 * The game avatar is about 2.4 world units tall. A world unit represents
 * 0.75 m, so 1 real metre = 4/3 game units. This keeps hull dimensions and
 * the player standing on deck in a consistent scale.
 */
import { getShipStructureBlueprint } from './ship-structures.js?v=0.8.5';

export const WORLD_UNITS_PER_METRE = 4 / 3;

const basePartNames = Object.freeze([
  'hull', 'hull-strakes', 'deck', 'deck-planks', 'keel', 'stem', 'sternworks',
  'stern-gallery', 'stern-windows', 'bowworks', 'bowsprit', 'rudder', 'helm', 'helm-wheel',
  'anchors', 'anchor-port', 'anchor-starboard', 'anchor-chain-port', 'anchor-chain-starboard',
  'railings', 'railings-port', 'railings-starboard', 'head-sails', 'deck-fittings',
]);

function freezeDesign(data) {
  const structure = getShipStructureBlueprint(data.id);
  const frameNames = Array.from({ length: structure?.frameCount ?? 0 }, (_, index) => `frame-${String(index + 1).padStart(2, '0')}`);
  const mastPartNames = data.masts.flatMap((mast) => {
    const id = mast.id;
    const names = [
      'mast-' + id, 'mast-lower-' + id, 'mast-topmast-' + id, 'mast-step-' + id,
      'running-rigging-' + id,
    ];
    if (mast.rig === 'junk') {
      names.push('junk-yard-' + id, 'junk-battens-' + id, 'junk-sheets-' + id, 'sail-' + id + '-junk', 'cloth-sail-' + id + '-junk');
      for (let batten = 1; batten <= 7; batten += 1) names.push('batten-' + id + '-' + batten);
      return names;
    }
    names.push('standing-rigging-' + id, 'shrouds-' + id, 'ratlines-' + id, 'mast-stays-' + id, 'running-braces-' + id);
    if (mast.rig === 'square' || mast.rig === 'brigantine') names.push('mast-platform-' + id);
    if (mast.rig === 'square') {
      ['course', 'topsail', 'topgallant'].slice(0, mast.squares ?? 2).forEach((level) => {
        names.push('yard-' + id + '-' + level, 'sail-' + id + '-' + level, 'cloth-sail-' + id + '-' + level, 'sheets-' + id + '-' + level);
      });
    } else if (mast.rig === 'brigantine') {
      names.push('gaff-spar-' + id, 'boom-' + id, 'sail-' + id + '-gaff', 'cloth-sail-' + id + '-gaff');
      names.push('yard-' + id + '-topsail', 'sail-' + id + '-topsail', 'cloth-sail-' + id + '-topsail', 'sheets-' + id + '-topsail');
    } else if (mast.rig === 'lateen') {
      names.push('lateen-yard-' + id, 'sail-' + id + '-lateen', 'cloth-sail-' + id + '-lateen');
    } else {
      const sailType = mast.rig === 'trysail' ? 'trysail' : 'gaff';
      names.push('gaff-spar-' + id, 'boom-' + id, 'sail-' + id + '-' + sailType, 'cloth-sail-' + id + '-' + sailType);
    }
    return names;
  });
  const headSailNames = [
    ...Array.from({ length: Math.max(0, data.headsails ?? 0) }, (_, index) => [
      'sail-head-' + (index + 1), 'cloth-sail-head-' + (index + 1),
    ]).flat(),
  ];
  const sternTierCount = ['galleon-castle', 'high-aftercastle', 'first-rate-aftercastle'].includes(data.sternwork) ? 3
    : ['quarterdeck', 'low-quarter', 'fluyt-roundhouse'].includes(data.sternwork) ? 2 : (data.sternwork === 'open-boat' ? 0 : 1);
  const sternNames = Array.from({ length: sternTierCount }, (_, index) => 'stern-tier-' + (index + 1));
  const accessoryNames = ['bowsprit', 'deck-fittings', ...sternNames, ...(data.oars ? ['oars'] : [])];

  const design = {
    ...data,
    structure,
    mastCount: data.primaryMastCount ?? data.masts.filter((mast) => !mast.auxiliary).length,
    totalMastSpars: data.masts.length,
    mastHeights: data.masts.map((mast) => mast.height),
    lengthBeamRatio: data.hullLength / data.beam,
    hullLengthUnits: data.hullLength * WORLD_UNITS_PER_METRE,
    beamUnits: data.beam * WORLD_UNITS_PER_METRE,
    draftUnits: data.draft * WORLD_UNITS_PER_METRE,
    deckHeightUnits: data.freeboard * WORLD_UNITS_PER_METRE,
    partNames: [...basePartNames, ...frameNames, ...accessoryNames, ...headSailNames, ...mastPartNames],
    modelScaleNote: data.modelScaleNote ?? 'Dimensions are historical reference values where stated; rig heights and unrecorded details are reconstruction estimates.',
    hullFormNote: data.hullFormNote ?? 'Original parametric hull loft informed by the cited vessel type; not a traced CAD or surviving lines plan.',
  };
  Object.freeze(design.masts);
  for (const mast of design.masts) Object.freeze(mast);
  Object.freeze(design.partNames);
  for (const source of design.sources) Object.freeze(source);
  Object.freeze(design.sources);
  Object.freeze(design.hull);
  return Object.freeze(design);
}

const designs = {
  sloop: {
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
  schooner: {
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
  brigantine: {
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
  brig: {
    id: 'brig', label: 'Full-rigged brig', era: 'Late 18th–early 19th century',
    hullLength: 33.7, beam: 9.75, draft: 3.7, freeboard: 2.0,
    rig: 'Two square-rigged masts, with staysails and a spanker aft.',
    hullProfile: 'Deep working hull, rounded floor, transom counter and raised quarterdeck.',
    reference: 'Representative size envelope informed by documented early-19th-century brigs; USS Niagara dimensions are 33.7 m LBP × 9.8 m beam.',
    sources: [{ label: 'Tall Ship Guide — USS Niagara brig dimensions', url: 'https://classic-sailing.com/wp-content/uploads/2021/03/Tall-Ship-Guide-Online-Version-22-03-2021.pdf' }],
    hull: { fullness: 0.7, entry: 0.65, stern: 'counter', sternWidth: 0.36, tumblehome: 0.1, sheer: 0.14, bowRise: 0.3, sternRise: 0.3, keelDepth: 0.13, deckCamber: 0.16 },
    sternwork: 'quarterdeck', bowwork: 'bowsprit', sailingSpeed: 7.4, handling: 0.86,
    masts: [
      { id: 'fore', z: -0.23, height: 25.5, rig: 'square', squares: 3 },
      { id: 'main', z: 0.13, height: 27.0, rig: 'square', squares: 3, spanker: true },
    ],
    headsails: 3, oars: false,
  },
  snow: {
    id: 'snow', label: 'Snow brig', era: '18th century', primaryMastCount: 2,
    hullLength: 28.5, beam: 7.8, draft: 3.0, freeboard: 1.8,
    rig: 'Square fore and main; a separate trysail mast sits immediately abaft the mainmast.',
    hullProfile: 'Compact two-masted working hull with a rounded bow and low counter stern.',
    reference: 'Dimensions are a representative game reconstruction; the defining snow-mast and trysail arrangement follows the Society for Nautical Research description.',
    sources: [{ label: 'Society for Nautical Research — The Snow', url: 'https://snr.org.uk/snow/' }],
    hull: { fullness: 0.67, entry: 0.66, stern: 'counter', sternWidth: 0.32, tumblehome: 0.1, sheer: 0.12, bowRise: 0.24, sternRise: 0.28, keelDepth: 0.12, deckCamber: 0.14 },
    sternwork: 'quarterdeck', bowwork: 'bowsprit', sailingSpeed: 7.2, handling: 0.88,
    masts: [
      { id: 'fore', z: -0.24, height: 21.0, rig: 'square', squares: 3 },
      { id: 'main', z: 0.075, height: 22.4, rig: 'square', squares: 3 },
      { id: 'trysail', z: 0.11, height: 16.2, rig: 'trysail', span: 0.31, auxiliary: true },
    ],
    headsails: 2, oars: false,
  },
  cutter: {
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
  frigate: {
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
  barque: {
    id: 'barque', label: 'Atlantic barque', era: 'Late 18th century onward',
    hullLength: 29.8, beam: 8.9, draft: 3.5, freeboard: 1.8,
    rig: 'At least three masts; fore and main square, mizzen fore-and-aft.',
    hullProfile: 'Long cargo hull, full midbody, low working deck and rounded counter.',
    reference: 'Endeavour (1768) reference dimensions: 29.8 m × 8.9 m. This reconstruction uses the defining three-mast barque sail division.',
    sources: [{ label: 'Deutsches Historisches Museum — Barque / Endeavour', url: 'https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/15-barque/' }],
    hull: { fullness: 0.72, entry: 0.62, stern: 'counter', sternWidth: 0.35, tumblehome: 0.08, sheer: 0.12, bowRise: 0.24, sternRise: 0.28, keelDepth: 0.1, deckCamber: 0.13 },
    sternwork: 'low-cabin', bowwork: 'bowsprit', sailingSpeed: 7.8, handling: 0.82,
    masts: [
      { id: 'fore', z: -0.29, height: 24.6, rig: 'square', squares: 3 },
      { id: 'main', z: -0.02, height: 27.5, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.28, height: 22.0, rig: 'gaff', span: 0.28, squares: 0 },
    ],
    headsails: 3, oars: false,
  },
  caravel: {
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
  carrack: {
    id: 'carrack', label: 'Iberian carrack / nao', era: '15th–16th century',
    hullLength: 32.3, beam: 10.5, draft: 4.0, freeboard: 2.55,
    rig: 'Three masts: square fore and main; lateen mizzen.',
    hullProfile: 'Broad, deep bulbous hull, narrow upper works, high forecastle and tall aftercastle.',
    reference: 'Carrack c. 1480 model at the German Historical Museum: 32.3 m × 10.5 m; the Mariners’ Museum describes the wide, deep cargo hull and mixed square/lateen three-mast rig.',
    sources: [{ label: 'Deutsches Historisches Museum — Carrack', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/07-carrack/' }, { label: 'The Mariners’ Museum — Carrack / Nao', url: 'https://exploration.marinersmuseum.org/watercraft/carrack-nao/' }],
    hull: { fullness: 0.92, entry: 0.44, stern: 'transom', sternWidth: 0.42, tumblehome: 0.1, sheer: 0.18, bowRise: 0.44, sternRise: 0.5, keelDepth: 0.16, deckCamber: 0.2 },
    sternwork: 'high-aftercastle', bowwork: 'high-forecastle', sailingSpeed: 6.5, handling: 0.55,
    masts: [
      { id: 'fore', z: -0.27, height: 22.8, rig: 'square', squares: 3 },
      { id: 'main', z: -0.035, height: 25.8, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 19.6, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  galleon: {
    id: 'galleon', label: 'Iberian merchant galleon', era: '16th–17th century',
    hullLength: 30.5, beam: 10.0, draft: 4.1, freeboard: 2.25,
    rig: 'Three masts: square fore and main, lateen mizzen, bowsprit and spritsail.',
    hullProfile: 'Elongated ocean hull, lowered forecastle, pronounced beakhead and stepped sterncastle.',
    reference: 'Santa Maria del Pilar (c. 1535) reference: 30.5 m × 10 m. San Salvador replica measurements provide a second three-mast early-galleon comparison.',
    sources: [{ label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' }, { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' }, { label: 'Maritime Museum of San Diego — San Salvador dimensions and sail plan', url: 'https://sdmaritime.org/visit/the-ships/san-salvador/' }],
    hull: { fullness: 0.78, entry: 0.63, stern: 'transom', sternWidth: 0.38, tumblehome: 0.12, sheer: 0.16, bowRise: 0.31, sternRise: 0.48, keelDepth: 0.13, deckCamber: 0.16 },
    sternwork: 'galleon-castle', bowwork: 'beakhead', sailingSpeed: 6.2, handling: 0.58,
    masts: [
      { id: 'fore', z: -0.28, height: 22.0, rig: 'square', squares: 3 },
      { id: 'main', z: -0.025, height: 25.1, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 17.0, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 2, oars: false,
  },
  fluyt: {
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
  xebec: {
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
  junk: {
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
  'first-rate': {
    id: 'first-rate', label: 'First-rate ship of the line', era: 'Late 18th century reference form',
    hullLength: 68.88, beam: 15.79, draft: 5.9, freeboard: 3.05,
    rig: 'Three very tall square-rigged masts with a full course, topsail and topgallant sequence.',
    hullProfile: 'Very long, deep three-deck hull with a fine entrance, full central body, pronounced sheer and stepped stern.',
    reference: 'HMS Victory is the dimensional anchor: 68.88 m overall length and 15.79 m maximum beam. Draft and the general class geometry are reconstruction estimates; individual first-rate designs varied.',
    sources: [
      { label: 'National Historic Ships — HMS Victory dimensions', url: 'https://www.nationalhistoricships.org.uk/register/499/hms-victory' },
      { label: 'Guinness World Records — HMS Victory breadth', url: 'https://www.guinnessworldrecords.com/world-records/62817-widest-sailing-ship-in-service' },
    ],
    hull: { fullness: 0.78, entry: 0.82, stern: 'transom', sternWidth: 0.38, tumblehome: 0.17, sheer: 0.11, bowRise: 0.25, sternRise: 0.30, keelDepth: 0.14, deckCamber: 0.17 },
    sternwork: 'first-rate-aftercastle', bowwork: 'bowsprit', sailingSpeed: 8.1, handling: 0.42,
    masts: [
      { id: 'fore', z: -0.30, height: 43.5, rig: 'square', squares: 3 },
      { id: 'main', z: -0.02, height: 48.5, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 40.0, rig: 'square', squares: 2, spanker: true },
    ],
    headsails: 4, oars: false,
  },
  pinnace: {
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
};

export const SHIP_DESIGNS = Object.freeze(Object.fromEntries(Object.entries(designs).map(([id, data]) => [id, freezeDesign(data)])));
export const HISTORICAL_SHIP_KINDS = Object.freeze(Object.keys(SHIP_DESIGNS).map((id) => `ship-${id}`));
export const SHIP_PART_BASE_NAMES = basePartNames;

// Legacy save records are deliberately mapped to the replacement fleet rather
// than rendering the previous generic box-and-plane models.
const LEGACY_SHIP_KIND_MAP = Object.freeze({ 'sailing-ship': 'sloop', 'large-ship': 'galleon' });

export function getShipDesign(type) {
  return SHIP_DESIGNS[String(type ?? '').replace(/^ship-/, '')] ?? null;
}

export function getShipTypeFromCreativeKind(kind) {
  const value = String(kind ?? '');
  if (Object.hasOwn(LEGACY_SHIP_KIND_MAP, value)) return LEGACY_SHIP_KIND_MAP[value];
  const type = value.startsWith('ship-') ? value.slice(5) : '';
  return Object.hasOwn(SHIP_DESIGNS, type) ? type : null;
}

export function describeShipDimensions(design) {
  if (!design) return '';
  return `${design.hullLength.toFixed(1)} m × ${design.beam.toFixed(1)} m · ${design.lengthBeamRatio.toFixed(2)}:1`;
}

export function getShipDesignPartNames(type) {
  return getShipDesign(type)?.partNames ?? [];
}

export function getShipRigMastNames(type) {
  return getShipDesign(type)?.masts.map((mast) => mast.id) ?? [];
}
