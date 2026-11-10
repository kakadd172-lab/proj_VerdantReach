import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const shipRoot=join(here,'ships');
const ids=['sloop','schooner','brigantine','brig','snow','cutter','frigate','barque','caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace'];
const modularIds=new Set(["barque","brig","brigantine","caravel","carrack","sloop","schooner","snow","cutter","frigate","galleon","fluyt","xebec","junk","first-rate","pinnace"]);
const pascal=id=>id.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');
const registry=readFileSync(join(shipRoot,'index.js'),'utf8');
const definitions=readFileSync(join(shipRoot,'shared','vessel-definition.js'),'utf8');
const kit=readFileSync(join(shipRoot,'shared','ship-editor-kit.js'),'utf8');

for(const path of ['index.js','README.md','shared/vessel-definition.js','shared/ship-editor-kit.js']){
 assert.ok(existsSync(join(shipRoot,path)),'Missing required ForTests support file: '+path);
}
assert.ok(definitions.includes('defineVesselSpec'),'Definition helper must validate vessel specifications.');
assert.ok(definitions.includes('getResolvedVesselDefinition'),'Definition helper must resolve editor overrides.');
assert.ok(definitions.includes('editorDefaults'),'Definition helper must resolve per-vessel saved defaults.');
assert.ok(kit.includes('editorDefaults'),'Ship model lifecycle must apply per-vessel saved component defaults.');
assert.ok(kit.includes('createShipContext')&&kit.includes('finishShipModel'),'Editor kit must expose context and lifecycle APIs.');
for(const routine of ['function halfBreadth(','function hullPoint(','function buildHull(','function buildCanvasSail(','function buildRig(']){
 assert.ok(!kit.includes(routine),'Editor kit must not contain vessel geometry: '+routine);
}
assert.ok(!existsSync(join(shipRoot,'shared','ship-model-builder.js')),'Removed shared ship geometry builder was restored.');
assert.ok(!existsSync(join(shipRoot,'shared','hull-math.js')),'Removed shared hull geometry module was restored.');
for(const path of ['ship-designs.js','ship-structures.js','ship-hull-parameterization.js','ship-models.js']){
 assert.ok(!existsSync(join(here,path)),'Unused top-level adapter remains: '+path);
}
assert.ok(!existsSync(join(shipRoot,'shared','define-vessel.js')),'Unused wrapper helper remains.');

