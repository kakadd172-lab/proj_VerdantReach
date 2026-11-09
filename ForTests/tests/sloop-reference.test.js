import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { getShipDesign, createShipModel, disposeShipModel } from '../ships/index.js?v=0.8.8';
import { deckY, keelY, hullPoint, stationZ, halfBreadth, hullShapeStation, sectionBreadth } from '../ships/vessels/sloop/architecture/hull-geometry.js';

test('Loguivy homardier keeps the dimensions and rig described by the 1866 sheet',()=>{
 const d=getShipDesign('sloop');
 assert.ok(Math.abs(d.hullLength-15.30)<0.01);
 assert.ok(Math.abs(d.beam-2.35)<0.01);
 assert.ok(Math.abs(d.freeboard+d.draft-2.50)<0.01);
 assert.equal(d.masts.length,1);
 assert.equal(d.masts[0].rig,'gaff');
 assert.equal(d.headsails,1);
 assert.equal(d.sternTiers.length,0,'source drawing has no raised aft cabin');
});

test('Plan-view offsets preserve a fine bow, full middle and broad natural stern',()=>{
 const d=getShipDesign('sloop');
 assert.ok(halfBreadth(d,0.03)<halfBreadth(d,0.30)*0.2);
 assert.ok(halfBreadth(d,0.58)>halfBreadth(d,0.30));
 assert.ok(halfBreadth(d,0.98)>halfBreadth(d,0.58)*0.72);
 assert.equal(hullShapeStation(d,1),1,'the entire aft run reaches the transom');
});

test('Body-plan sections flare above the bilge and close on the keel',()=>{
 const d=getShipDesign('sloop');
 assert.ok(sectionBreadth(d,0.5,0.78)>sectionBreadth(d,0.5,0.30));
 assert.ok(sectionBreadth(d,0.5,1)>sectionBreadth(d,0.5,0.78));
 const port=hullPoint(d,0.5,Math.PI),starboard=hullPoint(d,0.5,0),keel=hullPoint(d,0.5,Math.PI*1.5);
 assert.ok(port.x<0&&starboard.x>0);
 assert.ok(Math.abs(keel.x)<1e-5);
 assert.ok(keel.y<port.y&&keel.y<starboard.y);
});

test('The 1866 stern terminates at a flat transom plane without an artificial hull cut',()=>{
 const d=getShipDesign('sloop');
 const lowY=keelY(d,1),highY=deckY(d,1);
 const lowZ=stationZ(d,1,0),highZ=stationZ(d,1,1);
 const v=.5,midY=lowY+(highY-lowY)*v,midZ=stationZ(d,1,v);
 assert.ok(Math.abs((midY-lowY)/(highY-lowY)-(midZ-lowZ)/(highZ-lowZ))<1e-7);
 assert.ok(halfBreadth(d,1)>d.beamUnits*.30);
});

test('The fine bow, sheer and keel rocker are all continuous along the loft',()=>{
 const d=getShipDesign('sloop');
 assert.ok(stationZ(d,0.01,1)<stationZ(d,0.01,0));
 assert.ok(deckY(d,0.02)>deckY(d,0.50));
 assert.ok(deckY(d,0.98)>deckY(d,0.50));
 assert.ok(keelY(d,0.50)<keelY(d,0.02));
});

test('The central vivier is an editable open-deck component, not a box placed on an uncut deck',()=>{
 const ship=createShipModel('sloop');
 try{
  const deck=ship.userData.getPart('deck'),vivier=ship.userData.getPart('vivier');
  assert.ok(deck&&vivier);
  const deckMesh=deck.children.find(object=>object.name==='loguivy-open-deck-plan');
  const hullMesh=ship.userData.getPart('hull').children.find(object=>object.name==='loguivy-1866-open-shell');
  assert.ok(deckMesh?.userData.vivierOpening,'deck must expose its real livewell opening');
  assert.ok(hullMesh?.userData.openSheerDeck,'hull shell must remain open across the gunwales');
  assert.ok(ship.userData.getPart('vivier-bottom-board'));
  assert.ok(ship.userData.getPart('vivier-grate'));
  assert.ok(ship.userData.getPart('vivier-hull-vents'));
  assert.ok(ship.userData.partNames.includes('vivier'));
 }finally{disposeShipModel(ship);}
});

test('The transom, rudder, anchors and single-mast rig all assemble as separate editable parts',()=>{
 const ship=createShipModel('sloop');
 try{
  assert.ok(ship.userData.getPart('sternworks'));
  assert.ok(ship.userData.getPart('rudder'));
  assert.ok(ship.userData.getPart('anchor-port'));
  assert.ok(ship.userData.getPart('anchor-starboard'));
  assert.ok(ship.userData.getPart('mast-single'));
  assert.ok(ship.userData.getPart('sail-single-gaff'));
  assert.ok(ship.userData.getPart('cloth-sail-head-1'));
 }finally{disposeShipModel(ship);}
});

test('The gaff mainsail is a complete quadrilateral with a forward headsail',()=>{
 const ship=createShipModel('sloop');
 try{
  const sail=ship.userData.getPart('cloth-sail-single-gaff');
  assert.ok(sail);
  let cloth=null;
  sail.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')cloth=object;});
  assert.ok(cloth);
  cloth.geometry.computeBoundingBox();
  const size=cloth.geometry.boundingBox.getSize(new Vector3());
  assert.ok(size.y>4.5);
  assert.ok(size.z>3.0);
  assert.ok(ship.userData.getPart('cloth-sail-head-1'));
 }finally{disposeShipModel(ship);}
});
