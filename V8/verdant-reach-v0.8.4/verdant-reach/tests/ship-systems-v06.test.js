import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SHIP_DESIGNS, HISTORICAL_SHIP_KINDS, getShipDesign, getShipTypeFromCreativeKind, describeShipDimensions } from '../src/world/ship-designs.js';
import { TransportSystem } from '../src/systems/transport.js';
import { WorldEditSystem, CREATIVE_ENTITY_TYPES } from '../src/systems/world-editing.js';
import { MaritimeSystem, selectShipType } from '../src/systems/maritime.js';
import { createShipModel } from '../src/world/ship-models.js?v=0.8.4-completion';
import { WorldGenerator } from '../src/world/terrain.js';
import { WorldIntelligence } from '../src/world/world-intelligence.js';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('historical ship catalogue has distinct hull proportions, mast counts and rig plans', () => {
  assert.deepEqual(HISTORICAL_SHIP_KINDS, ['ship-sloop', 'ship-schooner', 'ship-brigantine', 'ship-brig', 'ship-snow', 'ship-cutter', 'ship-frigate', 'ship-barque', 'ship-caravel', 'ship-carrack', 'ship-galleon', 'ship-fluyt', 'ship-xebec', 'ship-pinnace']);
  const ids = Object.keys(SHIP_DESIGNS);
  assert.equal(ids.length, 14);
  for (const id of ids) {
    const design = getShipDesign(id);
    assert.ok(design.hullLength > design.beam * 2.5);
    assert.ok(design.beam > 0 && design.draft > 0);
    assert.equal(design.mastHeights.length, design.totalMastSpars);
    assert.ok(design.mastCount > 0 && design.mastCount <= design.totalMastSpars);
    assert.ok(design.rig.length > 15);
    assert.ok(design.sources?.length, `${id} should retain its research source`);
    assert.match(design.hullFormNote, /not .*traced/i);
    assert.ok(design.lengthBeamRatio > 2.5);
    assert.match(describeShipDimensions(design), /m × .*m/);
    assert.equal(getShipDesign(`ship-${id}`).id, id);
    assert.equal(getShipTypeFromCreativeKind(`ship-${id}`), id);
  }
  assert.notEqual(SHIP_DESIGNS.sloop.rig, SHIP_DESIGNS.schooner.rig);
  assert.notEqual(SHIP_DESIGNS.brigantine.mastCount, SHIP_DESIGNS.galleon.mastCount);
  assert.equal(SHIP_DESIGNS.snow.mastCount, 2);
  assert.equal(SHIP_DESIGNS.snow.totalMastSpars, 3);
  assert.equal(getShipTypeFromCreativeKind('large-ship'), 'galleon');
  assert.equal(getShipTypeFromCreativeKind('sailing-ship'), 'sloop');
});

