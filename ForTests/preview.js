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
    const designModule=await import('./ship-designs.js?v=0.8.5');
    const structureModule=await import('./ship-structures.js?v=0.8.5');
    const modelModule=await import('./ship-models.js?v=0.8.5');
    const {SHIP_DESIGNS,getShipDesign,setShipDesignOverrides}=designModule;
    const {getShipStructureBlueprint,setShipStructureOverrides}=structureModule;
    const {createShipModel,disposeShipModel}=modelModule;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101a22);
scene.fog=new THREE.Fog(0x101a22,120,900);
const camera=new THREE.PerspectiveCamera(42,1,.1,4000);

for(const [id,d] of Object.entries(SHIP_DESIGNS)){
  const option=document.createElement('option');
  option.value=id;
  option.textContent=d.label;
  selector.appendChild(option);
}
setStatus('Ship list ready · initializing 3D graphics…');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
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

let overrideConfig=JSON.parse(JSON.stringify(DESIGN_OVERRIDES||{}));
function getConfig(id){if(!overrideConfig[id])overrideConfig[id]={};return overrideConfig[id];}
function applyOverrides(){
  for(const [id,cfg] of Object.entries(overrideConfig)){
    setShipDesignOverrides(id,cfg.design||{});
    setShipStructureOverrides(id,cfg.structure||{});
  }
}
applyOverrides();
let ship=null;
let selectedName='';
let undoStack=[];
let redoStack=[];
let dragSnapshot=null;
const raycaster=new THREE.Raycaster();
const rayPointer=new THREE.Vector2();
const identity={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1};
const DESIGN_FIELDS=[
  {path:'design.hullLength',label:'Hull length (m)',min:2,max:150,step:.1},
  {path:'design.beam',label:'Beam (m)',min:.5,max:40,step:.1},
  {path:'design.draft',label:'Draft (m)',min:.2,max:20,step:.1},
  {path:'design.freeboard',label:'Freeboard (m)',min:.2,max:12,step:.05},
  {path:'design.hull.fullness',label:'Hull fullness',min:.35,max:1.1,step:.01},
  {path:'design.hull.entry',label:'Bow entry',min:.25,max:1.1,step:.01},
  {path:'design.hull.sternWidth',label:'Stern width',min:.02,max:.65,step:.01},
  {path:'design.hull.tumblehome',label:'Hull tumblehome',min:0,max:.45,step:.01},
  {path:'design.hull.sheer',label:'Hull sheer',min:0,max:.5,step:.01},
  {path:'design.hull.bowRise',label:'Bow rise',min:0,max:.8,step:.01},
  {path:'design.hull.sternRise',label:'Stern rise',min:0,max:.8,step:.01},
  {path:'design.hull.keelDepth',label:'Keel depth factor',min:.005,max:.3,step:.005},
  {path:'design.hull.deckCamber',label:'Deck camber',min:0,max:.4,step:.01},
  {path:'structure.beamStation',label:'Max beam station',min:.35,max:.68,step:.01},
  {path:'structure.forebody',label:'Forebody fullness',min:.45,max:1.65,step:.01},
  {path:'structure.aftbody',label:'Aftbody fullness',min:.45,max:1.65,step:.01},
  {path:'structure.bottomFlat',label:'Bottom flatness',min:.05,max:.7,step:.01},
  {path:'structure.bilge',label:'Bilge fullness',min:.02,max:.5,step:.01},
  {path:'structure.flare',label:'Hull flare',min:0,max:.35,step:.01},
  {path:'structure.tumble',label:'Upper tumblehome',min:0,max:.45,step:.01},
  {path:'structure.sheer',label:'Sheer multiplier',min:.4,max:1.8,step:.01},
  {path:'structure.entryVee',label:'Bow V-section',min:.15,max:.95,step:.01},
  {path:'structure.forecastleLength',label:'Forecastle length',min:0,max:.32,step:.01},
  {path:'structure.quarterdeckLength',label:'Quarterdeck length',min:0,max:.38,step:.01},
  {path:'structure.visibleDecks',label:'Visible deck levels',min:1,max:3,step:1}
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
function captureTransforms(){
  const result={};
  if(!ship)return result;
  for(const name of ship.userData.partNames){
    const transform=ship.userData.getPartTransform(name);
    if(!transform)continue;
    const normal=Math.abs(transform.x)<1e-6&&Math.abs(transform.y)<1e-6&&Math.abs(transform.z)<1e-6
      &&Math.abs(transform.rx)<1e-6&&Math.abs(transform.ry)<1e-6&&Math.abs(transform.rz)<1e-6
      &&Math.abs(transform.sx-1)<1e-6&&Math.abs(transform.sy-1)<1e-6&&Math.abs(transform.sz-1)<1e-6;
    if(!normal)result[name]=transform;
  }
  return result;
}
function syncTransforms(){
  if(!ship)return;
  const config=getConfig(selector.value);
  const transforms=captureTransforms();
  if(Object.keys(transforms).length)config.componentTransforms=transforms;
  else delete config.componentTransforms;
}
function captureSnapshot(){syncTransforms();return clone(getConfig(selector.value));}
function refreshHistory(){
  document.querySelector('#undo').disabled=undoStack.length===0;
  document.querySelector('#redo').disabled=redoStack.length===0;
}
function recordUndo(before){
  undoStack.push(before);
  if(undoStack.length>80)undoStack.shift();
  redoStack=[];
  refreshHistory();
}
function restoreSnapshot(snapshot){
  overrideConfig[selector.value]=clone(snapshot||{});
  applyOverrides();
  loadShip(selector.value,selectedName,false);
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
  const before=captureSnapshot();
  ship.userData.setPartTransform(selectedName,readTransformFields());
  syncTransforms();
  recordUndo(before);
  refreshTransformFields();
}
function selectPart(name){
  if(!ship)return;
  const part=ship.userData.getPart(name);
  if(!part){selectedName='';gizmo.detach();document.querySelector('#part-name').textContent='No component selected';return;}
  selectedName=name;partSelector.value=name;
  document.querySelector('#part-name').textContent=name;
  gizmo.attach(part);
  refreshTransformFields();
}
function populatePartList(){
  partSelector.replaceChildren();
  for(const name of ship.userData.partNames){
    const option=document.createElement('option');
    option.value=name;option.textContent=name;partSelector.appendChild(option);
  }
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
      const before=captureSnapshot();
      const config=getConfig(selector.value);
      const target=field.path.startsWith('design.')?(config.design||={}):(config.structure||={});
      setNested(target,field.path.replace(/^(design|structure)\./,''),next);
      setShipDesignOverrides(selector.value,config.design||{});
      setShipStructureOverrides(selector.value,config.structure||{});
      loadShip(selector.value,selectedName,false);
      recordUndo(before);
      renderDesignInputs();
      setStatus('Updated '+field.label+'. Save to keep the change.');
    });
    wrapper.append(label,input);container.appendChild(wrapper);
  }
}
function updateInfo(design){
  document.querySelector('#length').textContent=design.hullLength.toFixed(2)+' m';
  document.querySelector('#beam').textContent=design.beam.toFixed(2)+' m';
  document.querySelector('#draft').textContent=design.draft.toFixed(2)+' m';
  document.querySelector('#masts').textContent=design.masts.length;
  document.querySelector('#parts').textContent=ship.userData.partNames.length;
  document.querySelector('#description').textContent=design.hullProfile+' '+(design.reference||'');
}
function loadShip(type,preferredPart='',reframe=true){
  if(ship){gizmo.detach();disposeShipModel(ship);ship=null;}
  const design=getShipDesign(type);
  if(!design){setStatus('Unknown vessel design.',true);return;}
  try{
    ship=createShipModel(type,getConfig(type).componentTransforms||{});
    scene.add(ship);
    if(reframe)fit(ship);
    updateInfo(design);
    populatePartList();
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
}
function historyAction(action){
  const source=action==='undo'?undoStack:redoStack;
  const target=action==='undo'?redoStack:undoStack;
  if(!source.length)return;
  const current=captureSnapshot();
  const previous=source.pop();target.push(current);
  restoreSnapshot(previous);refreshHistory();
  setStatus(action==='undo'?'Undid the previous edit.':'Restored the edit.');
}
function buildExport(){
  syncTransforms();
  return {format:'verdant-reach-ship-editor',version:1,savedAt:new Date().toISOString(),ships:overrideConfig};
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
  undoStack=[];redoStack=[];loadShip(selector.value);refreshHistory();
});
partSelector.addEventListener('change',()=>selectPart(partSelector.value));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
document.querySelector('#undo').addEventListener('click',()=>historyAction('undo'));
document.querySelector('#redo').addEventListener('click',()=>historyAction('redo'));
document.querySelector('#reset-camera').addEventListener('click',()=>{if(ship)fit(ship);});
document.querySelector('#reset-part').addEventListener('click',()=>{
  if(!ship||!selectedName)return;
  const before=captureSnapshot();
  ship.userData.resetPartTransform(selectedName);
  syncTransforms();recordUndo(before);refreshTransformFields();
  setStatus('Reset '+selectedName+'.');
});
document.querySelector('#save-design').addEventListener('click',saveDesign);
document.querySelector('#export-design').addEventListener('click',exportDesign);
renderer.domElement.addEventListener('click',event=>{
  if(!ship||gizmo.dragging)return;
  const rect=renderer.domElement.getBoundingClientRect();
  rayPointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  rayPointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(rayPointer,camera);
  for(const hit of raycaster.intersectObject(ship,true)){
    let object=hit.object;
    while(object&&object!==ship){
      if(object.name&&ship.userData.getPart(object.name)===object){selectPart(object.name);return;}
      object=object.parent;
    }
  }
});
gizmo.addEventListener('mouseDown',()=>{dragSnapshot=captureSnapshot();});
gizmo.addEventListener('mouseUp',()=>{
  if(!dragSnapshot)return;
  syncTransforms();recordUndo(dragSnapshot);dragSnapshot=null;refreshTransformFields();
  setStatus('Component updated. Save to keep the change.');
});
window.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();historyAction(event.shiftKey?'redo':'undo');}
  else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();historyAction('redo');}
});
function resize(){
  const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
function animate(){requestAnimationFrame(animate);orbit.update();renderer.render(scene,camera);}
loadShip(selector.value||Object.keys(SHIP_DESIGNS)[0]);animate();
window.addEventListener('beforeunload',()=>{
  resizeObserver.disconnect();if(ship)disposeShipModel(ship);gizmo.dispose();renderer.dispose();
});

  }catch(error){
    console.error('[Ship Design Studio startup]',error);
    const message=error&&error.message?error.message:String(error);
    status.textContent='Editor startup failed: '+message;
    status.style.color='#f0a49b';
    const notice=document.createElement('div');
    notice.style.cssText='position:absolute;inset:14px 14px 52px;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #8c5550;border-radius:10px;background:#21191acc;color:#f4d8d4;text-align:left;white-space:pre-wrap;overflow:auto;font:12px/1.6 ui-monospace,monospace;z-index:5';
    notice.textContent='SHIP EDITOR COULD NOT START\\n\\n'+message+'\\n\\nOpen the terminal running npm run dev for the detailed error.\\nThe ship selector has been populated when the design modules loaded; if it is still empty, the import error occurred before the fleet catalogue could load.';
    viewport?.appendChild(notice);
  }
}
bootShipStudio();