const hullFingerprints=new Set(),sailFingerprints=new Set();
for(const id of ids){
 const converted=modularIds.has(id);
 const vesselDir=join(shipRoot,'vessels',id);
 const facadePath=converted?join(vesselDir,id+'.js'):join(shipRoot,'vessels',id+'.js');
 assert.ok(existsSync(facadePath),'Missing independent vessel module: '+id);
 const source=readFileSync(facadePath,'utf8');
 const defaultsPath=join(vesselDir,'editor-defaults.js');
 assert.ok(existsSync(defaultsPath),id+' must own an editor-defaults.js file beside its generator.');
 const defaultsSource=readFileSync(defaultsPath,'utf8');
 assert.ok(defaultsSource.includes('verdant-reach-vessel-defaults'),id+' editor defaults file must use the vessel-defaults format.');
 const defaultsVesselId=defaultsSource.match(/["']?vesselId["']?[ \t]*:[ \t]*["']([^"']+)["']/)?.[1];
 assert.equal(defaultsVesselId,id,id+' editor defaults file must identify its vessel.');
 assert.ok(source.includes("import EDITOR_DEFAULTS from './editor-defaults.js'")&&source.includes('editorDefaults: EDITOR_DEFAULTS'),id+' generator must load its own saved defaults.');
 const registryPath=converted?'./vessels/'+id+'/'+id+'.js':'./vessels/'+id+'.js';
 assert.ok(registry.includes(registryPath),id+' missing from the registry.');
 assert.ok(source.includes('createShipContext(')&&source.includes('finishShipModel('),id+' must use the editor lifecycle APIs.');
 assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(source),id+' still depends on a shared geometry engine.');
 assert.ok(!source.includes('../V8/')&&!source.includes('V8/verdant-reach'),id+' must not import main-game code.');

 let geometrySource=source,sailSource=source;
 if(converted){
  const architecture=readFileSync(join(vesselDir,'architecture','layout.js'),'utf8');
  geometrySource=readFileSync(join(vesselDir,'architecture','hull-geometry.js'),'utf8');
  sailSource=readFileSync(join(vesselDir,'generators','sails','sail-cloth-generator.js'),'utf8');
  assert.ok(architecture.includes('assemblyOrder')&&architecture.includes('mastInstances')&&architecture.includes('dependencyGraph'),id+' requires a complete architecture blueprint.');
  for(const path of [
   'generators/hull/hull-generator.js','generators/hull/keel-generator.js','generators/hull/stem-generator.js',
   'generators/decks/deck-generator.js','generators/decks/deck-planking-generator.js',
   'generators/hull-structure/frame-generator.js','generators/hull-structure/hull-planking-generator.js',
   'generators/stern/stern-generator.js','generators/cabins/aft-cabin-generator.js',
   'generators/bow/bow-generator.js','generators/steering/rudder-generator.js','generators/steering/helm-generator.js',
   'generators/deck-equipment/railing-generator.js','generators/deck-equipment/fittings-generator.js',
   'generators/anchors/anchor-generator.js','generators/sails/sail-cloth-generator.js',
   'generators/sails/head-sails-generator.js','generators/masts/mast-frame-generator.js',
   'generators/rigging/standing-rigging-generator.js'
  ])assert.ok(existsSync(join(vesselDir,path)),id+' missing component generator '+path);
  assert.ok(source.includes('./architecture/layout.js'),id+' assembler must import its architecture.');
  assert.ok(source.includes('ARCHITECTURE.assemblyOrder'),id+' must follow its architecture assembly order.');
  assert.ok(source.includes('shipArchitecture') && source.includes('ARCHITECTURE'),id+' should expose its architecture to the editor.');
  const mastNames=[...readFileSync(join(vesselDir,'architecture','layout.js'),'utf8').matchAll(/id:\s*"([^"]+)",\s*foreAftStation/g)].map(m=>m[1]);
  for(const mastId of mastNames)assert.ok(existsSync(join(vesselDir,'generators','masts',mastId+'mast-generator.js')),id+' missing individual '+mastId+' mast generator.');
  assert.ok(!existsSync(join(shipRoot,'vessels',id+'.js')),id+' legacy flat generator should be removed.');
 }else{
  for(const required of [
   "id: '"+id+"'",'design:','structure:','function halfBreadth(','function hullPoint(','function buildHull(',
   'function buildFramesAndPlanking(','function buildStern(','function buildBow(','function buildRudderAndHelm(',
   'function buildRailingsAndEquipment(','function buildAnchors(','function buildCanvasSail(','function buildRig('
  ])assert.ok(source.includes(required),id+' missing its own '+required);
  assert.ok(source.includes("from '../shared/ship-editor-kit.js'"),id+' should only use low-level editor support.');
 }
 const hull=geometrySource.match(/function halfBreadth\(d,t\)\s*\{([\s\S]*?)\}/);
 const sail=sailSource.match(/function buildCanvasSail\(ctx,[\s\S]*?\n\}/);
 assert.ok(hull,id+' missing its own hull breadth function.');
 assert.ok(sail,id+' missing its own curved sail-cloth algorithm.');
 hullFingerprints.add(hull[1].trim());
 sailFingerprints.add(sail[0].trim());
}
assert.equal(hullFingerprints.size,16,'Each vessel must implement a distinct hull breadth function.');
assert.equal(sailFingerprints.size,16,'Each vessel must implement its own sail surface profile.');

const preview=readFileSync(join(here,'preview.js'),'utf8');
assert.ok(preview.includes("./ships/index.js?v=0.8.24-legacy-transform-import"),'Preview must load the persistent authoring registry.');
assert.ok(preview.includes('VESSEL_EDITOR_DEFAULTS'),'Preview must load saved defaults for all vessels.');
for(const legacy of ['ship-model-builder.js','hull-math.js','./ship-designs.js','./ship-structures.js','./ship-hull-parameterization.js','./ship-models.js']){
 assert.ok(!preview.includes(legacy),'Preview still references obsolete module '+legacy);
}
for(const version of ["SHIP_DESIGN_MODULE_VERSION!=='0.8.9'","SHIP_STRUCTURE_MODULE_VERSION!=='0.8.9'","SHIP_MODEL_MODULE_VERSION!=='0.8.24'"]){
 assert.ok(preview.includes(version),'Preview version guard not updated: '+version);
}
const pkg=JSON.parse(readFileSync(join(here,'package.json'),'utf8'));
assert.ok(!pkg.scripts.postinstall,'Standalone ForTests must not install main-game dependencies.');
const vite=readFileSync(join(here,'vite.config.js'),'utf8');
assert.ok(/fs:\s*\{\s*allow:\s*\[forTestsDir\]\s*\}/.test(vite),'Vite should serve only the ForTests workspace.');
assert.ok(vite.includes('/__ship-editor/save')&&vite.includes('/__ship-editor/reset'),'Vite must expose validated save and reset handlers.');
console.log('Verified all 16 ship generators use independent component-first vessel folders.');
