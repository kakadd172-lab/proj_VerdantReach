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

test('Miscellaneous category keeps the existing Cannon entries and registers independent maritime props', () => {
  assert.equal(MISC_MODEL_CATEGORIES.length, 1);
  assert.equal(MISC_MODEL_CATEGORIES[0].id, 'miscellaneous');
  assert.deepEqual(
    MISC_MODEL_CATEGORIES[0].items.map(item => item.id),
    ['cannon', 'barrel', 'crate', 'lantern', 'fitting']
  );
  assert.deepEqual(
    MISC_MODEL_CATEGORIES[0].items[0].variants.map(variant => variant.id).sort(),
    ['18-pounder', '36-pounder', '9-pounder']
  );
  assert.equal(MISC_MODEL_IDS.length, 8);
  for (const id of MISC_MODEL_IDS) {
    assert.equal(isMiscModelId(id), true);
    assert.ok(getMiscModelDefinition(id));
    assert.ok(getMiscModelDefaults(id));
  }
  assert.equal(isMiscModelId('sloop'), false);
});

test('all miscellaneous generators create independently editable component hierarchies', () => {
  for (const id of MISC_MODEL_IDS) {
    const definition = getMiscModelDefinition(id);
    const model = createMiscModel(id);
    try {
      assert.ok(model.userData.partNames.length >= 5, id + ' should expose multiple editable components');
      for (const name of model.userData.partNames) {
        assert.ok(model.userData.getPart(name), id + ' exposes editable component ' + name);
      }
      const editableName = model.userData.partNames[0];
      assert.equal(model.userData.setPartTransform(editableName, { x: 0.125 }), true);
      assert.equal(model.userData.getPartTransform(editableName).x, 0.125);
      assert.equal(model.userData.miscModelId, definition.kind === 'cannon' ? undefined : id);
    } finally {
      model.userData.dispose();
    }
  }
});

test('new maritime prop generators expose the expected model identities', () => {
  for (const id of ['misc-prop-barrel', 'misc-prop-barrel-v2', 'misc-prop-crate', 'misc-prop-lantern', 'misc-prop-bollard']) {
    const model = createMiscModel(id);
    try {
      assert.equal(model.userData.modelCategory, 'miscellaneous');
      assert.equal(model.userData.miscModelType, getMiscModelDefinition(id).kind === 'fitting' ? 'fitting' : getMiscModelDefinition(id).kind);
      assert.ok(model.userData.partNames.length >= 5);
    } finally {
      model.userData.dispose();
    }
  }
});

test('Cargo Barrel V2 has its own ten editable assemblies and is distinct from V1', async () => {
  const { BARREL_V2_PART_NAMES } = await import('../ships/misc/barrels/v2/index.js');
  assert.equal(BARREL_V2_PART_NAMES.length, 10);
  const v1 = createMiscModel('misc-prop-barrel');
  const v2 = createMiscModel('misc-prop-barrel-v2');
  try {
    assert.notEqual(v1.userData.miscModelId, v2.userData.miscModelId);
    assert.equal(v2.userData.miscModelId, 'misc-prop-barrel-v2');
    assert.deepEqual(v2.userData.partNames, [...BARREL_V2_PART_NAMES]);
    for (const name of BARREL_V2_PART_NAMES) {
      assert.ok(v2.userData.getPart(name), 'V2 component is independently editable: ' + name);
    }
    assert.equal(v2.userData.setPartTransform('barrel-staves', { y: 0.1 }), true);
    assert.equal(v2.userData.getPartTransform('barrel-staves').y, 0.1);
  } finally {
    v1.userData.dispose();
    v2.userData.dispose();
  }
});
