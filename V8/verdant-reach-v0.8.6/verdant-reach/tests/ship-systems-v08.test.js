import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SHIP_DESIGNS, HISTORICAL_SHIP_KINDS, WORLD_UNITS_PER_METRE, getShipDesign } from '../src/world/ship-designs.js';
import { WorldEditSystem } from '../src/systems/world-editing.js';
import { createShip, disposeShipModel } from '../src/world/ships/index.js?v=0.8.10';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('each vessel has a distinct, documented structural blueprint', () => {
  assert.equal(HISTORICAL_SHIP_KINDS.length, 16);
  for (const id of Object.keys(SHIP_DESIGNS)) {
    const design = getShipDesign(id);
    assert.ok(design.structure.frameCount >= 12);
    assert.ok(design.hullProfile.length > 15);
    assert.ok(design.reference.length > 30);
    assert.ok(design.sources.length > 0);
    assert.ok(design.partNames.includes('hull'));
    assert.ok(design.partNames.includes('hull-strakes'));
    assert.ok(design.partNames.includes('deck'));
    assert.ok(design.partNames.includes('deck-planks'));
    assert.ok(design.partNames.includes('keel'));
    assert.ok(design.partNames.includes('sternworks'));
    assert.ok(design.partNames.includes('stern-gallery'));
    assert.ok(design.partNames.includes('stern-windows'));
    assert.ok(design.partNames.includes('rudder'));
    assert.ok(design.partNames.includes('helm-wheel'));
    assert.ok(design.partNames.includes('anchors'));
    assert.ok(design.partNames.includes('railings-port'));
    assert.ok(design.partNames.includes('railings-starboard'));
    assert.ok(design.partNames.includes('head-sails'));
    assert.equal(new Set(design.partNames).size, design.partNames.length);
  }
  assert.notDeepEqual(SHIP_DESIGNS.sloop.structure, SHIP_DESIGNS.galleon.structure);
  assert.notDeepEqual(SHIP_DESIGNS.junk.structure, SHIP_DESIGNS['first-rate'].structure);
});

test('player and vessel dimensions share the established world scale', () => {
  assert.equal(WORLD_UNITS_PER_METRE, 4 / 3);
  assert.equal(1.8 * WORLD_UNITS_PER_METRE, 2.4);
  for (const design of Object.values(SHIP_DESIGNS)) {
    assert.equal(design.hullLengthUnits, design.hullLength * WORLD_UNITS_PER_METRE);
    assert.equal(design.beamUnits, design.beam * WORLD_UNITS_PER_METRE);
    assert.equal(design.draftUnits, design.draft * WORLD_UNITS_PER_METRE);
    assert.ok(design.lengthBeamRatio > 2.5);
  }
});

test('square, gaff, lateen, snow and junk rigs publish the right independent components', () => {
  const junk = SHIP_DESIGNS.junk;
  assert.ok(junk.partNames.includes('junk-yard-main'));
  assert.ok(junk.partNames.includes('junk-battens-main'));
  assert.ok(junk.partNames.includes('junk-sheets-main'));
  assert.ok(junk.partNames.includes('sail-main-junk'));
  for (let index = 1; index <= 7; index += 1) assert.ok(junk.partNames.includes('batten-main-' + index));
  assert.ok(!junk.partNames.includes('standing-rigging-main'));

  const square = SHIP_DESIGNS.brig;
  assert.ok(square.partNames.includes('yard-fore-course'));
  assert.ok(square.partNames.includes('sail-fore-course'));
  assert.ok(square.partNames.includes('cloth-sail-fore-course'));
  assert.ok(SHIP_DESIGNS.schooner.partNames.includes('sail-main-gaff'));
  assert.ok(SHIP_DESIGNS.caravel.partNames.includes('lateen-yard-main'));
  assert.ok(SHIP_DESIGNS.snow.partNames.includes('mast-trysail'));
});

test('stern tiers are individual curved structures and match each design tier count', () => {
  const counts = {
    'galleon-castle': 3, 'high-aftercastle': 3, 'first-rate-aftercastle': 3,
    quarterdeck: 2, 'low-quarter': 2, 'fluyt-roundhouse': 2, 'low-cabin': 1,
    'xebec-platform': 1, 'open-boat': 0, 'transom': 0,
  };
  for (const design of Object.values(SHIP_DESIGNS)) {
    const expected = counts[design.sternwork] ?? 1;
    const actual = design.partNames.filter((name) => /^stern-tier-\d+$/.test(name)).length;
    assert.equal(actual, expected, design.id);
  }
});

