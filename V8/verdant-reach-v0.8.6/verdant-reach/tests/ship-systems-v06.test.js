import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  SHIP_DESIGNS, HISTORICAL_SHIP_KINDS, getShipDesign,
  getShipTypeFromCreativeKind, describeShipDimensions,
} from '../src/world/ship-designs.js';
import { TransportSystem } from '../src/systems/transport.js';
import { WorldEditSystem, CREATIVE_ENTITY_TYPES } from '../src/systems/world-editing.js';
import { MaritimeSystem, selectShipType } from '../src/systems/maritime.js';
import { createShipModel, disposeShipModel } from '../src/world/ship-models.js?v=0.8.6';
import { WorldGenerator } from '../src/world/terrain.js';
import { WorldIntelligence } from '../src/world/world-intelligence.js';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('v0.8.6 catalogue contains 16 distinct sailing-vessel families', () => {
  const expected = [
    'sloop', 'schooner', 'brigantine', 'brig', 'snow', 'cutter', 'frigate', 'barque',
    'caravel', 'carrack', 'galleon', 'fluyt', 'xebec', 'junk', 'first-rate', 'pinnace',
  ];
  assert.deepEqual(Object.keys(SHIP_DESIGNS), expected);
  assert.deepEqual(HISTORICAL_SHIP_KINDS, expected.map((id) => 'ship-' + id));
  assert.equal(CREATIVE_ENTITY_TYPES.filter((kind) => kind.startsWith('ship-')).length, expected.length);
  for (const id of expected) {
    const design = getShipDesign(id);
    assert.ok(design);
    assert.ok(design.hullLength > design.beam * 2.5, id + ' has an implausibly short hull ratio');
    assert.ok(design.beam > 0 && design.draft > 0);
    assert.ok(design.masts.length > 0);
    assert.ok(design.sources.length > 0);
    assert.equal(new Set(design.partNames).size, design.partNames.length, id + ' part catalogue must be unique');
    assert.ok(design.structure.frameCount >= 12);
    assert.equal(getShipDesign('ship-' + id).id, id);
    assert.equal(getShipTypeFromCreativeKind('ship-' + id), id);
    assert.match(describeShipDimensions(design), /m × .*m/);
  }
  assert.equal(SHIP_DESIGNS.snow.mastCount, 2);
  assert.equal(SHIP_DESIGNS.snow.totalMastSpars, 3);
  assert.equal(SHIP_DESIGNS.junk.mastCount, 3);
  assert.equal(SHIP_DESIGNS['first-rate'].mastCount, 3);
  assert.equal(getShipTypeFromCreativeKind('large-ship'), 'galleon');
  assert.equal(getShipTypeFromCreativeKind('sailing-ship'), 'sloop');
});

test('runtime models expose the full catalogue part hierarchy', () => {
  for (const id of Object.keys(SHIP_DESIGNS)) {
    const ship = createShipModel(id);
    try {
      const actual = new Set(ship.userData.partNames);
      for (const partName of SHIP_DESIGNS[id].partNames) {
        assert.ok(actual.has(partName), id + ' runtime model is missing component ' + partName);
      }
      assert.ok(actual.has('hull'));
      assert.ok(actual.has('deck'));
      assert.ok(actual.has('rudder'));
      assert.ok(actual.has('helm-wheel'));
      assert.ok(actual.has('stern-windows'));
      assert.ok(ship.userData.ownedGeometries.length > 0);
      assert.ok(ship.userData.ownedMaterials.length > 0);
    } finally {
      disposeShipModel(ship);
    }
  }
});

test('Chinese junk rig uses individual battens and a separate sail group per mast', () => {
  const ship = createShipModel('junk');
  try {
    for (const mast of ['fore', 'main', 'mizzen']) {
      assert.ok(ship.userData.getPart('mast-' + mast));
      assert.ok(ship.userData.getPart('junk-yard-' + mast));
      assert.ok(ship.userData.getPart('junk-battens-' + mast));
      assert.ok(ship.userData.getPart('junk-sheets-' + mast));
      assert.ok(ship.userData.getPart('sail-' + mast + '-junk'));
      for (let index = 1; index <= 7; index += 1) assert.ok(ship.userData.getPart('batten-' + mast + '-' + index));
      assert.equal(ship.userData.getPart('standing-rigging-' + mast), null);
    }
  } finally {
    disposeShipModel(ship);
  }
});

