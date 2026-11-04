/**
 * Ship Design Studio adapter.
 *
 * The mesh generator and part API are the same modules used by the v0.8.6
 * game. The optional extra arguments are an editor convenience for restoring
 * saved component transforms and ship state.
 */
import {
  createShipModel as createGameShipModel,
  disposeShipModel,
  shipModelSummary,
  SHIP_MODEL_ENGINE_VERSION,
} from '../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-model-builder.js';

export const SHIP_MODEL_MODULE_VERSION = SHIP_MODEL_ENGINE_VERSION;

export function createShipModel(type, componentTransforms = {}, savedState = {}) {
  const ship = createGameShipModel(type);
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
  ship.userData.shipGeneratorId = type;
  ship.userData.shipDefinitionPath = 'src/world/ships/vessels/' + String(type).replace(/^ship-/, '') + '.js';
  return ship;
}

export { disposeShipModel, shipModelSummary };
