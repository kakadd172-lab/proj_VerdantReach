import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/terrain.js';
import { WorldIntelligence } from '../src/world/world-intelligence.js';
import { WorldNeedsSystem } from '../src/systems/world-needs.js';
import { WorldEditSystem, CREATIVE_ENTITY_TYPES } from '../src/systems/world-editing.js';
import { MaritimeSystem } from '../src/systems/maritime.js';
import { RPGSystem } from '../src/systems/rpg.js';

function createMockCivilization(fromId, toId) {
  return {
    states: new Map([
      [fromId, { id: fromId, stock: { rations: 0, fish: 0, herbs: 0, timber: 14 }, wealth: 80 }],
      [toId, { id: toId, stock: { rations: 0, fish: 0, herbs: 0, timber: 0 }, wealth: 120 }],
    ]),
  };
}

test('Survival needs drain over time, respond to food and water, and restore from save data', () => {
  const rpg = new RPGSystem({ inventory: { rations: 2, freshWater: 1 } });
  const needs = new WorldNeedsSystem();
  needs.update(1800, rpg, { temperature: 0.9 }, true);
  assert.ok(needs.hunger < 100);
  assert.ok(needs.thirst < 100);
  const hungerBefore = needs.hunger;
  assert.equal(needs.eat(rpg, 'rations').ok, true);
  assert.ok(needs.hunger > hungerBefore);
  const thirstBefore = needs.thirst;
  assert.equal(needs.drink(rpg).ok, true);
  assert.ok(needs.thirst > thirstBefore);
  const restored = new WorldNeedsSystem(needs.getSaveData());
  assert.deepEqual(restored.getSaveData(), needs.getSaveData());
});

test('Creative world edits persist summoned props, biome patches, and remove nearby creations', () => {
  const edits = new WorldEditSystem();
  const rock = edits.summon('boulder', 120, -40, { scale: 1.8, yaw: 0.5, createdAt: 3 });
  const ship = edits.summon('large-ship', 320, -90, { scale: 1.4 });
  const settlement = edits.addSettlement({ id: 'creative-village:1', x: 150, z: -55, kind: 'village', name: 'Newstead' });
  const patch = edits.paintBiome(120, -40, 150, 'jungle');
  assert.ok(rock && ship && settlement && patch);
  const restored = new WorldEditSystem(edits.getSaveData());
  assert.equal(restored.entities.length, 2);
  assert.equal(restored.entities[1].kind, 'large-ship');
  assert.equal(restored.biomeOverrides[0].biome, 'jungle');
  const removed = restored.removeNearby(120, -40, 260);
  assert.equal(removed.entities, 2);
  assert.equal(removed.settlements, 1);
  assert.equal(restored.entities.length, 0);
  assert.equal(restored.settlements.length, 0);
  assert.ok(CREATIVE_ENTITY_TYPES.includes('large-ship'));
  assert.ok(CREATIVE_ENTITY_TYPES.includes('village'));
});

test('biome paint overlays preserve natural terrain height and can be restored', () => {
  const generator = new WorldGenerator('CREATIVE-PAINT-TEST');
  const point = generator.findSpawn();
  const original = generator.sample(point.x, point.z);
  const targetBiome = original.biome === 'jungle' ? 'desert' : 'jungle';
  const edits = new WorldEditSystem();
  edits.paintBiome(point.x, point.z, 180, targetBiome);
  generator.setBiomeOverrides(edits.biomeOverrides);
  const painted = generator.sample(point.x, point.z);
  assert.equal(painted.biome, targetBiome);
  assert.equal(painted.naturalBiome, original.naturalBiome);
  assert.equal(painted.height, original.height);
  edits.clearBiome(point.x, point.z, 180);
  generator.setBiomeOverrides(edits.biomeOverrides);
  assert.equal(generator.sample(point.x, point.z).biome, original.biome);
});

