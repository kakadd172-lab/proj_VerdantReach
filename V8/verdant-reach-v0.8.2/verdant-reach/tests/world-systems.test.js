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

test('legacy distant settlement saves are normalized before background simulation', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const legacyState = {
    id: 'distant-legacy-village',
    population: 24,
    food: 82,
    grain: 34,
    wood: 30,
    stone: 18,
    wealth: 90,
    stability: 0.76,
    prosperity: 0.55,
    stock: { rations: 7, herbs: 3, timber: 9, fish: 4 },
    farms: 3,
    workshops: 2,
    lastSimDay: 1,
    npcs: [],
    // Older saved settlements did not always contain the production object.
  };
  const civilization = new CivilizationSystem(generator.seed, intelligence, {
    settlements: { 'distant-legacy-village': legacyState },
  });

  assert.deepEqual(civilization.getSettlementState('distant-legacy-village').production, {
    farms: 0, workshops: 0, fishing: 0,
  });
  assert.doesNotThrow(() => civilization.advanceTo(2, 'spring'));

  const restored = civilization.getSettlementState('distant-legacy-village');
  assert.equal(restored.lastSimDay, 2);
  assert.ok(Number.isFinite(restored.production.farms));
  assert.ok(Number.isFinite(restored.food));
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

test('terrain-aware roads connect settlements with deterministic walkable route samples', () => {
  const generator = new WorldGenerator('WILLOW');
  const intelligence = new WorldIntelligence(generator);
  const settlements = intelligence.settlementsNear(generator.findSpawn().x, generator.findSpawn().z, 6000)
    .filter((settlement) => settlement.id !== intelligence.starterSettlement.id);
  const start = intelligence.starterSettlement;
  const end = settlements.find((settlement) => Math.hypot(settlement.x - start.x, settlement.z - start.z) < 4400);
  assert.ok(end, 'expected a nearby settlement for the road test');
  const first = intelligence.roadLinksFor([start, end], 4400)[0];
  const second = intelligence.roadLinksFor([start, end], 4400)[0];
  assert.ok(first?.terrainAware);
  assert.deepEqual(first.path, second.path);
  assert.ok(first.path.length >= 2);
  assert.equal(first.path[0].x, first.a.x);
  assert.equal(first.path[0].z, first.a.z);
  assert.equal(first.path.at(-1).x, first.b.x);
  assert.equal(first.path.at(-1).z, first.b.z);
  assert.ok(first.path.every((point) => Number.isFinite(point.x) && Number.isFinite(point.z)));
  assert.ok(first.routeDistance >= first.distance * 0.9);
});

test('climate samples expose stable wind exposure and mountain rain-shadow values', () => {
  const generator = new WorldGenerator('EMBERFALL');
  for (let z = -18000; z <= 18000; z += 1800) {
    for (let x = -18000; x <= 18000; x += 1800) {
      const sample = generator.sample(x, z);
      assert.ok(Number.isFinite(sample.windExposure));
      assert.ok(sample.windExposure >= 0 && sample.windExposure <= 1);
      assert.ok(Number.isFinite(sample.rainShadow));
      assert.ok(sample.rainShadow >= 0 && sample.rainShadow <= 0.22);
    }
  }
});

test('NPC schedules vary by profession and time of day', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator);
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  const settlement = intelligence.starterSettlement;
  const state = civilization.ensureSettlement(settlement, 1);
  const farmer = state.npcs.find((npc) => npc.profession === 'farmer') ?? state.npcs[0];
  const lateNight = civilization.scheduleForNpc(farmer, settlement, 23, 1);
  const workHours = civilization.scheduleForNpc(farmer, settlement, 9, 1);
  assert.equal(lateNight.activity, 'resting');
  assert.notEqual(workHours.activity, lateNight.activity);
  assert.notDeepEqual(workHours, lateNight);
});

