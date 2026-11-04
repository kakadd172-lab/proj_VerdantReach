/**
 * Ship Design Studio model adapter.
 *
 * The editor routes through the dedicated modules in ./ships/vessels/.
 * Those modules invoke the matching v0.8.6 vessel generator and shared model
 * engine, keeping the editor and game on the same authoritative ship designs.
 */
import {
  createShip as createForTestsShip,
  SHIP_GENERATORS,
  VESSEL_IDS,
  VESSEL_MODULES,
  getVesselModule,
} from './ships/index.js';
import {
  disposeShipModel,
  shipModelSummary,
  SHIP_MODEL_ENGINE_VERSION,
} from '../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-model-builder.js?v=0.8.6';

export const SHIP_MODEL_MODULE_VERSION = SHIP_MODEL_ENGINE_VERSION;
export {
  SHIP_GENERATORS,
  VESSEL_IDS,
  VESSEL_MODULES,
  getVesselModule,
  disposeShipModel,
  shipModelSummary,
};

export function createShipModel(type, componentTransforms = {}, savedState = {}) {
  // Resolve via ForTests/ships/<vessel>, not a monolithic generator file.
  const ship = createForTestsShip(type);
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
