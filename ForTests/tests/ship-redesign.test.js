import test from 'node:test';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import {
  SHIP_DESIGNS,getShipDesign,setShipDesignOverrides,resetShipDesignOverrides,SHIP_DESIGN_MODULE_VERSION,
  getShipStructureBlueprint,setShipStructureOverrides,resetShipStructureOverrides,SHIP_STRUCTURE_MODULE_VERSION,
  createShipModel,disposeShipModel,SHIP_GENERATORS,VESSEL_IDS,VESSEL_MODULES,SHIP_MODEL_MODULE_VERSION,
  getVesselModule,
} from '../ships/index.js?v=0.8.7';

const ids = Object.keys(SHIP_DESIGNS).sort();

test('the editor uses 16 self-contained ForTests vessel modules', () => {
  assert.equal(SHIP_DESIGN_MODULE_VERSION, '0.8.7');
  assert.equal(SHIP_STRUCTURE_MODULE_VERSION, '0.8.7');
  assert.equal(SHIP_MODEL_MODULE_VERSION, '0.8.7');
  assert.equal(ids.length, 16);
  assert.deepEqual([...VESSEL_IDS].sort(), ids);
  assert.deepEqual(Object.keys(VESSEL_MODULES).sort(), ids);
  for (const id of ids) {
    const module = getVesselModule(id);
    assert.ok(module, id + ' ForTests ship module');
    assert.equal(module.id, id);
    assert.equal(typeof module.createModel, 'function', id + ' dedicated model creator');
    assert.equal(typeof module.generate, 'function', id + ' dedicated generator entry point');
    assert.equal(module.editorModulePath, 'ForTests/ships/vessels/' + id + '.js');
    assert.equal(typeof SHIP_GENERATORS[id], 'function', id + ' registered generator');
  }
});


test('each vessel owns its own geometry-generation algorithms', () => {
  const sources = new Map(ids.map((id) => [
    id,
    readFileSync(new URL('../ships/vessels/' + id + '.js', import.meta.url), 'utf8'),
  ]));
  const algorithms = { halfBreadth: [], deckY: [], keelY: [], hullPoint: [], deckBreadthRatio: [] };
  for (const [id, source] of sources) {
    for (const required of [
      'function halfBreadth(', 'function hullPoint(', 'function buildHull(',
      'function buildFramesAndPlanking(', 'function buildStern(', 'function buildBow(',
      'function buildRudderAndHelm(', 'function buildRailingsAndEquipment(',
      'function buildAnchors(', 'function buildCanvasSail(', 'buildAnchors(ctx.design,ctx)', 'buildCanvasSail(ctx,', 'function ensureSternTierComponents(', 'function buildRig(', 'function generate',
    ]) assert.ok(source.includes(required), id + ' must own ' + required);
    assert.ok(source.includes('createShipContext('), id + ' must construct its own context');
    assert.ok(source.includes('finishShipModel('), id + ' must finish through editor support');
    const sectionRule = id === 'galleon' ? 'const v=1-Math.pow(Math.abs(Math.sin(a)),' : 'const v=1-Math.pow(Math.max(0,Math.sin(a)),';
    assert.ok(source.includes(sectionRule), id + ' hull section must use its vessel-specific cross-section mapping.');
    assert.ok(source.includes('half=halfBreadth(d,t)*deckBreadthRatio(d)'), id + ' deck must meet its own hull edge.');
    assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(source),
      id + ' still calls the old shared geometry engine');
    for (const name of Object.keys(algorithms)) {
      const match = source.match(new RegExp('function ' + name + '\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}'));
      assert.ok(match, id + ' has a readable local ' + name + ' function');
      algorithms[name].push(match[1].trim());
    }
  }
  for (const [name, bodies] of Object.entries(algorithms)) {
    assert.equal(new Set(bodies).size, 16, 'All 16 ships must have their own ' + name + ' algorithm');
  }

  const kit = readFileSync(new URL('../ships/shared/ship-editor-kit.js', import.meta.url), 'utf8');
  assert.ok(kit.includes('createShipContext'));
  assert.ok(kit.includes('finishShipModel'));
  for (const geometryRoutine of ['function halfBreadth(', 'function hullPoint(', 'function buildHull(', 'function buildCanvasSail(', 'function buildRig(']) {
    assert.ok(!kit.includes(geometryRoutine), 'Editor kit must not contain vessel geometry: ' + geometryRoutine);
  }
});


