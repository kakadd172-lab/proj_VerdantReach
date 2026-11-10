import * as THREE from 'three';
/** Low-level editor support only. Vessel geometry lives in each vessel module. */
export const SHIP_EDITOR_KIT_VERSION='0.8.9';
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
 const design={...vessel.design,structure:vessel.structure},root=new THREE.Group(),editorDefaults=vessel.editorDefaults??{};
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
 return {THREE,V,clamp,design,root,materials,registry,part,mesh,beam,tube,box,editorDefaults};
}
function setupPartApi(root,registry,design){
 const unlinked=new THREE.Group();unlinked.name='unlinked-parts';root.add(unlinked);
 const original=new Map(),base=new Map(),generatorBase=new Map(),resetBaseline=new Map(),state={rudderAngle:0,sailTrim:{},sailDeployment:{},mastLean:{},hiddenParts:{},unlinkedParts:[],partTransforms:{},runtimePose:{},windBlend:0,time:0};
 for(const [name,obj] of registry){
  original.set(name,{parent:obj.parent,position:obj.position.clone(),quaternion:obj.quaternion.clone(),rotation:obj.rotation.clone(),scale:obj.scale.clone(),visible:obj.visible});
  const initial={position:obj.position.clone(),rotation:obj.rotation.clone(),scale:obj.scale.clone()};
  base.set(name,initial);
  generatorBase.set(name,{position:initial.position.clone(),rotation:initial.rotation.clone(),scale:initial.scale.clone()});
 }
 const sailParts=[...registry.values()].filter(p=>p.userData.sailControl);
 const cloths=new Map(sailParts.map(p=>{
   const cloth=registry.get(p.userData.sailControl.clothPart);let mesh=null;
   cloth?.traverse(object=>{if(object.isMesh&&object.userData.sailCloth)mesh=object;});
   return [p.name,{cloth,mesh,from:1,target:1,elapsed:0,duration:0}];
  }));
 const mastParts=[...registry.values()].filter(p=>p.userData.mastControl);
  const runtimeTarget=p=>p.userData.animationPivot||p.userData.steeringControl?.pivotGroup||p.userData.sailControl?.pivotGroup||p;
  const setRuntimeRotation=(name,values={})=>{
   const p=registry.get(name),b=base.get(name);if(!p||!b)return false;
   const target=runtimeTarget(p);
   const pose={...(state.runtimePose[name]||{}),...values};state.runtimePose[name]=pose;
   if(target===p){
    const authored=state.partTransforms[name]||{};
    p.rotation.set(b.rotation.x+(authored.rx||0)+(pose.rx||0),b.rotation.y+(authored.ry||0)+(pose.ry||0),b.rotation.z+(authored.rz||0)+(pose.rz||0),'XYZ');
   }else target.rotation.set(pose.rx||0,pose.ry||0,pose.rz||0,'XYZ');
   return true;
  };
 const api={
  parts:registry,
  getPart(n){return registry.get(n)||null;},
  getPartTransform(n){const p=registry.get(n),b=base.get(n);if(!p||!b)return null;const pose=runtimeTarget(p)===p?(state.runtimePose[n]||{}):{};return {
   x:p.position.x-b.position.x,y:p.position.y-b.position.y,z:p.position.z-b.position.z,
   rx:p.rotation.x-b.rotation.x-(pose.rx||0),ry:p.rotation.y-b.rotation.y-(pose.ry||0),rz:p.rotation.z-b.rotation.z-(pose.rz||0),
   sx:p.scale.x/(b.scale.x||1),sy:p.scale.y/(b.scale.y||1),sz:p.scale.z/(b.scale.z||1)};},
  detachPart(n){const p=registry.get(n);if(!p||p.parent===unlinked)return false;root.updateMatrixWorld(true);const world=p.matrixWorld.clone();unlinked.updateMatrixWorld(true);p.parent?.remove(p);unlinked.add(p);unlinked.updateMatrixWorld(true);
   unlinked.matrixWorld.clone().invert().multiply(world).decompose(p.position,p.quaternion,p.scale);base.set(n,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});state.unlinkedParts=[...new Set([...state.unlinkedParts,n])];return true;},
  relinkPart(n){const p=registry.get(n),o=original.get(n);if(!p||!o||p.parent!==unlinked)return false;unlinked.updateMatrixWorld(true);const world=p.matrixWorld.clone();o.parent.updateMatrixWorld(true);o.parent.add(p);
   o.parent.matrixWorld.clone().invert().multiply(world).decompose(p.position,p.quaternion,p.scale);base.set(n,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});state.unlinkedParts=state.unlinkedParts.filter(x=>x!==n);return true;},
  setPartVisible(n,v){const p=registry.get(n);if(!p)return false;p.visible=!!v;state.hiddenParts[n]=!p.visible;return true;},
  setPartTransform(n,t={}){const p=registry.get(n),b=base.get(n);if(!p||!b)return false;const a={x:clamp(t.x,-1000,1000),y:clamp(t.y,-1000,1000),z:clamp(t.z,-1000,1000),rx:clamp(t.rx,-Math.PI*1000,Math.PI*1000),ry:clamp(t.ry,-Math.PI*1000,Math.PI*1000),rz:clamp(t.rz,-Math.PI*1000,Math.PI*1000),sx:clamp(t.sx??1,.001,1000),sy:clamp(t.sy??1,.001,1000),sz:clamp(t.sz??1,.001,1000)};
   p.position.copy(b.position).add(V(a.x,a.y,a.z));state.partTransforms[n]=a;const pose=runtimeTarget(p)===p?(state.runtimePose[n]||{}):{};p.rotation.set(b.rotation.x+a.rx+(pose.rx||0),b.rotation.y+a.ry+(pose.ry||0),b.rotation.z+a.rz+(pose.rz||0),'XYZ');p.scale.set(b.scale.x*a.sx,b.scale.y*a.sy,b.scale.z*a.sz);return true;},
  captureResetBaseline(){for(const [name,obj] of registry)resetBaseline.set(name,{parent:obj.parent,position:obj.position.clone(),quaternion:obj.quaternion.clone(),rotation:obj.rotation.clone(),scale:obj.scale.clone(),visible:obj.visible});return true;},
  resetPartTransform(n){const p=registry.get(n),saved=resetBaseline.get(n)||original.get(n),raw=generatorBase.get(n);if(!p||!saved)return false;if(p.parent!==saved.parent){p.parent?.remove(p);saved.parent.add(p);}p.position.copy(saved.position);p.quaternion.copy(saved.quaternion);p.rotation.copy(saved.rotation);p.scale.copy(saved.scale);p.visible=saved.visible;p.updateMatrix();if(raw)base.set(n,{position:raw.position.clone(),rotation:raw.rotation.clone(),scale:raw.scale.clone()});const transform=api.getPartTransform(n);if(transform&&Object.values(transform).some((x,i)=>i<6?Math.abs(x)>1e-8:Math.abs(x-1)>1e-8))state.partTransforms[n]=transform;else delete state.partTransforms[n];if(p.visible)delete state.hiddenParts[n];else state.hiddenParts[n]=true;if(p.parent===unlinked)state.unlinkedParts=[...new Set([...state.unlinkedParts,n])];else state.unlinkedParts=state.unlinkedParts.filter(x=>x!==n);return true;},
  setRudderAngle(a){
    const p=registry.get('rudder');if(!p)return false;state.rudderAngle=clamp(a,-.62,.62);
    const rc=p.userData.steeringControl||{};setRuntimeRotation('rudder',{ry:state.rudderAngle*(rc.rotationSign??1)});
    const wheel=registry.get('helm-wheel');
    if(wheel){const wc=wheel.userData.steeringControl||{};setRuntimeRotation('helm-wheel',{rz:state.rudderAngle*(wc.ratio??4.5)*(wc.rotationSign??1)});}
    return true;
   },
  setSailTrim(id,a){const targets=sailParts.filter(p=>p.userData.sailControl.mastId===id);if(!targets.length)return false;state.sailTrim[id]=clamp(a,-1.1,1.1);for(const p of targets)setRuntimeRotation(p.name,{ry:state.sailTrim[id]});return true;},
  setMastLean(id,a){const p=mastParts.find(x=>x.userData.mastControl.mastId===id);if(!p)return false;state.mastLean[id]=clamp(a,-.16,.16);setRuntimeRotation(p.name,{rx:state.mastLean[id]});return true;},
  setSailDeployment(id,mode='full',duration=.85){const targets=sailParts.filter(p=>p.userData.sailControl.mastId===id);if(!targets.length||!['full','reefed','furled'].includes(mode))return false;const scale=mode==='full'?1:mode==='reefed'?.48:.001;state.sailDeployment[id]=mode;for(const p of targets){const a=cloths.get(p.name);if(!a?.cloth)continue;a.from=a.cloth.scale.y;a.target=scale;a.elapsed=0;a.duration=clamp(duration,0,4);if(a.duration===0)a.cloth.scale.y=scale;}return true;},
  animateShip(dt=.016,weather={}){
    const delta=clamp(dt,0,.05);state.time+=delta;
    const targetWind=weather.enabled===true?clamp((weather.speedKnots??0)/30,0,1):0;
    state.windBlend+=(targetWind-state.windBlend)*(1-Math.exp(-delta*2.8));
    const direction=((Number(weather.directionDeg??90)%360)+360)%360*Math.PI/180;
    const transverse=Math.sin(direction),leeward=transverse>1e-4?-1:transverse< -1e-4?1:1;
    const aftness=(1-Math.cos(direction))*.5,trimAngle=leeward*(.08+.82*aftness)*state.windBlend;
    for(const mast of mastParts){
     const id=mast.userData.mastControl.mastId;
     setRuntimeRotation(mast.name,{rx:(state.mastLean[id]||0)+Math.cos(direction)*state.windBlend*.0045,rz:Math.sin(direction)*state.windBlend*.012});
    }
    for(const [name,p] of registry){
     const control=p.userData.windControl;
     if(control?.kind==='boom')setRuntimeRotation(name,{ry:trimAngle*(control.trimScale??1)});
     else if(control?.kind==='gaff')setRuntimeRotation(name,{ry:trimAngle,rx:Math.cos(direction)*state.windBlend*.012});
    }
    for(const p of sailParts){
     const id=p.userData.sailControl.mastId,type=p.userData.sailControl.sailType||'';
     const scale=/jib|staysail|headsail/i.test(type)?.78:/topsail/i.test(type)?.86:1;
     const gust=Math.sin(state.time*1.7+p.name.length*.71)*.018*state.windBlend;
     setRuntimeRotation(p.name,{ry:(state.sailTrim[id]||0)+trimAngle*scale+gust});
     const animation=cloths.get(p.name);
     if(animation?.mesh){
      const data=animation.mesh.userData.sailCloth,attribute=animation.mesh.geometry.attributes.position;
      if(data&&attribute){
       const luff=(1+Math.cos(direction))*.5,amplitude=state.windBlend*(.018+.026*luff);
       const array=attribute.array,rest=data.restPositions,stride=data.columns+1;
       for(let row=0;row<=data.rows;row++){
        const v=row/data.rows;
        for(let col=0;col<=data.columns;col++){
         const u=col/data.columns,index=row*stride+col,offset=index*3;
         const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
         const phase=state.time*4.8-u*6.2+v*2.1+p.name.length*.13;
         const displacement=amplitude*envelope*Math.sin(phase);
         array[offset]=rest[offset]+(data.axis==='x'?displacement:0);
         array[offset+2]=rest[offset+2]+(data.axis==='z'?displacement:0);
        }
       }
       attribute.needsUpdate=true;animation.mesh.geometry.computeVertexNormals();
      }
     }
     if(animation?.cloth&&animation.elapsed<animation.duration){
      animation.elapsed=Math.min(animation.duration,animation.elapsed+delta);
      const t=animation.duration>0?animation.elapsed/animation.duration:1;
      animation.cloth.scale.y=THREE.MathUtils.lerp(animation.from,animation.target,t*t*(3-2*t));
     }
    }
   },
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
 const defaults=ctx.editorDefaults?.componentState||{},patch=saved||{};
 const state={...defaults,...patch};
 for(const key of ['hiddenParts','sailTrim','sailDeployment','mastLean']){
  state[key]=Object.prototype.hasOwnProperty.call(patch,key)?{...(patch[key]||{})}:{...(defaults[key]||{})};
 }
 state.unlinkedParts=Object.prototype.hasOwnProperty.call(patch,'unlinkedParts')?[...(patch.unlinkedParts||[])]:[...(defaults.unlinkedParts||[])];
 const baseTransforms=Object.prototype.hasOwnProperty.call(patch,'partTransforms')?(patch.partTransforms||{}):(defaults.partTransforms||{});
 const partTransforms={...baseTransforms,...(transforms||{})};
 state.partTransforms=partTransforms;
 if(Object.keys(partTransforms).length||Object.keys(state.hiddenParts||{}).length||(state.unlinkedParts||[]).length||Object.keys(state.sailTrim||{}).length||Object.keys(state.sailDeployment||{}).length||Object.keys(state.mastLean||{}).length||Number(state.rudderAngle))api.applyShipState(state);
 api.captureResetBaseline();
 return root;
}
export function shipModelSummary(v){
 const d=v?.design||v;if(!d?.id)return null;
 return {id:d.id,label:d.label,dimensions:d.hullLength.toFixed(1)+' × '+d.beam.toFixed(1)+' m',ratio:d.lengthBeamRatio.toFixed(2),rig:d.rig,period:d.era,hullProfile:d.hullProfile,hullFormNote:d.hullFormNote,modelScaleNote:d.modelScaleNote,reference:d.reference,sources:(d.sources||[]).map(s=>({...s})),mastCount:d.mastCount,partCount:d.partNames.length,parts:d.partNames};
}
export function disposeShipModel(group){if(!group)return;for(const g of new Set(group.userData.ownedGeometries||[]))g.dispose();for(const m of new Set(group.userData.ownedMaterials||[]))m.dispose();group.parent?.remove(group);}
