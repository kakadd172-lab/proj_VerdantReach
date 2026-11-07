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
const kit=readFileSync(join(shipRoot,'shared','ship-editor-kit.js'),'utf8');

for(const path of ['index.js','README.md','shared/vessel-definition.js','shared/ship-editor-kit.js']){
 assert.ok(existsSync(join(shipRoot,path)),'Missing required ForTests support file: '+path);
}
assert.ok(definitions.includes('defineVesselSpec'),'Definition helper must validate vessel specifications.');
assert.ok(definitions.includes('getResolvedVesselDefinition'),'Definition helper must resolve editor overrides.');
assert.ok(kit.includes('createShipContext')&&kit.includes('finishShipModel'),'Editor kit must expose context and lifecycle APIs.');
for(const routine of ['function halfBreadth(','function hullPoint(','function buildHull(','function buildCanvasSail(','function buildRig(']){
 assert.ok(!kit.includes(routine),'Editor kit must not contain vessel geometry: '+routine);
}
assert.ok(!kit.includes('function sail('),'Curved sail geometry must be local to vessel files.');
assert.ok(!existsSync(join(shipRoot,'shared','ship-model-builder.js')),'Removed shared ship geometry builder was restored.');
assert.ok(!existsSync(join(shipRoot,'shared','hull-math.js')),'Removed shared hull geometry module was restored.');
for(const path of ['ship-designs.js','ship-structures.js','ship-hull-parameterization.js','ship-models.js']){
 assert.ok(!existsSync(join(here,path)),'Unused top-level adapter remains: '+path);
}
assert.ok(!existsSync(join(shipRoot,'shared','define-vessel.js')),'Unused wrapper helper remains.');

const hullFingerprints=new Set(),sailFingerprints=new Set();
for(const id of ids){
 const path=join(shipRoot,'vessels',id+'.js');assert.ok(existsSync(path),'Missing independent vessel module: '+id);
 const source=readFileSync(path,'utf8');
 for(const required of [
  "id: '"+id+"'",'design:','structure:','sternTiers:','keelDetails:','rudderDetails:',
  'function halfBreadth(','function hullPoint(','function buildHull(','function buildFramesAndPlanking(',
  'function buildStern(','function ensureSternTierComponents(','function buildBow(','function buildRudderAndHelm(',
  'function buildRailingsAndEquipment(','function buildAnchors(','function buildCanvasSail(',
  'function buildRig(','function generate'+pascal(id)+'Geometry(','function create'+pascal(id)+'Model('
 ])assert.ok(source.includes(required),id+' missing its own '+required);
 assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(source),id+' still depends on the old shared geometry path.');
 assert.ok(source.includes("from '../shared/ship-editor-kit.js'"),id+' should only use the low-level editor kit.');
 assert.ok(source.includes('buildAnchors(ctx.design,ctx)'),id+' must invoke its own anchor builder.');
 assert.ok(source.includes('buildCanvasSail(ctx,'),id+' must use its local sail builder.');
 assert.ok(registry.includes("./vessels/"+id+".js"),id+' missing from the registry.');
 assert.ok(!source.includes('../V8/')&&!source.includes('V8/verdant-reach'),id+' must not import main-game code.');
 const hull=source.match(/function halfBreadth\(d,t\)\s*\{([\s\S]*?)\}/);
 const sail=source.match(/function buildCanvasSail\(ctx,[\s\S]*?\n\}/);
 assert.ok(hull,id+' missing individual hull breadth algorithm.');
 assert.ok(sail,id+' missing individual sail-cloth algorithm.');
 hullFingerprints.add(hull[1].trim());sailFingerprints.add(sail[0].trim());
}
assert.equal(hullFingerprints.size,16,'Each vessel must implement a distinct hull breadth function.');
assert.equal(sailFingerprints.size,16,'Each vessel must implement its own sail surface profile.');

const preview=readFileSync(join(here,'preview.js'),'utf8');
assert.ok(preview.includes("./ships/index.js?v=0.8.8"),'Preview must load the independent generator registry.');
for(const legacy of ['ship-model-builder.js','hull-math.js','./ship-designs.js','./ship-structures.js','./ship-hull-parameterization.js','./ship-models.js']){
 assert.ok(!preview.includes(legacy),'Preview still references obsolete module '+legacy);
}
for(const version of ["SHIP_DESIGN_MODULE_VERSION!=='0.8.8'","SHIP_STRUCTURE_MODULE_VERSION!=='0.8.8'","SHIP_MODEL_MODULE_VERSION!=='0.8.8'"]){
 assert.ok(preview.includes(version),'Preview version guard not updated: '+version);
}
const pkg=JSON.parse(readFileSync(join(here,'package.json'),'utf8'));
assert.ok(!pkg.scripts.postinstall,'Standalone ForTests must not install main-game dependencies.');
const vite=readFileSync(join(here,'vite.config.js'),'utf8');
assert.ok(vite.includes('fs: { allow: [forTestsDir] }'),'Vite should serve only the ForTests workspace.');
console.log('Verified 16 independent vessel geometry modules and no shared ship geometry engine.');
