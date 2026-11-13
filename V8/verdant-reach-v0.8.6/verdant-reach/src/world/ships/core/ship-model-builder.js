/**
 * Backwards-compatible public model-builder facade.
 * New runtime code uses the selected vessel's own createModel() entry point.
 */
import { createShip } from '../index.js?v=0.8.11';
import { getShipDesign } from './ship-designs.js?v=0.8.11';
import { SHIP_EDITOR_KIT_VERSION, disposeShipModel, shipModelSummary as summarise } from './ship-editor-kit.js?v=0.8.11';

export const SHIP_MODEL_ENGINE_VERSION = SHIP_EDITOR_KIT_VERSION;
export { disposeShipModel };
export function createShipModel(type, componentTransforms = {}, savedState = {}) {
  return createShip(type, componentTransforms, savedState);
}
export function shipModelSummary(type) {
  return summarise(getShipDesign(type));
}
