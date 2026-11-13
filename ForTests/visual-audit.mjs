import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectDir=dirname(fileURLToPath(import.meta.url));
const viteCli=join(projectDir,'node_modules','vite','bin','vite.js');
const outputDir=join(projectDir,'visual-audit');
const baseUrl='http://127.0.0.1:5174/';
const vessels=['barque','brig','brigantine','caravel','carrack','cutter','first-rate','fluyt','frigate','galleon','war-galleon','junk','pinnace','schooner','sloop','sloop-v2','snow','xebec'];
const args=process.argv.slice(2);
const shipFlag=args.indexOf('--ship');
const requestedShip=shipFlag>=0?args[shipFlag+1]:null;
if(shipFlag>=0&&!requestedShip)throw new Error('Usage: npm run visual-audit -- --ship <vessel-id>');
if(requestedShip&&!vessels.includes(requestedShip))throw new Error('Unknown vessel "'+requestedShip+'". Valid ids: '+vessels.join(', '));
const selectedVessels=requestedShip?[requestedShip]:vessels;
let viteOutput='';
const vite=spawn(process.execPath,[viteCli,'--host','127.0.0.1','--port','5174','--strictPort'],{cwd:projectDir,stdio:['ignore','pipe','pipe']});
vite.stdout.on('data',c=>viteOutput+=c.toString());
vite.stderr.on('data',c=>viteOutput+=c.toString());
let browser;
try{
 await mkdir(outputDir,{recursive:true});
 let ready=false;
 for(let i=0;i<60;i++){
  if(vite.exitCode!==null)throw new Error('Vite exited early. '+viteOutput);
  try{const r=await fetch(baseUrl);if(r.ok){ready=true;break;}}catch{}
  await delay(500);
 }
 assert.ok(ready,'Vite did not start. '+viteOutput);
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1050},deviceScaleFactor:1});
 const errors=[],consoleErrors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 await page.goto(requestedShip?baseUrl+'?ship='+encodeURIComponent(requestedShip):baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('#ship-select option').length>=18,{timeout:30000});
 const report=[];
 for(const id of selectedVessels){
  await page.locator('#ship-select').selectOption(id);
  try{
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '),{timeout:30000});
  }catch(error){
   const state=await page.evaluate(()=>({
    status:document.querySelector('#status')?.textContent||'',
    caption:document.querySelector('#ship-caption')?.textContent||'',
    partCount:document.querySelectorAll('#part-select option').length,
    startupNotice:document.querySelector('#viewport')?.innerText||''
   }));
   throw new Error('Vessel '+id+' did not finish loading. Editor state: '+JSON.stringify(state)+'; browser errors: '+JSON.stringify(errors)+'; console errors: '+JSON.stringify(consoleErrors)+'; original: '+error.message);
  }
  await delay(900);
  assert.ok(await page.locator('#viewport canvas').count(),id+' canvas missing');
  const clearSelection=page.locator('#clear-selection');
  if(await clearSelection.isEnabled())await clearSelection.click();
  await delay(120);
  await page.locator('#viewport').screenshot({path:join(outputDir,id+'.png'),animations:'disabled'});
  const metrics=await page.evaluate(()=>({
   status:document.querySelector('#status')?.textContent||'',
   parts:document.querySelector('#parts')?.textContent||'',
   description:document.querySelector('#description')?.textContent||''
  }));
  report.push({id,...metrics});
 }
 await page.locator('details.section-card').filter({hasText:'Viewport & camera'}).locator('summary').click();
 const cameraViews=requestedShip?[[requestedShip,'side'],[requestedShip,'bow'],[requestedShip,'stern'],[requestedShip,'top']]:[['galleon','side'],['carrack','side'],['first-rate','side'],['brig','side'],['schooner','side'],['sloop','side'],['sloop','stern'],['snow','side'],['junk','top'],['xebec','top'],['fluyt','top']];
 for(const [id,angle] of cameraViews){
  await page.locator('#ship-select').selectOption(id);
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '));
  await page.locator('[data-camera="'+angle+'"]').click();
  const clearSelection=page.locator('#clear-selection');
  if(await clearSelection.isEnabled())await clearSelection.click();
  await delay(600);
  await page.locator('#viewport').screenshot({path:join(outputDir,id+'-'+angle+'.png')});
 }

 // Exercise real drag-box selection in the browser, then leave the editor clean.
 await page.locator('#ship-select').selectOption('sloop');
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '));
 await page.locator('[data-camera="side"]').click();
 await delay(700);
 await page.locator('#box-select-toggle').click();
 const canvasBounds=await page.locator('#viewport canvas').boundingBox();
 assert.ok(canvasBounds,'Ship viewport canvas has no visible bounds.');
 await page.mouse.move(canvasBounds.x+8,canvasBounds.y+8);
 await page.mouse.down();
 await page.mouse.move(canvasBounds.x+canvasBounds.width-8,canvasBounds.y+canvasBounds.height-8,{steps:10});
 await page.mouse.up();
 await page.waitForFunction(()=>{
  const label=document.querySelector('#selection-count')?.textContent||'';
  const count=Number(label.match(/^\s*(\d+)/)?.[1]||0);
  return count>1;
 },{timeout:8000});
 const marqueeSelection=await page.locator('#selection-count').textContent();
 assert.ok(Number(marqueeSelection.match(/^\s*(\d+)/)?.[1]||0)>1,'A viewport drag should select multiple Sloop components.');
 await page.locator('#clear-selection').click();
 await page.locator('#box-select-toggle').click();

 // Exercise wind presets, gusts, pause/resume, rudder and test reset.
 await page.locator('[data-wind-direction="0"]').click();
 assert.match(await page.locator('#wind-direction-value').textContent(),/^0° · Bow/);
 await page.locator('[data-wind-direction="270"]').click();
 assert.match(await page.locator('#wind-direction-value').textContent(),/^270° · Port/);
 await page.locator('#wind-speed').evaluate(el=>{el.value='21';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#gust-toggle').click();
 assert.equal(await page.locator('#gust-toggle').getAttribute('aria-pressed'),'true');
 await page.locator('#sails-reef').click();
 assert.equal((await page.locator('#sail-state-value').textContent()).trim(),'REEFED');
 await page.waitForTimeout(950);
 await page.locator('#sails-furl').click();
 assert.equal((await page.locator('#sail-state-value').textContent()).trim(),'FURLED');
 await page.waitForTimeout(950);
 await page.locator('#sails-full').click();
 assert.equal((await page.locator('#sail-state-value').textContent()).trim(),'FULL');
 await page.locator('[data-wind-direction="90"]').click();
 await page.locator('#wind-toggle').click();
 assert.equal(await page.locator('#wind-toggle').getAttribute('aria-pressed'),'true');
 await page.waitForTimeout(1800);
 const starboardWindReadout=await page.locator('#mast-response-value').textContent();
 const starboardHeel=starboardWindReadout.match(/([0-9.]+)°\s+port/i);
 assert.ok(starboardHeel&&Number(starboardHeel[1])>0.1,'wind from starboard should produce measurable port heel: '+starboardWindReadout);
 await page.locator('[data-wind-direction="270"]').click();
 await page.waitForTimeout(1800);
 const portWindReadout=await page.locator('#mast-response-value').textContent();
 const portHeel=portWindReadout.match(/([0-9.]+)°\s+starboard/i);
 assert.ok(portHeel&&Number(portHeel[1])>0.1,'wind from port should produce measurable starboard heel: '+portWindReadout);
 await page.locator('#simulation-toggle').click();
 assert.equal(await page.locator('#simulation-toggle').getAttribute('aria-pressed'),'true');
 await page.locator('#simulation-toggle').click();
 await page.locator('#rudder-angle').evaluate(el=>{el.value='18';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.match(await page.locator('#rudder-angle-value').textContent(),/Starboard/);
 await page.locator('#sailing-reset').click();
 assert.equal(await page.locator('#wind-toggle').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('#gust-toggle').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('#simulation-toggle').getAttribute('aria-pressed'),'false');
 assert.match(await page.locator('#rudder-angle-value').textContent(),/Center/);
 await page.waitForTimeout(1200);
 assert.match(await page.locator('#mast-response-value').textContent(),/neutral/i,'mast should return to neutral after wind is disabled');

 assert.deepEqual(errors,[],'Browser page errors: '+errors.join(' | '));
 const fs=await import('node:fs/promises');
 await fs.writeFile(join(outputDir,'report.json'),JSON.stringify({vessels:report,errors,selectedVessels,cameraViews,marqueeSelection},null,2));
 console.log('Captured the selected vessel set plus targeted camera views.');
 console.log(JSON.stringify(report,null,2));
}finally{
 if(browser)await browser.close();
 vite.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>vite.once('exit',resolve)),delay(3000)]);
 if(vite.exitCode===null) vite.kill('SIGKILL');
}
