async function bootShipStudio(){
  const viewport=document.querySelector('#viewport');
  const selector=document.querySelector('#ship-select');
  const partSelector=document.querySelector('#part-select');
  const status=document.querySelector('#status');
  if(!viewport||!selector||!partSelector||!status){
    throw new Error('Ship Design Studio HTML is incomplete. Update ForTests/index.html and reload.');
  }
  try{
    // Load modules dynamically so browser import failures can be displayed in the editor.
    const THREE=await import('three');
    const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
    const {TransformControls}=await import('three/addons/controls/TransformControls.js');
    const overrideResponse=await fetch('./design-overrides.json',{cache:'no-store'});
    if(!overrideResponse.ok) throw new Error('Could not read design-overrides.json (HTTP '+overrideResponse.status+').');
    const DESIGN_OVERRIDES=await overrideResponse.json();
    const shipModule=await import('./ships/index.js?v=0.8.8-modular-fleet-16');
    const {SHIP_DESIGNS,getShipDesign,setShipDesignOverrides,SHIP_DESIGN_MODULE_VERSION,
      getShipStructureBlueprint,setShipStructureOverrides,SHIP_STRUCTURE_MODULE_VERSION,
      createShipModel,disposeShipModel,SHIP_MODEL_MODULE_VERSION}=shipModule;
    const apiProblems=[];
    if(typeof setShipDesignOverrides!=='function')apiProblems.push('ships/index.js: setShipDesignOverrides');
    if(typeof getShipDesign!=='function')apiProblems.push('ships/index.js: getShipDesign');
    if(typeof setShipStructureOverrides!=='function')apiProblems.push('ships/index.js: setShipStructureOverrides');
    if(typeof getShipStructureBlueprint!=='function')apiProblems.push('ships/index.js: getShipStructureBlueprint');
    if(typeof createShipModel!=='function')apiProblems.push('ships/index.js: createShipModel');
    if(typeof disposeShipModel!=='function')apiProblems.push('ships/shared/ship-editor-kit.js: disposeShipModel');
    if(SHIP_DESIGN_MODULE_VERSION!=='0.8.8')apiProblems.push('ships/index.js design API version '+String(SHIP_DESIGN_MODULE_VERSION));
    if(SHIP_STRUCTURE_MODULE_VERSION!=='0.8.8')apiProblems.push('ships/index.js structure API version '+String(SHIP_STRUCTURE_MODULE_VERSION));
    if(SHIP_MODEL_MODULE_VERSION!=='0.8.8')apiProblems.push('ships/shared/ship-editor-kit.js version '+String(SHIP_MODEL_MODULE_VERSION));
    if(Object.keys(SHIP_DESIGNS||{}).length!==16)apiProblems.push('ship catalogue count '+Object.keys(SHIP_DESIGNS||{}).length);
    if(apiProblems.length){
      throw new Error('Ship module mismatch: '+apiProblems.join('; ')+'. Pull the latest ForTests files, restart Vite, then hard-refresh the preview.');
    }
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101a22);
scene.fog=new THREE.Fog(0x101a22,120,900);
const camera=new THREE.PerspectiveCamera(42,1,.1,4000);

for(const [id,d] of Object.entries(SHIP_DESIGNS)){
  // The HTML contains a static fallback list so vessel choices remain visible
  // even if a browser fails while loading the editor modules.
  if(selector.querySelector('option[value="'+CSS.escape(id)+'"]')) continue;
  const option=document.createElement('option');
  option.value=id;
  option.textContent=d.label;
  selector.appendChild(option);
}
// Optional direct-review URL: ?ship=barque&camera=side&part=hull
const reviewParams=new URLSearchParams(window.location.search);
const reviewShipId=reviewParams.get('ship')||'';
const reviewPartName=reviewParams.get('part')||'';
const reviewCamera=reviewParams.get('camera')||'';
if(Object.hasOwn(SHIP_DESIGNS,reviewShipId))selector.value=reviewShipId;

const compareSelector=document.querySelector('#compare-select');
for(const [id,design] of Object.entries(SHIP_DESIGNS)){
  const option=document.createElement('option');
  option.value=id;option.textContent=design.label;
  compareSelector?.appendChild(option);
}
if(compareSelector&&Object.hasOwn(SHIP_DESIGNS,'galleon'))compareSelector.value='galleon';
setStatus('Ship list ready · initializing 3D graphics…');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.localClippingEnabled=true;
viewport.appendChild(renderer.domElement);

const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;
orbit.dampingFactor=.065;
orbit.maxPolarAngle=Math.PI*.49;
orbit.minDistance=3;
orbit.maxDistance=900;

const gizmo=new TransformControls(camera,renderer.domElement);
gizmo.setSpace('local');
scene.add(gizmo.getHelper());
gizmo.addEventListener('dragging-changed',event=>{orbit.enabled=!event.value;});
gizmo.addEventListener('objectChange',refreshTransformFields);

scene.add(new THREE.HemisphereLight(0xc9e0e7,0x463d32,2.1));
const key=new THREE.DirectionalLight(0xffe5bf,3);
key.position.set(-55,90,-35);
key.castShadow=true;
key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-100;
key.shadow.camera.right=100;
key.shadow.camera.top=100;
key.shadow.camera.bottom=-100;
scene.add(key);
const fill=new THREE.DirectionalLight(0x9ac6db,1.2);
fill.position.set(50,35,65);
scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshStandardMaterial({color:0x203943,roughness:.88,metalness:.04}));
ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;
scene.add(ground);
const grid=new THREE.GridHelper(500,50,0x58717a,0x324b55);
grid.material.transparent=true;
grid.material.opacity=.28;
scene.add(grid);
const sectionPlane=new THREE.Plane(new THREE.Vector3(1,0,0),0);
const sectionHelper=new THREE.PlaneHelper(sectionPlane,80,0xd8bf8e);
sectionHelper.visible=false;
scene.add(sectionHelper);

