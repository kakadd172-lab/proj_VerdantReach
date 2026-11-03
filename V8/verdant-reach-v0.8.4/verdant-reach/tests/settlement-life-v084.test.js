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
  const cityState = system.ensureSettlement(city, 1);
  const marketState = system.ensureSettlement(market, 1);
  const portState = system.ensureSettlement(port, 1);
  assert.equal(cityState.npcs.length, 32);
  assert.equal(marketState.npcs.length, 12);
  assert.equal(portState.npcs.length, 16);
  assert.equal(new Set(cityState.npcs.map((npc) => npc.id)).size, 32);
});

test('older saved city rosters are topped up without duplicating residents', () => {
  const city = { id: 'legacy-free-city', seed: 412, basePopulation: 520, type: 'freeCity' };
  const source = new CivilizationSystem(1248, {});
  const full = source.ensureSettlement(city, 1);
  const saved = source.getSaveData();
  saved.settlements[city.id].npcs = full.npcs.slice(0, 7);
  const restored = new CivilizationSystem(1248, {}, saved);
  const state = restored.ensureSettlement(city, 2);
  assert.equal(state.npcs.length, 32);
  assert.equal(new Set(state.npcs.map((npc) => npc.id)).size, 32);
  assert.deepEqual(state.npcs.slice(0, 7).map((npc) => npc.id), full.npcs.slice(0, 7).map((npc) => npc.id));
});

test('market stalls and timber-framed facade details are generated for cities and settlements', () => {
  const city = read('src/world/settlement-models.js');
  const actors = read('src/world/world-actors.js');
  assert.ok(city.includes('marketStallCount = 12'));
  assert.ok(city.includes("'awning'"));
  assert.ok(city.includes('addWindow'));
  assert.ok(actors.includes('stallCount = settlement.type'));
  assert.ok(actors.includes('makeActorGableRoofGeometry'));
  assert.ok(actors.includes('armMeshes'));
  assert.ok(actors.includes('legMeshes'));
});

test('galleon headsails and aftercastle use corrected visual proportions', () => {
  const models = read('src/world/ship-models.js');
  const structures = read('src/world/ship-structures.js');
  assert.ok(models.includes('[bottomZ - topZ, 0], [0, 0]'));
  assert.ok(models.includes('galleon-upper-gallery-platform'));
  assert.match(models, /addDeckhouse\(0\.29, y \* 0\.36, 0\.075/);
  assert.match(structures, /galleon:.*shroudPairs: 2, ratlineCount: 8/);
});

test('castle walls and towers include parapets, crenels and gatehouse flanking towers', () => {
  const castle = read('src/world/settlement-models.js');
  assert.ok(castle.includes('const crenels = Math.max(1, Math.floor(localLength / 3.4))'));
  assert.ok(castle.includes('towerGround + 16.35'));
  assert.ok(castle.includes('keep.height * 0.86'));
});
