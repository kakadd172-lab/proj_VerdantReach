import test from 'node:test';
import assert from 'node:assert/strict';
import LegacySloop from '../src/world/ships/vessels/sloop.js';
import CanonicalSloop, { SLOOP_GENERATOR_REVISION } from '../src/world/ships/vessels/sloop/sloop.js';
import { createShipModel, disposeShipModel } from '../src/world/ships/index.js?v=0.8.10';

test('the legacy Sloop module path resolves the canonical Loguivy design', () => {
  assert.equal(LegacySloop.id, 'sloop');
  assert.equal(LegacySloop.design, CanonicalSloop.design);
  assert.equal(LegacySloop.definition, CanonicalSloop.definition);
  assert.equal(LegacySloop.design.label, 'Loguivy decked lobster boat');
  assert.equal(LegacySloop.design.hullLength, 15.30);
  assert.equal(LegacySloop.design.beam, 2.55);
  assert.equal(LegacySloop.revision, SLOOP_GENERATOR_REVISION);
});

test('legacy Sloop generator calls create the current modular model', () => {
  const ship = LegacySloop.generate(createShipModel);
  try {
    assert.equal(ship.userData.shipType, 'sloop');
    assert.equal(ship.userData.shipGeneratorId, 'sloop');
    assert.equal(ship.userData.shipDimensions.length, 15.30);
    assert.equal(ship.userData.shipDimensions.beam, 2.55);
    assert.equal(ship.userData.shipGeneratorRevision, SLOOP_GENERATOR_REVISION);
    assert.equal(ship.userData.shipDefinitionPath, 'src/world/ships/vessels/sloop/sloop.js');
    assert.ok(ship.userData.getPart('hull'));
    assert.ok(ship.userData.getPart('deck'));
    assert.ok(ship.userData.getPart('rudder'));
  } finally {
    disposeShipModel(ship);
  }
});

test('the legacy Sloop path can also construct the canonical model directly', () => {
  const ship = LegacySloop.generate();
  try {
    assert.equal(ship.userData.shipType, 'sloop');
    assert.equal(ship.userData.shipDimensions.length, 15.30);
    assert.equal(ship.userData.shipDimensions.beam, 2.55);
    assert.equal(ship.userData.shipGeneratorRevision, SLOOP_GENERATOR_REVISION);
  } finally {
    disposeShipModel(ship);
  }
});
