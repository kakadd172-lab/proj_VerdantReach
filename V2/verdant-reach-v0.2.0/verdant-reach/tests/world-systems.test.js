import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/terrain.js';
import { WorldIntelligence } from '../src/world/world-intelligence.js';
import { CivilizationSystem } from '../src/systems/civilization.js';
import { EcosystemSystem } from '../src/systems/ecosystem.js';
import { WeatherSystem } from '../src/systems/weather.js';
import { TransportSystem } from '../src/systems/transport.js';
import { RPGSystem } from '../src/systems/rpg.js';

test('world intelligence reproduces its starter settlement and river geometry by seed', () => {
  const firstGenerator = new WorldGenerator('EMBERFALL');
  const secondGenerator = new WorldGenerator('EMBERFALL');
  const first = new WorldIntelligence(firstGenerator);
  const second = new WorldIntelligence(secondGenerator);
  assert.deepEqual(first.starterSettlement, second.starterSettlement);
  const a = first.riversInBounds(-7000, -7000, 7000, 7000);
  const b = second.riversInBounds(-7000, -7000, 7000, 7000);
  assert.deepEqual(a, b);
  for (const river of a) {
    assert.ok(river.path.length >= 8);
    for (const point of river.path) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.z) && Number.isFinite(point.y));
    }
  }
});

test('river queries return the same deterministic path across overlapping bounds', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const broad = intelligence.riversInBounds(-7000, -7000, 7000, 7000);
  const overlap = intelligence.riversInBounds(-3500, -3500, 3500, 3500);
  for (const river of overlap) {
    const match = broad.find((candidate) => candidate.id === river.id);
    assert.ok(match, `river ${river.id} was missing from the broad query`);
    assert.deepEqual(match.path, river.path);
  }
});

test('civilization population, residents, relationships and market state survive save restoration', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const settlement = intelligence.starterSettlement;
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  const state = civilization.ensureSettlement(settlement, 1);
  assert.ok(state.population >= 1);
  assert.ok(state.npcs.length >= 3);
  const firstResident = state.npcs[0];
  const conversation = civilization.talkTo(firstResident.id, 1);
  assert.equal(conversation.repeated, false);
  assert.equal(civilization.talkTo(firstResident.id, 1).repeated, true);

  const rpg = new RPGSystem({ inventory: { silverPetal: 10 } });
  const trade = civilization.trade(settlement.id, 'buy-ration', rpg);
  assert.equal(trade.ok, true);
  assert.equal(rpg.inventory.rations, 1);
  assert.equal(rpg.inventory.silverPetal, 5);

  const restored = new CivilizationSystem(generator.seed, intelligence, civilization.getSaveData());
  const restoredState = restored.ensureSettlement(settlement, 2);
  assert.equal(restoredState.population, state.population);
  assert.equal(restoredState.npcs[0].name, firstResident.name);
  assert.equal(restoredState.stock.rations, state.stock.rations);
  assert.equal(restored.relationships[firstResident.id], 1);
});

test('distant settlement simulation advances from its last simulated day without frame-by-frame updates', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  const state = civilization.ensureSettlement(intelligence.starterSettlement, 1);
  const originalDay = state.lastSimDay;
  civilization.advanceTo(12, 'summer');
  assert.equal(state.lastSimDay, 12);
  assert.ok(state.food >= 0);
  civilization.advanceTo(12, 'summer');
  assert.equal(state.lastSimDay, originalDay + 11);
});

test('wildlife populations and harvest records persist across an unloaded-region save', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  const ecosystem = new EcosystemSystem(generator.seed, generator);
  let animal = null;
  for (let z = -2400; z <= 2400 && !animal; z += 600) {
    for (let x = -2400; x <= 2400 && !animal; x += 600) {
      animal = ecosystem.animalsNear(spawn.x + x, spawn.z + z, 300)[0] ?? null;
    }
  }
  assert.ok(animal, 'expected at least one animal in the deterministic test region');
  const reward = ecosystem.harvest(animal.id);
  assert.ok(reward?.gameMeat > 0);
  const save = ecosystem.getSaveData();
  const restored = new EcosystemSystem(generator.seed, generator, save);
  assert.equal(restored.harvest(animal.id), null);
  assert.ok(restored.totalHarvested >= 1);
});

test('weather is deterministic for a seed, place and world time, and cycles seasons', () => {
  const weather = new WeatherSystem(12345);
  const climate = { temperature: 0.5, rainfall: 0.7, moisture: 0.8 };
  const a = weather.at(1200, -450, 3920, climate);
  const b = weather.at(1200, -450, 3920, climate);
  assert.deepEqual(a, b);
  assert.equal(weather.at(1200, -450, 0, climate).season, 'spring');
  assert.equal(weather.at(1200, -450, 28 * 480, climate).season, 'summer');
  assert.equal(weather.at(1200, -450, 56 * 480, climate).season, 'autumn');
  assert.equal(weather.at(1200, -450, 84 * 480, climate).season, 'winter');
});

