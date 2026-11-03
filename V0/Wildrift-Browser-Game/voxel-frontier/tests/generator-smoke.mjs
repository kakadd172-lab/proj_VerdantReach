import assert from 'node:assert/strict';
import { WorldGenerator } from '../src/world/generator.js';
import { seedFromString } from '../src/world/noise.js';
import { BLOCK } from '../src/world/blocks.js';

const seed = seedFromString('wildrift-smoke-test');
const first = new WorldGenerator(seed);
const sameSeed = new WorldGenerator(seed);
const otherSeed = new WorldGenerator(seed + 1);

const chunkA = first.generateChunkData(-1, 2).data;
const chunkB = sameSeed.generateChunkData(-1, 2).data;
assert.equal(Buffer.compare(Buffer.from(chunkA), Buffer.from(chunkB)), 0, 'same seed and chunk must be byte-identical');
const differentSeed = otherSeed.generateChunkData(-1, 2).data;
assert.notEqual(Buffer.compare(Buffer.from(chunkA), Buffer.from(differentSeed)), 0, 'changing the seed must change generated blocks');

const biomes = new Set();
for (let z = -5000; z <= 5000; z += 55) {
  for (let x = -5000; x <= 5000; x += 55) biomes.add(first.sampleColumn(x, z).biome);
}
assert.equal(biomes.size, 13, `expected all 13 biomes in broad-area sample; got ${biomes.size}`);

let maxBoundaryStep = 0;
for (let z = -900; z <= 900; z += 12) {
  const west = first.sampleColumn(15, z).height;
  const east = first.sampleColumn(16, z).height;
  maxBoundaryStep = Math.max(maxBoundaryStep, Math.abs(west - east));
}
assert.ok(maxBoundaryStep <= 4, `terrain should vary smoothly across a chunk boundary; max one-block step was ${maxBoundaryStep}`);

const counts = new Uint32Array(22);
for (const id of chunkA) {
  assert.ok(id < counts.length, `unexpected block ID ${id}`);
  counts[id]++;
}
assert.ok(counts[BLOCK.STONE] > 0, 'terrain should contain stone');
assert.ok(counts[BLOCK.GRASS] + counts[BLOCK.SAND] + counts[BLOCK.SNOW] > 0, 'terrain should contain surface blocks');
assert.ok(counts[BLOCK.COAL] + counts[BLOCK.IRON] + counts[BLOCK.GOLD] + counts[BLOCK.DIAMOND] > 0, 'terrain should contain ore');
console.log(`World generator smoke test passed. Biomes: ${biomes.size}/13; maximum adjacent-column step at chunk edge: ${maxBoundaryStep}; chunk bytes: ${chunkA.length}.`);
