/**
 * Compatibility catalogue for game systems that still import ship-designs.js.
 * Actual vessel data lives in each independent vessels/<id>/<id>.js module.
 */
import { VESSEL_SPECS } from '../vessels/index.js?v=0.8.11';
import {
  SHIP_PART_BASE_NAMES, SHIP_DESIGN_MODULE_VERSION, WORLD_UNITS_PER_METRE,
  getShipDesignFromSpec, setDesignOverrideForSpec, resetDesignOverrideForSpec
} from './vessel-definition.js?v=0.8.11';

const vesselSpec = (type) => {
  const id = String(type ?? '').replace(/^ship-/, '');
  return VESSEL_SPECS[id] ?? null;
};
export const SHIP_CATALOGUE_VERSION = SHIP_DESIGN_MODULE_VERSION;
export { SHIP_DESIGN_MODULE_VERSION, WORLD_UNITS_PER_METRE, SHIP_PART_BASE_NAMES };
export const SHIP_DESIGNS = Object.freeze(Object.fromEntries(
  Object.entries(VESSEL_SPECS).map(([id, vessel]) => [id, getShipDesignFromSpec(vessel.definition)])
));
export const HISTORICAL_SHIP_KINDS = Object.freeze(Object.keys(SHIP_DESIGNS).map((id) => 'ship-' + id));

export function getShipDesign(type) {
  const vessel = vesselSpec(type);
  return vessel ? getShipDesignFromSpec(vessel.definition) : null;
}
export function setShipDesignOverrides(type, overrides = {}) {
  const vessel = vesselSpec(type);
  return vessel ? setDesignOverrideForSpec(vessel.definition, overrides) : false;
}
export function resetShipDesignOverrides(type) {
  const vessel = vesselSpec(type);
  return vessel ? resetDesignOverrideForSpec(vessel.definition) : false;
}
const LEGACY_SHIP_KIND_MAP = Object.freeze({ 'sailing-ship': 'sloop', 'large-ship': 'galleon' });
export function getShipTypeFromCreativeKind(kind) {
  const value = String(kind ?? '');
  if (Object.hasOwn(LEGACY_SHIP_KIND_MAP, value)) return LEGACY_SHIP_KIND_MAP[value];
  const id = value.startsWith('ship-') ? value.slice(5) : '';
  return Object.hasOwn(SHIP_DESIGNS, id) ? id : null;
}
export function describeShipDimensions(design) {
  if (!design) return '';
  return design.hullLength.toFixed(1) + ' m × ' + design.beam.toFixed(1) + ' m · ' + design.lengthBeamRatio.toFixed(2) + ':1';
}
export function getShipDesignPartNames(type) {
  return getShipDesign(type)?.partNames ?? [];
}
export function getShipRigMastNames(type) {
  return getShipDesign(type)?.masts.map((mast) => mast.id) ?? [];
}
