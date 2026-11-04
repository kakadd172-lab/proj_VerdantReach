import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const gameRoot = join(repoRoot, 'V8', 'verdant-reach-v0.8.6', 'verdant-reach');
const shipRoot = join(gameRoot, 'src', 'world', 'ships');
const ids = [
  'sloop','schooner','brigantine','brig','snow','cutter','frigate','barque',
  'caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace',
];

for (const relative of [
  'src/world/ships/index.js',
  'src/world/ships/vessels/index.js',
  'src/world/ships/core/ship-designs.js',
  'src/world/ships/core/ship-structures.js',
  'src/world/ships/core/ship-hull-parameterization.js',
  'src/world/ships/core/ship-model-builder.js',
  'node_modules/three/package.json',
]) {
  assert.ok(existsSync(join(gameRoot, relative)), 'Missing v0.8.6 game dependency: ' + relative);
}

const registry = readFileSync(join(shipRoot, 'vessels', 'index.js'), 'utf8');
const runtime = readFileSync(join(shipRoot, 'index.js'), 'utf8');
for (const id of ids) {
  const vesselPath = join(shipRoot, 'vessels', id + '.js');
  assert.ok(existsSync(vesselPath), 'Missing independent vessel file: ' + id);
  const source = readFileSync(vesselPath, 'utf8');
  assert.ok(source.includes("id: '" + id + "'"), id + ' vessel id');
  assert.ok(source.includes('generate(createShipModel)'), id + ' generator function');
  assert.ok(registry.includes("'" + id + "'"), id + ' definition registration');
}
assert.ok(runtime.includes('VESSEL_IDS.map'), 'Runtime must build generators from the vessel registry.');
assert.ok(runtime.includes('createShip(type)'), 'Runtime must expose the modular createShip API.');

for (const adapter of ['ship-designs.js','ship-structures.js','ship-hull-parameterization.js','ship-models.js']) {
  const source = readFileSync(join(here, adapter), 'utf8');
  assert.ok(source.includes('../V8/verdant-reach-v0.8.6/verdant-reach/'), adapter + ' must import v0.8.6 game code');
}

const designAdapter = readFileSync(join(here, 'ship-designs.js'), 'utf8');
const structureAdapter = readFileSync(join(here, 'ship-structures.js'), 'utf8');
const modelBuilder = readFileSync(join(shipRoot, 'core', 'ship-model-builder.js'), 'utf8');

// Query strings are part of browser ES-module identity. The adapters must use
// the exact same query as the builder or live override maps silently split.
assert.ok(designAdapter.includes('ship-designs.js?v=0.8.6'), 'Design adapter must share the builder module URL.');
assert.ok(structureAdapter.includes('ship-structures.js?v=0.8.6'), 'Structure adapter must share the builder module URL.');
assert.ok(modelBuilder.includes("'./ship-designs.js?v=0.8.6'"), 'Builder design import revision changed unexpectedly.');
assert.ok(modelBuilder.includes("'./ship-structures.js?v=0.8.6'"), 'Builder structure import revision changed unexpectedly.');

const preview = readFileSync(join(here, 'preview.js'), 'utf8');
assert.ok(preview.includes("./ship-designs.js?v=0.8.6"));
assert.ok(preview.includes("./ship-structures.js?v=0.8.6"));
assert.ok(preview.includes("./ship-models.js?v=0.8.6"));

console.log('Verified v0.8.6 modular game source, 16 vessel modules, editor adapters and shared override module identity.');
