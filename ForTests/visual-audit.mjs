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
const vessels=['galleon','carrack','first-rate','junk'];
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
 const errors=[];
 const capture=async name=>{
  const canvas=page.locator('#viewport canvas');
  await canvas.waitFor({state:'visible',timeout:12000});
  const bounds=await canvas.boundingBox();
  assert.ok(bounds&&bounds.width>0&&bounds.height>0,'WebGL canvas has no visible bounds for '+name);
  await page.screenshot({path:join(outputDir,name),clip:bounds,animations:'disabled',timeout:12000});
 };
 const clearSelection=async()=>{
  await page.locator('#part-select').evaluate(select=>{
   let empty=Array.from(select.options).find(option=>option.value==='');
   if(!empty){empty=document.createElement('option');empty.value='';empty.textContent='No selection';select.prepend(empty);}
   select.value='';
   select.dispatchEvent(new Event('change',{bubbles:true}));
  });
 };
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('#ship-select option').length>=16,{timeout:30000});
 const report=[];
 const cameraPanel=page.locator('details.section-card').filter({hasText:'Viewport & camera'});
 if(!(await cameraPanel.evaluate(element=>element.open)))await cameraPanel.locator('summary').click();
 for(const id of vessels){
  await page.locator('#ship-select').selectOption(id);
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '),{timeout:30000});
  await delay(650);
  await clearSelection();
  await delay(120);
  const metrics=await page.evaluate(()=>({
   status:document.querySelector('#status')?.textContent||'',
   parts:document.querySelector('#parts')?.textContent||'',
   description:document.querySelector('#description')?.textContent||''
  }));
  await capture(id+'.png');
  await page.locator('[data-camera="side"]').click();
  await delay(250);
  await capture(id+'-side.png');
  await page.locator('[data-camera="top"]').click();
  await delay(250);
  await capture(id+'-top.png');
  report.push({id,...metrics});
 }
 assert.deepEqual(errors,[],'Browser page errors: '+errors.join(' | '));
 const fs=await import('node:fs/promises');
 await fs.writeFile(join(outputDir,'report.json'),JSON.stringify({vessels:report,errors},null,2));
 console.log('Captured front-quarter, side and top views for '+report.length+' target vessels.');
 console.log(JSON.stringify(report,null,2));
}finally{
 if(browser)await browser.close();
 vite.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>vite.once('exit',resolve)),delay(3000)]);
 if(vite.exitCode===null)vite.kill('SIGKILL');
}