test('custom creative settlements are real deterministic world-intelligence records', () => {
  const generator = new WorldGenerator('CREATIVE-VILLAGE-TEST');
  const intelligence = new WorldIntelligence(generator);
  const site = intelligence.starterSettlement;
  const created = intelligence.addCustomSettlement({ id: 'creative-village:test', x: site.x, z: site.z, kind: 'village', name: 'Newstead' });
  assert.ok(created);
  assert.equal(created.name, 'Newstead');
  assert.equal(created.type, 'village');
  assert.equal(intelligence.settlementsNear(created.x, created.z, 30).some((item) => item.id === created.id), true);
  assert.equal(intelligence.removeCustomSettlement(created.id), true);
  assert.equal(intelligence.settlementsNear(created.x, created.z, 30).some((item) => item.id === created.id), false);
});

test('maritime voyages move real cargo between ports and restore in-flight state', () => {
  const generator = { heightAt: () => -18 };
  const a = { id: 'port:a', x: -180, z: 0, type: 'port', coastAccess: true };
  const b = { id: 'port:b', x: 180, z: 0, type: 'port', coastAccess: true };
  const maritime = new MaritimeSystem(generator);
  const routes = maritime.registerPorts([a, b]);
  assert.equal(routes.length, 1);
  assert.ok(routes[0].path.length >= 3);
  const civilization = createMockCivilization(a.id, b.id);
  maritime.advanceTo(1, civilization);
  assert.equal(maritime.voyages.length, 1);
  const voyage = maritime.voyages[0];
  assert.equal(voyage.status, 'enroute');
  assert.equal(civilization.states.get(voyage.fromId).stock.timber < 14 || civilization.states.get(voyage.toId).stock.timber < 14, true);
  const restored = new MaritimeSystem(generator, maritime.getSaveData());
  assert.equal(restored.voyages[0].id, voyage.id);
  restored.advanceTo(voyage.arrivalDay + 0.1, civilization);
  assert.equal(restored.voyages[0].status, 'delivered');
  const destination = civilization.states.get(voyage.toId);
  assert.ok(destination.stock.timber >= voyage.cargo.quantity);
});

test('new worlds respect the selected mode while legacy saves default to Survival', async () => {
  const { resolveGameMode } = await import('../src/systems/game-mode.js');
  assert.equal(resolveGameMode(null, 'creative'), 'creative');
  assert.equal(resolveGameMode(null, 'survival'), 'survival');
  assert.equal(resolveGameMode({ version: '0.4.0' }, 'creative'), 'survival');
  assert.equal(resolveGameMode({ gameMode: 'creative' }, 'survival'), 'creative');
  assert.equal(resolveGameMode({ gameMode: 'survival' }, 'creative'), 'survival');
});

test('removing a creative port clears its sea routes and in-flight cargo voyages', () => {
  const generator = { heightAt: () => -18 };
  const a = { id: 'port:remove-a', x: -180, z: 0, type: 'port', coastAccess: true };
  const b = { id: 'port:remove-b', x: 180, z: 0, type: 'port', coastAccess: true };
  const maritime = new MaritimeSystem(generator);
  maritime.registerPorts([a, b]);
  maritime.advanceTo(1, createMockCivilization(a.id, b.id));
  assert.equal(maritime.voyages.length, 1);
  const removed = maritime.removePort(a.id);
  assert.deepEqual(removed, { routes: 1, voyages: 1 });
  assert.equal(maritime.routes.size, 0);
  assert.equal(maritime.voyages.length, 0);
});

test('creative object storage remains bounded and gives every summoned object a stable ID', () => {
  const edits = new WorldEditSystem();
  let firstId = null;
  for (let i = 0; i < 330; i += 1) {
    const record = edits.summon('rock', i, 0);
    if (i === 0) firstId = record.id;
  }
  assert.equal(edits.entities.length, 320);
  assert.equal(edits.entities.some((item) => item.id === firstId), false);
  assert.equal(new Set(edits.entities.map((item) => item.id)).size, 320);
});


test('freshwater distance includes the edge of a generated lake basin', () => {
  const generator = new WorldGenerator('CREATIVE-LAKE-WATER-TEST');
  const scenario = { river: { id: 'scenario:lake', path: [], lake: { x: 100, z: 100, radius: 50 } } };
  const intelligence = new WorldIntelligence(generator, { x: 0, z: 0 }, { scenario });
  assert.equal(intelligence.riverDistanceAt(100, 100, 120), 0);
  assert.ok(intelligence.riverDistanceAt(200, 100, 120) <= 50);
});
