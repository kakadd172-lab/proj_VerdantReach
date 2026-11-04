import { getCrossSectionHalfBreadthRatio, getKeelLineHeight, getLongitudinalHalfBeamRatio } from './ship-hull-parameterization.js?v=0.8.6';
import { VESSEL_SPECS } from '../vessels/index.js?v=0.8.6';
/**
 * Ship-specific hull-line and framing profiles for the v0.8.6 modular fleet.
 * Profiles are dimensionless reconstruction controls. Real-world length,
 * beam, draft and freeboard remain in ship-designs.js.
 */
const profiles = Object.fromEntries(
  Object.entries(VESSEL_SPECS).map(([id, specification]) => [id, specification.structure]),
);

for (const profile of Object.values(profiles)) Object.freeze(profile);
export const SHIP_STRUCTURE_CATALOGUE_VERSION = '0.8.6';
export const SHIP_STRUCTURE_MODULE_VERSION = SHIP_STRUCTURE_CATALOGUE_VERSION;
export const SHIP_STRUCTURE_BLUEPRINTS = Object.freeze(profiles);

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const structureOverrides = new Map();

export function setShipStructureOverrides(type, overrides = {}) {
  const id = String(type ?? '').replace(/^ship-/, '');
  if (!Object.hasOwn(SHIP_STRUCTURE_BLUEPRINTS, id)) return false;
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new TypeError('Ship structure overrides must be an object.');
  }
  if (Object.keys(overrides).length === 0) structureOverrides.delete(id);
  else structureOverrides.set(id, structuredClone(overrides));
  return true;
}

export function resetShipStructureOverrides(type) {
  return setShipStructureOverrides(type, {});
}

export function getShipStructureBlueprint(id) {
  const key = String(id ?? '').replace(/^ship-/, '');
  const base = SHIP_STRUCTURE_BLUEPRINTS[key];
  if (!base) return null;
  const overrides = structureOverrides.get(key);
  return overrides ? Object.freeze({ ...base, ...overrides }) : base;
}

export function getHullHalfBeam(design, station) {
  const profile = getShipStructureBlueprint(design?.id);
  if (!profile) return (design?.beamUnits ?? 0) * .5;
  return design.beamUnits * .5 * getLongitudinalHalfBeamRatio(design, profile, station);
}

export function getHullSectionWidth(design, vertical) {
  const profile = getShipStructureBlueprint(design?.id);
  if (!profile) return 1;
  return getCrossSectionHalfBreadthRatio(design, profile, vertical);
}

export function getHullKeelY(design, station) {
  const profile = getShipStructureBlueprint(design?.id);
  if (!profile) return -(design?.draftUnits ?? 0);
  return getKeelLineHeight(design, profile, station);
}

export function getDeckSheer(design, station) {
  const t = clamp01(station);
  const edge = Math.pow(Math.abs(t - .5) * 2, 1.28);
  const bowRise = t < .5 ? design.hull.bowRise : design.hull.sternRise;
  const profile = getShipStructureBlueprint(design.id);
  return design.deckHeightUnits
    + design.hull.sheer * design.deckHeightUnits * edge
    + bowRise * design.deckHeightUnits * Math.pow(edge, 1.18) * (profile?.sheer ?? 1);
}

export function getHullFrameCount(design) {
  return getShipStructureBlueprint(design?.id)?.frameCount ?? 18;
}