test('regional migration moves a persistent resident identity and records the event', () => {
  const generator = new WorldGenerator('WILLOW');
  const intelligence = new WorldIntelligence(generator);
  const spawn = generator.findSpawn();
  const settlements = intelligence.settlementsNear(spawn.x, spawn.z, 7000);
  assert.ok(settlements.length >= 2);
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  civilization.registerSettlements(settlements, 1);
  const donorSettlement = intelligence.starterSettlement;
  const destinationSettlement = settlements
    .filter((settlement) => settlement.id !== donorSettlement.id)
    .sort((a, b) => Math.hypot(a.x - donorSettlement.x, a.z - donorSettlement.z) - Math.hypot(b.x - donorSettlement.x, b.z - donorSettlement.z))
    .find((settlement) => Math.hypot(settlement.x - donorSettlement.x, settlement.z - donorSettlement.z) < 3300);
  assert.ok(destinationSettlement);
  const donor = civilization.getSettlementState(donorSettlement.id);
  const destination = civilization.getSettlementState(destinationSettlement.id);
  assert.ok(donor && destination);
  donor.lastMigrationDay = 0;
  donor.food = 0;
  donor.stability = 0.2;
  donor.population = Math.max(12, donor.population);
  donor.farms = 0;
  destination.food = 10000;
  destination.stability = 0.9;
  const migrant = donor.npcs.find((npc) => npc.id !== donor.leader);
  assert.ok(migrant);
  civilization.advanceTo(14, 'spring');
  const saved = civilization.getSaveData();
  const restored = new CivilizationSystem(generator.seed, intelligence, saved);
  const moved = restored.getSettlementState(destination.id).npcs.find((npc) => npc.id === migrant.id);
  assert.ok(moved, 'migrant identity should be present in the destination settlement');
  assert.equal(moved.homeSettlementId, destination.id);
  assert.ok(saved.migrationLog.some((event) => event.npcId === migrant.id));
});

test('cargo convoys move stored goods, arrive while unloaded, and survive save restoration', () => {
  const generator = new WorldGenerator('WILLOW');
  const intelligence = new WorldIntelligence(generator);
  const spawn = generator.findSpawn();
  const settlements = intelligence.settlementsNear(spawn.x, spawn.z, 7000);
  const pair = intelligence.roadLinksFor(settlements, 4400)[0];
  assert.ok(pair, 'expected a connected pair for the convoy test');
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  civilization.registerSettlements([pair.a, pair.b], 1);
  const origin = civilization.getSettlementState(pair.a.id);
  const destination = civilization.getSettlementState(pair.b.id);
  origin.stock.rations = 30;
  destination.stock.rations = 0;
  destination.wealth = 1000;
  civilization.advanceTo(1, 'spring');
  const launched = civilization.tradeConvoys.find((convoy) => convoy.roadId === pair.id && convoy.status === 'enroute');
  assert.ok(launched, 'a surplus should create a shipment');
  assert.equal(origin.stock.rations, 27);
  const restored = new CivilizationSystem(generator.seed, intelligence, civilization.getSaveData());
  restored.registerSettlements([pair.a, pair.b], 1);
  restored.advanceTo(launched.arrivalDay, 'summer');
  const delivered = restored.tradeConvoys.find((convoy) => convoy.id === launched.id);
  assert.equal(delivered.status, 'delivered');
  assert.equal(restored.getSettlementState(pair.b.id).stock.rations, 3);
});

test('predator activity persists ecosystem population loss without player harvesting', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const ecosystem = new EcosystemSystem(generator.seed, generator);
  const spawn = generator.findSpawn();
  let prey = null;
  for (let z = -2400; z <= 2400 && !prey; z += 600) {
    for (let x = -2400; x <= 2400 && !prey; x += 600) {
      prey = ecosystem.animalsNear(spawn.x + x, spawn.z + z, 320).find((animal) => animal.diet !== 'predator') ?? null;
    }
  }
  assert.ok(prey);
  assert.equal(ecosystem.predate(prey.id), true);
  assert.equal(ecosystem.predate(prey.id), false);
  const restored = new EcosystemSystem(generator.seed, generator, ecosystem.getSaveData());
  assert.equal(restored.predate(prey.id), false);
  assert.equal(restored.totalPredated, 1);
});


test('regional roads do not fall back to an unchecked straight line across impassable terrain', () => {
  const generator = new WorldGenerator('WILLOW');
  const intelligence = new WorldIntelligence(generator);
  const a = { id: 'audit:road-a', x: -200, z: -200 };
  const b = { id: 'audit:road-b', x: 900, z: 700 };
  const path = intelligence.routePathFor(a, b, { resolution: 42 });
  assert.ok(Array.isArray(path));
  assert.ok(path.length === 0 || (path[0].x === a.x && path.at(-1).x === b.x));
  if (path.length > 1) {
    for (let i = 1; i < path.length; i += 1) {
      assert.ok(Number.isFinite(path[i].x) && Number.isFinite(path[i].z));
    }
  }
});

test('regional road planner applies landform, wet-ground and grade costs', () => {
  const intelligence = new WorldIntelligence(new WorldGenerator('EMBERFALL'));
  const costSource = intelligence._roadCellCost.toString();
  const routeSource = intelligence.routePathFor.toString();
  assert.match(costSource, /cliffIntensity/);
  assert.match(costSource, /ravineIntensity/);
  assert.match(costSource, /floodplain/);
  assert.match(routeSource, /grade/);
  assert.match(routeSource, /blockedDiagonal/);
});
