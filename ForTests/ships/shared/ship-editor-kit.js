import * as THREE from 'three';
/** Low-level editor support only. Vessel geometry lives in each vessel module. */
export const SHIP_MODEL_ENGINE_VERSION='0.8.7';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const COLORS={hull:0x684632,lower:0x3e342d,plank:0x8d6b4b,deck:0xb1946a,trim:0x49382b,rope:0x6d5944,sail:0xe5dcc8,sailShade:0xbdb39a,iron:0x58615f,brass:0xb58b4e,glass:0x7faaa6,flag:0x8b4938};
function createMaterials(palette={}){
 const c={...COLORS,...palette};
 return {
  hull:new THREE.MeshStandardMaterial({color:c.hull,roughness:.9,side:THREE.DoubleSide}),
  lower:new THREE.MeshStandardMaterial({color:c.lower,roughness:.94,side:THREE.DoubleSide}),
  plank:new THREE.MeshStandardMaterial({color:c.plank,roughness:.92}),
  deck:new THREE.MeshStandardMaterial({color:c.deck,roughness:.94,side:THREE.DoubleSide}),
  trim:new THREE.MeshStandardMaterial({color:c.trim,roughness:.88}),
  rope:new THREE.MeshStandardMaterial({color:c.rope,roughness:1}),
  sail:new THREE.MeshStandardMaterial({color:c.sail,roughness:1,side:THREE.DoubleSide}),
  sailShade:new THREE.MeshStandardMaterial({color:c.sailShade,roughness:1,side:THREE.DoubleSide}),
  iron:new THREE.MeshStandardMaterial({color:c.iron,roughness:.72,metalness:.22}),
  brass:new THREE.MeshStandardMaterial({color:c.brass,roughness:.58,metalness:.28}),
  glass:new THREE.MeshStandardMaterial({color:c.glass,roughness:.35,metalness:.08,transparent:true,opacity:.72}),
  flag:new THREE.MeshStandardMaterial({color:c.flag,roughness:.96,side:THREE.DoubleSide})
 };
}
export function createShipContext(vessel,palette={}){
 if(!vessel?.design||!vessel?.structure)throw new TypeError('A resolved vessel definition is required.');
 const design={...vessel.design,structure:vessel.structure},root=new THREE.Group();
 root.name='Verdant Reach · '+design.label;
 const materials=createMaterials(palette),registry=new Map();
 function part(name,parent=root){
  if(registry.has(name))throw new Error('Duplicate ship component: '+name);
  const group=new THREE.Group();group.name=name;group.userData.shipPart=true;parent.add(group);registry.set(name,group);return group;
 }
 function mesh(parent,geometry,material,name=''){
  const obj=new THREE.Mesh(geometry,material);obj.name=name;obj.castShadow=true;obj.receiveShadow=true;obj.userData.shipOwned=true;parent.add(obj);return obj;
 }
 function beam(parent,start,end,radius,material=materials.trim,name='spar',segments=9){
  const a=start?.isVector3?start:V(...start),b=end?.isVector3?end:V(...end),dir=b.clone().sub(a),length=dir.length();
  if(length<.001)return null;
  const obj=mesh(parent,new THREE.CylinderGeometry(radius*.82,radius,length,segments,1),material,name);
  obj.position.copy(a).add(b).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());return obj;
 }
 function tube(parent,points,radius,material=materials.rope,name='line',segments=36){
  if(!Array.isArray(points)||points.length<2)return null;
  return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>p?.isVector3?p:V(...p))),segments,radius,7,false),material,name);
 }
 function box(parent,w,h,depth,material=materials.trim,name='box'){
  return mesh(parent,new THREE.BoxGeometry(w,h,depth),material,name);
 }
 root.userData.shipType=design.id;root.userData.shipLabel=design.label;root.userData.shipGeneratorId=design.id;
 root.userData.shipDefinitionPath=vessel.editorModulePath;root.userData.shipEditorModulePath=vessel.editorModulePath;root.userData.shipGameDefinitionPath=vessel.gameDefinitionPath;
 root.userData.shipSourceVersion='ForTests-native';root.userData.forwardAxis='-z';
 root.userData.shipDimensions={length:design.hullLength,beam:design.beam,draft:design.draft};
 root.userData.shipDimensionsUnits={length:design.hullLengthUnits,beam:design.beamUnits,draft:design.draftUnits};
 root.userData.deckHeightUnits=design.deckHeightUnits;root.userData.deckHeight=design.deckHeightUnits;
 root.userData.vehicle={mode:'boat',vesselType:design.id,deckHeight:design.deckHeightUnits,label:'Board '+design.label};
 return {THREE,V,clamp,design,root,materials,registry,part,mesh,beam,tube,box};
}
function setupPartApi(root,registry,design){
 const unlinked=new THREE.Group();unlinked.name='unlinked-parts';root.add(unlinked);
 const original=new Map(),base=new Map(),state={rudderAngle:0,sailTrim:{},sailDeployment:{},mastLean:{},hiddenParts:{},unlinkedParts:[],partTransforms:{},time:0};
 for(const [name,obj] of registry){
  original.set(name,{parent:obj.parent,position:obj.position.clone(),quaternion:obj.quaternion.clone(),rotation:obj.rotation.clone(),scale:obj.scale.clone()});
  base.set(name,{position:obj.position.clone(),rotation:obj.rotation.clone(),scale:obj.scale.clone()});
 }
 const sailParts=[...registry.values()].filter(p=>p.userData.sailControl);
 const cloths=new Map(sailParts.map(p=>[p.name,{cloth:registry.get(p.userData.sailControl.clothPart),from:1,target:1,elapsed:0,duration:0}]));
 const mastParts=[...registry.values()].filter(p=>p.userData.mastControl);
 const api={
  parts:registry,
  getPart(n){return registry.get(n)||null;},
  getPartTransform(n){const p=registry.get(n),b=base.get(n);if(!p||!b)return null;return {
   x:p.position.x-b.position.x,y:p.position.y-b.position.y,z:p.position.z-b.position.z,
   rx:p.rotation.x-b.rotation.x,ry:p.rotation.y-b.rotation.y,rz:p.rotation.z-b.rotation.z,
   sx:p.scale.x/(b.scale.x||1),sy:p.scale.y/(b.scale.y||1),sz:p.scale.z/(b.scale.z||1)};},
  detachPart(n){const p=registry.get(n);if(!p||p.parent===unlinked)return false;root.updateMatrixWorld(true);const world=p.matrixWorld.clone();unlinked.updateMatrixWorld(true);p.parent?.remove(p);unlinked.add(p);unlinked.updateMatrixWorld(true);
   unlinked.matrixWorld.clone().invert().multiply(world).decompose(p.position,p.quaternion,p.scale);base.set(n,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});state.unlinkedParts=[...new Set([...state.unlinkedParts,n])];return true;},
  relinkPart(n){const p=registry.get(n),o=original.get(n);if(!p||!o||p.parent!==unlinked)return false;unlinked.updateMatrixWorld(true);const world=p.matrixWorld.clone();o.parent.updateMatrixWorld(true);o.parent.add(p);
   o.parent.matrixWorld.clone().invert().multiply(world).decompose(p.position,p.quaternion,p.scale);base.set(n,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});state.unlinkedParts=state.unlinkedParts.filter(x=>x!==n);return true;},
  setPartVisible(n,v){const p=registry.get(n);if(!p)return false;p.visible=!!v;state.hiddenParts[n]=!p.visible;return true;},
  setPartTransform(n,t={}){const p=registry.get(n),b=base.get(n);if(!p||!b)return false;const a={x:clamp(t.x,-24,24),y:clamp(t.y,-24,24),z:clamp(t.z,-24,24),rx:clamp(t.rx,-Math.PI,Math.PI),ry:clamp(t.ry,-Math.PI,Math.PI),rz:clamp(t.rz,-Math.PI,Math.PI),sx:clamp(t.sx??1,.05,20),sy:clamp(t.sy??1,.05,20),sz:clamp(t.sz??1,.05,20)};
   p.position.copy(b.position).add(V(a.x,a.y,a.z));p.rotation.set(b.rotation.x+a.rx,b.rotation.y+a.ry,b.rotation.z+a.rz,'XYZ');p.scale.set(b.scale.x*a.sx,b.scale.y*a.sy,b.scale.z*a.sz);state.partTransforms[n]=a;return true;},
  resetPartTransform(n){const p=registry.get(n),o=original.get(n);if(!p||!o)return false;if(p.parent!==o.parent){p.parent?.remove(p);o.parent.add(p);}p.position.copy(o.position);p.quaternion.copy(o.quaternion);p.rotation.copy(o.rotation);p.scale.copy(o.scale);p.visible=true;p.updateMatrix();base.set(n,{position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});delete state.partTransforms[n];delete state.hiddenParts[n];state.unlinkedParts=state.unlinkedParts.filter(x=>x!==n);return true;},
  setRudderAngle(a){const p=registry.get('rudder');if(!p)return false;state.rudderAngle=clamp(a,-.62,.62);p.rotation.y=state.rudderAngle+(state.partTransforms.rudder?.ry||0);return true;},
  setSailTrim(id,a){const targets=sailParts.filter(p=>p.userData.sailControl.mastId===id);if(!targets.length)return false;state.sailTrim[id]=clamp(a,-1.1,1.1);for(const p of targets)p.rotation.y=state.sailTrim[id]+(state.partTransforms[p.name]?.ry||0);return true;},
  setMastLean(id,a){const p=mastParts.find(x=>x.userData.mastControl.mastId===id);if(!p)return false;state.mastLean[id]=clamp(a,-.16,.16);const b=base.get(p.name);p.rotation.x=(b?.rotation.x||0)+state.mastLean[id]+(state.partTransforms[p.name]?.rx||0);return true;},
  setSailDeployment(id,mode='full',duration=.85){const targets=sailParts.filter(p=>p.userData.sailControl.mastId===id);if(!targets.length||!['full','reefed','furled'].includes(mode))return false;const scale=mode==='full'?1:mode==='reefed'?.48:.001;state.sailDeployment[id]=mode;for(const p of targets){const a=cloths.get(p.name);if(!a?.cloth)continue;a.from=a.cloth.scale.y;a.target=scale;a.elapsed=0;a.duration=clamp(duration,0,4);if(a.duration===0)a.cloth.scale.y=scale;}return true;},
  animateShip(dt=.016,weather={}){state.time+=clamp(dt,0,.1);const wind=clamp(weather.windStrength??.25,0,1),angle=Number(weather.windAngle)||0;for(const p of sailParts){const id=p.userData.sailControl.mastId,manual=state.sailTrim[id]||0,gust=Math.sin(state.time*1.4+id.length)*.018*wind;p.rotation.y=(state.partTransforms[p.name]?.ry||0)+manual+Math.sin(angle)*.08*wind+gust;const a=cloths.get(p.name);if(a?.cloth&&a.elapsed<a.duration){a.elapsed=Math.min(a.duration,a.elapsed+clamp(dt,0,.1));const t=a.duration>0?a.elapsed/a.duration:1;a.cloth.scale.y=THREE.MathUtils.lerp(a.from,a.target,t*t*(3-2*t));}}},
  getShipState(){const partTransforms=Object.fromEntries([...registry.keys()].map(n=>[n,api.getPartTransform(n)]).filter(([,v])=>v&&Object.values(v).some((x,i)=>i<6?Math.abs(x)>1e-8:Math.abs(x-1)>1e-8)));return {rudderAngle:state.rudderAngle,sailTrim:{...state.sailTrim},sailDeployment:{...state.sailDeployment},mastLean:{...state.mastLean},hiddenParts:Object.fromEntries(Object.entries(state.hiddenParts).filter(([,v])=>v)),unlinkedParts:[...state.unlinkedParts],partTransforms};},
  applyShipState(s={}){for(const n of s.unlinkedParts||[])if(registry.has(n))api.detachPart(n);for(const [n,t] of Object.entries(s.partTransforms||{}))if(registry.has(n))api.setPartTransform(n,t);api.setRudderAngle(s.rudderAngle||0);for(const [id,v] of Object.entries(s.sailTrim||{}))api.setSailTrim(id,v);for(const [id,v] of Object.entries(s.sailDeployment||{}))api.setSailDeployment(id,v,0);for(const [id,v] of Object.entries(s.mastLean||{}))api.setMastLean(id,v);for(const [n,v] of Object.entries(s.hiddenParts||{}))if(registry.has(n))api.setPartVisible(n,!v);return true;},
  summary(){return {type:design.id,label:design.label,dimensions:{length:design.hullLength,beam:design.beam,draft:design.draft},lengthBeamRatio:design.lengthBeamRatio,rig:design.rig,era:design.era,reference:design.reference,sources:(design.sources||[]).map(s=>({...s})),hullProfile:design.hullProfile,partCount:registry.size,parts:[...registry.keys()],unlinkedParts:[...state.unlinkedParts]};}
 };
 return api;
}
export function finishShipModel(ctx,transforms={},saved={}){
 const {root,registry,design,materials}=ctx,api=setupPartApi(root,registry,design);
 for(const key of ['getPart','getPartTransform','detachPart','relinkPart','setPartVisible','setPartTransform','resetPartTransform','setRudderAngle','setSailTrim','setMastLean','setSailDeployment','animateShip','getShipState','applyShipState'])root.userData[key]=api[key].bind(api);
 root.userData.shipModelSummary=api.summary.bind(api);root.userData.partNames=[...registry.keys()];
 const geometries=new Set(),used=new Set(Object.values(materials));
 root.traverse(o=>{if(!o.isMesh)return;if(o.geometry)geometries.add(o.geometry);if(Array.isArray(o.material))o.material.forEach(m=>used.add(m));else if(o.material)used.add(o.material);o.userData.shipOwned=true;});
 root.userData.ownedGeometries=[...geometries];root.userData.ownedMaterials=[...used];
 const partTransforms=transforms&&Object.keys(transforms).length?transforms:(saved?.partTransforms||{}),state={...(saved||{}),partTransforms};
 if(Object.keys(partTransforms).length||Object.keys(state.hiddenParts||{}).length||(state.unlinkedParts||[]).length||Object.keys(state.sailTrim||{}).length||Object.keys(state.sailDeployment||{}).length||Object.keys(state.mastLean||{}).length||Number(state.rudderAngle))api.applyShipState(state);
 return root;
}
export function shipModelSummary(v){
 const d=v?.design||v;if(!d?.id)return null;
 return {id:d.id,label:d.label,dimensions:d.hullLength.toFixed(1)+' × '+d.beam.toFixed(1)+' m',ratio:d.lengthBeamRatio.toFixed(2),rig:d.rig,period:d.era,hullProfile:d.hullProfile,hullFormNote:d.hullFormNote,modelScaleNote:d.modelScaleNote,reference:d.reference,sources:(d.sources||[]).map(s=>({...s})),mastCount:d.mastCount,partCount:d.partNames.length,parts:d.partNames};
}
export function disposeShipModel(group){if(!group)return;for(const g of new Set(group.userData.ownedGeometries||[]))g.dispose();for(const m of new Set(group.userData.ownedMaterials||[]))m.dispose();group.parent?.remove(group);}