test('historical reference variants stay within their intended length-to-beam envelopes', () => {
  const ranges = {
    sloop: [3.8, 4.1], schooner: [3.3, 3.8], brigantine: [3.3, 3.8],
    brig: [3.2, 3.7], snow: [3.4, 3.9], cutter: [3.1, 3.5],
    frigate: [3.4, 3.8], barque: [4.4, 4.7], caravel: [2.6, 3.1],
    carrack: [2.9, 3.3], galleon: [3.8, 4.2], fluyt: [4.7, 5.1],
    xebec: [4.0, 4.8], junk: [3.6, 4.2], 'first-rate': [3.4, 3.8],
    pinnace: [3.4, 4.0],
  };
  for (const [id, [minimum, maximum]] of Object.entries(ranges)) {
    const design = getShipDesign(id);
    assert.ok(
      design.lengthBeamRatio >= minimum && design.lengthBeamRatio <= maximum,
      id + ' length-to-beam ratio ' + design.lengthBeamRatio.toFixed(3) +
        ' is outside the intended ' + minimum + '–' + maximum + ' envelope',
    );
  }
});


test('named historical reference anchors match their selected vessel variants', () => {
  const frigate = getShipDesign('frigate');
  assert.ok(Math.abs(frigate.hullLength - 30.8) < 0.01);
  assert.ok(Math.abs(frigate.beam - 8.4) < 0.01);

  const caravel = getShipDesign('caravel');
  assert.equal(caravel.masts.length, 4);
  assert.equal(caravel.masts[0].rig, 'square');
  assert.equal(caravel.masts[1].rig, 'square');
  assert.equal(caravel.masts[2].rig, 'lateen');
  assert.equal(caravel.masts[3].rig, 'lateen');

  const barque = getShipDesign('barque');
  assert.ok(Math.abs(barque.hullLength - 39.93) < 0.02);
  assert.ok(Math.abs(barque.beam - 8.84) < 0.02);
  assert.equal(barque.masts.length, 3);
  assert.equal(barque.masts[2].rig, 'gaff');

  const fluyt = getShipDesign('fluyt');
  assert.ok(Math.abs(fluyt.hullLength - 32.75) < 0.02);
  assert.ok(Math.abs(fluyt.beam - 6.7) < 0.02);
  assert.equal(fluyt.masts.length, 3);

  const pinnace = getShipDesign('pinnace');
  assert.ok(Math.abs(pinnace.hullLength - 9.75) < 0.01);
});

test('each vessel has an independent design, structure profile and generator', () => {
  for (const id of ids) {
    const design = getShipDesign(id);
    const structure = getShipStructureBlueprint(id);
    const module = getVesselModule(id);
    assert.ok(design, id + ' design');
    assert.ok(structure, id + ' structure');
    assert.equal(design.id, id);
    assert.ok(design.hullLength > 0 && design.beam > 0 && design.draft > 0, id + ' dimensions');
    assert.ok(Array.isArray(design.masts) && design.masts.length > 0, id + ' rig');
    assert.ok(Array.isArray(design.partNames) && design.partNames.length > 10, id + ' parts');
    assert.ok(structure.frameCount >= 12, id + ' frames');
    assert.equal(module.design.id, id, id + ' module design');
    assert.equal(module.structure.frameCount, structure.frameCount, id + ' module structure');
    assert.ok(Object.isFrozen(design), id + ' design is immutable');
    assert.ok(Object.isFrozen(structure), id + ' structure is immutable');
  }
});

