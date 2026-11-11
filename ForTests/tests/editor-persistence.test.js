import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { shipEditorSavePlugin } from '../vite.config.js';
function attach(root){const h=new Map();shipEditorSavePlugin().configureServer({config:{root},middlewares:{use(route,handler){h.set(route,handler);}}});return h;}
async function request(handler,method,payload){const req=Readable.from([JSON.stringify(payload)]);req.method=method;const res={statusCode:200,setHeader(){},end(v){this.body=v;}};await handler(req,res);return {status:res.statusCode,body:JSON.parse(res.body||'{}')};}
test('save writes a validated module beside the vessel generator',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verdant-shipyard-'));try{const h=attach(root),r=await request(h.get('/__ship-editor/save'),'POST',{ships:{sloop:{design:{hullLength:16.1},structure:{frameCount:44},partState:{rudderAngle:.1,partTransforms:{hull:{x:.25,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1}},hiddenParts:{},unlinkedParts:[],sailTrim:{},sailDeployment:{},mastLean:{}}}}});
  assert.equal(r.status,200);assert.equal(r.body.saved,true);assert.equal(r.body.vessels,1);const f=await readFile(join(root,'ships','vessels','sloop','editor-defaults.js'),'utf8');
  assert.ok(f.includes('verdant-reach-vessel-defaults'));assert.ok(f.includes('"hullLength": 16.1'));assert.ok(f.includes('"x": 0.25'));assert.equal((await readFile(join(root,'design-overrides.json'),'utf8')).trim(),'{}');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('save accepts legitimate viewport transforms beyond the old narrow editor limits',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verdant-shipyard-'));try{
  const h=attach(root),r=await request(h.get('/__ship-editor/save'),'POST',{ships:{sloop:{
   partState:{rudderAngle:0,partTransforms:{hull:{x:42,y:-31,z:0,rx:Math.PI*2,ry:0,rz:0,sx:25,sy:1,sz:1}},hiddenParts:{},unlinkedParts:[],sailTrim:{},sailDeployment:{},mastLean:{}}
  }}});
  assert.equal(r.status,200);assert.equal(r.body.saved,true);
  const f=await readFile(join(root,'ships','vessels','sloop','editor-defaults.js'),'utf8');
  assert.ok(f.includes('"x": 42'));assert.ok(f.includes('"sx": 25'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('save rejects traversal IDs and invalid transform values',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verdant-shipyard-'));try{const h=attach(root),a=await request(h.get('/__ship-editor/save'),'POST',{ships:{'../outside':{design:{},structure:{},partState:{}}}});assert.equal(a.status,400);
  const b=await request(h.get('/__ship-editor/save'),'POST',{ships:{sloop:{partState:{partTransforms:{hull:{x:99999}}}}}});assert.equal(b.status,400);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reset restores only the selected vessel defaults module',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verdant-shipyard-'));try{const h=attach(root),r=await request(h.get('/__ship-editor/reset'),'POST',{shipId:'sloop'});assert.equal(r.status,200);assert.equal(r.body.saved,true);
  const f=await readFile(join(root,'ships','vessels','sloop','editor-defaults.js'),'utf8');assert.ok(f.includes('schemaVersion'));assert.equal(f.includes('"hullLength"'),false);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('save and reset persist an individual miscellaneous model defaults module',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verdant-misc-'));try{
  const h=attach(root),r=await request(h.get('/__ship-editor/save'),'POST',{ships:{},miscModels:{'misc-cannon-18-pounder':{componentState:{partTransforms:{'barrel-body':{x:.5,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1}},hiddenParts:{},unlinkedParts:[]}}}});
  assert.equal(r.status,200);assert.equal(r.body.saved,true);assert.equal(r.body.miscModels,1);
  const file=join(root,'ships','misc','cannons','18-pounder','editor-defaults.js');
  const saved=await readFile(file,'utf8');assert.ok(saved.includes('verdant-reach-misc-model-defaults'));assert.ok(saved.includes('"x": 0.5'));
  const reset=await request(h.get('/__ship-editor/reset'),'POST',{shipId:'misc-cannon-18-pounder'});
  assert.equal(reset.status,200);assert.equal(reset.body.saved,true);
  const defaults=await readFile(file,'utf8');assert.ok(defaults.includes('"partTransforms": {}'));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('save and reset persist each independent maritime prop defaults module',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verdant-props-'));try{
  const h=attach(root);
  const cases=[
   ['misc-prop-barrel',['barrels','editor-defaults.js']],
   ['misc-prop-barrel-v2',['barrels','v2','editor-defaults.js']],
   ['misc-prop-crate',['crates','editor-defaults.js']],
   ['misc-prop-lantern',['lanterns','editor-defaults.js']],
   ['misc-prop-bollard',['fittings','editor-defaults.js']]
  ];
  for(const [id,parts] of cases){
   const config={componentState:{partTransforms:{'editable-part':{x:.25}},hiddenParts:{},unlinkedParts:[]}};
   const saved=await request(h.get('/__ship-editor/save'),'POST',{ships:{},miscModels:{[id]:config}});
   assert.equal(saved.status,200,id+' should save');
   const file=join(root,'ships','misc',...parts);
   const contents=await readFile(file,'utf8');
   assert.ok(contents.includes('"x": 0.25'),id+' should persist transforms');
   const reset=await request(h.get('/__ship-editor/reset'),'POST',{shipId:id});
   assert.equal(reset.status,200,id+' should reset');
   assert.ok((await readFile(file,'utf8')).includes('"partTransforms": {}'),id+' should reset its own defaults');
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
