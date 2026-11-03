import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SHIP_DESIGNS, HISTORICAL_SHIP_KINDS, WORLD_UNITS_PER_METRE, getShipDesign } from '../src/world/ship-designs.js';
import { WorldEditSystem } from '../src/systems/world-editing.js';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

 test('v0.8 fleet contains a broad Atlantic-Caribbean range of historically distinct vessel families', () => {
  assert.equal(HISTORICAL_SHIP_KINDS.length, 14);
  for (const id of Object.keys(SHIP_DESIGNS)) {
    const design = getShipDesign(id);
    assert.ok(design.hullLength > design.beam * 2.5, `${id} length/beam ratio is too short`);
    assert.ok(design.beam > 0 && design.draft > 0);
    assert.ok(design.masts.length > 0);
    assert.ok(design.sources.length > 0, `${id} needs a historical source or source note`);
    assert.equal(new Set(design.partNames).size, design.partNames.length, `${id} part catalogue should not contain duplicate names`);
  }
  assert.ok(SHIP_DESIGNS.galleon.hullLength > SHIP_DESIGNS.sloop.hullLength);
  assert.ok(SHIP_DESIGNS.galleon.beam > SHIP_DESIGNS.sloop.beam);
  assert.equal(SHIP_DESIGNS.fluyt.mastCount, 2);
  assert.equal(SHIP_DESIGNS.snow.mastCount, 2);
  assert.equal(SHIP_DESIGNS.snow.totalMastSpars, 3);
});

test('vessel dimensions use the same real-world scale as the player character', () => {
  const avatarHeightMetres = 1.8;
  const avatarHeightUnits = avatarHeightMetres * WORLD_UNITS_PER_METRE;
  assert.ok(Math.abs(avatarHeightUnits - 2.4) < 1e-9);
  for (const design of Object.values(SHIP_DESIGNS)) {
    const lengthUnits = design.hullLength * WORLD_UNITS_PER_METRE;
    const beamUnits = design.beam * WORLD_UNITS_PER_METRE;
    assert.ok(lengthUnits > avatarHeightUnits * 4, `${design.id} must visibly exceed character size`);
    assert.ok(beamUnits > avatarHeightUnits, `${design.id} beam should be character-scale plausible`);
    assert.ok(Math.abs(lengthUnits / beamUnits - design.lengthBeamRatio) < 1e-9);
  }
});

test('every vessel describes a separate component hierarchy for hull, stern, railings, rig, anchors and helm', () => {
  for (const design of Object.values(SHIP_DESIGNS)) {
    for (const name of ['hull', 'hull-strakes', 'deck', 'keel', 'sternworks', 'stern-gallery', 'railings', 'railings-port', 'railings-starboard', 'rudder', 'helm-wheel', 'anchors', 'anchor-port', 'anchor-starboard', 'anchor-chain-port', 'anchor-chain-starboard']) {
      assert.ok(design.partNames.includes(name), `${design.id} is missing ${name}`);
    }
    for (const mast of design.masts) {
      for (const name of [`mast-${mast.id}`, `mast-lower-${mast.id}`, `mast-topmast-${mast.id}`, `mast-step-${mast.id}`, `standing-rigging-${mast.id}`, `running-rigging-${mast.id}`, `shrouds-${mast.id}`, `ratlines-${mast.id}`, `mast-stays-${mast.id}`, `running-braces-${mast.id}`]) {
        assert.ok(design.partNames.includes(name), `${design.id} is missing ${name}`);
      }
    }
  }
});