test('all 16 independent ForTests generators build separate editable models', () => {
  for (const id of ids) {
    const module = getVesselModule(id);
    const ship = module.createModel();
    try {
      assert.equal(ship.userData.shipType, id, id + ' model type');
      assert.equal(ship.userData.shipGeneratorId, id, id + ' generator routing');
      assert.equal(
        ship.userData.shipDefinitionPath,
        'ForTests/ships/vessels/' + id + '.js',
        id + ' ForTests definition path',
      );
      assert.equal(
        ship.userData.shipEditorModulePath,
        'ForTests/ships/vessels/' + id + '.js',
        id + ' dedicated ForTests model/generator path',
      );
      assert.equal(ship.userData.shipGameDefinitionPath, 'src/world/ships/vessels/' + id + '.js');
      assert.equal(ship.userData.shipSourceVersion, 'ForTests-native');
      assert.ok(ship.userData.getPart('hull'), id + ' hull');
      assert.ok(ship.userData.getPart('deck'), id + ' deck');
      assert.ok(ship.userData.getPart('rudder'), id + ' rudder');
      for (const partName of getShipDesign(id).partNames) {
        assert.ok(ship.userData.getPart(partName), id + ' missing editable component ' + partName);
      }
      assert.equal(typeof ship.userData.getPartTransform, 'function');
      assert.equal(typeof ship.userData.applyShipState, 'function');
      assert.equal(typeof ship.userData.getShipState, 'function');

      ship.traverse((object) => {
        if (!object.isMesh) return;
        const position = object.geometry?.getAttribute('position');
        assert.ok(position && position.count > 0, id + ' mesh geometry ' + object.name);
        for (let i = 0; i < position.count; i += 1) {
          assert.ok(Number.isFinite(position.getX(i)), id + ' invalid x in ' + object.name);
          assert.ok(Number.isFinite(position.getY(i)), id + ' invalid y in ' + object.name);
          assert.ok(Number.isFinite(position.getZ(i)), id + ' invalid z in ' + object.name);
        }
      });
    } finally {
      disposeShipModel(ship);
    }
  }
});

test('design overrides rebuild only the selected vessel and can be reset', () => {
  const original = getShipDesign('sloop');
  try {
    assert.equal(setShipDesignOverrides('sloop', { beam: original.beam + 1.25 }), true);
    const changed = getShipDesign('sloop');
    assert.ok(Math.abs(changed.beam - (original.beam + 1.25)) < 1e-9);
    assert.ok(Math.abs(changed.beamUnits - (original.beam + 1.25) * (4 / 3)) < 1e-9);
    assert.equal(getShipDesign('galleon').beam, SHIP_DESIGNS.galleon.beam);

    const ship = createShipModel('sloop');
    try {
      assert.ok(Math.abs(ship.userData.shipDimensions.beam - (original.beam + 1.25)) < 1e-9);
    } finally {
      disposeShipModel(ship);
    }
  } finally {
    resetShipDesignOverrides('sloop');
  }
  assert.equal(getShipDesign('sloop').beam, original.beam);
});

test('structure overrides change the selected vessel frame layout and can be reset', () => {
  const original = getShipStructureBlueprint('sloop');
  try {
    assert.equal(setShipStructureOverrides('sloop', { frameCount: original.frameCount + 2 }), true);
    assert.equal(getShipStructureBlueprint('sloop').frameCount, original.frameCount + 2);
    const ship = createShipModel('sloop');
    try {
      assert.ok(ship.userData.getPart('frame-' + String(original.frameCount + 2).padStart(2, '0')));
    } finally {
      disposeShipModel(ship);
    }
  } finally {
    resetShipStructureOverrides('sloop');
  }
  assert.equal(getShipStructureBlueprint('sloop').frameCount, original.frameCount);
});

test('component move, rotation, scale and live gizmo values persist in ship state', () => {
  const ship = createShipModel('sloop');
  try {
    const mast = ship.userData.getPart('mast-single');
    assert.ok(mast);
    mast.position.x += 0.75;
    mast.rotation.y += 0.12;
    mast.scale.z *= 1.15;

    const transform = ship.userData.getPartTransform('mast-single');
    assert.ok(Math.abs(transform.x - 0.75) < 1e-8);
    assert.ok(Math.abs(transform.ry - 0.12) < 1e-8);
    assert.ok(Math.abs(transform.sz - 1.15) < 1e-8);

    const state = ship.userData.getShipState();
    assert.ok(Math.abs(state.partTransforms['mast-single'].x - 0.75) < 1e-8);
    assert.ok(Math.abs(state.partTransforms['mast-single'].ry - 0.12) < 1e-8);
    assert.ok(Math.abs(state.partTransforms['mast-single'].sz - 1.15) < 1e-8);

    const restored = createShipModel('sloop', state.partTransforms, state);
    try {
      const result = restored.userData.getPartTransform('mast-single');
      assert.ok(Math.abs(result.x - 0.75) < 1e-8);
      assert.ok(Math.abs(result.ry - 0.12) < 1e-8);
      assert.ok(Math.abs(result.sz - 1.15) < 1e-8);
    } finally {
      disposeShipModel(restored);
    }
  } finally {
    disposeShipModel(ship);
  }
});

