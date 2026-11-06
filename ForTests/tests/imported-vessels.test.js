import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  IMPORTED_VESSELS,
  createImportedVesselWrapper,
  disposeImportedModel,
} from '../imported-vessels.js';

test('the imported vessel gallery contains only documented CC0 civilian vessels', () => {
  assert.equal(IMPORTED_VESSELS.length, 3);
  for (const asset of IMPORTED_VESSELS) {
    assert.ok(asset.label && asset.description);
    assert.equal(asset.license, 'CC0 1.0 Universal');
    assert.ok(asset.sources.length > 0);
    for (const source of asset.sources) {
      assert.ok(source.url.startsWith('https://3dassets.dev/'));
      assert.ok(source.model.startsWith('https://cdn.3dassets.dev/'));
      assert.ok(source.model.endsWith('.glb'));
    }
  }
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
  } finally {
    disposeImportedModel(root);
  }
  assert.equal(root.parent, null);
});
