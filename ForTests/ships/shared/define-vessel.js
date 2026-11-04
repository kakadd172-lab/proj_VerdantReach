/**
 * Shared adapter for the ForTests vessel modules.
 *
 * Each vessel keeps its own entry point under ships/vessels/. The historical
 * dimensions, hull profile, rig and structural profile come from that vessel's
 * v0.8.6 source module. Actual mesh construction is delegated to the game's
 * reusable Three.js model engine.
 */
import {
  createShipModel as createGameShipModel,
} from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-model-builder.js?v=0.8.6';

export function defineTestVessel(sourceVessel, editorModulePath) {
  if (!sourceVessel || typeof sourceVessel.id !== 'string') {
    throw new TypeError('A valid source vessel specification is required.');
  }
  if (typeof sourceVessel.generate !== 'function') {
    throw new TypeError('Vessel ' + sourceVessel.id + ' does not expose a generator.');
  }
  if (!sourceVessel.design || !sourceVessel.structure) {
    throw new TypeError('Vessel ' + sourceVessel.id + ' is missing design or structure data.');
  }

  const id = sourceVessel.id;
  const gameDefinitionPath = 'src/world/ships/vessels/' + id + '.js';

  function createModel() {
    // This vessel-specific module calls its own game's generator. The game
    // generator then builds a distinct editable model using its own design.
    const model = sourceVessel.generate(createGameShipModel);
    if (!model?.isObject3D) {
      throw new Error('The ' + id + ' generator did not return a Three.js Object3D.');
    }
    model.userData.shipGeneratorId = id;
    model.userData.shipDefinitionPath = gameDefinitionPath;
    model.userData.shipEditorModulePath = editorModulePath;
    model.userData.shipSourceVersion = '0.8.6';
    return model;
  }

  return Object.freeze({
    id,
    label: sourceVessel.design.label,
    design: sourceVessel.design,
    structure: sourceVessel.structure,
    source: sourceVessel,
    gameDefinitionPath,
    editorModulePath,
    createModel,
    generate: createModel,
  });
}
