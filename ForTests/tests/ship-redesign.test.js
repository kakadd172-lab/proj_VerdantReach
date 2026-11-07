import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import {
  SHIP_DESIGNS,getShipDesign,setShipDesignOverrides,resetShipDesignOverrides,SHIP_DESIGN_MODULE_VERSION,
  getShipStructureBlueprint,setShipStructureOverrides,resetShipStructureOverrides,SHIP_STRUCTURE_MODULE_VERSION,
  createShipModel,disposeShipModel,SHIP_GENERATORS,VESSEL_IDS,VESSEL_MODULES,SHIP_MODEL_MODULE_VERSION,
  getVesselModule,
} from '../ships/index.js?v=0.8.8';

const ids = Object.keys(SHIP_DESIGNS).sort();

test('the editor uses 16 self-contained ForTests vessel modules', () => {
  assert.equal(SHIP_DESIGN_MODULE_VERSION, '0.8.8');
  assert.equal(SHIP_STRUCTURE_MODULE_VERSION, '0.8.8');
  assert.equal(SHIP_MODEL_MODULE_VERSION, '0.8.8');
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
  const hullAlgorithms = [];
  for (const [id, source] of sources) {
    for (const required of [
      'function halfBreadth(', 'function hullPoint(', 'function buildHull(',
      'function buildFramesAndPlanking(', 'function buildStern(', 'function buildBow(',
      'function buildRudderAndHelm(', 'function buildRailingsAndEquipment(',
      'function buildAnchors(', 'function buildCanvasSail(', 'buildAnchors(ctx.design,ctx)', 'buildCanvasSail(ctx,', 'function ensureSternTierComponents(', 'function buildRig(', 'function generate',
    ]) assert.ok(source.includes(required), id + ' must own ' + required);
    assert.ok(source.includes('createShipContext('), id + ' must construct its own context');
    assert.ok(source.includes('finishShipModel('), id + ' must finish through editor support');
    assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(source),
      id + ' still calls the old shared geometry engine');
    const match = source.match(/function halfBreadth\(d,t\)\s*\{([\s\S]*?)\}/);
    assert.ok(match, id + ' has a readable local hull breadth function');
    hullAlgorithms.push(match[1].trim());
  }
  assert.equal(new Set(hullAlgorithms).size, 16, 'All 16 ships must have different hull breadth algorithms');

  const kit = readFileSync(new URL('../ships/shared/ship-editor-kit.js', import.meta.url), 'utf8');
  assert.ok(kit.includes('createShipContext'));
  assert.ok(kit.includes('finishShipModel'));
  for (const geometryRoutine of ['function halfBreadth(', 'function hullPoint(', 'function buildHull(', 'function buildCanvasSail(', 'function buildRig(']) {
    assert.ok(!kit.includes(geometryRoutine), 'Editor kit must not contain vessel geometry: ' + geometryRoutine);
  }
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
      if (['galleon','carrack','first-rate'].includes(id)) {
        const sternTier = ship.userData.getPart('stern-tier-1');
        let taperedSternMeshes = 0;
        sternTier.traverse((object) => {
          if (object.isMesh && object.geometry?.type === 'ExtrudeGeometry') taperedSternMeshes += 1;
        });
        assert.ok(taperedSternMeshes > 0, id + ' should use a tapered, bevelled stern-tier shell');
        const sideWindows = ship.userData.getPart('stern-side-windows');
        let framedSideWindows = 0;
        sideWindows.traverse((object) => {
          if (object.isMesh && object.name === 'stern-side-window') framedSideWindows += 1;
        });
        assert.ok(framedSideWindows >= 6, id + ' should have framed gallery windows visible from port and starboard');
        let visibleGunports = 0;
        ship.userData.getPart('deck-fittings').traverse((object) => {
          if (object.isMesh && object.name.startsWith('gunport-')) visibleGunports += 1;
        });
        assert.ok(visibleGunports >= 20, id + ' should expose port openings and frames along its gun decks');
      }
      if (['galleon','carrack'].includes(id)) {
        assert.ok(ship.userData.getPart(id + '-forecastle'), id + ' raised forecastle assembly');
        assert.ok(ship.userData.getPart(id + '-forecastle-deck'), id + ' raised forecastle deck');
      }
      assert.ok(ship.userData.partNames.some((name) => name.startsWith('panel-seams-sail-')), id + ' editable sail panel seams');
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