test('transport modes enforce land and shallow-water traversal rules', () => {
  const transport = new TransportSystem();
  assert.equal(transport.canTraverse(10, 0.2), true);
  assert.equal(transport.canTraverse(0.2, 0), false);
  assert.equal(transport.mount({ id: 'horse-1', mode: 'horse' }), true);
  assert.equal(transport.canTraverse(10, 0.8), true);
  assert.equal(transport.mount({ id: 'boat-1', mode: 'boat' }), true);
  assert.equal(transport.canTraverse(1.2, 0), true);
  assert.equal(transport.canTraverse(4, 0), false);
  const save = transport.getSaveData();
  const restored = new TransportSystem(save);
  assert.equal(restored.mode, 'boat');
  assert.equal(restored.vehicleId, 'boat-1');
});

test('older RPG saves are migrated and crafting consumes materials exactly once', () => {
  const legacy = new RPGSystem({ level: 2, inventory: { moonleaf: 1, silverPetal: 3 } });
  assert.equal(legacy.skills.foraging, 1);
  assert.equal(legacy.inventory.rations, 0);
  assert.equal(legacy.inventory.moonleaf, 1);
  legacy.addItem('gameMeat', 1);
  const result = legacy.craft('trail-ration');
  assert.equal(result.ok, true);
  assert.equal(legacy.inventory.rations, 2);
  assert.equal(legacy.inventory.gameMeat, 0);
  assert.equal(legacy.inventory.moonleaf, 0);
  assert.equal(legacy.craft('trail-ration').ok, false);
});

test('spending a skill point changes its practical market benefit', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const settlement = intelligence.starterSettlement;
  const commerceRpg = new RPGSystem({ skillPoints: 1, skills: { commerce: 3 }, inventory: { silverPetal: 10 } });
  const training = commerceRpg.spendSkillPoint('commerce');
  assert.equal(training.ok, true);
  assert.equal(commerceRpg.skills.commerce, 4);
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  const market = civilization.ensureSettlement(settlement, 1);
  const initialWealth = market.wealth;
  assert.equal(civilization.trade(settlement.id, 'buy-ration', commerceRpg).ok, true);
  assert.equal(commerceRpg.inventory.silverPetal, 6);
  assert.equal(market.wealth, initialWealth + 4);
});

test('commerce trade cannot spend a market below zero wealth', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const settlement = intelligence.starterSettlement;
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  const market = civilization.ensureSettlement(settlement, 1);
  market.wealth = 0;
  const rpg = new RPGSystem({ inventory: { moonleaf: 1 } });
  const result = civilization.trade(settlement.id, 'sell-moonleaf', rpg);
  assert.equal(result.ok, false);
  assert.equal(rpg.inventory.moonleaf, 1);
  assert.equal(rpg.inventory.silverPetal, 0);
});

test('wandering wisps are deterministic, can be challenged, and defeated states persist', async () => {
  const { CombatSystem } = await import('../src/systems/combat.js');
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const combat = new CombatSystem(generator.seed, generator, intelligence);
  const spawn = generator.findSpawn();
  const hostiles = combat.hostilesNear(spawn.x, spawn.z, 5200);
  assert.ok(hostiles.length > 0);
  const first = hostiles[0];
  const repeat = combat.hostilesNear(spawn.x, spawn.z, 5200).find((item) => item.id === first.id);
  assert.deepEqual(first, repeat);

  const rpg = new RPGSystem();
  let result;
  let now = 1;
  for (let hit = 0; hit < 6; hit += 1) {
    result = combat.strike(first.id, rpg, now);
    now += 0.6;
    if (!result.ok || result.defeated) break;
  }
  assert.equal(result.ok, true);
  assert.equal(result.defeated, true);
  assert.equal(rpg.inventory.wispDust, 1);
  assert.equal(combat.hostilesNear(spawn.x, spawn.z, 5200).some((item) => item.id === first.id), false);

  const restored = new CombatSystem(generator.seed, generator, intelligence, combat.getSaveData());
  assert.equal(restored.strike(first.id, rpg, 10).ok, false);
  assert.ok(restored.getSaveData().defeated.includes(first.id));
});

test('wisp contact is throttled and health recovers after leaving danger', async () => {
  const { CombatSystem } = await import('../src/systems/combat.js');
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const combat = new CombatSystem(generator.seed, generator, intelligence);
  const rpg = new RPGSystem();
  const first = combat.hostilesNear(0, 0, 5200)[0];
  assert.ok(first);
  const hit = combat.contact(first.id, rpg, 10);
  assert.equal(hit.hit, true);
  assert.equal(rpg.health, 94);
  assert.equal(combat.contact(first.id, rpg, 10.5).hit, false);
  combat.recover(1, rpg, 20, false);
  assert.ok(rpg.health > 94);
});
