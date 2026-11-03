import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipModel, disposeShipModel } from '../src/world/ship-models.js?v=0.8.5';
import { SHIP_DESIGNS, getShipDesign } from '../src/world/ship-designs.js';
import { getHullHalfBeam, getHullSectionWidth, getHullKeelY, getShipStructureBlueprint } from '../src/world/ship-structures.js?v=0.8.5';
import { cubicBezierScalar, getParametricHullPoint } from '../src/world/ship-hull-parameterization.js?v=0.8.5';

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

test('sails and mast assemblies rotate around their own attachment points', () => {
  const ship = createShipModel('galleon');
  try {
    const design = getShipDesign('galleon');
    const mainMast = design.masts.find((mast) => mast.id === 'main');
    const mastGroup = ship.userData.getPart('mast-main');
    const sailGroup = ship.userData.getPart('sail-main-course');
    const expectedZ = mainMast.z * design.hullLengthUnits;
    assert.ok(Math.abs(mastGroup.position.z - expectedZ) < 1e-6);
    assert.equal(sailGroup.parent, mastGroup);
    assert.ok(sailGroup.position.length() < 1e-6, "the sail uses the mast group's local attachment origin");
    const sailOrigin = sailGroup.position.clone();
    assert.equal(ship.userData.setSailTrim('main', .22), true);
    assert.ok(Math.abs(sailGroup.rotation.y - .22) < 1e-6);
    assert.ok(sailGroup.position.distanceTo(sailOrigin) < 1e-6);
    assert.equal(ship.userData.setMastLean('main', .08), true);
    assert.ok(Math.abs(mastGroup.rotation.x - .08) < 1e-6);
    assert.ok(Math.abs(mastGroup.position.z - expectedZ) < 1e-6);
  } finally {
    disposeShipModel(ship);
  }
});

test('standing rigging follows each vessel blueprint shroud-pair count without duplicate ratlines', () => {
  const ship = createShipModel('galleon');
  try {
    const design = getShipDesign('galleon');
    const expectedPairs = design.structure.shroudPairs;
    const shrouds = ship.userData.getPart('shrouds-fore');
    const ratlines = ship.userData.getPart('ratlines-fore');
    const stays = ship.userData.getPart('mast-stays-fore');
    assert.equal(shrouds.children.filter((child) => child.isMesh).length, expectedPairs * 2);
    assert.equal(ratlines.children.filter((child) => child.isMesh).length, design.structure.ratlines);
    assert.equal(stays.children.filter((child) => child.isMesh).length, 1);
  } finally {
    disposeShipModel(ship);
  }
});

test('Chinese junk omits the European stem-post silhouette and generic bow ornament', () => {
  const ship = createShipModel('junk');
  try {
    const stem = ship.userData.getPart('stem');
    const bowworks = ship.userData.getPart('bowworks');
    const keel = ship.userData.getPart('keel');
    assert.equal(stem.children.filter((child) => child.isMesh).length, 0);
    assert.equal(bowworks.getObjectByName('abstract-bow-ornament'), undefined);
    assert.ok(keel.children.length > 0, 'a shallow centreline structural group remains available');
  } finally {
    disposeShipModel(ship);
  }
});


test('sail cloth is parented to its mast pivot so mast lean carries yards and canvas together', () => {
  const ship = createShipModel('galleon');
  try {
    const mast = ship.userData.getPart('mast-main');
    const yard = ship.userData.getPart('yard-main-course');
    const sail = ship.userData.getPart('sail-main-course');
    const junk = createShipModel('junk');
    try {
      const junkMast = junk.userData.getPart('mast-main');
      const junkSail = junk.userData.getPart('sail-main-junk');
      assert.equal(yard.parent, mast);
      assert.equal(sail.parent, mast);
      assert.equal(junkSail.parent, junkMast);

      const sailMesh = sail.getObjectByName('sail-cloth');
      assert.ok(sailMesh?.geometry?.getAttribute('position'));
      const vertex = sailMesh.geometry.getAttribute('position');
      const localCanvasPoint = new THREE.Vector3(vertex.getX(0), vertex.getY(0), vertex.getZ(0));
      const sailWorldBefore = localCanvasPoint.clone();
      sailMesh.localToWorld(sailWorldBefore);
      const sailPosition = sail.position.clone();
      assert.equal(ship.userData.setMastLean('main', .08), true);
      const sailWorldAfter = localCanvasPoint.clone();
      sailMesh.localToWorld(sailWorldAfter);
      assert.ok(sailWorldBefore.distanceTo(sailWorldAfter) > .01, 'mast lean carries the attached sail cloth');
      assert.ok(sail.position.distanceTo(sailPosition) < 1e-6, 'local attachment point remains fixed');
    } finally {
      disposeShipModel(junk);
    }
  } finally {
    disposeShipModel(ship);
  }
});


