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
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error')consoleErrors.push(message.text());
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

  await page.locator('#ship-select').selectOption('galleon');
  await page.waitForFunction(()=>document.querySelector('#description')?.textContent?.toLowerCase().includes('galleon'));
  const galleonStatus=await page.locator('#status').innerText();
  assert.ok(galleonStatus.startsWith('Loaded '),'Galleon did not load: '+galleonStatus);

  await page.locator('[data-mode="rotate"]').click();
  await page.locator('[data-mode="scale"]').click();
  await page.locator('[data-mode="translate"]').click();

  assert.deepEqual(pageErrors,[],'Browser runtime errors: '+pageErrors.join(' | '));
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
