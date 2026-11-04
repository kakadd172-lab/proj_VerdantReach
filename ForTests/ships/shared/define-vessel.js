/**
 * Shared adapter for the ForTests vessel modules.
 *
 * Each vessel keeps its own entry point under ships/vessels/. The historical
 * dimensions, hull profile, rig, structural profile and model recipe remain
 * in that vessel's v0.8.6 source module. The actual Three.js mesh construction
 * is intentionally delegated to the game's shared model engine.
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

  function generate() {
    // This per-vessel entry point invokes that ship's actual game generator.
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
    generate,
  });
}