test('Creative ship saves preserve editable hierarchy and all six component transform values', () => {
  const edits = new WorldEditSystem();
  const ship = edits.summon('ship-junk', 10, 20, { shipState: {
    partTransforms: { 'sail-main-junk': { x: .5, y: .1, z: -.2, rx: .1, ry: .2, rz: .3 } },
    hiddenParts: { 'anchor-port': true },
    unlinkedParts: ['anchor-starboard'],
    sailDeployment: { main: 'reefed' },
    transformFrameVersion: 2,
  } });
  assert.ok(ship);
  assert.deepEqual(ship.shipState.sailDeployment, { main: 'reefed' });
  assert.equal(ship.shipState.transformFrameVersion, 2);
  const duplicate = edits.duplicateEntity(ship.id, 40, 60);
  assert.deepEqual(duplicate.shipState, ship.shipState);
  duplicate.shipState.partTransforms['sail-main-junk'].x = 5;
  duplicate.shipState.sailDeployment.main = 'full';
  duplicate.shipState.transformFrameVersion = 1;
  assert.equal(ship.shipState.partTransforms['sail-main-junk'].x, .5);
  assert.equal(ship.shipState.sailDeployment.main, 'reefed');
  assert.equal(ship.shipState.transformFrameVersion, 2);
  const restored = new WorldEditSystem(edits.getSaveData());
  assert.deepEqual(restored.entities.find((item) => item.id === ship.id).shipState, ship.shipState);
  const legacy = new WorldEditSystem({ entities: [{ id: 'legacy', kind: 'ship-junk', x: 0, z: 0, shipState: { rudderAngle: 0.1 } }] });
  const legacyState = legacy.getSaveData().entities[0].shipState;
  assert.deepEqual(legacyState.sailDeployment, {});
  assert.equal(Object.hasOwn(legacyState, 'transformFrameVersion'), false);
});

test('Creative Shipyard retains local transform, mast and deployment controls', () => {
  const ui = read('src/ui/interface.js');
  const main = read('src/main.js');
  const css = read('src/styles.css');
  for (const id of ['creative-ship-part-x', 'creative-ship-part-y', 'creative-ship-part-z', 'creative-ship-part-rx', 'creative-ship-part-ry', 'creative-ship-part-rz']) {
    assert.ok(ui.includes('id="' + id + '"'));
    assert.ok(ui.includes("value('" + id + "')"));
  }
  for (const action of ['ship-part-transform', 'ship-part-reset', 'ship-sail-deployment', 'ship-sail-trim', 'ship-rudder', 'ship-mast-lean']) {
    assert.ok(ui.includes('data-creative-action="' + action + '"'));
    assert.ok(main.includes("'" + action + "'"));
  }
  assert.ok(ui.includes('creative-ship-transform-copy'));
  assert.ok(ui.includes('creative-ship-transform-paste'));
  assert.ok(css.includes('.creative-grid-two'));
});

test('v0.8.6 game shell and v0.8.10 component-first ship modules use consistent cache revisions', () => {
  const html = read('index.html');
  const main = read('src/main.js');
  const ui = read('src/ui/interface.js');
  const entities = read('src/world/creative-entities.js');
  const designs = read('src/world/ships/core/ship-designs.js');
  const models = read('src/world/ships/core/ship-model-builder.js');
  const structures = read('src/world/ships/core/ship-structures.js');
  const hullMath = read('src/world/ships/core/ship-hull-parameterization.js');
  const registry = read('src/world/ships/index.js');
  const vessels = read('src/world/ships/vessels/index.js');
  const definition = read('src/world/ships/core/vessel-definition.js');
  const kit = read('src/world/ships/core/ship-editor-kit.js');
  assert.ok(html.includes('styles.css?v=0.8.6'));
  assert.ok(html.includes('main.js?v=0.8.6'));
  assert.ok(main.includes('creative-entities.js?v=0.8.6'));
  assert.ok(main.includes('ship-designs.js?v=0.8.6'));
  assert.ok(ui.includes('ship-designs.js?v=0.8.6'));
  assert.ok(entities.includes('ships/index.js?v=0.8.6'));
  assert.ok(designs.includes('vessel-definition.js?v=0.8.10'));
  assert.ok(designs.includes('vessels/index.js?v=0.8.10'));
  assert.ok(structures.includes('ship-hull-parameterization.js?v=0.8.10'));
  assert.ok(structures.includes('vessel-definition.js?v=0.8.10'));
  assert.ok(models.includes('../index.js?v=0.8.10'));
  assert.ok(models.includes('ship-editor-kit.js?v=0.8.10'));
  assert.ok(definition.includes("SHIP_CATALOGUE_VERSION='0.8.10'"));
  assert.ok(kit.includes("SHIP_EDITOR_KIT_VERSION='0.8.10'"));
  assert.ok(hullMath.includes('getLongitudinalHalfBeamRatio'));
  assert.ok(hullMath.includes('getCrossSectionHalfBreadthRatio'));
  assert.ok(hullMath.includes('getKeelLineHeight'));
  assert.ok(registry.includes('VESSEL_SPECS'));
  assert.ok(registry.includes('VESSEL_IDS.map'));
  assert.ok(registry.includes('vessel.createModel(transforms, savedState)'));
  assert.ok(vessels.includes("./sloop/sloop.js"));
  assert.ok(registry.includes('getShipGenerator(type)'));
  assert.ok(structures.includes('getHullHalfBeam'));
  const generated = createShip('sloop', {}, { rudderAngle: 0.17, sailDeployment: { single: 'reefed' }, transformFrameVersion: 2 });
  try {
    assert.equal(generated.userData.shipType, 'sloop');
    assert.equal(generated.userData.shipGeneratorId, 'sloop');
    const state = generated.userData.getShipState();
    assert.ok(Math.abs(state.rudderAngle - 0.17) < 1e-8);
    assert.equal(state.sailDeployment.single, 'reefed');
    assert.equal(state.transformFrameVersion, 2);
  } finally {
    disposeShipModel(generated);
  }
});

test('older save aliases remain supported', () => {
  const designs = read('src/world/ships/core/ship-designs.js');
  assert.match(designs, /'sailing-ship': 'sloop'/);
  assert.match(designs, /'large-ship': 'galleon'/);
});
