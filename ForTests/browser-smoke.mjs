import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectDir=dirname(fileURLToPath(import.meta.url));
const viteCli=join(projectDir,'node_modules','vite','bin','vite.js');
const baseUrl='http://127.0.0.1:5174/';
let viteOutput='';
const vite=spawn(process.execPath,[viteCli,'--host','127.0.0.1','--port','5174','--strictPort'],{
  cwd:projectDir,stdio:['ignore','pipe','pipe']
});
vite.stdout.on('data',chunk=>{viteOutput+=chunk.toString();});
vite.stderr.on('data',chunk=>{viteOutput+=chunk.toString();});

let browser;
try{
  let ready=false;
  for(let attempt=0;attempt<60;attempt++){
    if(vite.exitCode!==null) throw new Error('Vite exited before becoming ready.\n'+viteOutput);
    try{
      const response=await fetch(baseUrl);
      if(response.ok){ready=true;break;}
    }catch{}
    await delay(500);
  }
  assert.ok(ready,'Vite server did not become ready.\n'+viteOutput);

  browser=await chromium.launch({
    headless:true,
    args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']
  });
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const pageErrors=[];
  const consoleErrors=[];
  const duplicateThreeWarnings=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error')consoleErrors.push(message.text());
    if(message.type()==='warning'&&/Multiple instances of Three\.js/i.test(message.text()))duplicateThreeWarnings.push(message.text());
  });

  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>{
    const selector=document.querySelector('#ship-select');
    const status=document.querySelector('#status')?.textContent||'';
    return (selector&&selector.options.length>=16)||status.startsWith('Editor startup failed:');
  },{timeout:30000});

  const optionCount=await page.locator('#ship-select option').count();
  assert.equal(optionCount,19,'Expected 16 procedural vessels plus 3 imported vessel presets.');
  await page.waitForFunction(()=>{
    const status=document.querySelector('#status')?.textContent||'';
    const parts=Number(document.querySelector('#parts')?.textContent||0);
    return status.startsWith('Loaded ')||(status.startsWith('Editor startup failed:'))||parts>0;
  },{timeout:30000});
  const initialStatus=await page.locator('#status').innerText();
  assert.ok(initialStatus.startsWith('Loaded '),'Initial ship did not load: '+initialStatus);
  assert.ok(await page.locator('#viewport canvas').count()>0,'The 3D canvas was not created.');
  assert.ok(Number(await page.locator('#parts').innerText())>0,'No model components were registered.');
  assert.ok(await page.locator('#part-select option').count()>20,'Component selector was not populated.');

  await page.locator('#ship-select').selectOption('galleon');
  await page.waitForFunction(()=>document.querySelector('#description')?.textContent?.toLowerCase().includes('galleon'));
  const galleonStatus=await page.locator('#status').innerText();
  assert.ok(galleonStatus.startsWith('Loaded '),'Galleon did not load: '+galleonStatus);
  // Preserve the actual successful Galleon render as a CI artifact for visual review.
  await delay(800);
  await page.locator('#viewport canvas').screenshot({path:join(projectDir,'galleon-preview.png')});
  console.log('Galleon viewport screenshot saved: galleon-preview.png');
  const importedChecks=[
    ['imported-sailing-sloop','imported-sloop-preview.png'],
    ['imported-coastal-trawler','imported-trawler-preview.png'],
    ['imported-motor-cruiser','imported-motor-cruiser-preview.png'],
  ];
  for(const [id,screenshot] of importedChecks){
    await page.locator('#ship-select').selectOption(id);
    await page.waitForFunction(expected=>{
      const status=document.querySelector('#status')?.textContent||'';
      return status.startsWith('Loaded ')&&status.includes('editable model components.');
    },{timeout:45000},id);
    assert.ok(Number(await page.locator('#parts').innerText())>0,id+' registered no editable model parts.');
    assert.ok(await page.locator('#part-select option').count()>0,id+' did not populate its component list.');
    await delay(450);
    await page.locator('#viewport canvas').screenshot({path:join(projectDir,screenshot)});
    console.log(id+' loaded with '+await page.locator('#parts').innerText()+' editable model components.');
  }

  // Exercise the local GLB import path using a tiny valid glTF 2.0 binary.
  function makeTestGlb(){
    const positions=Buffer.alloc(72);
    const vertices=[
      [-1,0,-2],[1,0,-2],[0,2,-2],
      [-1,0,2],[1,0,2],[0,2,2],
    ];
    let offset=0;
    for(const vertex of vertices)for(const value of vertex){positions.writeFloatLE(value,offset);offset+=4;}
    const indices=Buffer.alloc(12);
    [0,1,2,3,5,4].forEach((value,i)=>indices.writeUInt16LE(value,i*2));
    const binary=Buffer.concat([positions,indices]);
    const gltf={
      asset:{version:'2.0',generator:'Verdant Reach imported-model smoke test'},
      scene:0,
      scenes:[{nodes:[0]}],
      nodes:[{name:'Test sailboat hull',mesh:0}],
      meshes:[{name:'Test hull',primitives:[{attributes:{POSITION:0},indices:1}]}],
      buffers:[{byteLength:binary.length}],
      bufferViews:[
        {buffer:0,byteOffset:0,byteLength:72,target:34962},
        {buffer:0,byteOffset:72,byteLength:12,target:34963},
      ],
      accessors:[
        {bufferView:0,componentType:5126,count:6,type:'VEC3',min:[-1,0,-2],max:[1,2,2]},
        {bufferView:1,componentType:5123,count:6,type:'SCALAR',min:[0],max:[5]},
      ],
    };
    const json=Buffer.from(JSON.stringify(gltf));
    const jsonPadding=(4-json.length%4)%4;
    const jsonChunk=Buffer.concat([json,Buffer.alloc(jsonPadding,0x20)]);
    const binPadding=(4-binary.length%4)%4;
    const binChunk=Buffer.concat([binary,Buffer.alloc(binPadding)]);
    const total=12+8+jsonChunk.length+8+binChunk.length;
    const header=Buffer.alloc(12);
    header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(total,8);
    const jsonHeader=Buffer.alloc(8);
    jsonHeader.writeUInt32LE(jsonChunk.length,0);jsonHeader.writeUInt32LE(0x4e4f534a,4);
    const binHeader=Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length,0);binHeader.writeUInt32LE(0x004e4942,4);
    return Buffer.concat([header,jsonHeader,jsonChunk,binHeader,binChunk]);
  }
  const localGlbPayload={
    name:'test-imported-sailboat.glb',
    mimeType:'model/gltf-binary',
    buffer:makeTestGlb(),
    lastModified:1700000000000,
  };
  await page.locator('#import-3d-input').setInputFiles(localGlbPayload);
  await page.waitForFunction(()=>{
    const selector=document.querySelector('#ship-select');
    const caption=document.querySelector('#ship-caption')?.textContent||'';
    const parts=Number(document.querySelector('#parts')?.textContent||0);
    const status=document.querySelector('#status')?.textContent||'';
    return selector?.value?.startsWith('imported-local-')
      && caption.includes('test-imported-sailboat')
      && parts>0
      && !status.startsWith('Model import failed:');
  },{timeout:15000}).catch(async error=>{
    const current=await page.locator('#status').innerText();
    const selected=await page.locator('#ship-select').inputValue();
    const caption=await page.locator('#ship-caption').innerText();
    throw new Error('Local GLB import did not settle. Editor status: '+current+' · selected: '+selected+' · caption: '+caption+' · '+error.message);
  });
  const localImportStatus=await page.locator('#status').innerText();
  assert.ok((await page.locator('#ship-select').inputValue()).startsWith('imported-local-'),'Local GLB import did not select an imported model. Status: '+localImportStatus);
  assert.ok(Number(await page.locator('#parts').innerText())>0,'Local GLB import did not expose editable parts.');
  assert.ok((await page.locator('#ship-select').inputValue()).startsWith('imported-local-'),'Local GLB import did not add a model selector entry.');
  await delay(350);
  await page.locator('#viewport canvas').screenshot({path:join(projectDir,'imported-local-preview.png')});
  console.log('Local GLB import passed.');

  // Imported-model JSON backups must restore edits, including local-model state.
  const localAssetId=await page.locator('#ship-select').inputValue();
  const localPartId=await page.locator('#part-select').inputValue();
  await page.locator('details.section-card').filter({hasText:'Precise transforms'}).locator('summary').click();
  const importedXField=page.locator('[data-transform="x"]');
  await importedXField.fill('0.75');
  await importedXField.dispatchEvent('change');
  assert.equal(await importedXField.inputValue(),'0.750','Local imported component transform was not applied.');
  const localBackup={
    format:'verdant-reach-ship-editor',
    version:3,
    savedAt:new Date().toISOString(),
    ships:{},
    importedModels:{
      [localAssetId]:{
        partTransforms:{
          [localPartId]:{x:.75,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1}
        },
        hiddenParts:{},
        unlinkedParts:[],
      }
    }
  };
  // Change the live model after producing the backup so import must genuinely restore the earlier value.
  await importedXField.fill('1.50');
  await importedXField.dispatchEvent('change');
  assert.equal(await importedXField.inputValue(),'1.500','Could not create a divergent live model state for the backup test.');
  await page.locator('#import-file').setInputFiles({
    name:'local-imported-model-state.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(localBackup)),
  });
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('1 imported-model state(s)'),undefined,{timeout:15000});
  assert.equal(await importedXField.inputValue(),'0.750','JSON backup import did not restore the earlier local model transform.');

  // Re-importing the same source must reconnect saved state without duplicating the dropdown entry.
  const optionCountBeforeReimport=await page.locator('#ship-select option').count();
  await page.locator('#import-3d-input').setInputFiles(localGlbPayload);
  await page.waitForFunction(expected=>{
    const selected=document.querySelector('#ship-select')?.value||'';
    const status=document.querySelector('#status')?.textContent||'';
    return selected!==expected||status.startsWith('Loaded ')||status.startsWith('Could not load imported model:');
  },localAssetId,{timeout:15000});
  const reimportedId=await page.locator('#ship-select').inputValue();
  const reimportStatus=await page.locator('#status').innerText();
  assert.equal(reimportedId,localAssetId,'Re-import changed the stable local asset identity. Status: '+reimportStatus);
  assert.ok(reimportStatus.startsWith('Loaded '),'Re-import did not finish loading. Status: '+reimportStatus);
  assert.equal(await page.locator('#ship-select option').count(),optionCountBeforeReimport,'Re-import added a duplicate local model option.');
  assert.equal(await importedXField.inputValue(),'0.750','Re-import did not reconnect the saved local-model transform.');
  console.log('Local imported-model backup and re-import persistence passed.');

  // Exercise folder import with nested binary resources and duplicate filenames.
  const gltfFixtureDir=await mkdtemp(join(tmpdir(),'verdant-reach-gltf-folder-'));
  try{
    await mkdir(join(gltfFixtureDir,'geometry'),{recursive:true});
    await mkdir(join(gltfFixtureDir,'unused'),{recursive:true});
    const positions=Buffer.alloc(72);
    const vertices=[[-1,0,-2],[1,0,-2],[0,2,-2],[-1,0,2],[1,0,2],[0,2,2]];
    let positionOffset=0;
    for(const vertex of vertices)for(const value of vertex){positions.writeFloatLE(value,positionOffset);positionOffset+=4;}
    const indices=Buffer.alloc(12);
    [0,1,2,3,5,4].forEach((value,index)=>indices.writeUInt16LE(value,index*2));
    const binary=Buffer.concat([positions,indices]);
    const gltf={
      asset:{version:'2.0',generator:'Verdant Reach glTF folder smoke test'},
      scene:0,
      scenes:[{nodes:[0]}],
      nodes:[{name:'Folder imported hull',mesh:0}],
      meshes:[{name:'Folder hull',primitives:[{attributes:{POSITION:0},indices:1}]}],
      buffers:[{uri:'geometry/mesh.bin',byteLength:binary.length}],
      bufferViews:[
        {buffer:0,byteOffset:0,byteLength:72,target:34962},
        {buffer:0,byteOffset:72,byteLength:12,target:34963},
      ],
      accessors:[
        {bufferView:0,componentType:5126,count:6,type:'VEC3',min:[-1,0,-2],max:[1,2,2]},
        {bufferView:1,componentType:5123,count:6,type:'SCALAR',min:[0],max:[5]},
      ],
    };
    await writeFile(join(gltfFixtureDir,'folder-test.gltf'),JSON.stringify(gltf));
    await writeFile(join(gltfFixtureDir,'geometry','mesh.bin'),binary);
    await writeFile(join(gltfFixtureDir,'unused','mesh.bin'),Buffer.from([9,8,7,6]));
    await page.locator('#import-3d-folder-input').setInputFiles(gltfFixtureDir);
    await page.waitForFunction(()=>document.querySelector('#ship-select')?.value?.startsWith('imported-local-')
      &&(document.querySelector('#ship-caption')?.textContent||'').includes('folder-test')
      &&Number(document.querySelector('#parts')?.textContent||0)>0
      &&(document.querySelector('#status')?.textContent||'').startsWith('Loaded '),undefined,{timeout:15000});
    assert.ok(Number(await page.locator('#parts').innerText())>0,'glTF folder import did not expose editable components.');
    console.log('Nested glTF folder import passed.');
  }finally{
    await rm(gltfFixtureDir,{recursive:true,force:true});
  }

  await page.locator('#ship-select').selectOption('sloop');

  await page.locator('[data-mode="rotate"]').click();
  await page.locator('[data-mode="scale"]').click();
  await page.locator('[data-mode="translate"]').click();

  // Component transform -> undo -> redo -> reset -> undo -> redo.
  await page.locator('#part-select').selectOption('mast-single');
  await page.locator('details.section-card').filter({hasText:'Precise transforms'}).locator('summary').click();
  const xField=page.locator('[data-transform="x"]');
  await xField.fill('1.25');
  await xField.dispatchEvent('change');
  assert.ok(await page.locator('#undo').isEnabled(),'Undo did not enable after numeric transform.');
  assert.equal(await xField.inputValue(),'1.250');
  await page.locator('#undo').click();
  assert.equal(await xField.inputValue(),'0.000','Undo failed to restore original mast position.');
  await page.locator('#redo').click();
  assert.equal(await xField.inputValue(),'1.250','Redo failed to restore mast position.');
  await page.locator('#reset-part').click();
  assert.equal(await xField.inputValue(),'0.000','Reset component failed to restore mast position.');
  await page.locator('#undo').click();
  assert.equal(await xField.inputValue(),'1.250','Undo after reset failed.');
  await page.locator('#redo').click();
  assert.equal(await xField.inputValue(),'0.000','Redo after reset failed.');

  // Design parameters are part of the same history timeline.
  await page.locator('details.section-card').filter({hasText:'Design parameters'}).locator('summary').click();
  const sloopBeam=Number((await page.locator('#beam').innerText()).replace(' m',''));
  const beamField=page.locator('[data-design-path="design.beam"]');
  await beamField.fill('5.3');
  await beamField.dispatchEvent('change');
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-5.3)<1e-6,'Beam parameter did not rebuild the ship.');
  await page.locator('#undo').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-sloopBeam)<1e-6,'Undo did not revert the design parameter.');

  // A single history timeline must survive vessel changes.
  await page.locator('[data-design-path="design.beam"]').fill('5.3');
  await page.locator('[data-design-path="design.beam"]').dispatchEvent('change');
  await page.locator('#ship-select').selectOption('galleon');
  const originalGalleonBeam=Number((await page.locator('#beam').innerText()).replace(' m',''));
  await page.locator('[data-design-path="design.beam"]').fill('16.5');
  await page.locator('[data-design-path="design.beam"]').dispatchEvent('change');
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-16.5)<1e-6);
  await page.locator('#undo').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-originalGalleonBeam)<1e-6,'Undo on second vessel did not restore its previous design.');
  await page.locator('#undo').click();
  assert.equal(await page.locator('#ship-select').inputValue(),'sloop','Global undo should return to the vessel associated with the earlier edit.');
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-sloopBeam)<1e-6,'Global undo failed to restore the earlier vessel baseline.');
  await page.locator('#redo').click();
  assert.equal(await page.locator('#ship-select').inputValue(),'sloop','Redo should restore the next recorded vessel.');
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-5.3)<1e-6,'Global redo failed to restore the earlier vessel edit.');
  await page.locator('#redo').click();
  assert.equal(await page.locator('#ship-select').inputValue(),'galleon','Second redo should restore the following vessel.');
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-16.5)<1e-6,'Global redo failed to restore the next vessel state.');

  // Advanced selection and viewport tools remain operational.
  await page.locator('#part-search').fill('mast');
  assert.ok(await page.locator('#part-select option').count()>0,'Component search returned no results.');
  await page.locator('#part-search').fill('');
  await page.locator('#snap-toggle').click();
  assert.equal(await page.locator('#snap-toggle').innerText(),'Snapping on');
  await page.locator('#space-toggle').click();
  assert.equal(await page.locator('#space-toggle').innerText(),'World space');
  await page.locator('details.section-card').filter({hasText:'Viewport & camera'}).locator('summary').click();
  await page.locator('[data-camera="top"]').click();
  await page.locator('#frame-selected').click();
  await page.locator('#reset-all-parts').click();
  await page.locator('#toggle-visibility').click();
  assert.equal(await page.locator('#toggle-visibility').innerText(),'Show selected','Hide selected did not update visibility controls.');
  await page.locator('#show-all-parts').click();
  assert.equal(await page.locator('#toggle-visibility').innerText(),'Hide selected','Show all did not restore component visibility.');

  // Detach/relink is a reversible hierarchy edit.
  await page.locator('#detach-part').click();
  assert.ok(await page.locator('#relink-part').isEnabled(),'Detach did not enable Relink.');
  assert.ok(await page.locator('#detach-part').isDisabled(),'Detach remained enabled for an unlinked component.');
  await page.locator('#relink-part').click();
  assert.ok(await page.locator('#detach-part').isEnabled(),'Relink did not restore the Detach action.');
  assert.ok(await page.locator('#relink-part').isDisabled(),'Relink remained enabled for a linked component.');
  await page.locator('#undo').click();
  assert.ok(await page.locator('#relink-part').isEnabled(),'Undo did not restore the detached hierarchy state.');
  await page.locator('#redo').click();
  assert.ok(await page.locator('#detach-part').isEnabled(),'Redo did not restore the linked hierarchy state.');

  // Viewport display options are functional and independent of model edits.
  await page.locator('#wireframe-toggle').click();
  assert.equal(await page.locator('#wireframe-toggle').innerText(),'Wireframe on');
  await page.locator('#wireframe-toggle').click();
  await page.locator('#grid-toggle').click();
  assert.equal(await page.locator('#grid-toggle').innerText(),'Grid off');
  await page.locator('#grid-toggle').click();
  await page.locator('#shadows-toggle').click();
  assert.equal(await page.locator('#shadows-toggle').innerText(),'Shadows off');
  await page.locator('#shadows-toggle').click();

  // Resetting the full vessel must also be undoable and redoable.
  await page.locator('#reset-vessel').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-originalGalleonBeam)<1e-6,'Reset vessel did not restore the catalogue dimensions.');
  await page.locator('#undo').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-16.5)<1e-6,'Undo did not restore the edited vessel design.');
  await page.locator('#redo').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-originalGalleonBeam)<1e-6,'Redo did not reapply the vessel reset.');

  // New component inspector reports useful details for the current selection.
  assert.notEqual(await page.locator('#part-size').innerText(),'—','Component bounds were not reported.');
  assert.ok(Number(await page.locator('#part-meshes').innerText())>0,'Component inspector did not count meshes.');

  // Vessel-to-vessel comparison displays the current design dimensions.
  await page.locator('#compare-select').selectOption('sloop');
  assert.ok((await page.locator('#compare-summary').innerText()).includes('Length'),'Vessel comparison summary was not updated.');

  // Point measurement mode and hull-section clipping remain reversible.
  await page.locator('details.section-card').filter({hasText:'Hull analysis tools'}).locator('summary').click();
  await page.locator('#measure-toggle').click();
  assert.ok((await page.locator('#measure-toggle').innerText()).startsWith('Measuring'),'Measurement mode did not activate.');
  await page.locator('#measure-toggle').click();
  await page.locator('#clear-measurement').click();
  await page.locator('#section-toggle').click();
  assert.equal(await page.locator('#section-slider').isEnabled(),true,'Hull section slider did not enable.');
  await page.locator('#section-slider').evaluate(element=>{
    element.value=String((Number(element.min)+Number(element.max))*0.35);
    element.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('#section-toggle').click();
  assert.equal(await page.locator('#section-slider').isDisabled(),true,'Hull section slider remained enabled after turning the section off.');

  // The viewport can be captured as a PNG from the current WebGL canvas.
  await page.locator('#capture-preview').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Captured '),{timeout:5000});
  assert.ok(await page.locator('#viewport canvas').count()>0,'Preview capture lost the WebGL canvas.');

  // Import a design backup and verify that it participates in global undo/redo.
  const importJson=JSON.stringify({format:'verdant-reach-ship-editor',version:2,ships:{galleon:{design:{beam:16.4}}}});
  await page.locator('#import-file').setInputFiles({
    name:'shipyard-import-test.json',
    mimeType:'application/json',
    buffer:Buffer.from(importJson),
  });
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Imported '),{timeout:10000});
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-16.4)<1e-6,'Imported vessel beam override was not applied.');
  await page.locator('#undo').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-originalGalleonBeam)<1e-6,'Undo did not revert the imported vessel configuration.');
  await page.locator('#redo').click();
  assert.ok(Math.abs(Number((await page.locator('#beam').innerText()).replace(' m',''))-16.4)<1e-6,'Redo did not restore the imported vessel configuration.');

  assert.deepEqual(pageErrors,[],'Browser runtime errors: '+pageErrors.join(' | '));
  assert.deepEqual(duplicateThreeWarnings,[],'Multiple Three.js instances detected: '+duplicateThreeWarnings.join(' | '));
  console.log('Browser smoke test passed.');
  console.log('Vessels in dropdown: '+optionCount);
  console.log('Initial vessel: '+initialStatus);
  console.log('Galleon vessel: '+galleonStatus);
  console.log('Registered parts: '+await page.locator('#part-select option').count());
  if(consoleErrors.length) console.log('Browser console warnings/errors: '+consoleErrors.join(' | '));
}catch(error){
  console.error('Browser smoke test failed:',error);
  console.error('Vite output:',viteOutput);
  if(browser){
    try{
      const pages=browser.contexts().flatMap(context=>context.pages());
      if(pages[0]) await pages[0].screenshot({path:join(projectDir,'ship-studio-smoke-failure.png'),fullPage:true});
    }catch{}
  }
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  vite.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>vite.once('exit',resolve)),delay(3000)]);
  if(vite.exitCode===null) vite.kill('SIGKILL');
}
