import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const [html,preview,researchPage,assetAudit]=await Promise.all([
  readFile(join(root,'index.html'),'utf8'),
  readFile(join(root,'preview.js'),'utf8'),
  readFile(join(root,'historical-model-references.html'),'utf8'),
  readFile(join(root,'HISTORICAL_ASSET_RESEARCH.md'),'utf8'),
]);
const [css,gameHtml]=await Promise.all([
  readFile(join(root,'../V8/verdant-reach-v0.8.6/verdant-reach/src/styles.css'),'utf8'),
  readFile(join(root,'../V8/verdant-reach-v0.8.6/verdant-reach/index.html'),'utf8'),
]);

const requiredIds=[
  'viewport','ship-select','part-select','undo','redo','position-fields','rotation-fields',
  'scale-fields','design-controls','length','beam','draft','masts','parts','description',
  'save-design','export-design','status','part-size','part-parent','part-meshes','part-materials',
  'compare-select','compare-summary','measure-toggle','clear-measurement','measurement-value',
  'section-toggle','section-slider','section-value','import-design','import-file',
  'capture-preview','viewport-fullscreen','viewport-readout',
];

test('shipyard page exposes every editor control and information target',()=>{
  for(const id of requiredIds)assert.match(html,new RegExp('id="'+id+'"'),'Missing #'+id+' in the editor page.');
});

test('all new analysis and import controls are wired to runtime handlers',()=>{
  for(const symbol of [
    'function refreshPartInspector()',
    'function updateComparison()',
    'function updateSectionRange()',
    'function toggleSection()',
    'function toggleMeasure()',
    'function addMeasurementPoint(point)',
    "addEventListener('change',updateComparison)",
    "addEventListener('input',updateSectionPlane)",
    "addEventListener('change',async event=>",
    "toDataURL('image/png')",
    'requestFullscreen()',
  ])assert.ok(preview.includes(symbol),'Missing runtime wiring: '+symbol);
});

test('the shipyard page keeps its vessel choice, parameter, and save workflow targets',()=>{
  assert.ok(html.includes('data-mode="translate"'));
  assert.ok(html.includes('data-mode="rotate"'));
  assert.ok(html.includes('data-mode="scale"'));
  assert.ok(html.includes('id="design-controls"'));
  assert.ok(html.includes('id="save-design"'));
  assert.ok(html.includes('id="export-design"'));
});


test('historical asset research is linked and does not confuse external sources with bundled presets',()=>{
  assert.ok(html.includes('href="./historical-model-references.html"'));
  assert.ok(researchPage.includes('Nothing on this page is bundled into the game yet.'));
  assert.ok(researchPage.includes('HISTORICAL_ASSET_RESEARCH.md'));
  assert.ok(assetAudit.includes('Generator-by-generator coverage'));
  assert.ok(assetAudit.includes('`first-rate`'));
  assert.ok(assetAudit.includes('`fluyt`'));
});

test('the refreshed game title menu keeps every original launch and save control',()=>{
  for(const selector of [
    'id="main-menu"','id="mode-survival"','id="mode-creative"','id="world-seed"',
    'id="random-seed"','id="start-world"','id="continue-world"',
    'id="open-saved-worlds"','id="saved-worlds-view"','id="saved-worlds-list"',
    'id="saved-worlds-back"',
  ])assert.ok(gameHtml.includes(selector),'Game title markup is missing '+selector);
});

test('the refreshed game title menu uses responsive, reduced-motion-friendly comfort styling',()=>{
  assert.ok(css.includes('/* v0.8.6 comfort refresh'));
  assert.ok(css.includes('.menu-content'));
  assert.ok(css.includes('@media (max-width: 760px)'));
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(css.includes('border-radius: 28px'));
});