test('first-rate dimensional reference uses a long, deep hull and independently editable tiers', () => {
  const design = SHIP_DESIGNS['first-rate'];
  assert.equal(design.hullLength, 56.73);
  assert.equal(design.beam, 15.79);
  assert.ok(design.reference.includes('186 ft (56.73 m) gun-deck length'));
  assert.ok(design.draft > 5);
  assert.ok(design.structure.frameCount >= 40);
  const ship = createShipModel('first-rate');
  try {
    for (const tier of ['stern-tier-1', 'stern-tier-2', 'stern-tier-3']) {
      assert.ok(ship.userData.getPart(tier));
    }
    assert.ok(ship.userData.getPart('mast-main'));
    assert.ok(ship.userData.getPart('sail-main-course'));
  } finally {
    disposeShipModel(ship);
  }
});

test('maritime routes select appropriate vessel classes by voyage distance', () => {
  assert.equal(selectShipType({ distance: 1200 }, 'rations'), 'sloop');
  assert.equal(selectShipType({ distance: 4200 }, 'rations'), 'brigantine');
  assert.equal(selectShipType({ distance: 8200 }, 'rations'), 'schooner');
  assert.equal(selectShipType({ distance: 15000 }, 'rations'), 'galleon');
  assert.equal(selectShipType({ distance: 4200 }, 'timber'), 'fluyt');
  assert.equal(selectShipType({ distance: 500 }, 'fish'), 'pinnace');
  assert.equal(selectShipType({ distance: 14000 }, 'rations'), 'frigate');
  assert.equal(selectShipType({ distance: 18000 }, 'rations'), 'carrack');
});

test('maritime voyage stores the selected hull family and reverses return cargo paths', () => {
  const maritime = new MaritimeSystem({ heightAt: () => -20 });
  const route = {
    id: 'sea-route:a|b', fromId: 'port:a', toId: 'port:b', distance: 15000,
    path: [{ x: -100, z: 4 }, { x: 0, z: 0 }, { x: 100, z: -4 }],
  };
  maritime.routes.set(route.id, route);
  const states = new Map([
    ['port:a', { id: 'port:a', stock: { rations: 0, fish: 0, herbs: 0, timber: 0 }, wealth: 100 }],
    ['port:b', { id: 'port:b', stock: { rations: 0, fish: 0, herbs: 0, timber: 15 }, wealth: 100 }],
  ]);
  const voyage = maritime._dispatch(route, 3, states);
  assert.ok(voyage);
  assert.equal(voyage.shipType, 'galleon');
  assert.equal(voyage.fromId, 'port:b');
  assert.equal(voyage.toId, 'port:a');
  assert.deepEqual(voyage.path[0], route.path.at(-1));
  assert.deepEqual(voyage.path.at(-1), route.path[0]);
  const restored = new MaritimeSystem({ heightAt: () => -20 }, maritime.getSaveData());
  assert.equal(restored.voyages[0].shipType, 'galleon');
  assert.deepEqual(restored.voyages[0].path, voyage.path);
});

test('player transport persists vessel type and design-dependent movement values', () => {
  const transport = new TransportSystem();
  const schooner = getShipDesign('schooner');
  assert.equal(transport.mount({ id: 'ship:test', mode: 'boat', vesselType: 'schooner', deckHeight: schooner.deckHeightUnits }), true);
  assert.equal(transport.movementProfile().speed, schooner.sailingSpeed * 0.514444 * 4 / 3 * 3);
  const restored = new TransportSystem(transport.getSaveData());
  assert.equal(restored.vesselType, 'schooner');
  assert.equal(restored.deckHeight, schooner.deckHeightUnits);
  assert.equal(restored.movementProfile().speed, schooner.sailingSpeed * 0.514444 * 4 / 3 * 3);
  restored.mount({ id: 'ship:first-rate', mode: 'boat', vesselType: 'first-rate', deckHeight: getShipDesign('first-rate').deckHeightUnits });
  assert.ok(restored.movementProfile().speed < schooner.sailingSpeed * 0.514444 * 4 / 3 * 3);
  assert.ok(restored.movementProfile().turnRate > 0);
  assert.ok(restored.movementProfile().draft > 0);
  restored.dismount();
  assert.equal(restored.vesselType, null);
});

