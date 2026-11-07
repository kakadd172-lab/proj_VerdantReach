import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  IMPORTED_VESSELS,
  createImportedVesselWrapper,
  createLocalAssetId,
  disposeImportedModel,
} from '../imported-vessels.js';

test('no unverified modern demo vessels are presented as historical presets', () => {
  // The former examples were modern leisure/working craft, not the requested
  // Age-of-Sail fleet. A model only enters this registry after its actual file,
  // historical fit and redistribution licence are verified.
  assert.deepEqual(IMPORTED_VESSELS, []);
});

test('imported GLTF hierarchy exposes editable parts and supports transforms, visibility and relinking', () => {
  const scene = new THREE.Group();
  scene.name = 'test-imported-scene';
  const deck = new THREE.Group();
  deck.name = 'Deck';
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1, 9),
    new THREE.MeshStandardMaterial({ color: 0x778899 })
  );
  hull.name = 'Hull mesh';
  deck.add(hull);
  scene.add(deck);

  const asset = {
    id: 'imported-test-vessel',
    label: 'Imported test vessel',
    category: 'Test vessel',
    license: 'CC0 1.0 Universal',
    description: 'Synthetic test model.',
    dimensions: { length: 9, beam: 4, height: 2, draft: null },
    sources: [],
  };
  const root = createImportedVesselWrapper(THREE, asset, { scene, resources: [] });
  try {
    assert.equal(root.userData.isImportedModel, true);
    assert.equal(root.userData.importedAssetId, asset.id);
    assert.ok(root.userData.partNames.length >= 2);

    const deckId = root.userData.partNames.find(name => name.includes('deck'));
    assert.ok(deckId, 'the deck group should remain selectable');
    const deckPart = root.userData.getPart(deckId);
    assert.ok(deckPart);

    assert.equal(root.userData.setPartTransform(deckId, {
      x: 1.25, y: .4, z: -.6, rx: .1, ry: .2, rz: -.1, sx: 1.2, sy: 1, sz: .9,
    }), true);
    const transformed = root.userData.getPartTransform(deckId);
    assert.ok(Math.abs(transformed.x - 1.25) < 1e-8);
    assert.ok(Math.abs(transformed.ry - .2) < 1e-8);
    assert.ok(Math.abs(transformed.sx - 1.2) < 1e-8);

    assert.equal(root.userData.setPartVisible(deckId, false), true);
    assert.equal(deckPart.visible, false);
    assert.equal(root.userData.resetPartTransform(deckId), true);
    assert.equal(deckPart.visible, true);
    assert.ok(Math.abs(root.userData.getPartTransform(deckId).x) < 1e-8);

    const before = new THREE.Vector3();
    deckPart.updateWorldMatrix(true, false);
    deckPart.getWorldPosition(before);
    assert.equal(root.userData.detachPart(deckId), true);
    assert.equal(deckPart.parent.name, 'unlinked-parts');
    const afterDetach = new THREE.Vector3();
    deckPart.updateWorldMatrix(true, false);
    deckPart.getWorldPosition(afterDetach);
    assert.ok(before.distanceTo(afterDetach) < 1e-7);
    assert.equal(root.userData.relinkPart(deckId), true);
    assert.equal(deckPart.parent, scene);

    // A transform must remain relative to the part's original baseline when it is detached and relinked.
    assert.equal(root.userData.setPartTransform(deckId, {
      x: .75, y: .2, z: -.35, rx: .05, ry: -.1, rz: .08, sx: 1.1, sy: .95, sz: 1.05,
    }), true);
    const editedBeforeDetach = new THREE.Vector3();
    root.updateMatrixWorld(true);
    deckPart.getWorldPosition(editedBeforeDetach);
    assert.equal(root.userData.detachPart(deckId), true);
    const detachedTransform = root.userData.getPartTransform(deckId);
    assert.ok(Math.abs(detachedTransform.x - .75) < 1e-8);
    assert.ok(Math.abs(detachedTransform.ry + .1) < 1e-8);
    const detachedState = root.userData.getShipState();
    assert.ok(Math.abs(detachedState.partTransforms[deckId].x - .75) < 1e-8);
    const editedAfterDetach = new THREE.Vector3();
    root.updateMatrixWorld(true);
    deckPart.getWorldPosition(editedAfterDetach);
    assert.ok(editedBeforeDetach.distanceTo(editedAfterDetach) < 1e-7);
    assert.equal(root.userData.relinkPart(deckId), true);
    const relinkedTransform = root.userData.getPartTransform(deckId);
    assert.ok(Math.abs(relinkedTransform.x - .75) < 1e-8);
    assert.ok(Math.abs(relinkedTransform.ry + .1) < 1e-8);
    assert.ok(Math.abs(root.userData.getShipState().partTransforms[deckId].x - .75) < 1e-8);
    const editedAfterRelink = new THREE.Vector3();
    root.updateMatrixWorld(true);
    deckPart.getWorldPosition(editedAfterRelink);
    assert.ok(editedBeforeDetach.distanceTo(editedAfterRelink) < 1e-7);
  } finally {
    disposeImportedModel(root);
  }
  assert.equal(root.parent, null);
});


test('local model identity is stable across re-imports and changes when the model changes', () => {
  const main = {
    name: 'sailboat.glb',
    webkitRelativePath: 'fleet/sailboat.glb',
    size: 128,
    lastModified: 1700000000000,
  };
  const companion = {
    name: 'texture.png',
    webkitRelativePath: 'fleet/textures/texture.png',
    size: 64,
    lastModified: 1700000000001,
  };
  const files = [main, companion];
  const content = new Uint8Array([1, 2, 3, 4]).buffer;
  const first = createLocalAssetId(files, main, content);
  const second = createLocalAssetId(files, main, content);
  const reselectedMain = { ...main, lastModified: main.lastModified + 86400000 };
  const reselectedFiles = [reselectedMain, companion];
  const afterReselecting = createLocalAssetId(reselectedFiles, reselectedMain, content);
  assert.equal(first, second);
  assert.equal(first, afterReselecting, 'Selection timestamps must not change the model identity.');
  assert.match(first, /^imported-local-[a-f0-9]{16}$/);
  const changed = createLocalAssetId(files, main, new Uint8Array([1, 2, 3, 5]).buffer);
  assert.notEqual(first, changed);
});

test('saved imported-model transforms are restored when the same asset is wrapped again', () => {
  const scene = new THREE.Group();
  scene.name = 'test-persisted-scene';
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 8), new THREE.MeshStandardMaterial());
  hull.name = 'Hull';
  scene.add(hull);
  const asset = {
    id: 'imported-test-persisted',
    label: 'Persisted test vessel',
    category: 'Test vessel',
    license: 'CC0 1.0 Universal',
    description: 'Synthetic persistence fixture.',
    dimensions: { length: 8, beam: 3, height: 1, draft: null },
    sources: [],
  };
  const partId = 'imported-001-hull';
  const state = {
    partTransforms: { [partId]: { x: 1.5, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 } },
    hiddenParts: {},
    unlinkedParts: [],
  };
  const root = createImportedVesselWrapper(THREE, asset, { scene, resources: [] }, state);
  try {
    assert.equal(root.userData.getPartTransform(partId).x, 1.5);
    assert.equal(root.userData.getShipState().partTransforms[partId].x, 1.5);
  } finally {
    disposeImportedModel(root);
  }
});
