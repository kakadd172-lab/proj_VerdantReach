import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/terrain.js';

test('the same seed reproduces the same sampled geography', () => {
  const a = new WorldGenerator('EMBERFALL');
  const b = new WorldGenerator('EMBERFALL');
  const points = [[0, 0], [88, 0], [0, 88], [-512, 320], [2048, -1536], [12000, 4000]];
  for (const [x, z] of points) {
    assert.equal(a.heightAt(x, z), b.heightAt(x, z));
    const sampleA = a.sample(x, z);
    const sampleB = b.sample(x, z);
    assert.equal(sampleA.biome, sampleB.biome);
    assert.equal(sampleA.height, sampleB.height);
  }
});

test('different seeds can produce different terrain at the same coordinates', () => {
  const a = new WorldGenerator('EMBERFALL');
  const b = new WorldGenerator('MOONHARBOR');
  const points = [[0, 0], [88, 0], [0, 88], [-512, 320], [2048, -1536], [12000, 4000]];
  assert.ok(points.some(([x, z]) => a.heightAt(x, z) !== b.heightAt(x, z)));
});

test('terrain and climate samples remain finite across a broad coordinate range', () => {
  const generator = new WorldGenerator('TIDEMARCH');
  for (let z = -20000; z <= 20000; z += 2500) {
    for (let x = -20000; x <= 20000; x += 2500) {
      const sample = generator.sample(x, z);
      assert.ok(Number.isFinite(sample.height));
      assert.ok(Number.isFinite(sample.temperature));
      assert.ok(Number.isFinite(sample.moisture));
      assert.ok(sample.temperature >= 0 && sample.temperature <= 1);
      assert.ok(sample.moisture >= 0 && sample.moisture <= 1);
    }
  }
});

test('a world starts at a walkable land coordinate for the starter seed', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  assert.ok(Number.isFinite(spawn.x) && Number.isFinite(spawn.z));
  assert.ok(spawn.height > 8 && spawn.height < 82);
});

test('global height sampling is stable at chunk boundaries', () => {
  const generator = new WorldGenerator('RIVERGLASS');
  const chunkSize = 88;
  for (let k = -8; k <= 8; k += 1) {
    const z = k * 13.25;
    const edgeFromWest = generator.heightAt(chunkSize, z);
    const edgeFromEast = generator.heightAt(0 + chunkSize, z);
    assert.equal(edgeFromWest, edgeFromEast);
  }
});

test('the starter quest chain advances and pays rewards exactly once', async () => {
  const { RPGSystem } = await import('../src/systems/rpg.js');
  const rpg = new RPGSystem();
  for (let i = 0; i < 4; i += 1) assert.equal(rpg.addMoonleaf().completed.length, 0);
  const first = rpg.addMoonleaf();
  assert.equal(first.completed[0].title, 'Greenward Errand');
  assert.equal(rpg.questIndex, 1);
  assert.equal(rpg.inventory.silverPetal, 20);
  const second = rpg.attuneWaystone('stone:test');
  assert.equal(second.completed[0].title, 'Echoes on the Road');
  assert.equal(rpg.questIndex, 2);
  assert.equal(rpg.inventory.echoGlass, 1);
  assert.equal(rpg.attuneWaystone('stone:test').completed.length, 0);
});

test('quest prerequisites discovered out of order still resolve in sequence', async () => {
  const { RPGSystem } = await import('../src/systems/rpg.js');
  const rpg = new RPGSystem();
  assert.equal(rpg.attuneWaystone('stone:early').completed.length, 0);
  for (let i = 0; i < 5; i += 1) {
    const result = rpg.addMoonleaf();
    if (i === 4) assert.deepEqual(result.completed.map((quest) => quest.title), ['Greenward Errand', 'Echoes on the Road']);
  }
  assert.equal(rpg.questIndex, 2);
  assert.equal(rpg.inventory.silverPetal, 20);
  assert.equal(rpg.inventory.echoGlass, 1);
});

test('new worlds find a land start across a range of distinct seeds', () => {
  for (let i = 1; i <= 16; i += 1) {
    const generator = new WorldGenerator(`SPIRAL-${i}`);
    const spawn = generator.findSpawn();
    assert.ok(spawn.height > 8 && spawn.height < 82, `seed ${i} did not find a safe land start`);
  }
});

test('the continental climate field produces multiple distinct land biomes', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const biomes = new Set();
  for (let z = -30000; z <= 30000; z += 1200) {
    for (let x = -30000; x <= 30000; x += 1200) {
      const sample = generator.sample(x, z);
      if (sample.height > 0) biomes.add(sample.biome);
    }
  }
  assert.ok(biomes.has('forest'));
  assert.ok(biomes.has('desert'));
  assert.ok(biomes.has('alpine') || biomes.has('snow'));
  assert.ok(biomes.size >= 5, `expected a varied land climate, got ${[...biomes].join(', ')}`);
});
