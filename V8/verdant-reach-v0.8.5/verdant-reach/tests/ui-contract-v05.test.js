import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('v0.5 menu and HUD IDs required by the mode-aware interface exist', () => {
  const html = read('index.html');
  const interfaceSource = read('src/ui/interface.js');
  const mainSource = read('src/main.js');
  const htmlIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const dynamicIds = new Set([...interfaceSource.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const source = `${interfaceSource}\n${mainSource}`;
  const referencedIds = new Set([...source.matchAll(/\$\(['"]#([\w-]+)['"]\)/g)].map((match) => match[1]));
  const missing = [...referencedIds].filter((id) => !htmlIds.has(id) && !dynamicIds.has(id));
  assert.deepEqual(missing, []);
  for (const id of ['mode-survival', 'mode-creative', 'game-mode-chip', 'survival-needs', 'creative-tools-button', 'saved-worlds-view']) {
    assert.ok(htmlIds.has(id), `Expected #${id} in index.html`);
  }
});

test('Creative editor exposes persistent summon, biome, time, weather, and utility actions', () => {
  const source = read('src/ui/interface.js');
  for (const action of ['summon', 'summon-ahead', 'paint-biome', 'restore-biome', 'set-time', 'set-weather', 'heal', 'grant-supplies', 'teleport-home', 'clear-nearby', 'save-world']) {
    assert.ok(source.includes(`data-creative-action="${action}"`), `Missing Creative action ${action}`);
  }
});
