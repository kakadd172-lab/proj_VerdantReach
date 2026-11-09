import test from 'node:test';
import assert from 'node:assert/strict';
import { getShipDesign, createShipModel, disposeShipModel } from '../ships/index.js?v=0.8.8';
import { deckY, keelY, hullPoint, stationZ, halfBreadth, hullShapeStation } from '../ships/vessels/sloop/architecture/hull-geometry.js';

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
  assert.ok(halfBreadth(design,0.999)>design.beamUnits*0.30,'transom should preserve the breadth at the cut station');
  assert.ok(Math.abs(hullShapeStation(design,1)-0.75)<1e-8,'aft quarter should be removed at the chosen cut station');
  assert.ok(Math.abs((stationZ(design,1,0.5)-stationZ(design,0,0.5))-design.hullLengthUnits*0.75)<0.02,'physical hull length should end at the cut, not extend behind it');
});

test('Sloop aft cut forms one flat, slightly raked transom plane',()=>{
  const design=getShipDesign('sloop');
  const lowY=keelY(design,1),highY=deckY(design,1);
  const lowZ=stationZ(design,1,0),highZ=stationZ(design,1,1);
  const midV=0.5,midY=keelY(design,1)+(deckY(design,1)-keelY(design,1))*Math.pow(midV,0.92);
  const midZ=stationZ(design,1,midV);
  const yRatio=(midY-lowY)/(highY-lowY);
  const zRatio=(midZ-lowZ)/(highZ-lowZ);
  assert.ok(Math.abs(yRatio-zRatio)<1e-6,'transom stern rake should remain planar through the hull depth');
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
    const stern=ship.userData.getPart('sternworks');
    let hasTransom=false;
    stern.traverse(object=>{if(object.name==='sloop-square-transom')hasTransom=true;});
    assert.ok(hasTransom,'sloop should have a shaped transom that follows the cut hull section');
    assert.ok(ship.userData.getPart('sail-single-gaff'));
    assert.ok(ship.userData.getPart('sail-head-1'));
    assert.ok(!ship.userData.partNames.includes('sail-head-2'));
  }finally{
    disposeShipModel(ship);
  }
});