test('model builder has high-resolution hulls and independently linked ship anatomy', () => {
  const source = read('src/world/ship-models.js');
  for (const token of [
    'addLoftGeometry', 'const stations = 56', 'const ringSegments = 24',
    'addSternworks', 'addRailings', 'addHullStrakes', 'addAnchors',
    'mast-lower-${mast.id}', 'mast-topmast-${mast.id}', 'shroud-${mast.id}',
    'ratlines-${mast.id}', 'running-braces-${mast.id}', 'stern-gallery',
    'helm-wheel', 'setPartTransform', 'resetPartTransform', 'detachPart', 'relinkPart',
    'getShipState', 'applyShipState', 'disposeShipModel',
  ]) assert.ok(source.includes(token), `missing model feature ${token}`);
  assert.match(source, /new THREE\.TubeGeometry\(railCurve/);
  assert.match(source, /new THREE\.CatmullRomCurve3\(railPoints\)/);
  assert.match(source, /transformBase\.set\(name, removeTransformOffset/);
});

test('part transforms persist in saves, undo, redo and duplicated Creative vessels', () => {
  const edits = new WorldEditSystem();
  const ship = edits.summon('ship-galleon', 10, 20, { shipState: {
    partTransforms: { 'sail-main-course': { x: 1.25, y: 0.1, z: -0.5, rx: 0.1, ry: 0.2, rz: 0 } },
    hiddenParts: { 'anchor-port': true }, unlinkedParts: ['anchor-starboard'],
  } });
  assert.ok(ship);
  const duplicate = edits.duplicateEntity(ship.id, 100, 200);
  assert.deepEqual(duplicate.shipState, ship.shipState);
  duplicate.shipState.partTransforms['sail-main-course'].x = 3;
  assert.equal(ship.shipState.partTransforms['sail-main-course'].x, 1.25, 'nested transform state must be deep-copied');
  const saved = edits.getSaveData();
  const restored = new WorldEditSystem(saved);
  assert.deepEqual(restored.entities.find((item) => item.id === ship.id).shipState.partTransforms, ship.shipState.partTransforms);
  assert.equal(edits.undo(), true, 'undo history should operate within the current editor session');
  assert.equal(edits.entities.length, 1);
  assert.equal(edits.redo(), true);
  assert.equal(edits.entities.length, 2);
});

test('Creative shipyard exposes local position and rotation controls with real handlers', () => {
  const ui = read('src/ui/interface.js');
  const main = read('src/main.js');
  const css = read('src/styles.css');
  for (const id of ['creative-ship-part-x', 'creative-ship-part-y', 'creative-ship-part-z', 'creative-ship-part-rx', 'creative-ship-part-ry', 'creative-ship-part-rz']) {
    assert.ok(ui.includes(`id="${id}"`), `missing ${id}`);
    assert.ok(ui.includes(`value('${id}')`), `missing event binding for ${id}`);
  }
  assert.ok(ui.includes('data-creative-action="ship-part-transform"'));
  assert.ok(ui.includes('data-creative-action="ship-part-reset"'));
  assert.ok(main.includes("action === 'ship-part-transform'"));
  assert.ok(main.includes("action === 'ship-part-reset'"));
  assert.ok(main.includes('WORLD_UNITS_PER_METRE'));
  assert.ok(css.includes('.creative-grid-two'));
});

test('legacy vessel aliases still load the replacement fleet and old saves default component transforms safely', () => {
  const designs = read('src/world/ship-designs.js');
  const editing = read('src/systems/world-editing.js');
  assert.match(designs, /'sailing-ship': 'sloop'/);
  assert.match(designs, /'large-ship': 'galleon'/);
  assert.match(editing, /partTransforms: Object\.fromEntries/);
  assert.match(editing, /state\.partTransforms \?\? \{\}/);
});

test('Creative ship cards expose historical evidence and reference links for every vessel family', () => {
  const ui = read('src/ui/interface.js');
  const models = read('src/world/ship-models.js');
  assert.ok(ui.includes('design.reference'));
  assert.ok(ui.includes('design.sources'));
  assert.ok(ui.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(ui.includes('Reference / reconstruction note'));
  assert.ok(models.includes('sources: design.sources.map'));
  assert.ok(models.includes('hullProfile: design.hullProfile'));
});

test('vessel catalogue clearly distinguishes measured reference data from game reconstruction estimates', () => {
  for (const design of Object.values(SHIP_DESIGNS)) {
    assert.ok(design.reference.trim().length > 30, `${design.id} needs an explanation of its reference basis`);
    assert.ok(design.sources.every((source) => /^https:\/\//.test(source.url)), `${design.id} sources should be secure web links`);
    assert.ok(design.hullProfile.trim().length > 15, `${design.id} needs a distinct hull profile note`);
  }
  assert.match(SHIP_DESIGNS.xebec.era, /uncommon Atlantic visitor/i);
  assert.match(SHIP_DESIGNS.pinnace.reference, /game-design reconstruction/i);
});

test('selected larger sailing designs expose independently selectable closed hull-port details', () => {
  const models = read('src/world/ship-models.js');
  assert.ok(models.includes('function addDecorativeGunports'));
  assert.ok(models.includes('closed-port-shutter'));
  assert.ok(models.includes('addDecorativeGunports(design, root, registry, mats)'));
  for (const id of ['brigantine', 'brig', 'snow', 'frigate', 'barque', 'carrack', 'galleon']) {
    const design = SHIP_DESIGNS[id];
    assert.ok(design.gunportRows > 0, `${id} should define decorative closed ports`);
    assert.ok(design.partNames.includes('gunports'));
    assert.ok(design.partNames.includes('gunports-port'));
    assert.ok(design.partNames.includes('gunports-starboard'));
    assert.ok(design.partNames.includes(`gunport-shutter-port-${design.gunportsPerRow}`));
    assert.ok(design.partNames.includes(`gunport-shutter-starboard-${design.gunportsPerRow}`));
  }
  assert.equal(SHIP_DESIGNS.sloop.gunportRows ?? 0, 0);
});

test('headsail trim is attached to the actual foremast ID, including single-mast vessels', () => {
  const models = read('src/world/ship-models.js');
  assert.ok(models.includes("mastId: fore.id, kind: 'headsail'"));
  assert.ok(!models.includes("mastId: 'fore', kind: 'headsail'"));
  assert.equal(SHIP_DESIGNS.sloop.masts[0].id, 'single');
  assert.equal(SHIP_DESIGNS.cutter.masts[0].id, 'single');
});


test('v0.8.1 shipyard preserves selection and restores saved component controls', () => {
  const ui = read('src/ui/interface.js');
  assert.ok(ui.includes('creativeShipSelection'));
  assert.ok(ui.includes('this._bindCreativeShipyard(state)'));
  assert.ok(ui.includes('saved.partTransforms?.[part]'));
  assert.ok(ui.includes('saved.sailTrim?.[mast]'));
  assert.ok(ui.includes('creative-ship-specs'));
  assert.ok(ui.includes('WORLD_UNITS_PER_METRE'));
});

test('v0.8.1 transform copy and paste covers all six local transform values', () => {
  const ui = read('src/ui/interface.js');
  for (const id of ['creative-ship-transform-copy', 'creative-ship-transform-paste']) assert.ok(ui.includes(id));
  for (const id of ['creative-ship-part-x', 'creative-ship-part-y', 'creative-ship-part-z', 'creative-ship-part-rx', 'creative-ship-part-ry', 'creative-ship-part-rz']) assert.ok(ui.includes(id));
  assert.ok(ui.includes("Math.round((Number(value('creative-ship-part-x')) || 0) * 10) / 10"));
  assert.ok(ui.includes("Math.round((Number(value('creative-ship-part-y')) || 0) * 10) / 10"));
  assert.ok(ui.includes("Math.round((Number(value('creative-ship-part-z')) || 0) * 10) / 10"));
});

test('v0.8.1 ship restore reapplies saved hierarchy before component offsets', () => {
  const models = read('src/world/ship-models.js');
  const start = models.indexOf('applyShipState(saved = {})');
  const end = models.indexOf('summary()', start);
  const block = models.slice(start, end);
  const detach = block.indexOf('api.detachPart(name)');
  const transform = block.indexOf('api.setPartTransform(name, transform)');
  const rudder = block.indexOf('api.setRudderAngle(saved.rudderAngle ?? 0)');
  assert.ok(detach >= 0 && transform > detach && rudder > transform);
});

test('v0.8.2 cache-busts the browser entry and road module graph', () => {
  const html = read('index.html');
  const main = read('src/main.js');
  const ui = read('src/ui/interface.js');
  const entities = read('src/world/creative-entities.js');
  const models = read('src/world/ship-models.js');
  assert.ok(html.includes('styles.css?v=0.8.2'));
  assert.ok(html.includes('main.js?v=0.8.2'));
  assert.ok(main.includes('world-intelligence.js?v=0.8.2'));
  assert.ok(main.includes('world-actors.js?v=0.8.2'));
  assert.ok(ui.includes('ship-designs.js?v=0.8.1'));
  assert.ok(entities.includes('ship-models.js?v=0.8.1'));
  assert.ok(models.includes('ship-designs.js?v=0.8.1'));
});
