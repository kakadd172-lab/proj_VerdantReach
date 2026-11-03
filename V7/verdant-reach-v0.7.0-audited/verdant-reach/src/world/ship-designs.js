/**
 * Historical reference cards for the first four Verdant Reach sailing vessels.
 * Dimensions are hull length / maximum beam in metres. Where an exact reference
 * vessel is unavailable for a broad class, the model-design estimate is labelled.
 */
export const SHIP_DESIGNS = Object.freeze({
  sloop: Object.freeze({
    id: 'sloop',
    label: 'Coastal packet sloop',
    era: '18th–19th century design language',
    hullLength: 21.0,
    beam: 5.6,
    draft: 2.2,
    mastCount: 1,
    mastHeights: [17.5],
    rig: 'One fore-and-aft gaff mainsail, boom and headsail/jib',
    hullProfile: 'Slim coastal hull, modest stern cabin and a pronounced bowsprit',
    reference: 'Packet sloops documented at 60–75 ft on deck; beam and exact model dimensions are game-design estimates.',
    lengthBeamRatio: 3.75,
    sourceIds: ['turn625039view2', 'turn625039view4'],
    sources: [{ label: 'Fitz Henry Lane Online / Cape Ann Museum — Sloop', url: 'https://www.fitzhenrylaneonline.org/historical_material/index.php?section=Sloop&type=Vessel+Types' }],
    modelScaleNote: 'Illustrative packet-sloop archetype, not a single named vessel. Beam, draft and mast height are game-design estimates.',
    hullFormNote: 'Stylized loft based on representative proportions; not traced from a surviving lines plan.',
  }),
  brigantine: Object.freeze({
    id: 'brigantine',
    label: 'Mercurio-style brigantine',
    era: 'Early 19th century reference',
    hullLength: 30.0,
    beam: 8.5,
    draft: 3.2,
    mastCount: 2,
    mastHeights: [22.0, 19.0],
    rig: 'Square foremast; fore-and-aft main with square main topsail',
    hullProfile: 'Balanced single-deck hull with a rounded bow and compact stern',
    reference: 'Mercurio reconstruction: approximately 30 m length and 8.5 m beam.',
    lengthBeamRatio: 30 / 8.5,
    sourceIds: ['turn355478search2', 'turn625039view4'],
    sources: [{ label: 'Museum of Maritime Archaeology, Caorle — Mercurio reconstruction', url: 'https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/' }],
    modelScaleNote: 'Dimensions follow the museum reconstruction; spar heights are proportioned for the game model.',
    hullFormNote: 'Stylized loft based on representative proportions; not traced from a surviving lines plan.',
  }),
  schooner: Object.freeze({
    id: 'schooner',
    label: 'Bluenose-inspired schooner',
    era: 'Early 20th century reference schooner',
    hullLength: 43.6,
    beam: 8.2,
    draft: 4.8,
    mastCount: 2,
    mastHeights: [31.2, 38.4],
    rig: 'Two fore-and-aft gaff rigs; foremast shorter than mainmast',
    hullProfile: 'Long, narrow, deep-draught hull with low working deck and fine ends',
    reference: 'Bluenose registry-derived figures: 43.6 m hull length, 8.2 m beam; foremast 31.2 m and mainmast 38.4 m above deck.',
    lengthBeamRatio: 43.6 / 8.2,
    sourceIds: ['turn355478search3', 'turn625039view3', 'turn625039view4'],
    sources: [{ label: 'The Maritime Atlas — Bluenose data method and registry dimensions', url: 'https://themaritimeatlas.ca/Bluenose/data-method' }],
    modelScaleNote: 'A large schooner archetype based on the documented Bluenose dimensions, not a universal schooner size.',
    hullFormNote: 'Stylized loft based on registry dimensions and rig proportions; not traced from the original designer’s lines plan.',
  }),
  galleon: Object.freeze({
    id: 'galleon',
    label: 'Iberian merchant galleon',
    era: '16th century reference',
    hullLength: 30.5,
    beam: 10.0,
    draft: 4.1,
    mastCount: 3,
    mastHeights: [22.0, 25.1, 17.0],
    rig: 'Square fore and main; lateen mizzen; bowsprit and spritsail',
    hullProfile: 'Fuller ocean-going hull, low forecastle, tall stepped sterncastle and beakhead',
    reference: 'Santa Maria del Pilar model: 30.5 m length and 10 m beam. The three-mast rig follows the Mariners’ Museum description of a common galleon arrangement.',
    lengthBeamRatio: 30.5 / 10,
    sourceIds: ['turn355478search0', 'turn625039view0', 'turn355478search4'],
    sources: [{ label: 'The Mariners’ Museum — Galleon', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' }, { label: 'German Historical Museum — Galleon reference dimensions', url: 'https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' }],
    modelScaleNote: 'A specific Iberian merchant-galleon interpretation. Historical galleons varied by region and period; spar heights are illustrative.',
    hullFormNote: 'Stylized loft based on representative proportions; not traced from a surviving lines plan.',
  }),
});

export const HISTORICAL_SHIP_KINDS = Object.freeze(Object.keys(SHIP_DESIGNS).map((id) => `ship-${id}`));

export function getShipDesign(type) {
  return SHIP_DESIGNS[String(type ?? '').replace(/^ship-/, '')] ?? null;
}

export function getShipTypeFromCreativeKind(kind) {
  const type = String(kind ?? '').startsWith('ship-') ? String(kind).slice(5) : '';
  return Object.hasOwn(SHIP_DESIGNS, type) ? type : null;
}

export function describeShipDimensions(design) {
  if (!design) return '';
  return `${design.hullLength.toFixed(1)} m × ${design.beam.toFixed(1)} m · ${design.lengthBeamRatio.toFixed(2)}:1`;
}
