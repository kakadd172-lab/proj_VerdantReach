import { defineConfig } from 'vite';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const allowedShips=new Set(['sloop','schooner','brigantine','brig','snow','cutter','frigate','barque','caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace']);
const safePartName=/^[a-z0-9][a-z0-9_-]{0,100}$/i;
const transformKeys=['x','y','z','rx','ry','rz','sx','sy','sz'];
const isRecord=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
function assertSafeTree(v,label,depth=0){
 if(depth>16)throw new Error(label+' is nested too deeply');
 if(v===null||typeof v==='string'||typeof v==='boolean')return v;
 if(typeof v==='number'){if(!Number.isFinite(v))throw new Error(label+' contains a non-finite number');return v;}
 if(Array.isArray(v)){if(v.length>2000)throw new Error(label+' contains too many array entries');return v.map((x,i)=>assertSafeTree(x,label+'['+i+']',depth+1));}
 if(!isRecord(v))throw new Error(label+' contains an unsupported value');
 const out={},entries=Object.entries(v);if(entries.length>3000)throw new Error(label+' contains too many properties');
 for(const [k,x] of entries){if(['__proto__','prototype','constructor'].includes(k))throw new Error(label+' contains a forbidden property');out[k]=assertSafeTree(x,label+'.'+k,depth+1);}return out;
}
function safeName(n,label){if(typeof n!=='string'||!safePartName.test(n))throw new Error('Invalid '+label+': '+String(n));return n;}
function numberMap(v,label,min,max){if(!isRecord(v))throw new Error(label+' must be an object');const out={};for(const [k,n] of Object.entries(v)){safeName(k,label+' key');if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new Error(label+'.'+k+' is outside the allowed range');out[k]=n;}return out;}
function booleanMap(v,label){if(!isRecord(v))throw new Error(label+' must be an object');const out={};for(const [k,x] of Object.entries(v)){safeName(k,label+' key');if(typeof x!=='boolean')throw new Error(label+'.'+k+' must be boolean');out[k]=x;}return out;}
function transformMap(v){
 if(!isRecord(v))throw new Error('componentState.partTransforms must be an object');const out={};
 for(const [name,t] of Object.entries(v)){safeName(name,'component name');if(!isRecord(t))throw new Error('Invalid transform for '+name);const clean={};
  for(const k of transformKeys){if(t[k]===undefined)continue;if(typeof t[k]!=='number'||!Number.isFinite(t[k]))throw new Error('Invalid '+k+' transform for '+name);const scale=k[0]==='s',rotation=k.startsWith('r'),min=scale?0.05:rotation?-Math.PI:-24,max=scale?20:rotation?Math.PI:24;if(t[k]<min||t[k]>max)throw new Error('Out-of-range '+k+' transform for '+name);clean[k]=t[k];}
  out[name]=clean;
 }return out;
}
function sanitizeConfig(id,config){
 if(!allowedShips.has(id))throw new Error('Unknown vessel ID: '+id);if(!isRecord(config))throw new Error('Invalid configuration for '+id);
 const design=config.design===undefined?{}:assertSafeTree(config.design,id+'.design'),structure=config.structure===undefined?{}:assertSafeTree(config.structure,id+'.structure');
 if(!isRecord(design)||!isRecord(structure))throw new Error('Design and structure overrides must be objects');
 const state=config.componentState||config.partState||{};if(!isRecord(state))throw new Error('Invalid component state for '+id);
 const rawTransforms=state.partTransforms===undefined?(config.componentTransforms||{}):state.partTransforms,rawUnlinked=state.unlinkedParts===undefined?[]:state.unlinkedParts;
 if(!Array.isArray(rawUnlinked))throw new Error('unlinkedParts must be an array');
 const cs={rudderAngle:state.rudderAngle===undefined?0:state.rudderAngle,sailTrim:numberMap(state.sailTrim||{},'sailTrim',-1.1,1.1),sailDeployment:{},mastLean:numberMap(state.mastLean||{},'mastLean',-.16,.16),hiddenParts:booleanMap(state.hiddenParts||{},'hiddenParts'),unlinkedParts:rawUnlinked.map(n=>safeName(n,'unlinked component')),partTransforms:transformMap(rawTransforms||{})};
 if(cs.unlinkedParts.length>1000)throw new Error('Too many unlinked components');
 if(typeof cs.rudderAngle!=='number'||!Number.isFinite(cs.rudderAngle)||cs.rudderAngle<-.62||cs.rudderAngle>.62)throw new Error('rudderAngle is outside the allowed range');
 const deployment=state.sailDeployment||{};if(!isRecord(deployment))throw new Error('sailDeployment must be an object');
 for(const [k,v] of Object.entries(deployment)){safeName(k,'sail deployment key');if(!['full','reefed','furled'].includes(v))throw new Error('Invalid sail deployment mode for '+k);cs.sailDeployment[k]=v;}
 return {format:'verdant-reach-vessel-defaults',schemaVersion:1,vesselId:id,savedAt:new Date().toISOString(),design,structure,componentState:cs};
}
function emptyDefaults(id){return {format:'verdant-reach-vessel-defaults',schemaVersion:1,vesselId:id,savedAt:null,design:{},structure:{},componentState:{rudderAngle:0,sailTrim:{},sailDeployment:{},mastLean:{},hiddenParts:{},unlinkedParts:[],partTransforms:{}}};}
async function writeDefaults(root,id,defaults){const dest=path.join(root,'ships','vessels',id,'editor-defaults.js');await fs.mkdir(path.dirname(dest),{recursive:true});const temp=dest+'.tmp';await fs.writeFile(temp,'export default Object.freeze('+JSON.stringify(defaults,null,2)+');\n','utf8');await fs.rename(temp,dest);return 'ships/vessels/'+id+'/editor-defaults.js';}
async function readRequest(req){let body='';for await(const chunk of req){body+=chunk;if(body.length>2*1024*1024)throw new Error('Save payload exceeds 2 MB');}return JSON.parse(body||'{}');}
function sendJson(res,status,value){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));}
export function shipEditorSavePlugin(){return {name:'verdant-reach-persistent-vessel-authoring',configureServer(server){
 const root=server.config.root;
 server.middlewares.use('/__ship-editor/save',async(req,res)=>{if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});try{
  const payload=await readRequest(req),ships=payload&&payload.ships?payload.ships:payload;if(!isRecord(ships))throw new Error('Expected a ships object');const entries=Object.entries(ships);if(!entries.length)throw new Error('There are no vessel configurations to save');
  const written=[];for(const [id,config] of entries)written.push(await writeDefaults(root,id,sanitizeConfig(id,config)));await fs.writeFile(path.join(root,'design-overrides.json'),'{}\n','utf8');sendJson(res,200,{saved:true,vessels:written.length,files:written});
 }catch(error){sendJson(res,400,{saved:false,error:error.message});}});
 server.middlewares.use('/__ship-editor/reset',async(req,res)=>{if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});try{
  const payload=await readRequest(req),id=payload&&payload.shipId;if(typeof id!=='string'||!allowedShips.has(id))throw new Error('Unknown vessel ID: '+String(id));const file=await writeDefaults(root,id,emptyDefaults(id)),legacyPath=path.join(root,'design-overrides.json');
  try{const legacy=JSON.parse(await fs.readFile(legacyPath,'utf8'));if(isRecord(legacy)&&Object.prototype.hasOwnProperty.call(legacy,id)){delete legacy[id];await fs.writeFile(legacyPath,JSON.stringify(legacy,null,2)+'\n','utf8');}}catch(error){if(error.code!=='ENOENT')throw error;}
  sendJson(res,200,{saved:true,vessel:id,file});
 }catch(error){sendJson(res,400,{saved:false,error:error.message});}});
}};}
const forTestsDir=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({root:forTestsDir,base:'./',server:{host:'127.0.0.1',port:5174,strictPort:true,fs:{allow:[forTestsDir]}},resolve:{dedupe:['three']},optimizeDeps:{include:['three'],force:true},plugins:[shipEditorSavePlugin()]});
