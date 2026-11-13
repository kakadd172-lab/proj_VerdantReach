import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const [html,preview]=await Promise.all([
  readFile(join(root,'index.html'),'utf8'),
  readFile(join(root,'preview.js'),'utf8'),
]);
const [css,gameHtml]=await Promise.all([
  readFile(join(root,'../V8/verdant-reach-v0.8.6/verdant-reach/src/styles.css'),'utf8'),
  readFile(join(root,'../V8/verdant-reach-v0.8.6/verdant-reach/index.html'),'utf8'),
]);

const requiredIds=[
  'viewport','model-category','model-category-caption','ship-select','part-select','undo','redo','position-fields','rotation-fields',
  'scale-fields','design-controls','length','beam','draft','masts','parts','description',
  'save-design','export-design','save-state','restore-generator-defaults','status','part-size','part-parent','part-meshes','part-materials',
  'compare-select','compare-summary','measure-toggle','clear-measurement','measurement-value',
  'section-toggle','section-slider','section-value','import-design','import-file',
  'capture-preview','viewport-fullscreen','viewport-readout','box-select-toggle','clear-selection','selection-count',
  'wind-toggle','wind-state','wind-direction','wind-direction-value','wind-direction-readout','wind-arrow',
  'wind-speed','wind-speed-value','wind-speed-readout','mast-response-value','sail-state-value','sails-full','sails-reef','sails-furl','gust-toggle','simulation-toggle','sailing-reset',
  'rudder-angle','rudder-angle-value','helm-wheel-angle','rudder-center',
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
    'function refreshSailingControls()',
    'function updateSailingTelemetry()',
    'function setAllSails(mode,duration=.85)',
    "document.querySelector('#sails-full')?.addEventListener('click'",
    "document.querySelector('#sails-reef')?.addEventListener('click'",
    "document.querySelector('#sails-furl')?.addEventListener('click'",
    'updateSailingTelemetry();',
    "document.querySelector('#wind-toggle')?.addEventListener('click'",
    "document.querySelector('#gust-toggle')?.addEventListener('click'",
    "document.querySelector('#simulation-toggle')?.addEventListener('click'",
    "document.querySelector('#sailing-reset')?.addEventListener('click'",
    "ship.userData.animateShip(delta,windSettings)",
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
  assert.ok(html.includes('Save to ship files'));
  assert.ok(html.includes('id="export-design"'));
  assert.ok(html.includes('id="restore-generator-defaults"'));
  assert.ok(preview.includes('function effectiveVesselConfig(id)'));
  assert.ok(preview.includes("fetch('/__ship-editor/save'"));
  assert.ok(preview.includes("fetch('/__ship-editor/reset'"));
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

test('shipyard supports direct review links for a selected vessel, component and camera',()=>{
  assert.ok(preview.includes("new URLSearchParams(window.location.search)"));
  assert.ok(preview.includes("reviewParams.get('ship')"));
  assert.ok(preview.includes("reviewParams.get('part')"));
  assert.ok(preview.includes("reviewParams.get('camera')"));
  assert.ok(preview.includes("['top','side','bow','stern'].includes(reviewCamera)"));
  assert.ok(preview.includes('loadShip(selector.value||Object.keys(SHIP_DESIGNS)[0],reviewPartName)'));
});


test('shipyard supports drag-box multi-selection and collective gizmo transforms',()=>{
  for(const symbol of [
    'function selectPartsInRectangle(start,end,append=false)',
    'function pruneNestedSelection(names)',
    'function beginGroupTransform()',
    'function finishGroupTransform()',
    "addEventListener('pointerdown'",
    "addEventListener('pointermove'",
    "addEventListener('pointerup'",
    "commitHistory(session.before,'Group transform '",
    "else if(key==='q')toggleBoxSelect()",
  ])assert.ok(preview.includes(symbol),'Missing box-selection behavior: '+symbol);
  assert.ok(html.includes('Shift + drag adds to selection'));
});

test('shipyard exposes a separate miscellaneous category and variant-aware model adapter',()=>{
  assert.ok(html.includes('<option value="miscellaneous">Miscellaneous</option>'));
  for(const symbol of [
    "document.querySelector('#model-category')",
    "import('./ships/misc/index.js?v=0.4.1')",
    'MISC_MODEL_IDS',
    'function createActiveModel(',
    'function refreshModelOptions(',
    "categorySelector.addEventListener('change'",
    'function effectiveMiscModelConfig(',
    'miscModels',
    'createMiscModel,',
  ])assert.ok(preview.includes(symbol),'Missing miscellaneous integration: '+symbol);
});


test('shipyard exposes the Maid of Endor V2 vessel entry and module version',()=>{
  assert.ok(html.includes('<option value="sloop-v2">Maid of Endor · Sloop V2</option>'));
  assert.ok(preview.includes("./ships/index.js?v=0.8.33-war-galleon"));
});
