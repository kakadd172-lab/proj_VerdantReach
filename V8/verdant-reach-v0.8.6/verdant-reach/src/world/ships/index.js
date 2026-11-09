import { VESSEL_SPECS, VESSEL_IDS, getVesselSpec } from './vessels/index.js?v=0.8.10';
import {
  SHIP_DESIGNS, HISTORICAL_SHIP_KINDS, WORLD_UNITS_PER_METRE, SHIP_PART_BASE_NAMES,
  SHIP_DESIGN_MODULE_VERSION, getShipDesign, setShipDesignOverrides, resetShipDesignOverrides,
  getShipTypeFromCreativeKind, describeShipDimensions, getShipDesignPartNames, getShipRigMastNames
} from './core/ship-designs.js?v=0.8.10';
import {
  SHIP_STRUCTURE_BLUEPRINTS, SHIP_STRUCTURE_MODULE_VERSION, getShipStructureBlueprint,
  setShipStructureOverrides, resetShipStructureOverrides, getHullHalfBeam, getHullSectionWidth,
  getHullKeelY, getDeckSheer, getHullFrameCount
} from './core/ship-structures.js?v=0.8.10';
import { SHIP_EDITOR_KIT_VERSION, disposeShipModel, shipModelSummary as summariseShipDesign } from './core/ship-editor-kit.js?v=0.8.10';

export { VESSEL_SPECS, VESSEL_IDS, getVesselSpec };
export {
  SHIP_DESIGNS, HISTORICAL_SHIP_KINDS, WORLD_UNITS_PER_METRE, SHIP_PART_BASE_NAMES,
  SHIP_DESIGN_MODULE_VERSION, getShipDesign, setShipDesignOverrides, resetShipDesignOverrides,
  getShipTypeFromCreativeKind, describeShipDimensions, getShipDesignPartNames, getShipRigMastNames
};
export {
  SHIP_STRUCTURE_BLUEPRINTS, SHIP_STRUCTURE_MODULE_VERSION, getShipStructureBlueprint,
  setShipStructureOverrides, resetShipStructureOverrides, getHullHalfBeam, getHullSectionWidth,
  getHullKeelY, getDeckSheer, getHullFrameCount
};
export { disposeShipModel };
export const SHIP_MODEL_ENGINE_VERSION = SHIP_EDITOR_KIT_VERSION;
export const SHIP_MODEL_MODULE_VERSION = SHIP_EDITOR_KIT_VERSION;
export const VESSEL_MODULE_LIST = Object.freeze(VESSEL_IDS.map((id) => VESSEL_SPECS[id]));
export const VESSEL_MODULES = VESSEL_SPECS;

const generators = Object.freeze(Object.fromEntries(VESSEL_IDS.map((id) => [id, (transforms = {}, savedState = {}) => {
  const vessel = VESSEL_SPECS[id];
  const ship = vessel.createModel(transforms, savedState);
  ship.userData.shipGeneratorId = id;
  ship.userData.shipDefinitionPath = vessel.editorModulePath;
  ship.userData.shipGameDefinitionPath = vessel.definition.gameDefinitionPath;
  return ship;
}])));

export const SHIP_GENERATORS = generators;
export function getVesselModule(type) {
  return getVesselSpec(type);
}
export function getShipGenerator(type) {
  return SHIP_GENERATORS[String(type ?? '').replace(/^ship-/, '')] ?? null;
}
export function createShip(type, transforms = {}, savedState = {}) {
  const id = String(type ?? '').replace(/^ship-/, '');
  const generator = getShipGenerator(id);
  if (!generator) throw new Error('No dedicated ship generator registered for: ' + String(type));
  return generator(transforms, savedState);
}
export const createShipModel = createShip;
export function shipModelSummary(type) {
  return summariseShipDesign(getShipDesign(type));
}
