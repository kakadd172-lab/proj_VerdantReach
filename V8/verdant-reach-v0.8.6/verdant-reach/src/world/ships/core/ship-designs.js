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
import { getShipStructureBlueprint } from './ship-structures.js?v=0.8.6';
import { VESSEL_SPECS } from '../vessels/index.js?v=0.8.6';

export const SHIP_CATALOGUE_VERSION = '0.8.6';
export const SHIP_DESIGN_MODULE_VERSION = SHIP_CATALOGUE_VERSION;
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
      if (mast.spanker) names.push('gaff-spar-' + id, 'boom-' + id, 'sail-' + id + '-spanker', 'cloth-sail-' + id + '-spanker');
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
  const accessoryNames = [...sternNames, ...(data.oars ? ['oars'] : [])];

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

const designs = Object.fromEntries(
  Object.entries(VESSEL_SPECS).map(([id, specification]) => [id, specification.design]),
);

export const SHIP_DESIGNS = Object.freeze(Object.fromEntries(Object.entries(designs).map(([id, data]) => [id, freezeDesign(data)])));
export const HISTORICAL_SHIP_KINDS = Object.freeze(Object.keys(SHIP_DESIGNS).map((id) => `ship-${id}`));
export const SHIP_PART_BASE_NAMES = basePartNames;

// Legacy save records are deliberately mapped to the replacement fleet rather
// than rendering the previous generic box-and-plane models.
const LEGACY_SHIP_KIND_MAP = Object.freeze({ 'sailing-ship': 'sloop', 'large-ship': 'galleon' });

const designOverrides = new Map();

function mergeDesignData(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base;
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeDesignData(
        base[key] && typeof base[key] === 'object' && !Array.isArray(base[key]) ? base[key] : {},
        value,
      );
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => item && typeof item === 'object' ? structuredClone(item) : item);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Apply editor/runtime-only design overrides without mutating the immutable
 * catalogue. Empty overrides restore the vessel's source definition.
 */
export function setShipDesignOverrides(type, overrides = {}) {
  const id = String(type ?? '').replace(/^ship-/, '');
  if (!Object.hasOwn(designs, id)) return false;
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new TypeError('Ship design overrides must be an object.');
  }
  if (Object.keys(overrides).length === 0) designOverrides.delete(id);
  else designOverrides.set(id, structuredClone(overrides));
  return true;
}

export function resetShipDesignOverrides(type) {
  return setShipDesignOverrides(type, {});
}

export function getShipDesign(type) {
  const id = String(type ?? '').replace(/^ship-/, '');
  const base = SHIP_DESIGNS[id];
  if (!base) return null;
  const overrides = designOverrides.get(id);
  return overrides ? freezeDesign(mergeDesignData(designs[id], overrides)) : base;
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
