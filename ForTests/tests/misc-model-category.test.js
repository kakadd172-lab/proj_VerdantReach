import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MISC_MODEL_CATEGORIES,
  MISC_MODEL_IDS,
  createMiscModel,
  getMiscModelDefinition,
  getMiscModelDefaults,
  isMiscModelId
} from '../ships/misc/index.js';

test('Miscellaneous category registers Cannon independently of the sailing-vessel catalogue', () => {
  assert.equal(MISC_MODEL_CATEGORIES.length, 1);
  assert.equal(MISC_MODEL_CATEGORIES[0].id, 'miscellaneous');
  assert.deepEqual(MISC_MODEL_CATEGORIES[0].items.map(item => item.id), ['cannon']);
  assert.deepEqual(
    MISC_MODEL_CATEGORIES[0].items[0].variants.map(variant => variant.id).sort(),
    ['18-pounder', '36-pounder', '9-pounder']
  );
  assert.equal(MISC_MODEL_IDS.length, 3);
  for (const id of MISC_MODEL_IDS) {
    assert.equal(isMiscModelId(id), true);
    assert.ok(getMiscModelDefinition(id));
    assert.ok(getMiscModelDefaults(id));
  }
  assert.equal(isMiscModelId('sloop'), false);
});

test('each miscellaneous Cannon variant creates a generic editor-compatible model', () => {
  for (const id of MISC_MODEL_IDS) {
    const definition = getMiscModelDefinition(id);
    const model = createMiscModel(id);
    try {
      assert.equal(model.userData.shipType, 'cannon');
      assert.equal(model.userData.cannonNonFunctionalVisualOnly, true);
      assert.equal(model.userData.muzzleSealed, true);
      assert.equal(model.userData.firingMechanism, false);
      assert.equal(model.userData.cannonId, definition.variantId);
      assert.ok(model.userData.partNames.length > 0);
      for (const name of model.userData.partNames) {
        assert.ok(model.userData.getPart(name), id + ' exposes editable visual component ' + name);
      }
      assert.equal(model.userData.getPartNames, undefined);
    } finally {
      model.userData.dispose();
    }
  }
});
