import * as THREE from 'three';
/** Low-level editor support only. Vessel geometry lives in each vessel module. */
export const SHIP_EDITOR_KIT_VERSION='0.8.16';
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
  const curvePoints=points.map(point=>point?.isVector3?point.clone():V(...point));
  const line=mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePoints),segments,radius,7,false),material,name);
  // Mast-supporting tubes are authored in the standing-rigging group's
  // stable hull frame. Record their centerline so the mast-step system can
  // move masthead ends while keeping deck/bow/stern fittings stationary.
  const mastStayGroup=(parent.name||'').match(/^(?:shrouds|mast-stays|backstays)-(.+)$/);
  if(mastStayGroup){
   let mastFrame=parent;
   while(mastFrame&&!mastFrame.userData?.mastControl)mastFrame=mastFrame.parent;
   const coordinateSpace=mastFrame?.userData?.mastControl?.mastId===mastStayGroup[1]?'mast-group':'parent';
   line.userData.dynamicMastStay={
    mastId:mastStayGroup[1],
    coordinateSpace,
    points:curvePoints.map(point=>point.toArray()),
    fixedEndIndex:curvePoints.length-1,
    fixedPoint:curvePoints[curvePoints.length-1].toArray(),
    radius,segments,radialSegments:7
   };
  }
  return line;
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
 const makeNestedPivot=(component,pivot,name,excluded=new Set())=>{
  const group=new THREE.Group();group.name=name;group.position.copy(pivot);
  for(const child of [...component.children]){
   if(excluded.has(child))continue;
   component.remove(child);child.position.sub(pivot);group.add(child);
  }
  component.add(group);return group;
 };

 // Install pivots before editor baselines are captured. The component root
 // remains the editable object; only the mast/spar/sail assembly rotates.
 // Standing rigging is deliberately excluded from that pivot: its hull-side
 // fittings must remain in the hull frame while its masthead ends are updated
 // from the mast pivot below. Rotating the whole rigging group and then trying
 // to counter-rotate its tube vertices causes endpoint drift.
 const mastParts=[...registry.values()].filter(p=>p.userData.mastControl);
 const mastStaySets=new Map(),pendingMastStays=[];
 const hullPart=registry.get('hull')||root;

 // Capture each stay's authored endpoints in their original source frame
 // before applying saved editor transforms. The hull fitting is stored in
 // hull-local coordinates; the head is stored in the mast pivot's local frame.
 for(const mast of mastParts){
  const control=mast.userData.mastControl,id=control.mastId;
  root.updateMatrixWorld(true);
  const pending=[];
  root.traverse(object=>{
   const metadata=object.userData.dynamicMastStay,attribute=object.geometry?.attributes?.position;
   if(!metadata||metadata.mastId!==id||!object.isMesh||!attribute||!object.parent)return;
   const radialSegments=metadata.radialSegments??7,segments=metadata.segments;
   const stride=radialSegments+1;
   if(!Number.isInteger(segments)||segments<1||attribute.count!==(segments+1)*stride)return;
   const sourceFrame=metadata.coordinateSpace==='mast-group'?mast:object.parent;
   const fixedPoint=metadata.fixedPoint||
    (Array.isArray(metadata.points)?metadata.points[metadata.fixedEndIndex??metadata.points.length-1]:null);
   if(!Array.isArray(fixedPoint)||!sourceFrame)return;
   const fixedWorld=sourceFrame.localToWorld(new THREE.Vector3(...fixedPoint));
   // Use the actual generated tube ring for the moving end. Across the fleet,
   // some generators author tube points in the mast frame and others in the
   // ship frame; metadata.points[0] alone cannot safely identify that frame.
   const startCenter=ringCenterFromArray(attribute.array,0,segments,radialSegments);
   const mastHeadWorld=object.localToWorld(startCenter.clone());
   pending.push({
    mesh:object,mast,metadata,segments,radialSegments,
    fixedHullLocal:hullPart.worldToLocal(fixedWorld.clone()).toArray(),
    mastHeadWorld
   });
  });

  // Keep the original hierarchy intact while saved component transforms
  // are applied. These rigging transforms were authored relative to this
  // hierarchy; reparenting before loading them would apply legacy offsets and
  // scales in a different coordinate frame and compound them.
  const standing=registry.get('standing-rigging-'+id)||mast.getObjectByName('standing-rigging-'+id);
  const fittings=['chainplates-'+id,'backstay-chainplates-'+id]
   .map(name=>registry.get(name)).filter(Boolean);
  const relativePose=(frame,object)=>{
   root.updateMatrixWorld(true);
   object.updateWorldMatrix(true,false);
   const relative=frame.matrixWorld.clone().invert().multiply(object.matrixWorld);
   const position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();
   relative.decompose(position,quaternion,scale);
   return {position,rotation:new THREE.Euler().setFromQuaternion(quaternion,'XYZ'),scale};
  };
  const standingBase=standing?relativePose(root,standing):null;
  const fittingBases=fittings.map(fitting=>({fitting,basePose:relativePose(hullPart,fitting)}));

  const excluded=new Set(standing?[standing]:[]);
  const pivot=control.pivotGroup||mast.userData.animationPivot||
   makeNestedPivot(mast,V(0,0,0),mast.name+'-mast-step-pivot',excluded);
  control.pivotGroup=pivot;
  control.windHeelMaxDeg=Number(control.windHeelMaxDeg)||2.5;
  control.windRakeMaxDeg=Number(control.windRakeMaxDeg)||1.2;
  mast.userData.animationPivot=pivot;
  pivot.userData.articulation={kind:'mast-step',mastId:id,heelLimitDeg:control.windHeelMaxDeg,rakeLimitDeg:control.windRakeMaxDeg};

  root.updateMatrixWorld(true);
  for(const stay of pending){
   stay.pivot=pivot;
   stay.startPivotLocal=pivot.worldToLocal(stay.mastHeadWorld.clone()).toArray();
   stay.standing=standing;
   stay.standingBase=standingBase;
   stay.fittingBases=fittingBases;
   pendingMastStays.push(stay);
  }
 }

 function ringCenterFromArray(array,ring,segments,radialSegments){
  const stride=radialSegments+1,offset=ring*stride*3,center=new THREE.Vector3();
  for(let radial=0;radial<=radialSegments;radial++){
   const index=offset+radial*3;
   center.add(new THREE.Vector3(array[index],array[index+1],array[index+2]));
  }
  return center.multiplyScalar(1/stride);
 }
 function applyMigratedPose(object,parent,basePose){
  if(!object||!parent||!basePose)return;
  const applied=state.partTransforms[object.name]||{};
  parent.add(object);
  object.position.copy(basePose.position).add(V(applied.x||0,applied.y||0,applied.z||0));
  object.rotation.set(
   basePose.rotation.x+(applied.rx||0),
   basePose.rotation.y+(applied.ry||0),
   basePose.rotation.z+(applied.rz||0),'XYZ');
  object.scale.copy(basePose.scale).multiply(V(applied.sx??1,applied.sy??1,applied.sz??1));
  const neutral={position:basePose.position.clone(),rotation:basePose.rotation.clone(),scale:basePose.scale.clone()};
  base.set(object.name,neutral);
  generatorBase.set(object.name,{position:neutral.position.clone(),rotation:neutral.rotation.clone(),scale:neutral.scale.clone()});
 }

 function isUnlinked(object){
  for(let parent=object;parent;parent=parent.parent)if(parent===unlinked)return true;
  return false;
 }
 function finalizeMastStays(){
  // Saved transforms have now been applied in the original authored
  // hierarchy. Only now detach standing rigging from the mast and move the
  // physical chainplates to the hull, preserving their fully edited world pose.
  // Explicitly detached editor parts remain detached and are not reattached.
  const migratedNames=new Set();
  for(const stay of pendingMastStays){
   if(stay.standing&&!isUnlinked(stay.standing)&&stay.standing.parent!==root){
    applyMigratedPose(stay.standing,root,stay.standingBase);
   }
   for(const entry of stay.fittingBases||[]){
    const {fitting,basePose}=entry;
    if(!isUnlinked(fitting)&&fitting.parent!==hullPart){
     // Chainplates were authored in mast-local coordinates. Move their
     // component origin into hull-local space, retaining only their own saved
     // editor delta rather than inheriting the mast/standing-rig transforms.
     applyMigratedPose(fitting,hullPart,basePose);
    }
   }
  }
  root.updateMatrixWorld(true);
  mastStaySets.clear();
  for(const stay of pendingMastStays){
   const {mesh,mast,pivot,metadata,segments,radialSegments,fixedHullLocal,startPivotLocal}=stay;
   if(isUnlinked(mesh))continue;
   const attribute=mesh.geometry?.attributes?.position;
   if(!attribute||attribute.count!==(segments+1)*(radialSegments+1))continue;

   const mastHeadWorld=pivot.localToWorld(new THREE.Vector3(...startPivotLocal));
   const fixedWorld=hullPart.localToWorld(new THREE.Vector3(...fixedHullLocal));
   const mastHeadLocal=mesh.worldToLocal(mastHeadWorld.clone());
   const fixedLocal=mesh.worldToLocal(fixedWorld.clone());
   const original=new Float32Array(attribute.array);
   const startCenter=ringCenterFromArray(original,0,segments,radialSegments);
   const endCenter=ringCenterFromArray(original,segments,segments,radialSegments);
   const startCorrection=mastHeadLocal.sub(startCenter);
   const endCorrection=fixedLocal.sub(endCenter);
   const positions=attribute.array,stride=radialSegments+1;
   for(let ring=0;ring<=segments;ring++){
    const t=ring/segments,from=1-t,offset=ring*stride*3;
    for(let radial=0;radial<=radialSegments;radial++){
     const index=offset+radial*3;
     positions[index]=original[index]+startCorrection.x*from+endCorrection.x*t;
     positions[index+1]=original[index+1]+startCorrection.y*from+endCorrection.y*t;
     positions[index+2]=original[index+2]+startCorrection.z*from+endCorrection.z*t;
    }
   }
   attribute.needsUpdate=true;
   mesh.geometry.computeVertexNormals();
   mesh.geometry.computeBoundingBox();
   mesh.geometry.computeBoundingSphere();

   metadata.anchorFrame='hull';
   metadata.fixedPointHull=fixedHullLocal.slice();
   metadata.mastHeadPivotLocal=startPivotLocal.slice();
   const data={
    ...metadata,segments,radialSegments,
    fixedHullLocal:fixedHullLocal.slice(),
    startPivotLocal:startPivotLocal.slice(),
    restPositions:new Float32Array(attribute.array),
    baseStartLocal:ringCenterFromArray(attribute.array,0,segments,radialSegments),
    baseFixedLocal:ringCenterFromArray(attribute.array,segments,segments,radialSegments),
    lastMastHeadLocal:mastHeadLocal.clone(),
    lastFixedLocal:fixedLocal.clone()
   };
   const set=mastStaySets.get(metadata.mastId)||{pivot,stays:[]};
   set.stays.push({mesh,mast,pivot,data});
   mastStaySets.set(metadata.mastId,set);
  }
  return true;
 }
 const sailControlsForSetup=[...registry.values()].filter(p=>p.userData.sailControl);
 for(const sail of sailControlsForSetup){
  const control=sail.userData.sailControl;
  const cloth=registry.get(control.clothPart);
  let canvas=null;
  cloth?.traverse(object=>{
   if(object.isMesh&&object.name==='sail-shaped-cloth')canvas=object;
  });
  if(!canvas?.geometry?.attributes?.position)continue;
  const position=canvas.geometry.attributes.position;
  const indices=canvas.geometry.index?.array;
  const stride=indices?.length>1?indices[1]:0;
  const inferredColumns=stride>1?stride-1:0;
  const inferredRows=inferredColumns&&position.count%stride===0?position.count/stride-1:0;
  const bounds=canvas.geometry.boundingBox||canvas.geometry.computeBoundingBox();
  const size=bounds?.getSize(new THREE.Vector3())||new THREE.Vector3(1,1,1);
  const authored=canvas.userData.sailCloth||{};
  const rows=authored.rows||inferredRows,columns=authored.columns||inferredColumns;
  // In this coordinate system fore-and-aft sails have their long span on Z
  // and therefore billow across X; square sails span X and billow across Z.
  const axis=authored.axis||(size.x>size.z?'z':'x');
  canvas.userData.sailCloth={rows,columns,axis};

  let pivot=control.pivotGroup||sail.userData.animationPivot;
  let deployment=control.deploymentPart?sail.getObjectByName(control.deploymentPart):null;
  if(!deployment){
   deployment=new THREE.Group();
   deployment.name='sail-deployment-'+sail.name;
   deployment.userData.sailDeploymentAssembly=true;
   if(pivot){
    for(const child of [...pivot.children]){
     pivot.remove(child);deployment.add(child);
    }
    pivot.add(deployment);
    control.deploymentAnchorY=0;
    control.pivotPoint ||= [0,0,0];
   }else{
    for(const child of [...sail.children]){
     sail.remove(child);deployment.add(child);
    }
    sail.add(deployment);
    const tack=new THREE.Vector3(position.getX(0),position.getY(0),position.getZ(0));
    pivot=makeNestedPivot(sail,tack,sail.name+'-tack-animation-pivot');
    control.pivotPoint=tack.toArray();
    control.deploymentAnchorY=tack.y;
   }
   control.deploymentPart=deployment.name;
  }
  control.pivotGroup=pivot||sail;
  control.windPivot=true;
  sail.userData.animationPivot=pivot||sail;
  sail.userData.windControl={kind:'sail'};
 }

 const rudder=registry.get('rudder');
 if(rudder&&!rudder.userData.steeringControl?.pivotGroup){
  const control=rudder.userData.steeringControl||{};
  const pivot=makeNestedPivot(rudder,V(0,0,0),rudder.name+'-stock-pivot');
  rudder.userData.steeringControl={...control,axis:control.axis||'y',rotationSign:control.rotationSign??1,maxAngle:control.maxAngle??.62,pivotGroup:pivot};
 }
 const wheel=registry.get('helm-wheel');
 if(wheel&&!wheel.userData.steeringControl?.pivotGroup){
  const control=wheel.userData.steeringControl||{};
  wheel.updateWorldMatrix(true,false);
  let axle=wheel.getObjectByName('helm-wheel-ring')||wheel.getObjectByName('helm-wheel-hub');
  if(!axle)wheel.traverse(object=>{if(!axle&&object.isMesh&&object.geometry?.type==='TorusGeometry')axle=object;});
  let pivotPoint;
  if(axle)pivotPoint=wheel.worldToLocal(axle.getWorldPosition(new THREE.Vector3()));
  else{
   const bounds=new THREE.Box3().setFromObject(wheel);
   pivotPoint=wheel.worldToLocal(bounds.getCenter(new THREE.Vector3()));
  }
  const pivot=makeNestedPivot(wheel,pivotPoint,wheel.name+'-axle-pivot');
  wheel.userData.steeringControl={...control,axis:control.axis||'z',ratio:control.ratio??4.5,rotationSign:control.rotationSign??1,pivotGroup:pivot};
 }

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
   const cloth=registry.get(p.userData.sailControl.clothPart);
   const deployment=p.getObjectByName(p.userData.sailControl.deploymentPart);
   let mesh=null,sailCloth=null;
   cloth?.traverse(object=>{
    if(object.isMesh&&object.userData.sailCloth){
     mesh=object;
     sailCloth={...object.userData.sailCloth,restPositions:new Float32Array(object.geometry.attributes.position.array)};
    }
   });
   const anchorY=p.userData.sailControl.deploymentAnchorY??p.userData.sailControl.pivotPoint?.[1]??0;
   return [p.name,{
    cloth,deployment,mesh,sailCloth,from:1,target:1,elapsed:0,duration:0,
    pivotY:anchorY,
    fromPositionY:deployment?.position.y||0,targetPositionY:deployment?.position.y||0
   }];
  }));
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
  finalizeMastStays,
  getPart(n){return registry.get(n)||null;},
  getPartTransform(n){const p=registry.get(n),b=base.get(n);if(!p||!b)return null;const pose=runtimeTarget(p)===p?(state.runtimePose[n]||{}):{};return {
   x:p.position.x-b.position.x,y:p.position.y-b.position.y,z:p.position.z-b.position.z,
   rx:p.rotation.x-b.rotation.x-(pose.rx||0),ry:p.rotation.y-b.rotation.y-(pose.ry||0),rz:p.rotation.z-b.rotation.z-(pose.rz||0),
   sx:p.scale.x/(b.scale.x||1),sy:p.scale.y/(b.scale.y||1),sz:p.scale.z/(b.scale.z||1)};},
  detachPart(n){const p=registry.get(n);if(!p||p.parent===unlinked)return false;root.updateMatrixWorld(true);const world=p.matrixWorld.clone();unlinked.updateMatrixWorld(true);p.parent?.remove(p);unlinked.add(p);unlinked.updateMatrixWorld(true);
   unlinked.matrixWorld.clone().invert().multiply(world).decompose(p.position,p.quaternion,p.scale);base.set(n,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});state.unlinkedParts=[...new Set([...state.unlinkedParts,n])];return true;},
  relinkPart(n){const p=registry.get(n),o=resetBaseline.get(n)||original.get(n);if(!p||!o||p.parent!==unlinked)return false;unlinked.updateMatrixWorld(true);const world=p.matrixWorld.clone();o.parent.updateMatrixWorld(true);o.parent.add(p);
   o.parent.matrixWorld.clone().invert().multiply(world).decompose(p.position,p.quaternion,p.scale);base.set(n,{position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()});state.unlinkedParts=state.unlinkedParts.filter(x=>x!==n);return true;},
  setPartVisible(n,v){const p=registry.get(n);if(!p)return false;p.visible=!!v;state.hiddenParts[n]=!p.visible;return true;},
  setPartTransform(n,t={}){const p=registry.get(n),b=base.get(n);if(!p||!b)return false;const a={x:clamp(t.x,-1000,1000),y:clamp(t.y,-1000,1000),z:clamp(t.z,-1000,1000),rx:clamp(t.rx,-Math.PI*1000,Math.PI*1000),ry:clamp(t.ry,-Math.PI*1000,Math.PI*1000),rz:clamp(t.rz,-Math.PI*1000,Math.PI*1000),sx:clamp(t.sx??1,.001,1000),sy:clamp(t.sy??1,.001,1000),sz:clamp(t.sz??1,.001,1000)};
   p.position.copy(b.position).add(V(a.x,a.y,a.z));state.partTransforms[n]=a;const pose=runtimeTarget(p)===p?(state.runtimePose[n]||{}):{};p.rotation.set(b.rotation.x+a.rx+(pose.rx||0),b.rotation.y+a.ry+(pose.ry||0),b.rotation.z+a.rz+(pose.rz||0),'XYZ');p.scale.set(b.scale.x*a.sx,b.scale.y*a.sy,b.scale.z*a.sz);return true;},
  captureResetBaseline(){for(const [name,obj] of registry)resetBaseline.set(name,{parent:obj.parent,position:obj.position.clone(),quaternion:obj.quaternion.clone(),rotation:obj.rotation.clone(),scale:obj.scale.clone(),visible:obj.visible});return true;},
  resetPartTransform(n){
   const p=registry.get(n),saved=resetBaseline.get(n)||original.get(n),raw=generatorBase.get(n);
   if(!p||!saved)return false;
   if(p.parent!==saved.parent){p.parent?.remove(p);saved.parent.add(p);}
   p.position.copy(saved.position);p.quaternion.copy(saved.quaternion);p.rotation.copy(saved.rotation);p.scale.copy(saved.scale);p.visible=saved.visible;p.updateMatrix();
   // Runtime pivots are not part of a design transform. Reset them separately so
   // a wind/steering pose cannot survive a component reset.
   const target=runtimeTarget(p);
   if(target!==p)target.rotation.set(0,0,0,'XYZ');
   delete state.runtimePose[n];
   if(p.userData.mastControl)state.mastLean[p.userData.mastControl.mastId]=0;
   if(p.userData.sailControl){
    state.sailTrim[p.userData.sailControl.mastId]=0;
    api.setSailDeployment(p.userData.sailControl.mastId,'full',0);
   }
   if(n==='rudder'||n==='helm-wheel')api.setRudderAngle(0);
   if(raw)base.set(n,{position:raw.position.clone(),rotation:raw.rotation.clone(),scale:raw.scale.clone()});
   const transform=api.getPartTransform(n);
   if(transform&&Object.values(transform).some((x,i)=>i<6?Math.abs(x)>1e-8:Math.abs(x-1)>1e-8))state.partTransforms[n]=transform;
   else delete state.partTransforms[n];
   if(p.visible)delete state.hiddenParts[n];else state.hiddenParts[n]=true;
   if(p.parent===unlinked)state.unlinkedParts=[...new Set([...state.unlinkedParts,n])];
   else state.unlinkedParts=state.unlinkedParts.filter(x=>x!==n);
   return true;
  },
  setRudderAngle(a){
    const p=registry.get('rudder');if(!p)return false;
    const rc=p.userData.steeringControl||{},limit=Math.abs(Number(rc.maxAngle)||.62);
    state.rudderAngle=clamp(a,-limit,limit);
    setRuntimeRotation('rudder',{ry:state.rudderAngle*(rc.rotationSign??1)});
    const wheel=registry.get('helm-wheel');
    if(wheel){const wc=wheel.userData.steeringControl||{};setRuntimeRotation('helm-wheel',{rz:state.rudderAngle*(wc.ratio??4.5)*(wc.rotationSign??1)});}
    return true;
   },
  setSailTrim(id,a){const targets=sailParts.filter(p=>p.userData.sailControl.mastId===id);if(!targets.length)return false;state.sailTrim[id]=clamp(a,-1.1,1.1);for(const p of targets)setRuntimeRotation(p.name,{ry:state.sailTrim[id]});return true;},
  setMastLean(id,a){const p=mastParts.find(x=>x.userData.mastControl.mastId===id);if(!p)return false;state.mastLean[id]=clamp(a,-.16,.16);setRuntimeRotation(p.name,{rx:state.mastLean[id]});return true;},
  setSailDeployment(id,mode='full',duration=.85){
   const targets=sailParts.filter(p=>p.userData.sailControl.mastId===id);
   if(!targets.length||!['full','reefed','furled'].includes(mode))return false;
   const scale=mode==='full'?1:mode==='reefed'?.48:.001;
   state.sailDeployment[id]=mode;
   for(const p of targets){
    const a=cloths.get(p.name);if(!a?.deployment)continue;
    a.from=a.deployment.scale.y;a.target=scale;
    a.fromPositionY=a.deployment.position.y;a.targetPositionY=-a.pivotY*scale;
    a.elapsed=0;a.duration=clamp(duration,0,4);
    if(a.duration===0){a.deployment.scale.y=scale;a.deployment.position.y=a.targetPositionY;}
   }
   return true;
  },
  animateShip(dt=.016,weather={}){
    const delta=clamp(dt,0,.05);state.time+=delta;
    const gustEnvelope=weather.gusts===true?(0.72+0.28*(0.5+0.5*Math.sin(state.time*1.25))):1;
    const targetWind=weather.enabled===true?clamp((weather.speedKnots??0)/30,0,1)*gustEnvelope:0;
    state.windBlend+=(targetWind-state.windBlend)*(1-Math.exp(-delta*2.8));
    const direction=((Number(weather.directionDeg??90)%360)+360)%360*Math.PI/180;
    const transverse=Math.sin(direction),leeward=transverse>1e-4?-1:transverse< -1e-4?1:1;
    const aftness=(1-Math.cos(direction))*.5,trimAngle=leeward*(.08+.82*aftness)*state.windBlend;
    for(const mast of mastParts){
     const id=mast.userData.mastControl.mastId;
     const control=mast.userData.mastControl;
     const maxHeel=THREE.MathUtils.degToRad(control.windHeelMaxDeg??2.5);
     const maxRake=THREE.MathUtils.degToRad(control.windRakeMaxDeg??1.2);
     // Wind-from starboard heels the masthead to port; bow wind adds a
     // smaller aft rake. The mast-step motion is angle-limited and reversible.
     setRuntimeRotation(mast.name,{
      rx:(state.mastLean[id]||0)+Math.cos(direction)*state.windBlend*maxRake,
      rz:Math.sin(direction)*state.windBlend*maxHeel
     });
    }
    // Enforce both physical endpoints in their owning frames. The masthead
    // follows the mast pivot; the foot follows the hull fitting. Re-evaluate
    // local targets so saved/live component transforms cannot drag a stay away
    // from either attachment. Always deform from the immutable rest array.
    root.updateMatrixWorld(true);
    for(const {pivot,stays} of mastStaySets.values()){
     for(const {mesh,mast,data} of stays){
      const attribute=mesh.geometry.attributes.position;
      const stride=data.radialSegments+1;
      if(!attribute||attribute.count!==(data.segments+1)*stride)continue;
      const mastHeadWorld=pivot.localToWorld(new THREE.Vector3(...data.startPivotLocal));
      const fixedWorld=hullPart.localToWorld(new THREE.Vector3(...data.fixedHullLocal));
      const mastHeadLocal=mesh.worldToLocal(mastHeadWorld.clone());
      const fixedLocal=mesh.worldToLocal(fixedWorld.clone());
      if(mastHeadLocal.distanceToSquared(data.lastMastHeadLocal)<1e-12&&
         fixedLocal.distanceToSquared(data.lastFixedLocal)<1e-12)continue;
      const startCorrection=mastHeadLocal.sub(data.baseStartLocal);
      const endCorrection=fixedLocal.sub(data.baseFixedLocal);
      const positions=attribute.array,rest=data.restPositions;
      for(let ring=0;ring<=data.segments;ring++){
       const t=ring/data.segments,from=1-t,offset=ring*stride*3;
       for(let radial=0;radial<=data.radialSegments;radial++){
        const index=offset+radial*3;
        positions[index]=rest[index]+startCorrection.x*from+endCorrection.x*t;
        positions[index+1]=rest[index+1]+startCorrection.y*from+endCorrection.y*t;
        positions[index+2]=rest[index+2]+startCorrection.z*from+endCorrection.z*t;
       }
      }
      attribute.needsUpdate=true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
      data.lastMastHeadLocal.copy(mastHeadLocal.add(data.baseStartLocal));
      data.lastFixedLocal.copy(fixedLocal.add(data.baseFixedLocal));
     }
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
      const data=animation.sailCloth,attribute=animation.mesh.geometry.attributes.position;
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
      const eased=t*t*(3-2*t);
      animation.deployment.scale.y=THREE.MathUtils.lerp(animation.from,animation.target,eased);
      animation.deployment.position.y=THREE.MathUtils.lerp(animation.fromPositionY,animation.targetPositionY,eased);
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
 api.finalizeMastStays();
 api.captureResetBaseline();
 return root;
}
export function shipModelSummary(v){
 const d=v?.design||v;if(!d?.id)return null;
 return {id:d.id,label:d.label,dimensions:d.hullLength.toFixed(1)+' × '+d.beam.toFixed(1)+' m',ratio:d.lengthBeamRatio.toFixed(2),rig:d.rig,period:d.era,hullProfile:d.hullProfile,hullFormNote:d.hullFormNote,modelScaleNote:d.modelScaleNote,reference:d.reference,sources:(d.sources||[]).map(s=>({...s})),mastCount:d.mastCount,partCount:d.partNames.length,parts:d.partNames};
}
export function disposeShipModel(group){if(!group)return;for(const g of new Set(group.userData.ownedGeometries||[]))g.dispose();for(const m of new Set(group.userData.ownedMaterials||[]))m.dispose();group.parent?.remove(group);}