test('Creative object duplication and save restoration preserve ship state', () => {
  const edits = new WorldEditSystem();
  const ship = edits.summon('ship-galleon', 20, 40, { yaw: 0.25, scale: 1.2, y: -0.12, shipState: {
    partTransforms: { 'sail-main-course': { x: .5, y: 0, z: -.2, rx: 0, ry: .1, rz: 0 } },
    hiddenParts: { 'anchor-port': true },
  } });
  assert.ok(ship);
  const duplicate = edits.duplicateEntity(ship.id, 100, 120);
  assert.ok(duplicate);
  assert.deepEqual(duplicate.shipState, ship.shipState);
  duplicate.shipState.partTransforms['sail-main-course'].x = 4;
  assert.equal(ship.shipState.partTransforms['sail-main-course'].x, .5);
  const restored = new WorldEditSystem(edits.getSaveData());
  assert.deepEqual(restored.entities.find((item) => item.id === ship.id).shipState, ship.shipState);
  assert.equal(edits.undo(), true);
  assert.equal(edits.redo(), true);
});

test('the replacement model builder uses high-resolution hull lofts and editable curved structures', () => {
  const source = read('src/world/ships/core/ship-model-builder.js');
  const structures = read('src/world/ships/core/ship-structures.js');
  const firstRate = read('src/world/ships/vessels/first-rate.js');
  for (const token of ['hullGeometry', 'deckGeometry', 'sternHouseGeometry', 'addJunkRig', 'addFrames', 'addStrakesAndPlanking', 'setupPartApi', 'createShipModel', 'disposeShipModel']) {
    assert.ok(source.includes(token), 'missing model feature: ' + token);
  }
  assert.match(source, /const stations = 96/);
  assert.match(source, /const ringSegments = 40/);
  assert.ok(structures.includes('getHullHalfBeam'));
  assert.ok(structures.includes('getHullSectionWidth'));
  assert.ok(structures.includes('getDeckSheer'));
  assert.ok(firstRate.includes("id: 'first-rate'"));
  assert.ok(firstRate.includes('frameCount: 42'));
  assert.ok(structures.includes('junk:'));
});

test('all historical vessels are available in the Creative editor', () => {
  const ui = read('src/ui/interface.js');
  const worldEditing = read('src/systems/world-editing.js');
  const main = read('src/main.js');
  for (const kind of HISTORICAL_SHIP_KINDS) assert.ok(CREATIVE_ENTITY_TYPES.includes(kind));
  assert.ok(worldEditing.includes('...HISTORICAL_SHIP_KINDS'));
  for (const action of ['move-selected', 'rotate-selected', 'duplicate-selected', 'delete-selected', 'undo', 'redo']) {
    assert.ok(ui.includes('data-creative-action="' + action + '"'));
    assert.ok(main.includes("'" + action + "'"));
  }
  assert.ok(ui.includes('ship-model-grid'));
  assert.ok(main.includes('creativePlacement'));
});

test('version metadata and browser entry identify v0.8.6', () => {
  const pkg = JSON.parse(read('package.json'));
  const html = read('index.html');
  assert.equal(pkg.version, '0.8.6');
  assert.match(html, /styles\.css\?v=0\.8\.6/);
  assert.match(html, /main\.js\?v=0\.8\.6/);
  assert.match(read('src/main.js'), /version: '0\.8\.6'/);
  assert.match(read('src/ui/interface.js'), /v0\.8\.6/);
});

test('waterfall sites remain deterministic in the prior world systems', () => {
  const first = new WorldIntelligence(new WorldGenerator('WAYFARER-TEST-040'));
  const second = new WorldIntelligence(new WorldGenerator('WAYFARER-TEST-040'));
  const a = first.riversInBounds(-14000, -14000, 14000, 14000);
  const b = second.riversInBounds(-14000, -14000, 14000, 14000);
  assert.deepEqual(a, b);
  const falls = a.flatMap((river) => river.waterfalls ?? []);
  assert.ok(falls.length > 0);
  assert.ok(falls.every((fall) => fall.drop >= 4.5 && fall.topY > fall.bottomY));
  assert.ok(read('src/world/world-actors.js').includes('river.waterfalls'));
});
