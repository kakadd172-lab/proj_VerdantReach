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
const vessels=['sloop','schooner','brigantine','brig','snow','cutter','frigate','barque','caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace'];
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
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('#ship-select option').length>=16,{timeout:30000});
 const report=[];
 for(const id of vessels){
  await page.locator('#ship-select').selectOption(id);
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '),{timeout:30000});
  // loadShip() reframes the camera automatically for each vessel.
  await delay(900);
  const canvas=page.locator('#viewport canvas');
  assert.ok(await canvas.count(),id+' canvas missing');
  const name=id.replace(/[^a-z0-9-]/g,'_');
  await page.locator('#viewport').screenshot({path:join(outputDir,name+'.png'),animations:'disabled'});
  const metrics=await page.evaluate(()=>{
   const s=document.querySelector('#status')?.textContent||'';
   const p=document.querySelector('#parts')?.textContent||'';
   const d=document.querySelector('#description')?.textContent||'';
   return {status:s,parts:p,description:d};
  });
  report.push({id,...metrics});
 }
 await page.locator('#ship-select').selectOption('galleon');
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '));
 await page.locator('details.section-card').filter({hasText:'Viewport & camera'}).locator('summary').click();
 await page.locator('[data-camera="top"]').click();
 await delay(600);
 await page.locator('#viewport').screenshot({path:join(outputDir,'galleon-top.png')});
 await page.locator('[data-camera="side"]').click();
 await delay(600);
 await page.locator('#viewport').screenshot({path:join(outputDir,'galleon-side.png')});
 await page.locator('#ship-select').selectOption('junk');
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '));
 await page.locator('[data-camera="top"]').click();
 await delay(600);
 await page.locator('#viewport').screenshot({path:join(outputDir,'junk-top.png')});
 assert.deepEqual(errors,[],'Browser page errors: '+errors.join(' | '));
 const fs=await import('node:fs/promises');
 await fs.writeFile(join(outputDir,'report.json'),JSON.stringify({vessels:report,errors},null,2));
 console.log('Captured visual audit for '+report.length+' ship generators.');
 console.log(JSON.stringify(report,null,2));
}finally{
 if(browser)await browser.close();
 vite.kill('SIGTERM');
 await Promise.race([new Promise(r=>vite.once('exit',r)),delay(3000)]);
 if(vite.exitCode===null)vite.kill('SIGKILL');
}
