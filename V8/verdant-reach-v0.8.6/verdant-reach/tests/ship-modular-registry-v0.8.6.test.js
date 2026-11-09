import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIP_DESIGNS, getShipDesign } from '../src/world/ship-designs.js?v=0.8.10';
import { SHIP_STRUCTURE_BLUEPRINTS, getShipStructureBlueprint } from '../src/world/ship-structures.js?v=0.8.10';
import { VESSEL_SPECS, VESSEL_IDS, createShip, getShipGenerator } from '../src/world/ships/index.js?v=0.8.10';
import { disposeShipModel } from '../src/world/ship-models.js?v=0.8.10';

test('all 16 vessels have independent specification and generator modules',()=>{
  const expected=['sloop','schooner','brigantine','brig','snow','cutter','frigate','barque','caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace'].sort();
  assert.deepEqual([...VESSEL_IDS].sort(),expected);
  assert.deepEqual(Object.keys(SHIP_DESIGNS).sort(),expected);
  assert.deepEqual(Object.keys(SHIP_STRUCTURE_BLUEPRINTS).sort(),expected);
  for(const id of expected){
    const spec=VESSEL_SPECS[id];
    assert.ok(spec, id+' specification');
    assert.equal(spec.id,id);
    assert.equal(getShipDesign(id).id,id);
    assert.ok(getShipStructureBlueprint(id));
    assert.equal(typeof spec.generate,'function');
    assert.equal(typeof getShipGenerator(id),'function');
    assert.equal(typeof getShipGenerator('ship-'+id),'function');
  }
});

test('each vessel generator returns the correct editable Three.js vessel',()=>{
  for(const id of VESSEL_IDS){
    const ship=createShip(id);
    try{
      assert.equal(ship.userData.shipType,id);
      assert.equal(ship.userData.shipGeneratorId,id);
      assert.equal(ship.userData.shipDefinitionPath,'src/world/ships/vessels/'+id+'/'+id+'.js');
      assert.ok(ship.userData.partNames.length>10);
      assert.equal(typeof ship.userData.getPart,'function');
      assert.ok(ship.userData.getPart('hull'));
      assert.ok(ship.userData.getPart('deck'));
    }finally{
      disposeShipModel(ship);
    }
  }
});

test('generator registry accepts legacy ship-prefixed IDs and rejects unknown IDs',()=>{
  const ship=createShip('ship-galleon');
  try{assert.equal(ship.userData.shipType,'galleon');}
  finally{disposeShipModel(ship);}
  assert.equal(getShipGenerator('ship-unknown'),null);
  assert.throws(()=>createShip('unknown'),/No dedicated ship generator registered/);
});
