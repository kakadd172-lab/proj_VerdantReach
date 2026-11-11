import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
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
  assert.equal(optionCount,16,'Expected all 16 vessel choices in the dropdown.');
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

  // Sea-state test bench exposes environmental inputs without animating the ship yet.
  assert.equal(await page.locator('#sea-state-value').innerText(),'OFF');
  assert.equal(await page.locator('#sea-surface-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('#sea-surface-toggle').click();
  assert.equal(await page.locator('#sea-surface-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#sea-surface-toggle').click();
  assert.equal(await page.locator('#sea-surface-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#wave-height').inputValue(),'0');
  assert.equal(await page.locator('#wave-period').inputValue(),'5');
  await page.locator('[data-sea-preset="moderate"]').click();
  assert.equal(await page.locator('#sea-state-value').innerText(),'MODERATE');
  assert.equal(await page.locator('#wave-height').inputValue(),'1.5');
  assert.equal(await page.locator('#wave-period').inputValue(),'6');
  await page.locator('[data-wave-direction="270"]').click();
  assert.ok((await page.locator('#wave-direction-value').innerText()).startsWith('270°'));
  await page.locator('#wave-height').evaluate(element=>{
    element.value='0.8';
    element.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#wave-height-readout').innerText(),'0.8 m');
  await page.locator('#sea-toggle').click();
  assert.equal(await page.locator('#sea-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#sea-toggle').click();
  assert.equal(await page.locator('#sea-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('#sea-reset').click();
  assert.equal(await page.locator('#sea-state-value').innerText(),'OFF');
  assert.equal(await page.locator('#wave-height').inputValue(),'0');
  assert.equal(await page.locator('#wave-direction').inputValue(),'90');

  await page.locator('#ship-select').selectOption('galleon');
  await page.waitForFunction(()=>document.querySelector('#description')?.textContent?.toLowerCase().includes('galleon'));
  const galleonStatus=await page.locator('#status').innerText();
  assert.ok(galleonStatus.startsWith('Loaded '),'Galleon did not load: '+galleonStatus);
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

  // Miscellaneous category: all three cannon display variants use the same editable model controls.
  await page.locator('#model-category').selectOption('miscellaneous');
  assert.equal(await page.locator('#ship-select option').count(),3,'Miscellaneous category should expose three cannon variants.');
  await page.locator('#ship-select').selectOption('misc-cannon-18-pounder');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('18-pounder'),{timeout:10000});
  assert.ok(await page.locator('#part-select option').count()>10,'Miscellaneous model did not expose its editable visual components.');
  const firstMiscPart=await page.locator('#part-select').inputValue();
  await page.locator('[data-transform="x"]').fill('0.125');
  await page.locator('[data-transform="x"]').dispatchEvent('change');
  assert.equal(await page.locator('[data-transform="x"]').inputValue(),'0.125','Miscellaneous component transform input was not retained.');
  await page.locator('#ship-select').selectOption('misc-cannon-9-pounder');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('9-pounder'),{timeout:10000});
  await page.locator('#ship-select').selectOption('misc-cannon-36-pounder');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('36-pounder'),{timeout:10000});
  await page.locator('#model-category').selectOption('vessels');
  assert.equal(await page.locator('#ship-select option').count(),16,'Switching back should restore all 16 vessel designs.');
  assert.equal(await page.locator('#ship-select').inputValue(),'sloop','Returning to Sailing vessels should select the Sloop again.');
  await page.waitForFunction(()=>document.querySelector('#ship-caption')?.textContent?.includes('merchant sloop'),null,{timeout:10000});

  assert.deepEqual(pageErrors,[],'Browser runtime errors: '+pageErrors.join(' | '));
  assert.deepEqual(consoleErrors,[],'Browser console errors: '+consoleErrors.join(' | '));
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
