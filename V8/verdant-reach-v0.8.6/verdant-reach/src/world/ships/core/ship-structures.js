import { getCrossSectionHalfBreadthRatio, getKeelLineHeight, getLongitudinalHalfBeamRatio } from './ship-hull-parameterization.js?v=0.8.6';
import { VESSEL_SPECS } from '../vessels/index.js?v=0.8.6';
/**
 * Ship-specific hull-line and framing profiles for the v0.8.5 modular fleet.
 * Profiles are dimensionless reconstruction controls. Real-world length,
 * beam, draft and freeboard remain in ship-designs.js.
 */
const profiles = Object.fromEntries(
  Object.entries(VESSEL_SPECS).map(([id, specification]) => [id, specification.structure]),
);

for (const profile of Object.values(profiles)) Object.freeze(profile);
export const SHIP_STRUCTURE_CATALOGUE_VERSION = '0.8.6';
export const SHIP_STRUCTURE_BLUEPRINTS = Object.freeze(profiles);

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
export function getShipStructureBlueprint(id) {
  return SHIP_STRUCTURE_BLUEPRINTS[String(id ?? '').replace(/^ship-/, '')] ?? null;
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
