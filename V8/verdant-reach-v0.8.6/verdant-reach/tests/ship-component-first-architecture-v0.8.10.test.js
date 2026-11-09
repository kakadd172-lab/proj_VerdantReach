import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHIP_DESIGNS } from '../src/world/ship-designs.js?v=0.8.10';
import { SHIP_STRUCTURE_BLUEPRINTS } from '../src/world/ship-structures.js?v=0.8.10';
import { VESSEL_SPECS, VESSEL_IDS, createShip, createShipModel, getShipGenerator } from '../src/world/ships/index.js?v=0.8.10';
import { disposeShipModel } from '../src/world/ship-models.js?v=0.8.10';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/world/ships/vessels');
const expected = ['sloop','schooner','brigantine','brig','snow','cutter','frigate','barque','caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace'].sort();

test('all 16 vessels own component-first runtime folders and generator entry points', () => {
  assert.deepEqual([...VESSEL_IDS].sort(), expected);
  assert.deepEqual(Object.keys(SHIP_DESIGNS).sort(), expected);
  assert.deepEqual(Object.keys(SHIP_STRUCTURE_BLUEPRINTS).sort(), expected);
  for (const id of expected) {
    const spec = VESSEL_SPECS[id];
    assert.ok(spec, id + ' registry entry');
    assert.equal(typeof spec.createModel, 'function');
    assert.equal(typeof spec.generate, 'function');
    assert.equal(typeof getShipGenerator(id), 'function');
    assert.equal(typeof getShipGenerator('ship-' + id), 'function');
    for (const file of [
      id + '.js','editor-defaults.js','architecture/layout.js','architecture/hull-geometry.js',
      'generators/hull/hull-generator.js','generators/decks/deck-generator.js',
      'generators/sails/sail-cloth-generator.js','generators/masts/mast-frame-generator.js'
    ]) assert.ok(existsSync(path.join(root,id,file)), id + ' missing ' + file);
    const source = readFileSync(path.join(root,id,id+'.js'),'utf8');
    assert.ok(source.includes("from './editor-defaults.js'"));
    assert.ok(source.includes('ARCHITECTURE.assemblyOrder'));
  }
});

test('each runtime generator creates its own editable ship hierarchy', () => {
  for (const id of VESSEL_IDS) {
    const ship = createShip(id);
    try {
      assert.equal(ship.userData.shipType,id);
      assert.equal(ship.userData.shipGeneratorId,id);
      assert.equal(ship.userData.shipDefinitionPath,'src/world/ships/vessels/'+id+'/'+id+'.js');
      assert.ok(ship.userData.partNames.length>10);
      assert.equal(typeof ship.userData.getPart,'function');
      assert.ok(ship.userData.getPart('hull'));
      assert.ok(ship.userData.getPart('deck'));
      assert.ok(ship.userData.ownedGeometries.length>0);
      assert.ok(ship.userData.ownedMaterials.length>0);
    } finally { disposeShipModel(ship); }
  }
});

test('legacy createShipModel alias and prefixed vessel IDs remain compatible', () => {
  const ship = createShipModel('ship-galleon');
  try { assert.equal(ship.userData.shipType,'galleon'); }
  finally { disposeShipModel(ship); }
  assert.equal(getShipGenerator('ship-unknown'),null);
  assert.throws(()=>createShip('unknown'),/No dedicated ship generator registered/);
});