let overrideConfig=JSON.parse(JSON.stringify(DESIGN_OVERRIDES||{}));
function getConfig(id){if(!overrideConfig[id])overrideConfig[id]={};return overrideConfig[id];}
function applyOverrides(){
  // Explicitly clear runtime overrides for untouched/reset vessels as well.
  for(const id of Object.keys(SHIP_DESIGNS)){
    const config=overrideConfig[id]||{};
    setShipDesignOverrides(id,config.design||{});
    setShipStructureOverrides(id,config.structure||{});
  }
}
applyOverrides();
let ship=null;
let selectedName='';
let activeShipId=selector.value||Object.keys(SHIP_DESIGNS)[0];
let historyEntries=[];
let historyCursor=0;
let dragSnapshot=null;
let snapEnabled=false;
let wireframeEnabled=false;
let gridEnabled=true;
let shadowsEnabled=true;
let measureEnabled=false;
let measurementPoints=[];
let measurementLine=null;
let sectionEnabled=false;
const raycaster=new THREE.Raycaster();
const rayPointer=new THREE.Vector2();
const identity={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1};
const DESIGN_FIELDS=[
  {path:'design.hullLength',label:'Hull length (m)',min:2,max:150,step:.1},
  {path:'design.beam',label:'Maximum beam (m)',min:.5,max:40,step:.1},
  {path:'design.draft',label:'Loaded draft (m)',min:.2,max:20,step:.1},
  {path:'design.freeboard',label:'Freeboard (m)',min:.2,max:12,step:.05},
  {path:'design.hull.fullness',label:'Midbody fullness',min:.35,max:1.1,step:.01},
  {path:'design.hull.entry',label:'Bow entry fullness',min:.25,max:1.1,step:.01},
  {path:'design.hull.sternWidth',label:'Stern width ratio',min:.02,max:.65,step:.01},
  {path:'design.hull.tumblehome',label:'Hull tumblehome',min:0,max:.45,step:.01},
  {path:'design.hull.sheer',label:'Hull sheer',min:0,max:.5,step:.01},
  {path:'design.hull.bowRise',label:'Bow rise',min:0,max:.8,step:.01},
  {path:'design.hull.sternRise',label:'Stern rise',min:0,max:.8,step:.01},
  {path:'design.hull.keelDepth',label:'Keel depth factor',min:.005,max:.3,step:.005},
  {path:'design.hull.deckCamber',label:'Deck camber',min:0,max:.4,step:.01},
  {path:'structure.beamStation',label:'Maximum beam station',min:.35,max:.68,step:.01},
  {path:'structure.forebody',label:'Forebody fullness',min:.45,max:1.65,step:.01},
  {path:'structure.aftbody',label:'Aftbody fullness',min:.45,max:1.65,step:.01},
  {path:'structure.foreTip',label:'Bow tip fullness',min:.001,max:.15,step:.001},
  {path:'structure.aftTip',label:'Stern tip fullness',min:.001,max:.2,step:.001},
  {path:'structure.bottomFlat',label:'Bottom flatness',min:.05,max:.7,step:.01},
  {path:'structure.bilge',label:'Bilge fullness',min:.02,max:.5,step:.01},
  {path:'structure.flare',label:'Hull flare',min:0,max:.35,step:.01},
  {path:'structure.tumble',label:'Upper tumblehome',min:0,max:.45,step:.01},
  {path:'structure.sheer',label:'Sheer multiplier',min:.4,max:1.8,step:.01},
  {path:'structure.lowerMastRatio',label:'Lower mast proportion',min:.45,max:.8,step:.01},
  {path:'structure.shroudPairs',label:'Shroud pairs',min:0,max:8,step:1},
  {path:'structure.ratlines',label:'Ratline count',min:0,max:18,step:1},
  {path:'structure.yardSpread',label:'Yard spread ratio',min:.6,max:1.5,step:.01}
];
const TRANSFORM_FIELDS=[
  ['x','X','position'],['y','Y','position'],['z','Z','position'],
  ['rx','X°','rotation'],['ry','Y°','rotation'],['rz','Z°','rotation'],
  ['sx','X','scale'],['sy','Y','scale'],['sz','Z','scale']
];
function clone(value){return JSON.parse(JSON.stringify(value));}
function getNested(object,path){return path.split('.').reduce((value,key)=>value?.[key],object);}
function setNested(object,path,value){
  const keys=path.split('.');
  let target=object;
  for(const key of keys.slice(0,-1))target[key]||={};
  target[keys[keys.length-1]]=value;
}
function setStatus(message,error=false){
  status.textContent=message;
  status.style.color=error?'#e5a29b':'#a9caa6';
}
function fit(object){
  object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(object);
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  const diameter=Math.max(size.x,size.y,size.z,1);
  const distance=diameter*1.7;
  camera.position.set(center.x+distance*.88,center.y+distance*.62,center.z+distance*1.15);
  camera.near=Math.max(.05,diameter/1000);
  camera.far=Math.max(2000,diameter*30);
  camera.updateProjectionMatrix();
  orbit.target.copy(center);
  orbit.minDistance=Math.max(1,diameter*.12);
  orbit.maxDistance=diameter*8;
  orbit.update();
  const y=box.min.y-Math.max(.25,diameter*.008);
  ground.position.y=y;grid.position.y=y+.015;
}
function syncCurrentShipState(){
  if(!ship||!activeShipId)return;
  const config=getConfig(activeShipId);
  const state=ship.userData.getShipState();
  const hasState=Object.keys(state.partTransforms||{}).length>0
    ||Object.keys(state.hiddenParts||{}).length>0
    ||(state.unlinkedParts||[]).length>0
    ||Math.abs(state.rudderAngle||0)>1e-8
    ||Object.keys(state.sailTrim||{}).length>0
    ||Object.keys(state.sailDeployment||{}).length>0
    ||Object.keys(state.mastLean||{}).length>0;
  if(hasState)config.partState=clone(state);
  else delete config.partState;
  if(state.partTransforms&&Object.keys(state.partTransforms).length)config.componentTransforms=clone(state.partTransforms);
  else delete config.componentTransforms;
  if(Object.keys(config).length===0)delete overrideConfig[activeShipId];
}
function captureDocumentSnapshot(){
  syncCurrentShipState();
  return {activeShip:activeShipId,ships:clone(overrideConfig)};
}
function refreshHistory(){
  document.querySelector('#undo').disabled=historyCursor<=0;
  document.querySelector('#redo').disabled=historyCursor>=historyEntries.length;
  const count=document.querySelector('#history-count');
  if(count)count.textContent=historyCursor+' / '+historyEntries.length;
}
function commitHistory(before,label='Edit'){
  const after=captureDocumentSnapshot();
  if(JSON.stringify(before)===JSON.stringify(after)){refreshHistory();return false;}
  historyEntries.splice(historyCursor);
  historyEntries.push({before,after,label});
  if(historyEntries.length>100)historyEntries.shift();
  historyCursor=historyEntries.length;
  refreshHistory();
  setStatus('Recorded: '+label+'.');
  return true;
}
function restoreDocumentSnapshot(snapshot){
  overrideConfig=clone(snapshot.ships||{});
  applyOverrides();
  const nextId=Object.hasOwn(SHIP_DESIGNS,snapshot.activeShip)?snapshot.activeShip:Object.keys(SHIP_DESIGNS)[0];
  selector.value=nextId;
  loadShip(nextId,selectedName,false,true);
  refreshHistory();
}
function historyAction(action){
  if(action==='undo'){
    if(historyCursor<=0)return;
    const entry=historyEntries[--historyCursor];
    restoreDocumentSnapshot(entry.before);
    setStatus('Undone: '+entry.label);
  }else{
    if(historyCursor>=historyEntries.length)return;
    const entry=historyEntries[historyCursor++];
    restoreDocumentSnapshot(entry.after);
    setStatus('Redone: '+entry.label);
  }
  refreshHistory();
}
function getSelectedTransform(){
  return ship&&selectedName?(ship.userData.getPartTransform(selectedName)||identity):identity;
}
function refreshTransformFields(){
  if(!ship||!selectedName)return;
  const t=getSelectedTransform();
  const values={...t,rx:THREE.MathUtils.radToDeg(t.rx),ry:THREE.MathUtils.radToDeg(t.ry),rz:THREE.MathUtils.radToDeg(t.rz)};
  for(const [id] of TRANSFORM_FIELDS){
    const input=document.querySelector('[data-transform="'+id+'"]');
    if(input)input.value=Number(values[id]).toFixed(id.startsWith('r')?1:3);
  }
}
function readTransformFields(){
  const value=id=>Number(document.querySelector('[data-transform="'+id+'"]')?.value??0);
  return {x:value('x'),y:value('y'),z:value('z'),
    rx:THREE.MathUtils.degToRad(value('rx')),ry:THREE.MathUtils.degToRad(value('ry')),rz:THREE.MathUtils.degToRad(value('rz')),
    sx:value('sx'),sy:value('sy'),sz:value('sz')};
}
function commitManualTransform(){
  if(!ship||!selectedName)return;
  const before=captureDocumentSnapshot();
  ship.userData.setPartTransform(selectedName,readTransformFields());
  syncCurrentShipState();
  commitHistory(before,'Transform '+selectedName);
  refreshTransformFields();
}
function refreshPartInspector(){
  const part=ship&&selectedName?ship.userData.getPart(selectedName):null;
  const set=(id,value)=>{const node=document.querySelector('#'+id);if(node)node.textContent=value;};
  if(!part){set('part-size','—');set('part-parent','—');set('part-meshes','—');set('part-materials','—');return;}
  part.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(part);
  const size=bounds.isEmpty()?new THREE.Vector3():bounds.getSize(new THREE.Vector3());
  const meshes=[];const materials=new Set();
  part.traverse(object=>{
    if(!object.isMesh)return;
    meshes.push(object);
    for(const material of (Array.isArray(object.material)?object.material:[object.material])){
      if(material)materials.add(material.name||material.type||'Material');
    }
  });
  set('part-size',[size.x,size.y,size.z].map(value=>value.toFixed(2)).join(' × '));
  set('part-parent',part.parent?.name||'Ship root');
  set('part-meshes',String(meshes.length));
  set('part-materials',String(materials.size));
}
function selectPart(name){
  if(!ship)return;
  const part=ship.userData.getPart(name);
  if(!part){selectedName='';gizmo.detach();document.querySelector('#part-name').textContent='No component selected';refreshPartInspector();refreshSelectionTools();return;}
  selectedName=name;partSelector.value=name;
  document.querySelector('#part-name').textContent=name;
  gizmo.attach(part);
  refreshTransformFields();
  refreshSelectionTools();
  refreshPartInspector();
}
function populatePartList(){
  const filter=(document.querySelector('#part-search')?.value||'').trim().toLowerCase();
  partSelector.replaceChildren();
  for(const name of ship.userData.partNames){
    if(filter&&!name.toLowerCase().includes(filter))continue;
    const option=document.createElement('option');
    option.value=name;option.textContent=name;partSelector.appendChild(option);
  }
  if(selectedName&&Array.from(partSelector.options).some(option=>option.value===selectedName))partSelector.value=selectedName;
}
function refreshSelectionTools(){
  const part=ship&&selectedName?ship.userData.getPart(selectedName):null;
  const toggle=document.querySelector('#toggle-visibility');
  if(toggle)toggle.textContent=part&&!part.visible?'Show selected':'Hide selected';
  const detached=part?.parent?.name==='unlinked-parts';
  const detach=document.querySelector('#detach-part');
  const relink=document.querySelector('#relink-part');
  if(detach)detach.disabled=!part||detached;
  if(relink)relink.disabled=!part||!detached;
}
function detachSelectedPart(){
  if(!ship||!selectedName)return;
  const before=captureDocumentSnapshot();
  if(!ship.userData.detachPart(selectedName)){setStatus('This component is already detached.',true);return;}
  syncCurrentShipState();
  commitHistory(before,'Detach '+selectedName);
  refreshSelectionTools();
}
function relinkSelectedPart(){
  if(!ship||!selectedName)return;
  const before=captureDocumentSnapshot();
  if(!ship.userData.relinkPart(selectedName)){setStatus('This component is already linked.',true);return;}
  syncCurrentShipState();
  commitHistory(before,'Relink '+selectedName);
  refreshSelectionTools();
}
function applyWireframe(){
  if(!ship)return;
  ship.traverse(object=>{
    if(!object.isMesh)return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials)if(material&&'wireframe'in material)material.wireframe=wireframeEnabled;
  });
}
function toggleWireframe(){
  wireframeEnabled=!wireframeEnabled;
  applyWireframe();
  document.querySelector('#wireframe-toggle').textContent='Wireframe '+(wireframeEnabled?'on':'off');
}
function toggleGrid(){
  gridEnabled=!gridEnabled;
  grid.visible=gridEnabled;
  document.querySelector('#grid-toggle').textContent='Grid '+(gridEnabled?'on':'off');
}
function toggleShadows(){
  shadowsEnabled=!shadowsEnabled;
  renderer.shadowMap.enabled=shadowsEnabled;
  key.castShadow=shadowsEnabled;
  renderer.shadowMap.needsUpdate=true;
  document.querySelector('#shadows-toggle').textContent='Shadows '+(shadowsEnabled?'on':'off');
}
function frameObject(object){
  if(!object)return;
  object.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(object);
  if(bounds.isEmpty())return;
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const distance=Math.max(size.length()*1.7,2);
  const direction=camera.position.clone().sub(orbit.target);
  if(direction.lengthSq()<1e-6)direction.set(1,.65,1);
  direction.normalize();
  orbit.target.copy(center);
  camera.position.copy(center).addScaledVector(direction,distance);
  camera.near=Math.max(.05,distance/1000);
  camera.far=Math.max(2000,distance*30);
  camera.updateProjectionMatrix();
  orbit.update();
}
function setCameraPreset(name){
  if(!ship)return;
  ship.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(ship);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const distance=Math.max(size.length()*1.35,5);
  const vectors={
    top:new THREE.Vector3(0,1,0),
    side:new THREE.Vector3(1,.24,0),
    bow:new THREE.Vector3(.12,.42,-1),
    stern:new THREE.Vector3(.12,.42,1)
  };
  const direction=(vectors[name]||vectors.bow).normalize();
  camera.up.set(0,1,0);
  camera.position.copy(center).addScaledVector(direction,distance);
  camera.lookAt(center);
  orbit.target.copy(center);
  orbit.update();
}
function setPartVisibility(name,visible){
  if(!ship||!ship.userData.getPart(name))return;
  const before=captureDocumentSnapshot();
  ship.userData.setPartVisible(name,visible);
  syncCurrentShipState();
  commitHistory(before,(visible?'Show ':'Hide ')+name);
  refreshSelectionTools();
}
function resetAllComponents(){
  if(!ship)return;
  const before=captureDocumentSnapshot();
  for(const name of ship.userData.partNames)ship.userData.resetPartTransform(name);
  syncCurrentShipState();
  commitHistory(before,'Reset all components');
  refreshTransformFields();
  refreshSelectionTools();
}
function isolateSelected(){
  if(!ship||!selectedName)return;
  const before=captureDocumentSnapshot();
  for(const name of ship.userData.partNames)ship.userData.setPartVisible(name,name===selectedName);
  syncCurrentShipState();
  commitHistory(before,'Isolate '+selectedName);
  refreshSelectionTools();
}
function showAllComponents(){
  if(!ship)return;
  const before=captureDocumentSnapshot();
  for(const name of ship.userData.partNames)ship.userData.setPartVisible(name,true);
  syncCurrentShipState();
  commitHistory(before,'Show all components');
  refreshSelectionTools();
}
function resetVesselDesign(){
  if(!activeShipId)return;
  const before=captureDocumentSnapshot();
  const label=getShipDesign(activeShipId)?.label||activeShipId;
  delete overrideConfig[activeShipId];
  applyOverrides();
  loadShip(activeShipId,selectedName,false,true);
  commitHistory(before,'Reset vessel '+label+' to original design');
}
function toggleSnap(){
  snapEnabled=!snapEnabled;
  gizmo.setTranslationSnap(snapEnabled?.25:null);
  gizmo.setRotationSnap(snapEnabled?THREE.MathUtils.degToRad(15):null);
  gizmo.setScaleSnap(snapEnabled?.1:null);
  document.querySelector('#snap-toggle').textContent=snapEnabled?'Snapping on':'Snapping off';
}
function toggleSpace(){
  const world=gizmo.space!=='world';
  gizmo.setSpace(world?'world':'local');
  document.querySelector('#space-toggle').textContent=world?'World space':'Local space';
}
function renderTransformInputs(){
  for(const [id,label,kind] of TRANSFORM_FIELDS){
    const container=document.querySelector('#'+kind+'-fields');
    const wrapper=document.createElement('div');wrapper.className='field';
    const title=document.createElement('label');title.textContent=label;
    const input=document.createElement('input');input.type='number';
    input.step=kind==='rotation'?'1':kind==='scale'?'.05':'.01';
    input.value=kind==='scale'?'1':'0';input.dataset.transform=id;
    input.addEventListener('change',commitManualTransform);
    wrapper.append(title,input);container.appendChild(wrapper);
  }
}
function renderDesignInputs(){
  const container=document.querySelector('#design-controls');
  container.replaceChildren();
  const design=getShipDesign(selector.value);
  const structure=getShipStructureBlueprint(selector.value);
  for(const field of DESIGN_FIELDS){
    const root=field.path.startsWith('design.')?design:structure;
    const localPath=field.path.replace(/^design\./,'');
    const value=getNested(root,localPath);
    const wrapper=document.createElement('div');wrapper.className='field';
    const label=document.createElement('label');label.textContent=field.label;
    const input=document.createElement('input');input.type='number';
    input.min=String(field.min);input.max=String(field.max);input.step=String(field.step);
    input.value=Number(value??0);input.dataset.designPath=field.path;
    input.addEventListener('change',()=>{
      const next=Number(input.value);
      if(!Number.isFinite(next))return;
      const before=captureDocumentSnapshot();
      const config=getConfig(activeShipId);
      const target=field.path.startsWith('design.')?(config.design||={}):(config.structure||={});
      setNested(target,field.path.replace(/^(design|structure)\./,''),next);
      setShipDesignOverrides(activeShipId,config.design||{});
      setShipStructureOverrides(activeShipId,config.structure||{});
      loadShip(activeShipId,selectedName,false);
      commitHistory(before,'Change '+field.label);
      renderDesignInputs();
      setStatus('Updated '+field.label+'. Save to keep the change.');
    });
    wrapper.append(label,input);container.appendChild(wrapper);
  }
}
function updateComparison(){
  const target=compareSelector?.value;
  const output=document.querySelector('#compare-summary');
  if(!output)return;
  if(!target||target===activeShipId){output.textContent='Choose a different vessel to compare principal dimensions.';return;}
  const current=getShipDesign(activeShipId),other=getShipDesign(target);
  if(!current||!other){output.textContent='Comparison data is unavailable.';return;}
  const delta=(value)=>value>0?'+':'−';
  const format=(value)=>Math.abs(value).toFixed(2)+' m';
  const rows=[
    ['Length',current.hullLength,other.hullLength],
    ['Beam',current.beam,other.beam],
    ['Draft',current.draft,other.draft],
  ];
  output.textContent=rows.map(([label,a,b])=>label+': '+a.toFixed(2)+' m vs '+b.toFixed(2)+' m ('+delta(b-a)+format(b-a)+')').join(' · ')
    +' · Masts: '+current.masts.length+' vs '+other.masts.length;
}
function updateSectionRange(){
  if(!ship)return;
  ship.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(ship);
  const slider=document.querySelector('#section-slider');
  if(bounds.isEmpty()||!slider)return;
  const min=bounds.min.x,max=bounds.max.x;
  slider.min=String(min.toFixed(2));slider.max=String(max.toFixed(2));
  slider.step=String(Math.max(.05,(max-min)/500));
  slider.value=String(((min+max)*.5).toFixed(2));
  updateSectionPlane();
  sectionHelper.size=Math.max(12,bounds.getSize(new THREE.Vector3()).length()*.78);
  sectionHelper.updateMatrixWorld(true);
}
function updateSectionPlane(){
  const slider=document.querySelector('#section-slider');
  if(!slider)return;
  const value=Number(slider.value)||0;
  sectionPlane.constant=-value;
  sectionHelper.visible=sectionEnabled;
  const readout=document.querySelector('#section-value');
  if(readout)readout.textContent=value.toFixed(2)+' units';
  if(ship){ship.traverse(object=>{
    if(!object.isMesh)return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials){
      if(!material)continue;
      material.clippingPlanes=sectionEnabled?[sectionPlane]:[];
      material.needsUpdate=true;
    }
  });}
}
function toggleSection(){
  sectionEnabled=!sectionEnabled;
  const button=document.querySelector('#section-toggle');
  const slider=document.querySelector('#section-slider');
  if(button){button.textContent='Section view '+(sectionEnabled?'on':'off');button.classList.toggle('active',sectionEnabled);}
  if(slider)slider.disabled=!sectionEnabled;
  updateSectionPlane();
  setStatus(sectionEnabled?'Hull section view enabled. Move the slider to inspect the interior.':'Hull section view disabled.');
}
function updateMeasurementReadout(){
  const strong=document.querySelector('#measurement-value strong');
  if(!strong)return;
  if(measurementPoints.length<2){strong.textContent=measurementPoints.length?'Select the second point…':'—';return;}
  strong.textContent=measurementPoints[0].distanceTo(measurementPoints[1]).toFixed(2)+' game units';
}
function clearMeasurement(){
  if(measurementLine){scene.remove(measurementLine);measurementLine.geometry.dispose();measurementLine.material.dispose();measurementLine=null;}
  measurementPoints=[];updateMeasurementReadout();
  const button=document.querySelector('#measure-toggle');
  if(button)button.classList.toggle('active',measureEnabled);
  const readout=document.querySelector('#viewport-readout');
  if(readout)readout.textContent='Measurement cleared.';
}
function toggleMeasure(){
  measureEnabled=!measureEnabled;
  const button=document.querySelector('#measure-toggle');
  if(button){button.classList.toggle('active',measureEnabled);button.textContent=measureEnabled?'Measuring · click 2 points':'Measure points';}
  if(measureEnabled){clearMeasurement();measureEnabled=true;button.classList.add('active');button.textContent='Measuring · click 2 points';setStatus('Measurement mode: click two points on the visible ship.');}
  else setStatus('Measurement mode disabled.');
}
function addMeasurementPoint(point){
  if(measurementPoints.length>=2)clearMeasurement();
  measurementPoints.push(point.clone());
  if(measurementPoints.length===2){
    const geometry=new THREE.BufferGeometry().setFromPoints(measurementPoints);
    const material=new THREE.LineBasicMaterial({color:0xf0d39b,depthTest:false,transparent:true,opacity:.98});
    measurementLine=new THREE.Line(geometry,material);measurementLine.renderOrder=1000;scene.add(measurementLine);
    updateMeasurementReadout();
    const distance=measurementPoints[0].distanceTo(measurementPoints[1]);
    document.querySelector('#viewport-readout').textContent='Measured span · '+distance.toFixed(2)+' game units';
    setStatus('Measured '+distance.toFixed(2)+' game units. Click again to start another measurement.');
  }else{
    updateMeasurementReadout();document.querySelector('#viewport-readout').textContent='Point 1 recorded · choose a second point.';
  }
}
function updateInfo(design){
  document.querySelector('#ship-caption').textContent=design.label;
  document.querySelector('#length').textContent=design.hullLength.toFixed(2)+' m';
  document.querySelector('#beam').textContent=design.beam.toFixed(2)+' m';
  document.querySelector('#draft').textContent=design.draft.toFixed(2)+' m';
  document.querySelector('#masts').textContent=design.masts.length;
  document.querySelector('#parts').textContent=ship.userData.partNames.length;
  document.querySelector('#description').textContent=design.hullProfile+' '+(design.reference||'');
  updateComparison();
}
function loadShip(type,preferredPart='',reframe=true,skipSync=false){
  if(ship){if(!skipSync)syncCurrentShipState();gizmo.detach();disposeShipModel(ship);ship=null;}
  activeShipId=type;
  const design=getShipDesign(type);
  if(!design){setStatus('Unknown vessel design.',true);return;}
  try{
    const config=getConfig(type);
    const savedState=config.partState||{partTransforms:config.componentTransforms||{}};
    ship=createShipModel(type,savedState.partTransforms||config.componentTransforms||{},savedState);
    scene.add(ship);
    applyWireframe();
    if(reframe)fit(ship);
    updateInfo(design);
    populatePartList();
    updateSectionRange();
    const chosen=preferredPart&&ship.userData.getPart(preferredPart)?preferredPart:(ship.userData.partNames.includes('hull')?'hull':ship.userData.partNames[0]);
    selectPart(chosen);
    renderDesignInputs();
    setStatus('Loaded '+design.label+' · '+ship.userData.partNames.length+' editable components.');
  }catch(error){
    setStatus('Could not build ship: '+(error?.message||String(error)),true);
    console.error(error);
  }
}
function changeMode(mode){
  gizmo.setMode(mode);
  document.querySelectorAll('[data-mode]').forEach(button=>button.classList.toggle('active',button.dataset.mode===mode));
  const readout=document.querySelector('#viewport-readout');
  if(readout)readout.textContent='Transform tool · '+mode.toUpperCase();
}
function buildExport(){
  syncCurrentShipState();
  return {format:'verdant-reach-ship-editor',version:2,savedAt:new Date().toISOString(),ships:overrideConfig};
}
async function saveDesign(){
  try{
    const response=await fetch('/__ship-editor/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildExport().ships)});
    if(!response.ok)throw new Error('Local save endpoint returned '+response.status);
    const result=await response.json();
    setStatus('Saved to ForTests/design-overrides.json · '+result.ships+' vessel configuration(s).');
  }catch(error){setStatus('Local save unavailable. Use Export JSON instead. '+error.message,true);}
}
function exportDesign(){
  const blob=new Blob([JSON.stringify(buildExport(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='verdant-reach-ship-designs.json';link.click();
  URL.revokeObjectURL(url);
  setStatus('Exported design configurations as JSON.');
}

renderTransformInputs();
selector.addEventListener('change',()=>{
  syncCurrentShipState();
  loadShip(selector.value);
  refreshHistory();
});
partSelector.addEventListener('change',()=>selectPart(partSelector.value));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
document.querySelector('#undo').addEventListener('click',()=>historyAction('undo'));
document.querySelector('#redo').addEventListener('click',()=>historyAction('redo'));
document.querySelector('#reset-camera').addEventListener('click',()=>{if(ship)fit(ship);});
document.querySelector('#reset-part').addEventListener('click',()=>{
  if(!ship||!selectedName)return;
  const before=captureDocumentSnapshot();
  ship.userData.resetPartTransform(selectedName);
  syncCurrentShipState();
  commitHistory(before,'Reset component '+selectedName);
  refreshTransformFields();
  refreshSelectionTools();
});
document.querySelector('#reset-all-parts').addEventListener('click',resetAllComponents);
document.querySelector('#reset-vessel').addEventListener('click',resetVesselDesign);
document.querySelector('#detach-part').addEventListener('click',detachSelectedPart);
document.querySelector('#relink-part').addEventListener('click',relinkSelectedPart);
document.querySelector('#wireframe-toggle').addEventListener('click',toggleWireframe);
document.querySelector('#grid-toggle').addEventListener('click',toggleGrid);
document.querySelector('#shadows-toggle').addEventListener('click',toggleShadows);
document.querySelector('#frame-selected').addEventListener('click',()=>{
  if(ship&&selectedName)frameObject(ship.userData.getPart(selectedName));
});
document.querySelector('#toggle-visibility').addEventListener('click',()=>{
  if(!ship||!selectedName)return;
  const part=ship.userData.getPart(selectedName);
  setPartVisibility(selectedName,!part.visible);
});
document.querySelector('#isolate-selected').addEventListener('click',isolateSelected);
document.querySelector('#show-all-parts').addEventListener('click',showAllComponents);
document.querySelector('#part-search').addEventListener('input',populatePartList);
document.querySelector('#space-toggle').addEventListener('click',toggleSpace);
document.querySelector('#snap-toggle').addEventListener('click',toggleSnap);
document.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>setCameraPreset(button.dataset.camera)));
document.querySelector('#save-design').addEventListener('click',saveDesign);
document.querySelector('#export-design').addEventListener('click',exportDesign);
document.querySelector('#export-design-secondary')?.addEventListener('click',exportDesign);
document.querySelector('#compare-select')?.addEventListener('change',updateComparison);
document.querySelector('#measure-toggle')?.addEventListener('click',toggleMeasure);
document.querySelector('#clear-measurement')?.addEventListener('click',clearMeasurement);
document.querySelector('#section-toggle')?.addEventListener('click',toggleSection);
document.querySelector('#section-slider')?.addEventListener('input',updateSectionPlane);
document.querySelector('#viewport-fullscreen')?.addEventListener('click',async()=>{
  const target=document.querySelector('.viewport-wrap');
  try{if(!document.fullscreenElement)await target.requestFullscreen();else await document.exitFullscreen();}
  catch(error){setStatus('Fullscreen is unavailable in this browser.',true);}
});
document.querySelector('#capture-preview')?.addEventListener('click',()=>{
  try{
    const link=document.createElement('a');link.href=renderer.domElement.toDataURL('image/png');
    link.download='verdant-reach-'+activeShipId+'-preview.png';link.click();
    setStatus('Captured the current shipyard viewport as a PNG image.');
  }catch(error){setStatus('Preview capture failed: '+error.message,true);}
});
document.querySelector('#import-design')?.addEventListener('click',()=>document.querySelector('#import-file')?.click());
document.querySelector('#import-file')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    const imported=parsed?.ships&&typeof parsed.ships==='object'?parsed.ships:parsed;
    if(!imported||typeof imported!=='object'||Array.isArray(imported))throw new Error('The file must contain a vessel configuration object.');
    const next={};
    for(const [id,config] of Object.entries(imported)){
      if(!Object.hasOwn(SHIP_DESIGNS,id))continue;
      if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('Invalid configuration for '+id+'.');
      next[id]=clone(config);
    }
    if(!Object.keys(next).length)throw new Error('No known vessel configurations were found in this file.');
    const before=captureDocumentSnapshot();
    const previous=overrideConfig;
    try{
      overrideConfig=next;applyOverrides();
      loadShip(activeShipId,selectedName,false,true);
      if(!ship)throw new Error('The current vessel could not be rebuilt from this file.');
    }catch(error){overrideConfig=previous;applyOverrides();loadShip(activeShipId,selectedName,false,true);throw error;}
    commitHistory(before,'Import '+file.name);
    setStatus('Imported '+Object.keys(next).length+' vessel configuration(s) from '+file.name+'. Save to keep them in ForTests.');
  }catch(error){setStatus('Import failed: '+error.message,true);}
  finally{event.target.value='';}
});
renderer.domElement.addEventListener('click',event=>{
  if(!ship||gizmo.dragging)return;
  const rect=renderer.domElement.getBoundingClientRect();
  rayPointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  rayPointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(rayPointer,camera);
  const hits=raycaster.intersectObject(ship,true);
  if(measureEnabled){
    if(hits.length)addMeasurementPoint(hits[0].point);
    else setStatus('Choose a visible point on the ship model.',true);
    return;
  }
  for(const hit of hits){
    let object=hit.object;
    while(object&&object!==ship){
      if(object.name&&ship.userData.getPart(object.name)===object){selectPart(object.name);return;}
      object=object.parent;
    }
  }
});
gizmo.addEventListener('mouseDown',()=>{dragSnapshot=captureDocumentSnapshot();});
gizmo.addEventListener('mouseUp',()=>{
  if(!dragSnapshot)return;
  syncCurrentShipState();
  commitHistory(dragSnapshot,'Gizmo transform '+selectedName);
  dragSnapshot=null;
  refreshTransformFields();
});
window.addEventListener('keydown',event=>{
  const target=event.target;
  const typing=target instanceof HTMLElement&&(
    target.isContentEditable||
    (target.tagName==='INPUT'&&['text','search','email','password'].includes(target.type))
  );
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
    if(typing)return;
    event.preventDefault();historyAction(event.shiftKey?'redo':'undo');return;
  }
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){
    if(typing)return;
    event.preventDefault();historyAction('redo');return;
  }
  if(typing||event.ctrlKey||event.metaKey||event.altKey)return;
  const key=event.key.toLowerCase();
  if(key==='w')changeMode('translate');
  else if(key==='e')changeMode('rotate');
  else if(key==='r')changeMode('scale');
  else if(key==='f'&&ship&&selectedName)frameObject(ship.userData.getPart(selectedName));
});
function resize(){
  const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
function animate(){requestAnimationFrame(animate);orbit.update();renderer.render(scene,camera);}
loadShip(selector.value||Object.keys(SHIP_DESIGNS)[0],reviewPartName);
if(['top','side','bow','stern'].includes(reviewCamera))setCameraPreset(reviewCamera);
animate();
window.addEventListener('beforeunload',()=>{
  resizeObserver.disconnect();clearMeasurement();if(ship)disposeShipModel(ship);gizmo.dispose();renderer.dispose();
});

  }catch(error){
    console.error('[Ship Design Studio startup]',error);
    const message=error&&error.message?error.message:String(error);
    status.textContent='Editor startup failed: '+message;
    status.style.color='#f0a49b';
    const notice=document.createElement('div');
    notice.style.cssText='position:absolute;inset:14px 14px 52px;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #8c5550;border-radius:10px;background:#21191acc;color:#f4d8d4;text-align:left;white-space:pre-wrap;overflow:auto;font:12px/1.6 ui-monospace,monospace;z-index:5';
    notice.textContent='SHIP EDITOR COULD NOT START\n\n'+message+'\n\nOpen the terminal running npm run dev for the detailed error.\nThe vessel list remains available while the startup issue is corrected.';
    viewport?.appendChild(notice);
  }
}
bootShipStudio();
