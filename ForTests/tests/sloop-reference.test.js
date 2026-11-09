import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
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
  assert.ok(Math.abs(hullShapeStation(design,1)-0.70)<1e-8,'aft hull should terminate at the broad 70% station');
  const rakeScale=Math.pow(0.5,0.92),cutStation=0.70;
  const expectedLength=design.hullLengthUnits
    +design.hull.stemRake*design.beamUnits*(1-Math.pow(1-cutStation,4))*rakeScale
    +design.hull.sternRake*design.beamUnits*Math.pow(cutStation,5)*rakeScale;
  assert.ok(Math.abs((stationZ(design,1,0.5)-stationZ(design,0,0.5))-expectedLength)<1e-6,'hull should end at the shortened broad transom plane');
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
    stern.traverse(object=>{if(object.name==='sloop-natural-transom-face')hasTransom=true;});
    assert.ok(hasTransom,'sloop should have a shaped transom that follows the cut hull section');
    assert.ok(ship.userData.getPart('sail-single-gaff'));
    assert.ok(ship.userData.getPart('sail-head-1'));
    assert.ok(!ship.userData.partNames.includes('sail-head-2'));
  }finally{
    disposeShipModel(ship);
  }
});


test('Sloop anchors are fitted against the forward hull rather than floating off the bow',()=>{
  const design=getShipDesign('sloop');
  const ship=createShipModel('sloop');
  try{
    const port=ship.userData.getPart('anchor-port');
    const starboard=ship.userData.getPart('anchor-starboard');
    assert.ok(port&&starboard,'both anchors should be individually editable');
    assert.ok(port.position.x<0&&starboard.position.x>0,'anchors should be fitted to opposite bow cheeks');
    assert.ok(Math.abs(port.position.x)<design.beamUnits*0.25,'port anchor should remain close to the hull');
    assert.ok(Math.abs(starboard.position.x)<design.beamUnits*0.25,'starboard anchor should remain close to the hull');
    for(const anchor of [port,starboard]){
      let ring=false,fluke=false;
      anchor.traverse(object=>{
        if(object.name==='sloop-anchor-ring')ring=true;
        if(object.name==='sloop-anchor-fluke')fluke=true;
      });
      assert.ok(ring&&fluke,'each anchor should have a recognisable ring and flukes');
    }
  }finally{disposeShipModel(ship);}
});

test('Sloop rudder is a visible shaped blade extending below the keel',()=>{
  const ship=createShipModel('sloop');
  try{
    const rudder=ship.userData.getPart('rudder');
    assert.ok(rudder,'rudder component should exist');
    let blade=null,hinges=0;
    rudder.traverse(object=>{
      if(object.name==='sloop-profiled-rudder-blade')blade=object;
      if(object.name.startsWith('sloop-rudder-gudgeon-strap-'))hinges++;
    });
    assert.ok(blade,'rudder should have its own shaped blade mesh');
    blade.geometry.computeBoundingBox();
    const size=blade.geometry.boundingBox.getSize(new Vector3());
    assert.ok(size.x>0.55,'rudder blade should have a readable chord');
    assert.ok(size.y>3.0,'rudder blade should extend from the stern to below the keel');
    assert.equal(hinges,2,'rudder should have two transom hinge straps');
  }finally{disposeShipModel(ship);}
});

test('Sloop gaff mainsail is a complete four-sided cloth with a sloped gaff',()=>{
  const ship=createShipModel('sloop');
  try{
    const sail=ship.userData.getPart('cloth-sail-single-gaff');
    assert.ok(sail,'main sail cloth should be present');
    let clothMesh=null;
    sail.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')clothMesh=object;});
    assert.ok(clothMesh,'main sail cloth mesh should be generated');
    clothMesh.geometry.computeBoundingBox();
    const size=clothMesh.geometry.boundingBox.getSize(new Vector3());
    assert.ok(size.y>5.0,'main sail should have full working height');
    assert.ok(size.z>3.0,'main sail should have a complete fore-aft cloth span');
    assert.ok(ship.userData.getPart('cloth-sail-head-1'),'headsail cloth should remain present');
  }finally{disposeShipModel(ship);}
});
