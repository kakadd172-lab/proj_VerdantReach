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
const vessels=['barque','brig','brigantine','caravel','carrack','cutter','first-rate','fluyt','frigate','galleon','junk','pinnace','schooner','sloop','snow','xebec'];
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
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(requestedShip?baseUrl+'?ship='+encodeURIComponent(requestedShip):baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('#ship-select option').length>=16,{timeout:30000});
 const report=[];
 for(const id of selectedVessels){
  await page.locator('#ship-select').selectOption(id);
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '),{timeout:30000});
  await delay(900);
  assert.ok(await page.locator('#viewport canvas').count(),id+' canvas missing');
  await page.locator('#viewport').screenshot({path:join(outputDir,id+'.png'),animations:'disabled'});
  const metrics=await page.evaluate(()=>({
   status:document.querySelector('#status')?.textContent||'',
   parts:document.querySelector('#parts')?.textContent||'',
   description:document.querySelector('#description')?.textContent||''
  }));
  report.push({id,...metrics});
 }
 await page.locator('details.section-card').filter({hasText:'Viewport & camera'}).locator('summary').click();
 const cameraViews=requestedShip?[[requestedShip,'side'],[requestedShip,'bow'],[requestedShip,'stern'],[requestedShip,'top']]:[['galleon','side'],['carrack','side'],['first-rate','side'],['brig','side'],['schooner','side'],['sloop','side'],['snow','side'],['junk','top'],['xebec','top'],['fluyt','top']];
 for(const [id,angle] of cameraViews){
  await page.locator('#ship-select').selectOption(id);
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.startsWith('Loaded '));
  await page.locator('[data-camera="'+angle+'"]').click();
  await delay(600);
  await page.locator('#viewport').screenshot({path:join(outputDir,id+'-'+angle+'.png')});
 }
 assert.deepEqual(errors,[],'Browser page errors: '+errors.join(' | '));
 const fs=await import('node:fs/promises');
 await fs.writeFile(join(outputDir,'report.json'),JSON.stringify({vessels:report,errors,selectedVessels,cameraViews},null,2));
 console.log('Captured the selected vessel set plus targeted camera views.');
 console.log(JSON.stringify(report,null,2));
}finally{
 if(browser)await browser.close();
 vite.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>vite.once('exit',resolve)),delay(3000)]);
 if(vite.exitCode===null) vite.kill('SIGKILL');
}
