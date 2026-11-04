import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const gameRoot = join(repoRoot, 'V8', 'verdant-reach-v0.8.6', 'verdant-reach');
const shipRoot = join(gameRoot, 'src', 'world', 'ships');
const forTestsShipRoot = join(here, 'ships');
const ids = [
  'sloop','schooner','brigantine','brig','snow','cutter','frigate','barque',
  'caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace',
];
const pascal = (id) => id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');

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

const gameRegistry = readFileSync(join(shipRoot, 'vessels', 'index.js'), 'utf8');
const gameRuntime = readFileSync(join(shipRoot, 'index.js'), 'utf8');
for (const id of ids) {
  const gameVesselPath = join(shipRoot, 'vessels', id + '.js');
  assert.ok(existsSync(gameVesselPath), 'Missing independent game vessel file: ' + id);
  const gameVessel = readFileSync(gameVesselPath, 'utf8');
  assert.ok(gameVessel.includes("id: '" + id + "'"), id + ' game vessel id');
  assert.ok(gameVessel.includes('generate(createShipModel)'), id + ' game generator function');
  assert.ok(gameRegistry.includes("'" + id + "'"), id + ' game definition registration');
}
assert.ok(gameRuntime.includes('VESSEL_IDS.map'), 'Game runtime must build generators from the vessel registry.');
assert.ok(gameRuntime.includes('createShip(type)'), 'Game runtime must expose the modular createShip API.');

const forTestsRegistry = readFileSync(join(forTestsShipRoot, 'index.js'), 'utf8');
const forTestsFactory = readFileSync(join(forTestsShipRoot, 'shared', 'define-vessel.js'), 'utf8');
assert.ok(forTestsFactory.includes('ship-model-builder.js?v=0.8.6'), 'ForTests factory must share the v0.8.6 model-builder module identity.');
for (const id of ids) {
  const editorVesselPath = join(forTestsShipRoot, 'vessels', id + '.js');
  assert.ok(existsSync(editorVesselPath), 'Missing dedicated ForTests ship module: ' + id);
  const editorVessel = readFileSync(editorVesselPath, 'utf8');
  assert.ok(editorVessel.includes('/vessels/' + id + '.js'), id + ' must link to its matching game vessel source');
  assert.ok(editorVessel.includes("ForTests/ships/vessels/" + id + ".js"), id + ' editor module path');
  assert.ok(editorVessel.includes('defineTestVessel'), id + ' dedicated model adapter');
  assert.ok(editorVessel.includes('export const createModel'), id + ' dedicated model creator');
  assert.ok(editorVessel.includes('export const generate' + pascal(id)), id + ' named per-vessel generator');
  assert.ok(forTestsRegistry.includes("./vessels/" + id + ".js"), id + ' ForTests registry registration');
}

for (const adapter of ['ship-designs.js','ship-structures.js','ship-hull-parameterization.js','ship-models.js']) {
  const source = readFileSync(join(here, adapter), 'utf8');
  assert.ok(source.includes('../V8/verdant-reach-v0.8.6/verdant-reach/') || source.includes('./ships/index.js'), adapter + ' must connect to v0.8.6 game/ForTests ship modules');
}

const designAdapter = readFileSync(join(here, 'ship-designs.js'), 'utf8');
const structureAdapter = readFileSync(join(here, 'ship-structures.js'), 'utf8');
const modelBuilder = readFileSync(join(shipRoot, 'core', 'ship-model-builder.js'), 'utf8');
const modelAdapter = readFileSync(join(here, 'ship-models.js'), 'utf8');

// Query strings are part of browser ES-module identity. The adapters must use
// the exact same query as the builder or live override maps silently split.
assert.ok(designAdapter.includes('ship-designs.js?v=0.8.6'), 'Design adapter must share the builder module URL.');
assert.ok(structureAdapter.includes('ship-structures.js?v=0.8.6'), 'Structure adapter must share the builder module URL.');
assert.ok(modelBuilder.includes("'./ship-designs.js?v=0.8.6'"), 'Builder design import revision changed unexpectedly.');
assert.ok(modelBuilder.includes("'./ship-structures.js?v=0.8.6'"), 'Builder structure import revision changed unexpectedly.');
assert.ok(modelAdapter.includes("from './ships/index.js'"), 'Ship model adapter must route through the ForTests vessel registry.');
assert.ok(modelAdapter.includes("ship-model-builder.js?v=0.8.6"), 'Ship model adapter must use the same v0.8.6 builder module.');

const preview = readFileSync(join(here, 'preview.js'), 'utf8');
assert.ok(preview.includes("./ship-designs.js?v=0.8.6"));
assert.ok(preview.includes("./ship-structures.js?v=0.8.6"));
assert.ok(preview.includes("./ship-models.js?v=0.8.6"));

console.log('Verified v0.8.6 game source, 16 dedicated ForTests ship modules, vessel generators and shared module identity.');
