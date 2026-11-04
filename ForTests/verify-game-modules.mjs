import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const shipRoot=join(here,'ships');
const ids=["sloop","schooner","brigantine","brig","snow","cutter","frigate","barque","caravel","carrack","galleon","fluyt","xebec","junk","first-rate","pinnace"];
const pascal=id=>id.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');

for(const path of ['index.js','README.md','shared/vessel-definition.js','shared/ship-model-builder.js','shared/hull-math.js']){
 assert.ok(existsSync(join(shipRoot,path)),'Missing standalone ship dependency: '+path);
}
const registry=readFileSync(join(shipRoot,'index.js'),'utf8');
const helper=readFileSync(join(shipRoot,'shared','vessel-definition.js'),'utf8');
const builder=readFileSync(join(shipRoot,'shared','ship-model-builder.js'),'utf8');
const hullMath=readFileSync(join(shipRoot,'shared','hull-math.js'),'utf8');
assert.ok(builder.includes("from 'three'"),'Geometry engine must use Three.js.');
assert.ok(builder.includes("from './hull-math.js'"),'Geometry engine must use local hull math.');
assert.ok(builder.includes('createShipModelFromVessel'),'Geometry engine must accept a full vessel definition.');
assert.ok(!/ship-designs\.js|ship-structures\.js|ship-hull-parameterization\.js|V8\\/.test(builder),'Geometry engine still depends on legacy/game ship files.');
assert.ok(hullMath.includes('getParametricHullPoint'),'Hull math must export parametric hull generation.');
assert.ok(helper.includes('defineVesselSpec'),'Common helper must validate individual vessel definitions.');
assert.ok(!/V8\\/|\.\.\/V8/.test(helper+builder+registry),'ForTests ship runtime must not import main-game sources.');

for(const id of ids){
 const path=join(shipRoot,'vessels',id+'.js');
 assert.ok(existsSync(path),'Missing independent vessel module: '+id);
 const source=readFileSync(path,'utf8');
 assert.ok(source.includes("id: '"+id+"'"),id+' must own its id.');
 assert.ok(source.includes('design:'),id+' must own full design data.');
 assert.ok(source.includes('structure:'),id+' must own structural profile.');
 assert.ok(source.includes('sternTiers:'),id+' must own stern geometry profile.');
 assert.ok(source.includes('keelDetails:'),id+' must own keel profile.');
 assert.ok(source.includes('rudderDetails:'),id+' must own rudder profile.');
 assert.ok(source.includes('function create'+pascal(id)+'Model'),id+' must own model creator.');
 assert.ok(source.includes('function generate'+pascal(id)),id+' must own generator.');
 assert.ok(source.includes('createVesselModel('),id+' must invoke generic geometry engine.');
 assert.ok(registry.includes("./vessels/"+id+".js"),id+' missing from registry.');
 assert.ok(!/V8\\/|\.\.\/V8/.test(source),id+' must not import game source code.');
}
for(const obsolete of ['ship-designs.js','ship-structures.js','ship-hull-parameterization.js','ship-models.js']){
 assert.ok(!existsSync(join(here,obsolete)),obsolete+' should be removed from ForTests.');
}
assert.ok(!existsSync(join(shipRoot,'shared','define-vessel.js')),'Old wrapper helper should be removed.');
const preview=readFileSync(join(here,'preview.js'),'utf8');
assert.ok(preview.includes("./ships/index.js?v=0.8.6"),'Preview must load the new ship registry.');
for(const legacy of ['./ship-designs.js','./ship-structures.js','./ship-hull-parameterization.js','./ship-models.js']){
 assert.ok(!preview.includes(legacy),'Preview still imports legacy adapter '+legacy);
}
const pkg=JSON.parse(readFileSync(join(here,'package.json'),'utf8'));
assert.ok(!pkg.scripts.postinstall,'Standalone ForTests must not install the V8 game package.');
const vite=readFileSync(join(here,'vite.config.js'),'utf8');
assert.ok(vite.includes('fs: { allow: [forTestsDir] }'),'Vite should serve only the ForTests workspace.');
console.log('Verified 16 self-contained vessel definitions, dedicated generators, local hull math and a shared generic Three.js engine.');
