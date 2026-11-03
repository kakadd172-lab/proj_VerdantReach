import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CivilizationSystem } from '../src/systems/civilization.js';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('city, port and market settlements create larger visible resident rosters', () => {
  const system = new CivilizationSystem(1248, {});
  const city = { id: 'test-free-city', seed: 8821, basePopulation: 520, type: 'freeCity' };
  const market = { id: 'test-market', seed: 8822, basePopulation: 27, type: 'market' };
  const port = { id: 'test-port', seed: 8823, basePopulation: 34, type: 'port' };
  const village = { id: 'test-village', seed: 8824, basePopulation: 12, type: 'village' };
  const cityState = system.ensureSettlement(city, 1);
  const marketState = system.ensureSettlement(market, 1);
  const portState = system.ensureSettlement(port, 1);
  const villageState = system.ensureSettlement(village, 1);
  assert.equal(cityState.npcs.length, 64);
  assert.equal(marketState.npcs.length, 18);
  assert.equal(portState.npcs.length, 24);
  assert.equal(villageState.npcs.length, 12);
  assert.equal(new Set(cityState.npcs.map((npc) => npc.id)).size, 64);
});

test('older saved city rosters are topped up without duplicating residents', () => {
  const city = { id: 'legacy-free-city', seed: 412, basePopulation: 520, type: 'freeCity' };
  const source = new CivilizationSystem(1248, {});
  const full = source.ensureSettlement(city, 1);
  const saved = source.getSaveData();
  saved.settlements[city.id].npcs = full.npcs.slice(0, 7);
  const restored = new CivilizationSystem(1248, {}, saved);
  const state = restored.ensureSettlement(city, 2);
  assert.equal(state.npcs.length, 64);
  assert.equal(new Set(state.npcs.map((npc) => npc.id)).size, 64);
  assert.deepEqual(state.npcs.slice(0, 7).map((npc) => npc.id), full.npcs.slice(0, 7).map((npc) => npc.id));
});

test('market-going schedules target the market district during business hours', () => {
  const system = new CivilizationSystem(1248, {});
  const settlement = { id: 'schedule-market', seed: 89, basePopulation: 27, type: 'market', x: 100, z: 200 };
  const npc = { id: 'trader-1', profession: 'trader', homeOffset: { x: 4, z: 6 }, routineOffset: { x: 0, z: 0 }, scheduleSeed: 2500 };
  const schedule = system.scheduleForNpc(npc, settlement, 9, 1);
  assert.equal(schedule.activity, 'opening the market');
  assert.ok(Math.abs(Math.hypot(schedule.x - settlement.x, schedule.z - settlement.z) - 14) < 0.001);
});

test('free-city market is an open pavilion with twelve individually built stalls', () => {
  const city = read('src/world/settlement-models.js');
  const actors = read('src/world/world-actors.js');
  assert.ok(city.includes('const marketStallCount = 12'));
  assert.ok(city.includes('function addMarketStall'));
  assert.ok(city.includes("batches.add('box', 'awning'"));
  assert.ok(city.includes("if (feature.kind === 'market-hall')"));
  assert.ok(city.includes('The market is an open timber pavilion'));
  assert.ok(actors.includes('stallCount = settlement.type'));
  assert.ok(actors.includes('stallCount = settlement.type') && actors.includes('? 7 : settlement.type === \'market\' ? 6 : 3'));
  assert.ok(actors.includes('settlement-models.js?v=0.8.4'));
  assert.ok(!actors.includes('const stall = new THREE.Mesh(this.geometry.stall, this.materials.wood);\n      stall.position.set(settlement.x + 7'));
});

test('timber-framed housing, resident movement and walking animation remain wired', () => {
  const city = read('src/world/settlement-models.js');
  const actors = read('src/world/world-actors.js');
  assert.ok(city.includes('function addHouse'));
  assert.ok(city.includes('const addWindow'));
  assert.ok(city.includes("add('gable', 'roof'"));
  assert.ok(actors.includes('scheduleForNpc'));
  assert.ok(actors.includes('routePathFor'));
  assert.ok(actors.includes('armMeshes'));
  assert.ok(actors.includes('legMeshes'));
});

test('galleon sterncastle uses tapered faceted cabins, framed windows and open galleries', () => {
  const models = read('src/world/ship-models.js');
  const structures = read('src/world/ship-structures.js');
  assert.ok(models.includes('[bottomZ - topZ, 0], [0, 0]'));
  assert.ok(models.includes('galleon-upper-gallery-platform'));
  assert.ok(models.includes('function makeTaperedDeckhouseGeometry'));
  assert.ok(models.includes('function addTransomWindow'));
  assert.ok(models.includes('function addSideCabinWindow'));
  assert.ok(models.includes('function addGalleonBalcony'));
  assert.ok(models.includes('galleon-stern-lantern-frame'));
  assert.ok(models.includes("makePart(root, parts, 'galleon-stern-' + tier + '-deckhouse', parent)"));
  assert.ok(models.includes("tier: 'lower'"));
  assert.ok(!models.includes('addDeckhouse(0.52, lowerHeight'));
  assert.match(structures, /galleon:.*shroudPairs: 2, ratlineCount: 8/);
});

test('ruined castles retain broken crenellations, flanking gatehouse towers and reinforced keep corners', () => {
  const castle = read('src/world/settlement-models.js');
  assert.ok(castle.includes('const crenels = Math.max(1, Math.floor(localLength / 3.4))'));
  assert.ok(castle.includes('Two flanking gatehouse towers'));
  assert.ok(castle.includes('const pierHeight = keep.height * 0.86'));
  assert.ok(castle.includes('Ruined walls retain occasional merlons'));
});
