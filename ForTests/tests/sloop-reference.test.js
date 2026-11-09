import test from 'node:test';
import assert from 'node:assert/strict';
import { getShipDesign, createShipModel, disposeShipModel } from '../ships/index.js?v=0.8.8';
import { hullPoint, stationZ, halfBreadth } from '../ships/vessels/sloop/architecture/hull-geometry.js';

test('Sloop keeps a single-mast gaff plan with one clean headsail',()=>{
  const design=getShipDesign('sloop');
  assert.equal(design.masts.length,1);
  assert.equal(design.masts[0].rig,'gaff');
  assert.equal(design.headsails,1);
  assert.ok(design.hull.stemRake>0);
  assert.ok(design.hull.sternRake>0);
});

test('Sloop hull section reaches both gunwales and rounds down to the keel',()=>{
  const design=getShipDesign('sloop');
  const starboard=hullPoint(design,0.5,0);
  const port=hullPoint(design,0.5,Math.PI);
  const keel=hullPoint(design,0.5,Math.PI*1.5);
  assert.ok(starboard.x>0);
  assert.ok(port.x<0);
  assert.ok(Math.abs(starboard.y-port.y)<0.001);
  assert.ok(Math.abs(keel.x)<0.001);
  assert.ok(keel.y<starboard.y);
  assert.ok(halfBreadth(design,0.999)>design.beamUnits*0.05,'counter stern should retain a narrow transom');
});

test('Sloop bow and counter rake are visible in its longitudinal geometry',()=>{
  const design=getShipDesign('sloop');
  assert.ok(stationZ(design,0.012,1)<stationZ(design,0.012,0),'upper stem should rake forward');
  assert.ok(stationZ(design,0.984,1)>stationZ(design,0.984,0),'counter should overhang aft');
});

test('Sloop still assembles its editable hull, cabin and simplified sail plan',()=>{
  const ship=createShipModel('sloop');
  try{
    assert.ok(ship.userData.getPart('hull'));
    assert.ok(ship.userData.getPart('deck'));
    assert.ok(ship.userData.getPart('stem'));
    assert.ok(ship.userData.getPart('stern-tier-1'));
    assert.ok(ship.userData.getPart('sail-single-gaff'));
    assert.ok(ship.userData.getPart('sail-head-1'));
    assert.ok(!ship.userData.partNames.includes('sail-head-2'));
  }finally{
    disposeShipModel(ship);
  }
});
