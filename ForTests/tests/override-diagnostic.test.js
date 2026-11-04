import test from 'node:test';
import {
  getShipDesign,
  setShipDesignOverrides,
  resetShipDesignOverrides,
} from '../ship-designs.js?v=0.8.6';
import {
  getShipStructureBlueprint,
  setShipStructureOverrides,
  resetShipStructureOverrides,
} from '../ship-structures.js?v=0.8.6';
import { createShipModel as directEngineBuild, disposeShipModel } from '../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-model-builder.js?v=0.8.6';
import { createShipModel as registryBuild } from '../ship-models.js?v=0.8.6';

test('diagnose whether editor override state reaches the engine builder and registry', () => {
  const originalDesign = getShipDesign('sloop');
  const originalStructure = getShipStructureBlueprint('sloop');
  let direct;
  let registry;
  try {
    setShipDesignOverrides('sloop', { beam: originalDesign.beam + 1.25 });
    setShipStructureOverrides('sloop', { frameCount: originalStructure.frameCount + 2 });
    direct = directEngineBuild('sloop');
    registry = registryBuild('sloop');
    console.log('OVERRIDE_DIAGNOSTIC', JSON.stringify({
      expectedBeam: originalDesign.beam + 1.25,
      editorDesignBeam: getShipDesign('sloop').beam,
      directEngineBeam: direct.userData.shipDimensions.beam,
      registryBeam: registry.userData.shipDimensions.beam,
      expectedFrameCount: originalStructure.frameCount + 2,
      editorFrameCount: getShipStructureBlueprint('sloop').frameCount,
      directHasLastFrame: Boolean(direct.userData.getPart('frame-' + String(originalStructure.frameCount + 2).padStart(2, '0'))),
      registryHasLastFrame: Boolean(registry.userData.getPart('frame-' + String(originalStructure.frameCount + 2).padStart(2, '0'))),
    }));
  } finally {
    if (direct) disposeShipModel(direct);
    if (registry) disposeShipModel(registry);
    resetShipDesignOverrides('sloop');
    resetShipStructureOverrides('sloop');
  }
});