test('reset component restores its original hierarchy, transform and visibility', () => {
  const ship = createShipModel('sloop');
  try {
    const part = ship.userData.getPart('mast-single');
    const originalParent = part.parent;
    const originalPosition = part.position.clone();
    const originalRotation = part.rotation.clone();
    const originalScale = part.scale.clone();

    assert.equal(ship.userData.setPartTransform('mast-single', {
      x: 1.25, y: 0.4, z: -0.6, rx: 0.2, ry: -0.15, rz: 0.1, sx: 1.4, sy: 1.2, sz: 0.8,
    }), true);
    assert.equal(ship.userData.setPartVisible('mast-single', false), true);
    assert.equal(ship.userData.detachPart('mast-single'), true);
    assert.equal(part.visible, false);
    assert.notEqual(part.parent, originalParent);

    assert.equal(ship.userData.resetPartTransform('mast-single'), true);
    assert.equal(part.parent, originalParent);
    assert.equal(part.visible, true);
    assert.ok(part.position.distanceTo(originalPosition) < 1e-8);
    assert.ok(part.scale.distanceTo(originalScale) < 1e-8);
    assert.ok(Math.abs(part.rotation.x - originalRotation.x) < 1e-8);
    assert.ok(Math.abs(part.rotation.y - originalRotation.y) < 1e-8);
    assert.ok(Math.abs(part.rotation.z - originalRotation.z) < 1e-8);
    assert.deepEqual(ship.userData.getShipState().unlinkedParts, []);
    assert.deepEqual(ship.userData.getShipState().hiddenParts, {});
  } finally {
    disposeShipModel(ship);
  }
});


test('Galleon keel has a sculpted rocker and stern tiers taper and project aft', () => {
  const ship = createShipModel('galleon');
  try {
    const keelMesh = ship.getObjectByName('galleon-sculpted-keel');
    assert.ok(keelMesh?.isMesh, 'Galleon sculpted keel mesh');
    const keelPositions = keelMesh.geometry.getAttribute('position');
    const ring = 12;
    const stations = 104;
    const lowestAt = (station) => {
      let lowest = Infinity;
      for (let j = 0; j < ring; j += 1) {
        lowest = Math.min(lowest, keelPositions.getY(station * ring + j));
      }
      return lowest;
    };
    const foreKeel = lowestAt(0);
    const midKeel = lowestAt(Math.floor(stations / 2));
    const aftKeel = lowestAt(stations);
    assert.ok(midKeel < foreKeel - 0.8, 'keel must rise toward the forefoot');
    assert.ok(midKeel < aftKeel - 0.8, 'keel must rise toward the sternpost');

    const transom = ship.getObjectByName('curved-transom-wall-1');
    assert.ok(transom?.isMesh, 'lower stern transom mesh');
    const p = transom.geometry.getAttribute('position');
    const across = 36;
    const rows = 12;
    const lowerWidth = Math.abs(p.getX(across) - p.getX(0));
    const upperStart = rows * (across + 1);
    const upperWidth = Math.abs(p.getX(upperStart + across) - p.getX(upperStart));
    assert.ok(lowerWidth > upperWidth * 1.15, 'stern transom should narrow substantially toward its top');
    const lowerAft = p.getZ(across / 2);
    const upperAft = p.getZ(upperStart + across / 2);
    assert.ok(upperAft > lowerAft + 0.3, 'upper stern structure should project aft beyond the lower transom');
  } finally {
    disposeShipModel(ship);
  }
});
