/**
 * Ship Design Studio adapter.
 *
 * The editor calls the same per-vessel generator registry used by Creative
 * ship placement in v0.8.6. Optional state arguments restore an editor session
 * after a model rebuild.
 */
import {
  createShip as createGameShip,
  SHIP_GENERATORS,
  VESSEL_IDS,
} from '../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/index.js';
import {
  disposeShipModel,
  shipModelSummary,
  SHIP_MODEL_ENGINE_VERSION,
} from '../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-model-builder.js';

export const SHIP_MODEL_MODULE_VERSION = SHIP_MODEL_ENGINE_VERSION;
export { SHIP_GENERATORS, VESSEL_IDS, disposeShipModel, shipModelSummary };

export function createShipModel(type, componentTransforms = {}, savedState = {}) {
  // This is intentionally the game registry, not a direct call to the shared
  // builder: the preview therefore exercises each vessel's own generator.
  const ship = createGameShip(type);
  const transforms = componentTransforms && Object.keys(componentTransforms).length
    ? componentTransforms
    : (savedState?.partTransforms || {});
  const state = {
    ...(savedState && typeof savedState === 'object' ? savedState : {}),
    partTransforms: transforms,
  };
  if (
    Object.keys(state.partTransforms).length
    || Object.keys(state.hiddenParts || {}).length
    || (state.unlinkedParts || []).length
    || Object.keys(state.sailTrim || {}).length
    || Object.keys(state.sailDeployment || {}).length
    || Object.keys(state.mastLean || {}).length
    || Number(state.rudderAngle)
  ) {
    ship.userData.applyShipState(state);
  }
  return ship;
}
