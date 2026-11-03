import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipModel, disposeShipModel } from '../src/world/ship-models.js?v=0.8.5';
import { getShipDesign } from '../src/world/ship-designs.js';

function boundsOfPart(ship, name) {
  const part = ship.userData.getPart(name);
  assert.ok(part, 'missing part ' + name);
  const mesh = part.children.find((child) => child.isMesh);
  assert.ok(mesh?.geometry?.getAttribute('position'), 'part ' + name + ' needs mesh geometry');
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox;
}

test('the hull loft joins port and starboard sheer lines across the full deck breadth', () => {
  const ship = createShipModel('galleon');
  try {
    const design = getShipDesign('galleon');
    const hull = ship.userData.getPart('hull').getObjectByName('lofted-hull-shell');
    const position = hull.geometry.getAttribute('position');
    const ringStride = 41;
    const midshipRow = 48 * ringStride;
    const starboardX = position.getX(midshipRow);
    const portX = position.getX(midshipRow + 40);
    const starboardY = position.getY(midshipRow);
    const portY = position.getY(midshipRow + 40);
    assert.ok(starboardX > design.beamUnits * .35, 'starboard sheer must reach the deck edge');
    assert.ok(portX < -design.beamUnits * .35, 'port sheer must reach the deck edge');
    assert.ok(Math.abs(starboardY - portY) < 1e-5, 'both sheer edges should share deck height');
  } finally {
    disposeShipModel(ship);
  }
});

test('gaff and lateen sails extend fore-and-aft rather than across the beam', () => {
  const sloop = createShipModel('sloop');
  const caravel = createShipModel('caravel');
  try {
    const sloopDesign = getShipDesign('sloop');
    const gaff = boundsOfPart(sloop, 'cloth-sail-single-gaff');
    assert.ok(gaff.max.z - gaff.min.z > sloopDesign.hullLengthUnits * .25);
    assert.ok(gaff.max.x - gaff.min.x < .5, 'gaff canvas should stay in the fore-and-aft sail plane');

    const caravelDesign = getShipDesign('caravel');
    const lateen = boundsOfPart(caravel, 'cloth-sail-main-lateen');
    assert.ok(lateen.max.z - lateen.min.z > caravelDesign.hullLengthUnits * .2);
    assert.ok(lateen.max.x - lateen.min.x < .5, 'lateen canvas should stay in the fore-and-aft sail plane');
  } finally {
    disposeShipModel(sloop);
    disposeShipModel(caravel);
  }
});

test('Chinese junk battens follow the sail plane and the sail has real fore-and-aft span', () => {
  const ship = createShipModel('junk');
  try {
    const design = getShipDesign('junk');
    const sail = boundsOfPart(ship, 'cloth-sail-main-junk');
    assert.ok(sail.max.z - sail.min.z > design.hullLengthUnits * .2);
    assert.ok(sail.max.x - sail.min.x < .5);
    const batten = ship.userData.getPart('batten-main-4').children.find((child) => child.isMesh);
    assert.ok(batten);
    const battenBounds = new THREE.Box3().setFromObject(batten);
    assert.ok(battenBounds.max.z - battenBounds.min.z > design.hullLengthUnits * .15);
  } finally {
    disposeShipModel(ship);
  }
});

test('rudder steering rotates around the stern stock and square-rigged spankers are separate parts', () => {
  const ship = createShipModel('brig');
  try {
    const design = getShipDesign('brig');
    const rudder = ship.userData.getPart('rudder');
    assert.ok(Math.abs(rudder.position.z - (design.hullLengthUnits * .48 + .22)) < 1e-6);
    assert.ok(ship.userData.getPart('sail-main-spanker'));
    assert.ok(ship.userData.getPart('cloth-sail-main-spanker'));
    assert.equal(ship.userData.setRudderAngle(.35), true);
    assert.ok(Math.abs(rudder.rotation.y - .35) < 1e-6);
  } finally {
    disposeShipModel(ship);
  }
});
