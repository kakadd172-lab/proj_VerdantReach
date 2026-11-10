import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VESSEL_IDS,VESSEL_EDITOR_DEFAULTS,VESSEL_MODULES,getShipDesign,setShipDesignOverrides } from '../ships/index.js';
import { defineVesselSpec,getShipDesignFromSpec,getShipStructureFromSpec } from '../ships/shared/vessel-definition.js';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
test('all 16 vessels own defaults modules beside their generators',async()=>{
 assert.equal(VESSEL_IDS.length,16);assert.equal(Object.keys(VESSEL_EDITOR_DEFAULTS).length,16);
 for(const id of VESSEL_IDS){const defaults=VESSEL_EDITOR_DEFAULTS[id];assert.equal(defaults.format,'verdant-reach-vessel-defaults');assert.equal(defaults.schemaVersion,1);assert.equal(defaults.vesselId,id);assert.ok(VESSEL_MODULES[id].definition.editorDefaults);
  const file=await readFile(join(root,'ships','vessels',id,'editor-defaults.js'),'utf8');assert.ok(file.includes('"vesselId": "'+id+'"')||file.includes("vesselId: '"+id+"'"),id+' saved defaults file identifies its vessel');
  const module=await readFile(join(root,'ships','vessels',id,id+'.js'),'utf8');assert.ok(module.includes("from './editor-defaults.js'"),id+' imports its own defaults');}
});
test('persisted design and structure values resolve before geometry generation',()=>{
 const spec=defineVesselSpec({id:'fixture',design:{id:'fixture',label:'Fixture',hullLength:10,beam:2,draft:1,freeboard:1,masts:[{id:'main',height:4,rig:'gaff'}],sternTiers:[],keelDetails:{},rudderDetails:{}},structure:{frameCount:6}},
 {format:'verdant-reach-vessel-defaults',schemaVersion:1,vesselId:'fixture',design:{hullLength:12},structure:{frameCount:8},componentState:{partTransforms:{}}});
 assert.equal(getShipDesignFromSpec(spec).hullLength,12);assert.equal(getShipStructureFromSpec(spec).frameCount,8);
});
test('runtime overrides remain isolated to their selected vessel',()=>{
 const a=getShipDesign('sloop').hullLength,b=getShipDesign('schooner').hullLength;setShipDesignOverrides('sloop',{hullLength:a+.25});
 assert.equal(getShipDesign('sloop').hullLength,a+.25);assert.equal(getShipDesign('schooner').hullLength,b);setShipDesignOverrides('sloop',{});assert.equal(getShipDesign('sloop').hullLength,a);
});