test('piecewise Bezier hull plans preserve bow, shoulder and stern control widths', () => {
  assert.equal(cubicBezierScalar(2, 4, 6, 8, 0), 2);
  assert.equal(cubicBezierScalar(2, 4, 6, 8, 1), 8);
  for (const design of Object.values(SHIP_DESIGNS)) {
    const profile = getShipStructureBlueprint(design.id);
    assert.ok(profile, design.id + ' needs a structural profile');
    const shoulder = profile.beamStation;
    const halfBeam = design.beamUnits * .5;
    assert.ok(Math.abs(getHullHalfBeam(design, shoulder) - halfBeam) < 1e-6, design.id + ' shoulder is maximum beam');
    assert.ok(Math.abs(getHullHalfBeam(design, 0) - halfBeam * profile.foreTip) < 1e-6, design.id + ' bow tip width');
    assert.ok(Math.abs(getHullHalfBeam(design, 1) - halfBeam * profile.aftTip) < 1e-6, design.id + ' stern/transom width');

    let previous = getHullHalfBeam(design, 0);
    for (let index = 1; index <= 100; index += 1) {
      const station = index / 100;
      const current = getHullHalfBeam(design, station);
      assert.ok(Number.isFinite(current) && current > 0, design.id + ' station ' + station);
      if (station <= shoulder) assert.ok(current + 1e-6 >= previous, design.id + ' forebody taper is monotonic');
      else assert.ok(current <= previous + 1e-6, design.id + ' aftbody taper is monotonic');
      previous = current;
    }
  }
});

test('midship sections keep a finite keel-to-bilge-to-deck contour for every hull family', () => {
  for (const design of Object.values(SHIP_DESIGNS)) {
    const widths = Array.from({ length: 41 }, (_, index) => getHullSectionWidth(design, index / 40));
    assert.ok(widths.every((width) => Number.isFinite(width) && width > 0), design.id);
    assert.ok(widths[20] > widths[0], design.id + ' bilge should be wider than keel flat');
    assert.ok(widths[40] > 0.7 && widths[40] < 1.1, design.id + ' deck breadth remains bounded');
  }
  assert.ok(getHullSectionWidth(SHIP_DESIGNS.fluyt, 1) < .9, 'fluyt tumblehome narrows the deck breadth');
  assert.ok(getHullSectionWidth(SHIP_DESIGNS.junk, 0) > .18, 'junk keeps a broad flat bottom');
});

test('bow and stern keel rocker rise away from the deepest midbody', () => {
  for (const design of Object.values(SHIP_DESIGNS)) {
    const keelMid = getHullKeelY(design, .5);
    const keelBow = getHullKeelY(design, 0);
    const keelStern = getHullKeelY(design, 1);
    assert.ok(Math.abs(keelMid + design.draftUnits) < 1e-6, design.id + ' midbody keel datum');
    assert.ok(keelBow > keelMid, design.id + ' bow rocker');
    assert.ok(keelStern > keelMid, design.id + ' stern rocker');
  }
});

test('parametric hull points are mirrored port-to-starboard and remain finite across all designs', () => {
  for (const design of Object.values(SHIP_DESIGNS)) {
    const profile = getShipStructureBlueprint(design.id);
    for (const station of [.03, .2, profile.beamStation, .78, .97]) {
      const deckY = design.deckHeightUnits;
      for (const angle of [.2, .7, 1.25, 2.1]) {
        const starboard = getParametricHullPoint(design, profile, station, angle, deckY);
        const port = getParametricHullPoint(design, profile, station, Math.PI * 2 - angle, deckY);
        assert.ok(Object.values(starboard).every(Number.isFinite), design.id + ' starboard point');
        assert.ok(Object.values(port).every(Number.isFinite), design.id + ' port point');
        assert.ok(Math.abs(starboard.x + port.x) < 1e-6, design.id + ' mirrored breadth');
        assert.ok(Math.abs(starboard.y - port.y) < 1e-6, design.id + ' mirrored height');
        assert.ok(Math.abs(starboard.z - port.z) < 1e-6, design.id + ' mirrored station');
      }
    }
  }
});


test('specified beam remains the maximum hull breadth after bow, bilge and flare shaping', () => {
  for (const design of Object.values(SHIP_DESIGNS)) {
    const profile = getShipStructureBlueprint(design.id);
    let maximum = 0;
    for (let stationIndex = 0; stationIndex <= 100; stationIndex += 1) {
      const station = stationIndex / 100;
      const halfBeam = getHullHalfBeam(design, station);
      for (let sectionIndex = 0; sectionIndex <= 40; sectionIndex += 1) {
        const breadth = getHullSectionWidth(design, sectionIndex / 40);
        maximum = Math.max(maximum, halfBeam * breadth);
      }
    }
    assert.ok(maximum <= design.beamUnits * .5 + 1e-6, design.id + ' exceeds its specified maximum beam');
  }
});

test('bow and stern hull end faces are explicitly capped', () => {
  const ship = createShipModel('galleon');
  try {
    const hull = ship.userData.getPart('hull').getObjectByName('lofted-hull-shell');
    const position = hull.geometry.getAttribute('position');
    const stations = 96;
    const ringSegments = 40;
    const ringRows = (stations + 1) * (ringSegments + 1);
    assert.equal(position.count, ringRows + 2, 'one triangulation centre is added at each end');
    const index = hull.geometry.getIndex();
    assert.ok(index.count > stations * ringSegments * 6, 'the shell includes additional end-cap triangles');
  } finally {
    disposeShipModel(ship);
  }
});
