import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/terrain.js';
import { WorldIntelligence } from '../src/world/world-intelligence.js';
import { createFieldTestLayout, TEST_WORLD_NAME, TEST_WORLD_SEED } from '../src/world/field-test-world.js';
import { CivilizationSystem } from '../src/systems/civilization.js';
import { EcosystemSystem } from '../src/systems/ecosystem.js';
import { CombatSystem } from '../src/systems/combat.js';
import { RPGSystem } from '../src/systems/rpg.js';
import { mergeSavedWorldRecords } from '../src/systems/persistence.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function createScenario() {
  const generator = new WorldGenerator(TEST_WORLD_SEED);
  const layout = createFieldTestLayout(generator);
  const intelligence = new WorldIntelligence(generator, layout.spawn, { scenario: layout });
  return { generator, layout, intelligence };
}

test('the built-in Wayfarer Circuit is deterministic and has an ordered 12-step route', () => {
  const first = createScenario();
  const second = createScenario();
  assert.equal(TEST_WORLD_NAME, "Wayfarer's Circuit");
  assert.deepEqual(first.layout, second.layout);
  assert.equal(first.layout.courseSteps.length, 12);
  assert.deepEqual(first.layout.courseSteps.map((step) => step.id), [
    'survey', 'waystone', 'forage', 'village', 'trade', 'craft',
    'wildlife', 'combat', 'road', 'horse', 'boat', 'weather',
  ]);
  for (const step of first.layout.courseSteps) {
    assert.ok(distance(step, first.layout.spawn) <= 700, `${step.id} should stay close to the test spawn`);
    assert.ok(Number.isFinite(first.generator.heightAt(step.x, step.z)));
  }
});

test('the test region guarantees its three settlements, scenario stream, and a bridgeable road', () => {
  const { generator, layout, intelligence } = createScenario();
  const local = intelligence.settlementsNear(layout.spawn.x, layout.spawn.z, 2800);
  for (const settlement of layout.settlements) {
    assert.ok(local.some((candidate) => candidate.id === settlement.id), `${settlement.name} should be nearby`);
    const sample = generator.sample(settlement.x, settlement.z, true);
    assert.ok(sample.height > 1.8);
    assert.ok(sample.slope < 0.5);
  }
  const rivers = intelligence.riversInBounds(layout.spawn.x - 1000, layout.spawn.z - 1000, layout.spawn.x + 1000, layout.spawn.z + 1000);
  const stream = rivers.find((river) => river.id === 'test:wayfarer-stream');
  assert.ok(stream);
  assert.equal(stream.path.length, 35);
  const links = intelligence.roadLinksFor([intelligence.starterSettlement, ...layout.settlements], 4400);
  assert.ok(links.some((link) => link.path?.some((point) => point.bridge)), 'the test circuit should expose a bridge route');
});

test('the prepared wildlife habitat produces harvestable animals and persists their removal', () => {
  const { generator, layout } = createScenario();
  const ecosystem = new EcosystemSystem(generator.seed, generator);
  ecosystem.seedTestPopulation(layout.wildlife.x, layout.wildlife.z, 6);
  const animal = ecosystem.animalsNear(layout.wildlife.x, layout.wildlife.z, 300)
    .sort((a, b) => distance(a, layout.wildlife) - distance(b, layout.wildlife))[0];
  assert.ok(animal);
  assert.ok(ecosystem.harvest(animal.id));
  const restored = new EcosystemSystem(generator.seed, generator, ecosystem.getSaveData());
  assert.equal(restored.harvest(animal.id), null);
});

test('the test market creates a persistent cargo convoy on a generated road', () => {
  const { generator, layout, intelligence } = createScenario();
  const civilization = new CivilizationSystem(generator.seed, intelligence);
  const settlements = [intelligence.starterSettlement, ...layout.settlements];
  civilization.registerSettlements(settlements, 1);
  const links = intelligence.roadLinksFor(settlements, 4400);
  const link = links.find((candidate) => candidate.path?.some((point) => point.bridge));
  assert.ok(link);
  const origin = civilization.states.get(link.a.id);
  const startingTimber = origin.stock.timber;
  const convoy = civilization.seedTestConvoy(link.a.id, link.b.id, link.id, 1);
  assert.equal(convoy.id, 'field-test:starter-convoy');
  assert.equal(convoy.cargo.resource, 'timber');
  assert.ok(convoy.cargo.quantity > 0);
  assert.ok(origin.stock.timber < startingTimber);
  const restored = new CivilizationSystem(generator.seed, intelligence, civilization.getSaveData());
  assert.equal(restored.tradeConvoys[0].cargo.quantity, convoy.cargo.quantity);
  restored.advanceTo(convoy.arrivalDay, 'summer');
  assert.equal(restored.tradeConvoys[0].status, 'delivered');
});

test('the scripted practice encounter uses the normal combat save and reward path', () => {
  const { generator, layout, intelligence } = createScenario();
  const combat = new CombatSystem(generator.seed, generator, intelligence);
  const rpg = new RPGSystem();
  assert.equal(combat.addScenarioHostile({ id: 'field-test:practice-wisp', x: layout.hostile.x, z: layout.hostile.z, maxHealth: 28 }), true);
  assert.equal(combat.hostilesNear(layout.hostile.x, layout.hostile.z, 20).length, 1);
  let result;
  for (let time = 1; time < 8; time += 0.6) {
    result = combat.strike('field-test:practice-wisp', rpg, time);
    if (result.defeated) break;
  }
  assert.equal(result.defeated, true);
  const restored = new CombatSystem(generator.seed, generator, intelligence, combat.getSaveData());
  restored.addScenarioHostile({ id: 'field-test:practice-wisp', x: layout.hostile.x, z: layout.hostile.z, maxHealth: 28 });
  assert.equal(restored.hostilesNear(layout.hostile.x, layout.hostile.z, 20).length, 0);
});

test('saved-world records merge IndexedDB and fallback duplicates by newest timestamp', () => {
  const merged = mergeSavedWorldRecords([
    { seed: 'EMBERFALL', seedKey: 'EMBERFALL', savedAt: 10, worldName: 'Old' },
    { seed: 'EMBERFALL', seedKey: 'EMBERFALL', savedAt: 20, worldName: 'New' },
    { seed: 'WAYFARER', savedAt: 15 },
  ]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].worldName, 'New');
  assert.equal(merged[1].seed, 'WAYFARER');
});