test('galleon runtime model exposes the detailed sterncastle component hierarchy', () => {
  const ship = createShipModel('galleon');
  try {
    const getPart = ship.userData.getPart;
    assert.ok(getPart('galleon-stern-lower-deckhouse'));
    assert.ok(getPart('galleon-stern-middle-deckhouse'));
    assert.ok(getPart('galleon-stern-upper-deckhouse'));
    assert.ok(getPart('galleon-upper-gallery-platform'));
    const names = [];
    ship.traverse((object) => { if (object.name) names.push(object.name); });
    assert.ok(names.some((name) => name.includes('lower-stern-window')));
    assert.ok(names.some((name) => name.includes('middle-side-window')));
    assert.ok(names.includes('galleon-stern-lantern-frame'));
    const lower = getPart('galleon-stern-lower-deckhouse');
    const body = lower.getObjectByName('tapered-lower-sterncastle-body');
    assert.ok(body?.geometry?.getAttribute('position')?.count >= 32);
    assert.ok(body.geometry.index?.count >= 144);
  } finally {
    ship.traverse((object) => {
      if (object.userData?.shipOwned) object.geometry?.dispose?.();
    });
    for (const material of new Set(ship.userData.shipOwnedMaterials ?? [])) material.dispose?.();
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

test('maritime voyage loads the selected ship class and reverses path for reverse-direction cargo', () => {
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
  const saved = maritime.getSaveData();
  const restored = new MaritimeSystem({ heightAt: () => -20 }, saved);
  assert.equal(restored.voyages[0].shipType, 'galleon');
  assert.deepEqual(restored.voyages[0].path, voyage.path);
});

test('player transport stores historical vessel type and uses distinct handling speeds', () => {
  const transport = new TransportSystem();
  const schooner = getShipDesign('schooner');
  assert.equal(transport.mount({ id: 'ship:test', mode: 'boat', vesselType: 'schooner', deckHeight: schooner.deckHeightUnits }), true);
  assert.equal(transport.movementProfile().speed, schooner.sailingSpeed * 0.514444 * 4 / 3 * 3);
  const saved = transport.getSaveData();
  const restored = new TransportSystem(saved);
  assert.equal(restored.vesselType, 'schooner');
  assert.equal(restored.deckHeight, schooner.deckHeightUnits);
  assert.equal(restored.movementProfile().speed, schooner.sailingSpeed * 0.514444 * 4 / 3 * 3);
  restored.mount({ id: 'ship:galleon', mode: 'boat', vesselType: 'galleon', deckHeight: getShipDesign('galleon').deckHeightUnits });
  assert.ok(restored.movementProfile().speed < schooner.sailingSpeed * 0.514444 * 4 / 3 * 3);
  assert.ok(restored.movementProfile().turnRate > 0);
  assert.ok(restored.movementProfile().acceleration > 0);
  assert.ok(restored.movementProfile().draft > 0);
  assert.equal(restored.canTraverse(0.4), true);
  assert.equal(restored.canTraverse(0.8), false);
  restored.dismount();
  assert.equal(restored.vesselType, null);
});

test('Creative object transforms, duplication, undo and redo preserve ship records', () => {
  const edits = new WorldEditSystem();
  const ship = edits.summon('ship-galleon', 20, 40, { yaw: 0.25, scale: 1.2, y: -0.12 });
  assert.ok(ship);
  assert.equal(edits.moveEntity(ship.id, 60, 80, -0.12), true);
  assert.equal(edits.rotateEntity(ship.id, Math.PI / 12), true);
  const duplicate = edits.duplicateEntity(ship.id, 100, 120);
  assert.ok(duplicate);
  assert.equal(duplicate.kind, 'ship-galleon');
  assert.equal(duplicate.yaw, edits.entities.find((item) => item.id === ship.id).yaw);
  assert.equal(edits.undo(), true);
  assert.equal(edits.entities.some((item) => item.id === duplicate.id), false);
  assert.equal(edits.redo(), true);
  assert.equal(edits.entities.some((item) => item.id === duplicate.id), true);
  const restored = new WorldEditSystem(edits.getSaveData());
  assert.equal(restored.entities.filter((item) => item.kind === 'ship-galleon').length, 2);
});

test('ship model source builds a continuous swept hull, deck, class-specific rig and owned resources', () => {
  const source = read('src/world/ship-models.js');
  for (const token of ['addLoftGeometry', 'addDeckGeometry', 'makeSquareSail', 'addGaffAssembly', 'addLateenAssembly', 'createShipModel', 'disposeShipModel', 'setupPartApi']) {
    assert.ok(source.includes(token), `Ship model source is missing ${token}`);
  }
  assert.match(source, /const stations = 72/);
  assert.match(source, /const ringSegments = 28/);
  assert.match(source, /forwardAxis = '-z'/);
  assert.match(source, /ownedGeometries/);
  assert.match(source, /ownedMaterials/);
});

test('creative editor exposes historical ships and object transform/history controls', () => {
  const ui = read('src/ui/interface.js');
  const worldEditing = read('src/systems/world-editing.js');
  const main = read('src/main.js');
  for (const kind of HISTORICAL_SHIP_KINDS) assert.ok(CREATIVE_ENTITY_TYPES.includes(kind));
  assert.ok(worldEditing.includes('...HISTORICAL_SHIP_KINDS'));
  for (const action of ['move-selected', 'rotate-selected', 'duplicate-selected', 'delete-selected', 'undo', 'redo']) {
    assert.ok(ui.includes(`data-creative-action="${action}"`), `Missing editor action ${action}`);
    assert.ok(main.includes(`'${action}'`), `Missing handler for ${action}`);
  }
  assert.ok(ui.includes('ship-model-grid'));
  assert.ok(main.includes('creativePlacement'));
});

test('version metadata, title menu and runtime cache identify the v0.8.4 completion build', () => {
  const pkg = JSON.parse(read('package.json'));
  const html = read('index.html');
  assert.equal(pkg.version, '0.8.4');
  assert.match(html, /THE AGE OF SAIL · 0.8.4/);
  assert.match(html, /main\.js\?v=0.8.4-completion/);
  assert.match(read('src/ui/interface.js'), /v0.8.4/);
});


test('waterfall sites are deterministic and appear in the rendered river data', () => {
  const first = new WorldIntelligence(new WorldGenerator('WAYFARER-TEST-040'));
  const second = new WorldIntelligence(new WorldGenerator('WAYFARER-TEST-040'));
  const a = first.riversInBounds(-14000, -14000, 14000, 14000);
  const b = second.riversInBounds(-14000, -14000, 14000, 14000);
  assert.deepEqual(a, b);
  const falls = a.flatMap((river) => river.waterfalls ?? []);
  assert.ok(falls.length > 0);
  assert.ok(falls.every((fall) => fall.drop >= 4.5 && fall.topY > fall.bottomY));
  const actorSource = read('src/world/world-actors.js');
  assert.match(actorSource, /river\.waterfalls/);
});
