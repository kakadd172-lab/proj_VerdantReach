import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const shipRoot=join(here,'ships');
const ids=['sloop','schooner','brigantine','brig','snow','cutter','frigate','barque','caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace'];
const pascal=id=>id.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');
const registry=readFileSync(join(shipRoot,'index.js'),'utf8');
const definitions=readFileSync(join(shipRoot,'shared','vessel-definition.js'),'utf8');
const editorKit=readFileSync(join(shipRoot,'shared','ship-editor-kit.js'),'utf8');

for(const path of ['index.js','README.md','shared/vessel-definition.js','shared/ship-editor-kit.js']){
 assert.ok(existsSync(join(shipRoot,path)),'Missing required ForTests support file: '+path);
}
assert.ok(definitions.includes('defineVesselSpec'),'Definition helper must validate vessel specifications.');
assert.ok(definitions.includes('getResolvedVesselDefinition'),'Definition helper must resolve editor overrides.');
assert.ok(editorKit.includes('createShipContext')&&editorKit.includes('finishShipModel'),'Editor kit must expose construction context and lifecycle API.');
for(const routine of ['function halfBreadth(','function hullPoint(','function buildHull(','function buildRig(']){
 assert.ok(!editorKit.includes(routine),'Editor kit must not own vessel geometry: '+routine);
}
for(const obsolete of ['shared/ship-model-builder.js','shared/hull-math.js']){
 assert.ok(!existsSync(join(shipRoot,obsolete)),'Obsolete shared geometry file remains: '+obsolete);
}
for(const path of ['ship-designs.js','ship-structures.js','ship-hull-parameterization.js','ship-models.js']){
 assert.ok(!existsSync(join(here,path)),'Unused top-level adapter remains: '+path);
}
assert.ok(!existsSync(join(shipRoot,'shared','define-vessel.js')),'Unused wrapper helper remains.');

const hullFingerprints=new Set();
for(const id of ids){
 const path=join(shipRoot,'vessels',id+'.js');
 assert.ok(existsSync(path),'Missing independent vessel module: '+id);
 const source=readFileSync(path,'utf8');
 for(const required of [
  "id: '"+id+"'",'design:','structure:','sternTiers:','keelDetails:','rudderDetails:',
  'function halfBreadth(','function hullPoint(','function buildHull(','function buildFramesAndPlanking(',
  'function buildStern(','function buildBow(','function buildRudderAndHelm(','function buildRailingsAndEquipment(',
  'function buildAnchors(','function buildRig(','function generate'+pascal(id)+'Geometry(',
  'function create'+pascal(id)+'Model('
 ])assert.ok(source.includes(required),id+' missing its own '+required);
 assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(source),id+' still depends on legacy geometry engine.');
 assert.ok(source.includes("from './shared/ship-editor-kit.js'")||source.includes("from '../shared/ship-editor-kit.js'"),id+' must only use the low-level editor kit.');
 assert.ok(registry.includes("./vessels/"+id+".js"),id+' missing from the registry.');
 assert.ok(!source.includes('../V8/')&&!source.includes('V8/verdant-reach'),id+' must not import main-game code.');
 const match=source.match(/function halfBreadth\(d,t\)\s*\{([\s\S]*?)\}/);
 assert.ok(match,id+' is missing hull algorithm source.');
 hullFingerprints.add(match[1].trim());
}
assert.equal(hullFingerprints.size,16,'Every vessel must implement a distinct hull breadth algorithm.');

const preview=readFileSync(join(here,'preview.js'),'utf8');
assert.ok(preview.includes("./ships/index.js?v=0.8.7"),'Preview must load the independent-generator registry.');
for(const legacy of ['ship-model-builder.js','hull-math.js','./ship-designs.js','./ship-structures.js','./ship-hull-parameterization.js','./ship-models.js']){
 assert.ok(!preview.includes(legacy),'Preview still references obsolete module '+legacy);
}
for(const version of ["SHIP_DESIGN_MODULE_VERSION!=='0.8.7'","SHIP_STRUCTURE_MODULE_VERSION!=='0.8.7'","SHIP_MODEL_MODULE_VERSION!=='0.8.7'"]){
 assert.ok(preview.includes(version),'Preview version guard not updated: '+version);
}
const pkg=JSON.parse(readFileSync(join(here,'package.json'),'utf8'));
assert.ok(!pkg.scripts.postinstall,'Standalone ForTests must not install main-game dependencies.');
const vite=readFileSync(join(here,'vite.config.js'),'utf8');
assert.ok(vite.includes('fs: { allow: [forTestsDir] }'),'Vite should serve only the ForTests workspace.');
console.log('Verified 16 per-vessel geometry generators, 16 distinct hull algorithms, and no shared geometry engine.');
