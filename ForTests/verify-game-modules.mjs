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

const hullFingerprints=new Set(),deckFingerprints=new Set(),keelFingerprints=new Set(),sectionFingerprints=new Set(),deckEdgeFingerprints=new Set(),sailFingerprints=new Set(),signatureFingerprints=new Set();
for(const id of ids){
 const path=join(shipRoot,'vessels',id+'.js');assert.ok(existsSync(path),'Missing independent vessel module: '+id);
 const source=readFileSync(path,'utf8');
 for(const required of [
  "id: '"+id+"'",'design:','structure:','sternTiers:','keelDetails:','rudderDetails:',
  'function halfBreadth(','function hullPoint(','function buildHull(','function buildFramesAndPlanking(',
  'function buildStern(','function ensureSternTierComponents(','function buildBow(','function buildRudderAndHelm(',
  'function buildRailingsAndEquipment(','function buildAnchors(','function buildCanvasSail(',
  'function buildRig(','function buildSignatureDeckFeatures(','function generate'+pascal(id)+'Geometry(','function create'+pascal(id)+'Model('
 ])assert.ok(source.includes(required),id+' missing its own '+required);
 assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(source),id+' still depends on the old shared geometry path.');
 assert.ok(source.includes("from '../shared/ship-editor-kit.js'"),id+' should only use the low-level editor kit.');
 assert.ok(source.includes('buildAnchors(ctx.design,ctx)'),id+' must invoke its own anchor builder.');
 assert.ok(source.includes('buildSignatureDeckFeatures(ctx.design,ctx);'),id+' must build its own deck signatures.');
 assert.ok(source.includes('strakeRows:')&&source.includes('deckSeamCount:'),id+' must set its own surface-detail density.');
 assert.ok(source.includes('deckBreadthRatio(d)*.96'),id+' deck seams must follow the calculated deck edge.');
 const details=source.match(/detailParts:\s*(\[[^\]]*\])/);
 assert.ok(details,id+' must declare editor-visible detail parts.');
 const detailNames=JSON.parse(details[1].replaceAll("'",'"'));
 assert.ok(detailNames.length>=3,id+' must declare multiple unique details.');
 for(const detail of detailNames)assert.ok(source.includes("part('"+detail+"')"),id+' detail part is declared but never constructed: '+detail);
 const signatureStart=source.indexOf('function buildSignatureDeckFeatures(');
 const signatureEnd=source.indexOf('\nfunction buildCanvasSail(',signatureStart);
 assert.ok(signatureStart>=0&&signatureEnd>signatureStart,id+' must own a complete signature deck routine.');
 signatureFingerprints.add(source.slice(signatureStart,signatureEnd).trim());
 assert.ok(source.includes('buildCanvasSail(ctx,'),id+' must use its local sail builder.');
 assert.ok(registry.includes("./vessels/"+id+".js"),id+' missing from the registry.');
 assert.ok(!source.includes('../V8/')&&!source.includes('V8/verdant-reach'),id+' must not import main-game code.');
 const hull=source.match(/function halfBreadth\([^)]*\)\s*\{([\s\S]*?)\}/);
 const deck=source.match(/function deckY\([^)]*\)\s*\{([\s\S]*?)\}/);
 const keel=source.match(/function keelY\([^)]*\)\s*\{([\s\S]*?)\}/);
 const section=source.match(/function hullPoint\([^)]*\)\s*\{([\s\S]*?)\}/);
 const deckEdge=source.match(/function deckBreadthRatio\(d\)\s*\{([\s\S]*?)\}/);
 const sail=source.match(/function buildCanvasSail\(ctx,[\s\S]*?\n\}/);
 assert.ok(hull,id+' missing individual hull breadth algorithm.');
 assert.ok(deck,id+' missing individual deck sheer algorithm.');
 assert.ok(keel,id+' missing individual keel rocker algorithm.');
 assert.ok(section,id+' missing individual hull cross-section algorithm.');
 assert.ok(deckEdge,id+' missing its deck-edge breadth calculation.');
 assert.ok(source.includes('const v=1-Math.pow(Math.max(0,Math.sin(a)),'),id+' must trace one hull half-profile from each gunwale to the keel.');
 assert.ok(source.includes('half=halfBreadth(d,t)*deckBreadthRatio(d)'),id+' deck mesh must meet its own hull edge.');
 assert.ok(sail,id+' missing individual sail-cloth algorithm.');
 hullFingerprints.add(hull[1].trim());deckFingerprints.add(deck[1].trim());
 keelFingerprints.add(keel[1].trim());sectionFingerprints.add(section[1].trim());
 deckEdgeFingerprints.add(deckEdge[1].trim());sailFingerprints.add(sail[0].trim());
}
assert.equal(hullFingerprints.size,16,'Each vessel must implement a distinct hull breadth function.');
assert.equal(deckFingerprints.size,16,'Each vessel must implement its own deck sheer function.');
assert.equal(keelFingerprints.size,16,'Each vessel must implement its own keel rocker function.');
assert.equal(sectionFingerprints.size,16,'Each vessel must implement its own hull section function.');
assert.equal(deckEdgeFingerprints.size,16,'Each vessel must implement its own deck-edge breadth calculation.');
assert.equal(sailFingerprints.size,16,'Each vessel must implement its own sail surface profile.');
assert.equal(signatureFingerprints.size,16,'Each vessel must implement a unique signature deck routine.');
for(const id of ['frigate','first-rate']){
 const source=readFileSync(join(shipRoot,'vessels',id+'.js'),'utf8');
 assert.ok(!/cannon-barrel|deck-gun-|gunport-/.test(source),id+' passenger refit must not generate combat deck geometry.');
}

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
