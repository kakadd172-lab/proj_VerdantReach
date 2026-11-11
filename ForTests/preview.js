async function bootShipStudio(){
  const viewport=document.querySelector('#viewport');
  const selector=document.querySelector('#ship-select');
  const categorySelector=document.querySelector('#model-category');
  const partSelector=document.querySelector('#part-select');
  const status=document.querySelector('#status');
  if(!viewport||!selector||!categorySelector||!partSelector||!status){
    throw new Error('Ship Design Studio HTML is incomplete. Update ForTests/index.html and reload.');
  }
  try{
    // Load modules dynamically so browser import failures can be displayed in the editor.
    const THREE=await import('three');
    const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
    const {TransformControls}=await import('three/addons/controls/TransformControls.js');
    // Resolve this data file from the module itself, not from the current document URL.
    // This keeps the preview working when it is opened through a nested route or a
    // repository sub-path (where a relative fetch can otherwise hit Vite's HTML fallback).
    const overridesUrl=new URL('./design-overrides.json',import.meta.url);
    const overrideResponse=await fetch(overridesUrl,{cache:'no-store'});
    if(!overrideResponse.ok) throw new Error('Could not read design-overrides.json from '+overridesUrl.pathname+' (HTTP '+overrideResponse.status+').');
    const overrideText=await overrideResponse.text();
    let DESIGN_OVERRIDES;
    try{
      DESIGN_OVERRIDES=JSON.parse(overrideText);
    }catch(parseError){
      const contentType=overrideResponse.headers.get('content-type')||'unknown content type';
      const responseStart=overrideText.slice(0,100).replace(/\\s+/g,' ').trim();
      const fallbackHint=/^<!doctype html|^<html/i.test(responseStart)
        ?' The server returned an HTML page instead of the JSON file. Start Vite from the ForTests folder and open the local URL printed by Vite.'
        :' Check that the file contains valid JSON.';
      throw new Error('design-overrides.json was not valid JSON at '+overridesUrl.pathname+' (received '+contentType+').'+fallbackHint+' Response starts with: '+responseStart);
    }
    if(!DESIGN_OVERRIDES||typeof DESIGN_OVERRIDES!=='object'||Array.isArray(DESIGN_OVERRIDES)){
      throw new Error('design-overrides.json must contain a JSON object (use {} for an empty workspace).');
    }
    const shipModule=await import('./ships/index.js?v=0.8.30-reset-frame-registry');
    const miscModule=await import('./ships/misc/index.js?v=0.1.0');
    const {SHIP_DESIGNS,VESSEL_IDS,VESSEL_EDITOR_DEFAULTS,getShipDesign,setShipDesignOverrides,SHIP_DESIGN_MODULE_VERSION,
      getShipStructureBlueprint,setShipStructureOverrides,SHIP_STRUCTURE_MODULE_VERSION,
      createShipModel,disposeShipModel,SHIP_MODEL_MODULE_VERSION}=shipModule;
    const {MISC_MODEL_CATEGORIES,MISC_MODEL_IDS,createMiscModel,getMiscModelDefinition,getMiscModelDefaults,isMiscModelId}=miscModule;
    const apiProblems=[];
    if(typeof setShipDesignOverrides!=='function')apiProblems.push('ships/index.js: setShipDesignOverrides');
    if(typeof getShipDesign!=='function')apiProblems.push('ships/index.js: getShipDesign');
    if(typeof setShipStructureOverrides!=='function')apiProblems.push('ships/index.js: setShipStructureOverrides');
    if(typeof getShipStructureBlueprint!=='function')apiProblems.push('ships/index.js: getShipStructureBlueprint');
    if(typeof createShipModel!=='function')apiProblems.push('ships/index.js: createShipModel');
    if(typeof disposeShipModel!=='function')apiProblems.push('ships/shared/ship-editor-kit.js: disposeShipModel');
    if(SHIP_DESIGN_MODULE_VERSION!=='0.8.9')apiProblems.push('ships/index.js design API version '+String(SHIP_DESIGN_MODULE_VERSION));
    if(SHIP_STRUCTURE_MODULE_VERSION!=='0.8.9')apiProblems.push('ships/index.js structure API version '+String(SHIP_STRUCTURE_MODULE_VERSION));
    if(SHIP_MODEL_MODULE_VERSION!=='0.8.30')apiProblems.push('ships/shared/ship-editor-kit.js version '+String(SHIP_MODEL_MODULE_VERSION));
    if(Object.keys(SHIP_DESIGNS||{}).length!==16)apiProblems.push('ship catalogue count '+Object.keys(SHIP_DESIGNS||{}).length);
    if(Object.keys(VESSEL_EDITOR_DEFAULTS||{}).length!==16)apiProblems.push('per-vessel editor defaults count '+Object.keys(VESSEL_EDITOR_DEFAULTS||{}).length);
    if(typeof createMiscModel!=='function'||typeof getMiscModelDefinition!=='function'||typeof getMiscModelDefaults!=='function')apiProblems.push('ships/misc/index.js miscellaneous model API');
    if(!Array.isArray(MISC_MODEL_IDS)||MISC_MODEL_IDS.length!==3)apiProblems.push('miscellaneous model catalogue count '+(MISC_MODEL_IDS||[]).length);
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
const reviewModelId=reviewParams.get('model')||'';
if(isMiscModelId(reviewModelId)){categorySelector.value='miscellaneous';selector.value=reviewModelId;}

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
const marqueeOverlay=document.createElement('div');
marqueeOverlay.className='selection-marquee';
marqueeOverlay.hidden=true;
marqueeOverlay.setAttribute('aria-hidden','true');
viewport.appendChild(marqueeOverlay);

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
// Static waterline reference: vessel geometry uses y=0 as its design waterline.
// This remains level while the hull is later given its rocking motion.
const seaSurface=new THREE.Mesh(
 new THREE.PlaneGeometry(2400,2400),
 new THREE.MeshStandardMaterial({color:0x1b5963,roughness:.42,metalness:.08,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false})
);
seaSurface.name='sea-surface-reference';
seaSurface.rotation.x=-Math.PI/2;
seaSurface.position.y=0;
seaSurface.renderOrder=1;
scene.add(seaSurface);
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
let selectedNames=[];
let selectionPivot=null;
let selectionHelpers=[];
let groupDragSession=null;
let marqueeMode=false;
let marqueeStart=null;
let suppressCanvasClick=false;
let activeShipId=selector.value||Object.keys(SHIP_DESIGNS)[0];
let activeCategory=categorySelector.value||'vessels';
function getActiveDefinition(id=activeShipId){return isMiscModelId(id)?getMiscModelDefinition(id):getShipDesign(id);}
function getActiveDefaults(id=activeShipId){return isMiscModelId(id)?getMiscModelDefaults(id):(VESSEL_EDITOR_DEFAULTS[id]||{});}
function createActiveModel(id,transforms={},state={}){return isMiscModelId(id)?createMiscModel(id,transforms,state):createShipModel(id,transforms,state);}
function refreshModelOptions(category,preferredId){
  activeCategory=category;
  const entries=category==='miscellaneous'?MISC_MODEL_IDS.map(id=>[id,getMiscModelDefinition(id)]):Object.entries(SHIP_DESIGNS);
  selector.replaceChildren();
  for(const [id,definition] of entries){const option=document.createElement('option');option.value=id;option.textContent=definition.label;selector.appendChild(option);}
  const next=preferredId&&entries.some(([id])=>id===preferredId)?preferredId:entries[0]?.[0];
  if(next)selector.value=next;
  const caption=document.querySelector('#model-category-caption');if(caption)caption.textContent=category==='miscellaneous'?'Miscellaneous models · '+entries.length+' variants':'Sailing vessels · '+entries.length+' designs';
}
let historyEntries=[];
let historyCursor=0;
let hasUnsavedChanges=Object.keys(overrideConfig||{}).length>0;
let dragSnapshot=null;
let snapEnabled=false;
let wireframeEnabled=false;
let gridEnabled=true;
let shadowsEnabled=true;
let measureEnabled=false;
let measurementPoints=[];
let measurementLine=null;
let sectionEnabled=false;
const seaSettings={enabled:false,directionDeg:90,heightMeters:0,periodSeconds:5,preset:'flat'};
const windSettings={enabled:false,directionDeg:90,speedKnots:12,gusts:false,paused:false,sea:seaSettings};
const SEA_PRESETS={
 flat:{enabled:false,heightMeters:0,periodSeconds:5},
 light:{enabled:true,heightMeters:.5,periodSeconds:4.5},
 moderate:{enabled:true,heightMeters:1.5,periodSeconds:6},
 rough:{enabled:true,heightMeters:3,periodSeconds:8}
};
function windDirectionName(degrees){
 const angle=((Math.round(degrees)%360)+360)%360;
 if(angle<45||angle>=315)return 'Bow';
 if(angle<135)return 'Starboard';
 if(angle<225)return 'Stern';
 return 'Port';
}
function waveDirectionName(degrees){
 const angle=((Math.round(degrees)%360)+360)%360;
 const directions=['Head sea','Starboard bow','Starboard beam','Starboard quarter','Following sea','Port quarter','Port beam','Port bow'];
 return directions[Math.round(angle/45)%8];
}
function refreshSeaControls(){
 const surfaceToggle=document.querySelector('#sea-surface-toggle');
 if(surfaceToggle){surfaceToggle.textContent=seaSurface.visible?'Waterline plane on':'Waterline plane off';surfaceToggle.classList.toggle('active',seaSurface.visible);surfaceToggle.setAttribute('aria-pressed',String(seaSurface.visible));}
 const toggle=document.querySelector('#sea-toggle'),state=document.querySelector('#sea-state-value');
 const direction=document.querySelector('#wave-direction'),height=document.querySelector('#wave-height'),period=document.querySelector('#wave-period');
 const arrow=document.querySelector('#wave-arrow'),directionValue=document.querySelector('#wave-direction-value');
 const directionReadout=document.querySelector('#wave-direction-readout');
 const heightReadout=document.querySelector('#wave-height-readout'),periodReadout=document.querySelector('#wave-period-readout');
 if(toggle){toggle.textContent=seaSettings.enabled?'Waves on':'Waves off';toggle.classList.toggle('active',seaSettings.enabled);toggle.setAttribute('aria-pressed',String(seaSettings.enabled));}
 const seaState=!seaSettings.enabled?'OFF':seaSettings.heightMeters<.05?'FLAT':seaSettings.heightMeters<1?'LIGHT':seaSettings.heightMeters<2?'MODERATE':'ROUGH';
 if(state)state.textContent=seaState;
 if(direction)direction.value=String(seaSettings.directionDeg);
 if(height)height.value=String(seaSettings.heightMeters);
 if(period)period.value=String(seaSettings.periodSeconds);
 if(arrow)arrow.style.setProperty('--wind-direction',seaSettings.directionDeg+'deg');
 if(directionValue)directionValue.textContent=seaSettings.directionDeg+'° · '+waveDirectionName(seaSettings.directionDeg);
 if(directionReadout)directionReadout.textContent=seaSettings.directionDeg+'°';
 if(heightReadout)heightReadout.textContent=seaSettings.heightMeters.toFixed(1)+' m';
 if(periodReadout)periodReadout.textContent=seaSettings.periodSeconds.toFixed(1)+' s';
 for(const preset of document.querySelectorAll('[data-sea-preset]')){
  const active=preset.dataset.seaPreset===seaSettings.preset;
  preset.classList.toggle('active',active);preset.setAttribute('aria-pressed',String(active));
 }
 for(const preset of document.querySelectorAll('[data-wave-direction]')){
  const active=Number(preset.dataset.waveDirection)===seaSettings.directionDeg;
  preset.classList.toggle('active',active);preset.setAttribute('aria-pressed',String(active));
 }
}
function applySeaPreset(name){
 const preset=SEA_PRESETS[name];
 if(!preset)return false;
 Object.assign(seaSettings,preset,{preset:name});
 refreshSeaControls();
 return true;
}
function refreshSailingControls(){
 const toggle=document.querySelector('#wind-toggle'),windState=document.querySelector('#wind-state');
 const gustToggle=document.querySelector('#gust-toggle'),simulationToggle=document.querySelector('#simulation-toggle');
 const direction=document.querySelector('#wind-direction'),speed=document.querySelector('#wind-speed');
 const arrow=document.querySelector('#wind-arrow'),directionValue=document.querySelector('#wind-direction-value');
 const directionReadout=document.querySelector('#wind-direction-readout'),speedValue=document.querySelector('#wind-speed-value'),speedReadout=document.querySelector('#wind-speed-readout');
 if(toggle){toggle.textContent=windSettings.enabled?'Wind on':'Wind off';toggle.classList.toggle('active',windSettings.enabled);toggle.setAttribute('aria-pressed',String(windSettings.enabled));}
 if(windState)windState.textContent=windSettings.enabled?'BLOWING':'CALM';
 if(direction)direction.value=String(windSettings.directionDeg);
 if(speed)speed.value=String(windSettings.speedKnots);
 if(arrow)arrow.style.setProperty('--wind-direction',windSettings.directionDeg+'deg');
 if(directionValue)directionValue.textContent=windSettings.directionDeg+'° · '+windDirectionName(windSettings.directionDeg);
 if(directionReadout)directionReadout.textContent=windSettings.directionDeg+'°';
 if(speedValue)speedValue.textContent=windSettings.speedKnots+' knots · '+(windSettings.enabled?'Wind active':'Wind disabled');
 if(speedReadout)speedReadout.textContent=windSettings.speedKnots+' kn';
 if(gustToggle){gustToggle.textContent=windSettings.gusts?'Gusts on':'Gusts off';gustToggle.classList.toggle('active',windSettings.gusts);gustToggle.setAttribute('aria-pressed',String(windSettings.gusts));}
 if(simulationToggle){simulationToggle.textContent=windSettings.paused?'Resume motion':'Pause motion';simulationToggle.classList.toggle('active',windSettings.paused);simulationToggle.setAttribute('aria-pressed',String(windSettings.paused));}
 for(const preset of document.querySelectorAll('[data-wind-direction]')){
  const active=Number(preset.dataset.windDirection)===windSettings.directionDeg;
  preset.classList.toggle('active',active);preset.setAttribute('aria-pressed',String(active));
 }
 const sailState=document.querySelector('#sail-state-value');
 const sailButtons={full:document.querySelector('#sails-full'),reefed:document.querySelector('#sails-reef'),furled:document.querySelector('#sails-furl')};
 const savedState=ship?.userData.getShipState();
 const modes=(SHIP_DESIGNS[activeShipId]?.masts||[]).map(m=>savedState?.sailDeployment?.[m.id]||'full');
 const commonMode=modes.length&&modes.every(mode=>mode===modes[0])?modes[0]:(modes.length?'mixed':'none');
 if(sailState)sailState.textContent=commonMode.toUpperCase();
 for(const [mode,button] of Object.entries(sailButtons)){
  if(button){const active=commonMode===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
 }
 const rudder=document.querySelector('#rudder-angle'),rudderValue=document.querySelector('#rudder-angle-value');
 const centre=document.querySelector('#rudder-center'),wheelReadout=document.querySelector('#helm-wheel-angle');
 const rudderPart=ship?.userData.getPart('rudder'),wheelPart=ship?.userData.getPart('helm-wheel');
 if(rudder)rudder.disabled=!rudderPart;
 if(centre)centre.disabled=!rudderPart;
 const angle=ship?THREE.MathUtils.radToDeg(ship.userData.getShipState().rudderAngle||0):0;
 if(rudder&&document.activeElement!==rudder)rudder.value=String(Math.round(angle));
 if(rudderValue){const rounded=Math.round(angle);rudderValue.textContent=Math.abs(rounded)<1?'0° · Center':Math.abs(rounded)+'° · '+(rounded>0?'Starboard':'Port');}
 if(wheelReadout&&wheelPart){const wheelPivot=wheelPart.userData.steeringControl?.pivotGroup||wheelPart;const rotation=THREE.MathUtils.radToDeg(wheelPivot.rotation.z||0);wheelReadout.textContent=(rotation<0?'−':'')+Math.abs(rotation).toFixed(0)+'°';}
 else if(wheelReadout)wheelReadout.textContent='Not fitted';
}
function updateSailingTelemetry(){
 const output=document.querySelector('#mast-response-value');
 if(!output)return;
 const definitions=SHIP_DESIGNS[activeShipId]?.masts||[];
 const readings=definitions.map(definition=>{
  const mast=ship?.userData.getPart('mast-'+definition.id);
  const pivot=mast?.userData.mastControl?.pivotGroup||mast?.userData.animationPivot;
  if(!pivot)return definition.id+': no pivot';
  const heel=THREE.MathUtils.radToDeg(pivot.rotation.z||0),rake=THREE.MathUtils.radToDeg(pivot.rotation.x||0);
  const heelText=Math.abs(heel)<.05?'neutral':Math.abs(heel).toFixed(1)+'° '+(heel>0?'port':'starboard');
  const rakeText=Math.abs(rake)<.05?'neutral':Math.abs(rake).toFixed(1)+'° '+(rake>0?'aft':'forward');
  return definition.id+': '+heelText+' / '+rakeText;
 });
 output.textContent=readings.length?readings.join(' · '):'No articulated mast';
}
function updateSloopRockingTelemetry(){
 const status=document.querySelector('#sloop-rocking-status');
 const roll=document.querySelector('#sloop-roll-value');
 const pitch=document.querySelector('#sloop-pitch-value');
 const heave=document.querySelector('#sloop-heave-value');
 if(!status&&!roll&&!pitch&&!heave)return;
 const motion=ship?.userData?.sloopRocking;
 if(!motion){
  if(status)status.textContent='Sloop only · select Sloop';
  if(roll)roll.textContent='0.0°';
  if(pitch)pitch.textContent='0.0°';
  if(heave)heave.textContent='0.00 m';
  return;
 }
 const toDegrees=value=>THREE.MathUtils.radToDeg(Number(value)||0);
 if(status)status.textContent=motion.enabled?'ACTIVE · '+motion.waveHeightMeters.toFixed(1)+' m sea':motion.seaBlend>.01?'SETTLING':'IDLE';
 if(roll)roll.textContent=toDegrees(motion.rollRadians).toFixed(1)+'°';
 if(pitch)pitch.textContent=toDegrees(motion.pitchRadians).toFixed(1)+'°';
 if(heave)heave.textContent=motion.heaveMeters.toFixed(2)+' m';
}
function setAllSails(mode,duration=.85){
 if(!ship||!activeShipId)return false;
 let applied=false;
 for(const mast of SHIP_DESIGNS[activeShipId]?.masts||[])applied=ship.userData.setSailDeployment(mast.id,mode,duration)||applied;
 refreshSailingControls();return applied;
}
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
function updateSaveIndicator(){
  const node=document.querySelector('#save-state');
  if(!node)return;
  node.textContent=hasUnsavedChanges?'Unsaved edits':'Vessel files saved';
  node.classList.toggle('dirty',hasUnsavedChanges);
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
function syncCurrentShipState(forceSnapshot=true){
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
  if(hasState||forceSnapshot)config.partState=clone(state);
  else delete config.partState;
  if(state.partTransforms&&Object.keys(state.partTransforms).length)config.componentTransforms=clone(state.partTransforms);
  else delete config.componentTransforms;
  if(Object.keys(config).length===0)delete overrideConfig[activeShipId];
}
function captureDocumentSnapshot(){
  syncCurrentShipState();
  return {activeShip:activeShipId,ships:clone(overrideConfig),selectedName,selectedNames:[...selectedNames]};
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
  hasUnsavedChanges=true;
  updateSaveIndicator();
  refreshHistory();
  setStatus('Recorded: '+label+'.');
  return true;
}
function restoreDocumentSnapshot(snapshot){
  overrideConfig=clone(snapshot.ships||{});
  applyOverrides();
  const nextId=(Object.hasOwn(SHIP_DESIGNS,snapshot.activeShip)||isMiscModelId(snapshot.activeShip))?snapshot.activeShip:Object.keys(SHIP_DESIGNS)[0];
  categorySelector.value=isMiscModelId(nextId)?'miscellaneous':'vessels';
  refreshModelOptions(categorySelector.value,nextId);
  selector.value=nextId;
  const restoreNames=Array.isArray(snapshot.selectedNames)?snapshot.selectedNames:[];
  const restoreSingle=snapshot.selectedName||restoreNames[0]||selectedName;
  loadShip(nextId,restoreSingle,false,true);
  if(restoreNames.length>1){
    const valid=restoreNames.filter(name=>ship?.userData.getPart(name));
    if(valid.length>1)selectParts(valid);
  }
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
  const enabled=!!ship&&!!selectedName&&selectedNames.length<=1;
  const t=enabled?getSelectedTransform():identity;
  const values={...t,rx:THREE.MathUtils.radToDeg(t.rx),ry:THREE.MathUtils.radToDeg(t.ry),rz:THREE.MathUtils.radToDeg(t.rz)};
  for(const [id] of TRANSFORM_FIELDS){
    const input=document.querySelector('[data-transform="'+id+'"]');
    if(input){input.disabled=!enabled;input.value=Number(values[id]).toFixed(id.startsWith('r')?1:3);}
  }
}
function readTransformFields(){
  const value=id=>Number(document.querySelector('[data-transform="'+id+'"]')?.value??0);
  return {x:value('x'),y:value('y'),z:value('z'),
    rx:THREE.MathUtils.degToRad(value('rx')),ry:THREE.MathUtils.degToRad(value('ry')),rz:THREE.MathUtils.degToRad(value('rz')),
    sx:value('sx'),sy:value('sy'),sz:value('sz')};
}
function commitManualTransform(){
  if(!ship||!selectedName||selectedNames.length>1)return;
  const before=captureDocumentSnapshot();
  ship.userData.setPartTransform(selectedName,readTransformFields());
  syncCurrentShipState();
  commitHistory(before,'Transform '+selectedName);
  refreshTransformFields();
}
function refreshPartInspector(){
  const set=(id,value)=>{const node=document.querySelector('#'+id);if(node)node.textContent=value;};
  const names=selectedNames.length?selectedNames:(selectedName?[selectedName]:[]);
  if(!ship||!names.length){set('part-size','—');set('part-parent','—');set('part-meshes','—');set('part-materials','—');return;}
  const bounds=getSelectionBounds(names),size=bounds.isEmpty()?new THREE.Vector3():bounds.getSize(new THREE.Vector3());
  let meshCount=0;const materials=new Set(),parents=new Set();
  for(const name of names){
    const object=ship.userData.getPart(name);
    if(!object)continue;
    parents.add(object.parent?.name||'Ship root');
    object.traverse(mesh=>{
      if(!mesh.isMesh)return;
      meshCount++;
      for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))if(material)materials.add(material.name||material.type||'Material');
    });
  }
  set('part-size',[size.x,size.y,size.z].map(value=>value.toFixed(2)).join(' × '));
  set('part-parent',parents.size===1?[...parents][0]:'Multiple groups');
  set('part-meshes',String(meshCount));set('part-materials',String(materials.size));
}
function selectPart(name){
  if(!ship)return;
  if(!name){clearSelection();return;}
  const part=ship.userData.getPart(name);
  if(!part){clearSelection();return;}
  removeSelectionPivot();clearSelectionHelpers();
  selectedNames=[name];selectedName=name;partSelector.value=name;
  document.querySelector('#part-name').textContent=name;
  gizmo.attach(part);setSelectionHelpers(selectedNames);
  refreshTransformFields();refreshSelectionTools();refreshPartInspector();refreshSelectionCount();
  const readout=document.querySelector('#viewport-readout');
  if(readout)readout.textContent='Selected component · '+name;
}
function populatePartList(){
  const filter=(document.querySelector('#part-search')?.value||'').trim().toLowerCase();
  partSelector.replaceChildren();
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Select a component…';partSelector.appendChild(placeholder);
  for(const name of ship.userData.partNames){
    if(filter&&!name.toLowerCase().includes(filter))continue;
    const option=document.createElement('option');option.value=name;option.textContent=name;partSelector.appendChild(option);
  }
  if(selectedNames.length>1)partSelector.value='';
  else if(selectedName&&Array.from(partSelector.options).some(option=>option.value===selectedName))partSelector.value=selectedName;
  else partSelector.value='';
}
function refreshSelectionTools(){
  const names=selectedNames.length?selectedNames:(selectedName?[selectedName]:[]);
  const part=ship&&selectedName?ship.userData.getPart(selectedName):null,multi=names.length>1;
  const allVisible=names.length>0&&names.every(name=>ship.userData.getPart(name)?.visible);
  const toggle=document.querySelector('#toggle-visibility');
  if(toggle)toggle.textContent=allVisible?'Hide selected':'Show selected';
  const detached=part?.parent?.name==='unlinked-parts';
  const detach=document.querySelector('#detach-part'),relink=document.querySelector('#relink-part');
  if(detach)detach.disabled=!part||detached||multi;
  if(relink)relink.disabled=!part||!detached||multi;
  const reset=document.querySelector('#reset-part');if(reset)reset.disabled=!names.length;
  const isolate=document.querySelector('#isolate-selected');if(isolate)isolate.disabled=!part||multi;
  refreshSelectionCount();
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
function clearSelectionHelpers(){
  for(const helper of selectionHelpers)scene.remove(helper);
  selectionHelpers=[];
}
function updateSelectionHelpers(){for(const helper of selectionHelpers)helper.update();}
function refreshSelectionCount(){
  const node=document.querySelector('#selection-count'),count=selectedNames.length||(selectedName?1:0);
  if(node)node.textContent=count+' component'+(count===1?'':'s')+' selected';
  const clear=document.querySelector('#clear-selection');if(clear)clear.disabled=count===0;
}
function removeSelectionPivot(){
  if(!selectionPivot)return;
  if(gizmo.object===selectionPivot)gizmo.detach();
  selectionPivot.removeFromParent();selectionPivot=null;
}
function clearSelection(){
  removeSelectionPivot();clearSelectionHelpers();gizmo.detach();selectedNames=[];selectedName='';
  if(partSelector)partSelector.value='';
  const label=document.querySelector('#part-name');if(label)label.textContent='No component selected';
  refreshTransformFields();refreshSelectionTools();refreshPartInspector();refreshSelectionCount();
  const readout=document.querySelector('#viewport-readout');
  if(readout)readout.textContent=ship?'Viewport ready · '+ship.userData.partNames.length+' editable components':'Viewport starting…';
}
function getSelectionBounds(names=selectedNames){
  const bounds=new THREE.Box3();if(!ship)return bounds;
  for(const name of names){
    const object=ship.userData.getPart(name);if(!object||!object.visible)continue;
    object.updateWorldMatrix(true,true);
    const partBounds=new THREE.Box3().setFromObject(object);if(!partBounds.isEmpty())bounds.union(partBounds);
  }
  return bounds;
}
function frameSelection(){
  if(selectedNames.length>1){
    const bounds=getSelectionBounds();if(bounds.isEmpty())return;
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const distance=Math.max(size.length()*1.7,2),direction=camera.position.clone().sub(orbit.target);
    if(direction.lengthSq()<1e-6)direction.set(1,.65,1);
    direction.normalize();orbit.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);
    camera.near=Math.max(.05,distance/1000);camera.far=Math.max(2000,distance*30);camera.updateProjectionMatrix();orbit.update();
  }else if(selectedName)frameObject(ship.userData.getPart(selectedName));
}
function recenterSelectionPivot(){
  if(!selectionPivot||selectedNames.length<2)return;
  const bounds=getSelectionBounds(selectedNames);
  if(bounds.isEmpty())return;
  selectionPivot.position.copy(bounds.getCenter(new THREE.Vector3()));
  selectionPivot.rotation.set(0,0,0);
  selectionPivot.scale.set(1,1,1);
  selectionPivot.updateMatrixWorld(true);
}
function setSelectionHelpers(names){
  clearSelectionHelpers();
  for(const name of names){
    const object=ship.userData.getPart(name);if(!object||!object.visible)continue;
    object.updateWorldMatrix(true,true);if(new THREE.Box3().setFromObject(object).isEmpty())continue;
    const helper=new THREE.BoxHelper(object,0xc2d7a8);helper.name='selection-outline-'+name;
    helper.material.depthTest=false;helper.material.transparent=true;helper.material.opacity=.95;helper.renderOrder=20;
    scene.add(helper);selectionHelpers.push(helper);
  }
  recenterSelectionPivot();
}
function pruneNestedSelection(names){
  const candidates=new Set(names);
  return [...candidates].filter(name=>{
    const object=ship.userData.getPart(name);if(!object)return false;
    for(let ancestor=object.parent;ancestor&&ancestor!==ship;ancestor=ancestor.parent){
      if(ancestor.name&&candidates.has(ancestor.name)&&ship.userData.getPart(ancestor.name)===ancestor)return false;
    }
    return true;
  });
}
function selectParts(names){
  if(!ship)return;
  const filtered=pruneNestedSelection(names);
  if(filtered.length===0){clearSelection();return;}
  if(filtered.length===1){selectPart(filtered[0]);return;}
  removeSelectionPivot();clearSelectionHelpers();selectedNames=filtered;selectedName='';partSelector.value='';
  document.querySelector('#part-name').textContent=filtered.length+' components selected';
  const bounds=getSelectionBounds(filtered);if(bounds.isEmpty()){clearSelection();return;}
  selectionPivot=new THREE.Group();selectionPivot.name='__multi-selection-pivot';
  selectionPivot.position.copy(bounds.getCenter(new THREE.Vector3()));scene.add(selectionPivot);gizmo.attach(selectionPivot);
  setSelectionHelpers(filtered);refreshTransformFields();refreshSelectionTools();refreshPartInspector();refreshSelectionCount();
  const readout=document.querySelector('#viewport-readout');
  if(readout)readout.textContent='Selected · '+filtered.length+' components';
  setStatus('Selected '+filtered.length+' components. Use the transform gizmo to move them together.');
}
function screenBoundsForPart(part,rect){
  part.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(part);if(bounds.isEmpty())return null;
  const points=[
    [bounds.min.x,bounds.min.y,bounds.min.z],[bounds.min.x,bounds.min.y,bounds.max.z],
    [bounds.min.x,bounds.max.y,bounds.min.z],[bounds.min.x,bounds.max.y,bounds.max.z],
    [bounds.max.x,bounds.min.y,bounds.min.z],[bounds.max.x,bounds.min.y,bounds.max.z],
    [bounds.max.x,bounds.max.y,bounds.min.z],[bounds.max.x,bounds.max.y,bounds.max.z]
  ].map(point=>new THREE.Vector3(...point));
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,inFront=0;
  for(const point of points){
    point.project(camera);if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(point.z))continue;
    if(point.z>=-1&&point.z<=1)inFront++;
    const x=rect.left+(point.x+1)*.5*rect.width,y=rect.top+(1-point.y)*.5*rect.height;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return !inFront||!Number.isFinite(left)?null:{left,right,top,bottom};
}
function selectPartsInRectangle(start,end,append=false){
  if(!ship)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const selection={left:Math.min(start.x,end.x),right:Math.max(start.x,end.x),top:Math.min(start.y,end.y),bottom:Math.max(start.y,end.y)};
  const windowSelection=end.x>=start.x,hits=[];
  for(const name of ship.userData.partNames){
    const part=ship.userData.getPart(name);if(!part||!part.visible)continue;
    let visible=true;
    for(let parent=part.parent;parent&&parent!==ship;parent=parent.parent)if(!parent.visible){visible=false;break;}
    if(!visible)continue;
    const b=screenBoundsForPart(part,rect);if(!b)continue;
    const contained=b.left>=selection.left&&b.right<=selection.right&&b.top>=selection.top&&b.bottom<=selection.bottom;
    const intersects=b.right>=selection.left&&b.left<=selection.right&&b.bottom>=selection.top&&b.top<=selection.bottom;
    if(windowSelection?contained:intersects)hits.push(name);
  }
  selectParts(append?[...selectedNames,...(selectedName?[selectedName]:[]),...hits]:hits);
}
function toggleBoxSelect(){
  marqueeMode=!marqueeMode;
  const button=document.querySelector('#box-select-toggle');
  if(button){button.classList.toggle('active',marqueeMode);button.setAttribute('aria-pressed',String(marqueeMode));button.textContent=marqueeMode?'Box select · ON':'Box select · Q';}
  const hint=document.querySelector('#hint');
  if(hint)hint.textContent=marqueeMode
    ?'Drag a rectangle around components to select them. Left → right selects fully enclosed parts; right → left selects anything crossed. Hold Shift to add. Press Q to exit.'
    :'Select a component from the list or click it in the model. Drag empty space to orbit · scroll to zoom · W / E / R changes the transform tool. Press Q for box selection.';
  setStatus(marqueeMode?'Box selection enabled. Drag across the ship to select components.':'Box selection disabled.');
}
function beginGroupTransform(){
  if(!ship||selectedNames.length<2||!selectionPivot||groupDragSession)return null;
  const before=captureDocumentSnapshot();ship.updateMatrixWorld(true);selectionPivot.updateMatrixWorld(true);
  const members=[];
  for(const name of selectedNames){
    const object=ship.userData.getPart(name);if(!object||!object.parent)continue;
    const old=ship.userData.getPartTransform(name)||identity;
    members.push({
      name,object,parent:object.parent,
      basePosition:object.position.clone().sub(new THREE.Vector3(old.x,old.y,old.z)),
      baseRotation:new THREE.Vector3(object.rotation.x-old.rx,object.rotation.y-old.ry,object.rotation.z-old.rz),
      baseScale:new THREE.Vector3(object.scale.x/(old.sx||1),object.scale.y/(old.sy||1),object.scale.z/(old.sz||1))
    });
  }
  if(members.length<2)return null;
  groupDragSession={before,members};
  for(const member of members)selectionPivot.attach(member.object);
  selectionPivot.updateMatrixWorld(true);return groupDragSession;
}
function finishGroupTransform(){
  const session=groupDragSession;if(!session)return null;
  selectionPivot?.updateMatrixWorld(true);
  for(const member of session.members){
    member.parent.attach(member.object);
    const object=member.object;
    ship.userData.setPartTransform(member.name,{
      x:object.position.x-member.basePosition.x,y:object.position.y-member.basePosition.y,z:object.position.z-member.basePosition.z,
      rx:object.rotation.x-member.baseRotation.x,ry:object.rotation.y-member.baseRotation.y,rz:object.rotation.z-member.baseRotation.z,
      sx:object.scale.x/(member.baseScale.x||1),sy:object.scale.y/(member.baseScale.y||1),sz:object.scale.z/(member.baseScale.z||1)
    });
  }
  groupDragSession=null;
  const bounds=getSelectionBounds();
  if(selectionPivot&&!bounds.isEmpty()){selectionPivot.position.copy(bounds.getCenter(new THREE.Vector3()));selectionPivot.rotation.set(0,0,0);selectionPivot.scale.set(1,1,1);selectionPivot.updateMatrixWorld(true);}
  setSelectionHelpers(selectedNames);refreshPartInspector();return session;
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
  const label=getActiveDefinition(activeShipId)?.label||activeShipId;
  delete overrideConfig[activeShipId];
  applyOverrides();
  loadShip(activeShipId,selectedName,false,true);
  commitHistory(before,'Discard unsaved edits for '+label);
  setStatus('Discarded unsaved edits. The last saved vessel defaults are still active.');
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
  const design=getActiveDefinition(selector.value);
  const structure=isMiscModelId(selector.value)?null:getShipStructureBlueprint(selector.value);
  if(isMiscModelId(selector.value)){container.textContent='Miscellaneous visual model · use the shared component inspector and transform tools to edit its individual parts.';return;}
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
  if(isMiscModelId(activeShipId)){output.textContent='Dimension comparison is available for sailing vessels.';return;}
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
  document.querySelector('#masts').textContent=(design.masts||[]).length;
  document.querySelector('#parts').textContent=ship.userData.partNames.length;
  document.querySelector('#description').textContent=(design.hullProfile||'Miscellaneous visual model')+' '+(design.reference||'');
  updateComparison();
}
function loadShip(type,preferredPart='',reframe=true,skipSync=false){
  if(ship){if(!skipSync)syncCurrentShipState();removeSelectionPivot();clearSelectionHelpers();selectedNames=[];selectedName='';gizmo.detach();disposeShipModel(ship);ship=null;}
  activeShipId=type;
  const design=getActiveDefinition(type);
  if(!design){setStatus('Unknown model design.',true);return;}
  try{
    const config=getConfig(type);
    const sourceState=getActiveDefaults(type)?.componentState||{};
    const editState=config.partState||(config.componentTransforms?{partTransforms:config.componentTransforms}:{});
    const savedState={...clone(sourceState),...clone(editState),partTransforms:clone(editState.partTransforms||editState.componentTransforms||sourceState.partTransforms||{})};
    ship=createActiveModel(type,savedState.partTransforms||{},savedState);
    scene.add(ship);
    applyWireframe();
    if(reframe)fit(ship);
    updateInfo(design);
    populatePartList();
    updateSectionRange();
    const chosen=preferredPart&&ship.userData.getPart(preferredPart)?preferredPart:(ship.userData.partNames.includes('hull')?'hull':ship.userData.partNames[0]);
    selectPart(chosen);
    renderDesignInputs();
    refreshSailingControls();
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
function mergePatch(base,patch){
  if(patch===undefined)return clone(base??{});
  if(!patch||typeof patch!=='object'||Array.isArray(patch))return clone(patch);
  const output=clone(base&&typeof base==='object'&&!Array.isArray(base)?base:{});
  for(const [key,value] of Object.entries(patch)){if(value&&typeof value==='object'&&!Array.isArray(value))output[key]=mergePatch(output[key],value);else output[key]=clone(value);}
  return output;
}
function effectiveVesselConfig(id){
  const source=VESSEL_EDITOR_DEFAULTS[id]||{},edits=overrideConfig[id]||{},sourceState=source.componentState||{},editState=edits.partState||{};
  const partState={...clone(sourceState),...clone(editState)};
  for(const key of ['transformFrameVersion','partTransforms','hiddenParts','sailTrim','sailDeployment','mastLean','unlinkedParts']){
    if(Object.prototype.hasOwnProperty.call(editState,key))partState[key]=clone(editState[key]);else if(sourceState[key]!==undefined)partState[key]=clone(sourceState[key]);
  }
  if(!Object.prototype.hasOwnProperty.call(editState,'partTransforms')&&edits.componentTransforms)partState.partTransforms=clone(edits.componentTransforms);
  return {design:mergePatch(source.design||{},edits.design),structure:mergePatch(source.structure||{},edits.structure),partState,componentTransforms:clone(partState.partTransforms||{})};
}
function effectiveMiscModelConfig(id){
  const source=getMiscModelDefaults(id)||{},edits=overrideConfig[id]||{};
  const sourceState=source.componentState||{},editState=edits.partState||{};
  return {componentState:{...clone(sourceState),...clone(editState),partTransforms:clone(editState.partTransforms||sourceState.partTransforms||{}),hiddenParts:clone(editState.hiddenParts||sourceState.hiddenParts||{}),unlinkedParts:clone(editState.unlinkedParts||sourceState.unlinkedParts||[])}};
}
function buildExport(){
  syncCurrentShipState();const ships={};for(const id of VESSEL_IDS)ships[id]=effectiveVesselConfig(id);
  const miscModels={};for(const id of MISC_MODEL_IDS)miscModels[id]=effectiveMiscModelConfig(id);
  return {format:'verdant-reach-ship-editor',version:4,savedAt:new Date().toISOString(),ships,miscModels};
}
async function saveDesign(){
  const button=document.querySelector('#save-design');if(button)button.disabled=true;
  try{
    const response=await fetch('/__ship-editor/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildExport())});
    let result={};
    try{result=await response.json();}catch{result={};}
    if(!response.ok||!result.saved)throw new Error(result.error||('Local save endpoint returned HTTP '+response.status+'.'));
    hasUnsavedChanges=false;updateSaveIndicator();setStatus('Saved '+result.vessels+' per-vessel default modules. Reloading from those source files…');window.location.reload();
  }catch(error){setStatus('Save failed. Your edits remain in this editor; use Export backup as an additional copy. '+error.message,true);}
  finally{if(button)button.disabled=false;}
}
async function restoreGeneratorDefaults(){
  if(!activeShipId)return;const label=getShipDesign(activeShipId)?.label||activeShipId;
  if(!window.confirm('Restore '+label+' to its original generator defaults? This clears only its editor-defaults.js file and leaves all individual part generators untouched.'))return;
  const button=document.querySelector('#restore-generator-defaults');if(button)button.disabled=true;
  try{
    const response=await fetch('/__ship-editor/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shipId:activeShipId})});
    if(!response.ok)throw new Error('Local reset endpoint returned '+response.status);
    const result=await response.json();if(!result.saved)throw new Error(result.error||'The local server did not confirm the reset.');
    setStatus('Restored '+label+' to the original generator defaults. Reloading…');window.location.reload();
  }catch(error){setStatus('Could not restore generator defaults: '+error.message,true);}
  finally{if(button)button.disabled=false;}
}
function exportDesign(){
  const blob=new Blob([JSON.stringify(buildExport(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='verdant-reach-vessel-authoring-backup.json';link.click();URL.revokeObjectURL(url);
  setStatus('Exported a full backup of all 16 vessels, including saved defaults and current edits.');
}

renderTransformInputs();
refreshSeaControls();
refreshSelectionCount();
updateSaveIndicator();
window.addEventListener('beforeunload',event=>{if(!hasUnsavedChanges)return;event.preventDefault();event.returnValue='';});
categorySelector.addEventListener('change',()=>{
  syncCurrentShipState();
  const first=categorySelector.value==='miscellaneous'?MISC_MODEL_IDS[0]:VESSEL_IDS[0];
  refreshModelOptions(categorySelector.value,first);
  loadShip(selector.value);
  refreshHistory();
});
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
  if(!ship||(!selectedName&&!selectedNames.length))return;
  const names=selectedNames.length?selectedNames:[selectedName];
  const before=captureDocumentSnapshot();
  for(const name of names)ship.userData.resetPartTransform(name);
  syncCurrentShipState();
  commitHistory(before,names.length>1?'Reset '+names.length+' selected components':'Reset component '+selectedName);
  refreshTransformFields();refreshSelectionTools();setSelectionHelpers(names);
});
document.querySelector('#reset-all-parts').addEventListener('click',resetAllComponents);
document.querySelector('#reset-vessel').addEventListener('click',resetVesselDesign);
document.querySelector('#detach-part').addEventListener('click',detachSelectedPart);
document.querySelector('#relink-part').addEventListener('click',relinkSelectedPart);
document.querySelector('#wireframe-toggle').addEventListener('click',toggleWireframe);
document.querySelector('#grid-toggle').addEventListener('click',toggleGrid);
document.querySelector('#shadows-toggle').addEventListener('click',toggleShadows);
document.querySelector('#frame-selected').addEventListener('click',frameSelection);
document.querySelector('#toggle-visibility').addEventListener('click',()=>{
  if(!ship||(!selectedName&&!selectedNames.length))return;
  const names=selectedNames.length?selectedNames:[selectedName];
  const allVisible=names.every(name=>ship.userData.getPart(name)?.visible);
  const before=captureDocumentSnapshot();
  for(const name of names)ship.userData.setPartVisible(name,!allVisible);
  syncCurrentShipState();
  commitHistory(before,(allVisible?'Hide ':'Show ')+names.length+' selected components');
  refreshSelectionTools();setSelectionHelpers(names);
});
document.querySelector('#isolate-selected').addEventListener('click',isolateSelected);
document.querySelector('#show-all-parts').addEventListener('click',showAllComponents);
document.querySelector('#part-search').addEventListener('input',populatePartList);
document.querySelector('#box-select-toggle').addEventListener('click',toggleBoxSelect);
document.querySelector('#clear-selection').addEventListener('click',clearSelection);
document.querySelector('#space-toggle').addEventListener('click',toggleSpace);
document.querySelector('#snap-toggle').addEventListener('click',toggleSnap);
document.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>setCameraPreset(button.dataset.camera)));
document.querySelector('#save-design').addEventListener('click',saveDesign);
document.querySelector('#restore-generator-defaults')?.addEventListener('click',restoreGeneratorDefaults);
document.querySelector('#export-design').addEventListener('click',exportDesign);
document.querySelector('#export-design-secondary')?.addEventListener('click',exportDesign);
document.querySelector('#compare-select')?.addEventListener('change',updateComparison);
document.querySelector('#sea-surface-toggle')?.addEventListener('click',()=>{
  seaSurface.visible=!seaSurface.visible;refreshSeaControls();
});
document.querySelector('#sea-toggle')?.addEventListener('click',()=>{
  seaSettings.enabled=!seaSettings.enabled;
  if(seaSettings.enabled&&seaSettings.heightMeters<.05){
    seaSettings.heightMeters=.5;seaSettings.periodSeconds=4.5;seaSettings.preset='light';
  }
  refreshSeaControls();
});
document.querySelector('#wave-direction')?.addEventListener('input',event=>{
  seaSettings.directionDeg=((Number(event.target.value)||0)%360+360)%360;refreshSeaControls();
});
document.querySelector('#wave-height')?.addEventListener('input',event=>{
  seaSettings.heightMeters=Number(event.target.value)||0;seaSettings.preset='custom';refreshSeaControls();
});
document.querySelector('#wave-period')?.addEventListener('input',event=>{
  seaSettings.periodSeconds=Number(event.target.value)||2;seaSettings.preset='custom';refreshSeaControls();
});
document.querySelectorAll('[data-sea-preset]').forEach(button=>button.addEventListener('click',()=>applySeaPreset(button.dataset.seaPreset)));
document.querySelectorAll('[data-wave-direction]').forEach(button=>button.addEventListener('click',()=>{
  seaSettings.directionDeg=Number(button.dataset.waveDirection)||0;refreshSeaControls();
}));
document.querySelector('#sea-reset')?.addEventListener('click',()=>{
  Object.assign(seaSettings,{enabled:false,directionDeg:90,heightMeters:0,periodSeconds:5,preset:'flat'});
  refreshSeaControls();
});
document.querySelector('#wind-toggle')?.addEventListener('click',()=>{windSettings.enabled=!windSettings.enabled;refreshSailingControls();});
document.querySelector('#wind-direction')?.addEventListener('input',event=>{windSettings.directionDeg=Number(event.target.value)||0;refreshSailingControls();});
document.querySelector('#wind-speed')?.addEventListener('input',event=>{windSettings.speedKnots=Number(event.target.value)||0;refreshSailingControls();});
document.querySelectorAll('[data-wind-direction]').forEach(button=>button.addEventListener('click',()=>{
  windSettings.directionDeg=Number(button.dataset.windDirection)||0;refreshSailingControls();
}));
document.querySelector('#gust-toggle')?.addEventListener('click',()=>{windSettings.gusts=!windSettings.gusts;refreshSailingControls();});
document.querySelector('#sails-full')?.addEventListener('click',()=>setAllSails('full'));
document.querySelector('#sails-reef')?.addEventListener('click',()=>setAllSails('reefed'));
document.querySelector('#sails-furl')?.addEventListener('click',()=>setAllSails('furled'));
document.querySelector('#simulation-toggle')?.addEventListener('click',()=>{windSettings.paused=!windSettings.paused;refreshSailingControls();});
document.querySelector('#sailing-reset')?.addEventListener('click',()=>{
  windSettings.enabled=false;windSettings.directionDeg=90;windSettings.speedKnots=12;
  windSettings.gusts=false;windSettings.paused=false;
  if(ship){
   ship.userData.setRudderAngle(0);
   for(const mast of SHIP_DESIGNS[activeShipId]?.masts||[])ship.userData.setSailDeployment(mast.id,'full',0);
  }
  refreshSailingControls();
});
document.querySelector('#rudder-angle')?.addEventListener('input',event=>{if(ship){ship.userData.setRudderAngle(THREE.MathUtils.degToRad(Number(event.target.value)||0));refreshSailingControls();}});
document.querySelector('#rudder-center')?.addEventListener('click',()=>{if(ship){const field=document.querySelector('#rudder-angle');if(field)field.value='0';ship.userData.setRudderAngle(0);refreshSailingControls();}});
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
    const importedMisc=parsed?.miscModels&&typeof parsed.miscModels==='object'?parsed.miscModels:{};
    if(!imported||typeof imported!=='object'||Array.isArray(imported))throw new Error('The file must contain a model configuration object.');
    const next={};
    for(const [id,config] of Object.entries(imported)){
      if(!Object.hasOwn(SHIP_DESIGNS,id)&&!isMiscModelId(id))continue;
      if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('Invalid configuration for '+id+'.');
      next[id]=clone(config);
    }
    for(const [id,config] of Object.entries(importedMisc)){
      if(!isMiscModelId(id))continue;
      if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('Invalid configuration for '+id+'.');
      next[id]=clone(config);
    }
    if(!Object.keys(next).length)throw new Error('No known model configurations were found in this file.');
    const before=captureDocumentSnapshot();
    const previous=overrideConfig;
    try{
      overrideConfig=next;applyOverrides();
      loadShip(activeShipId,selectedName,false,true);
      if(!ship)throw new Error('The current vessel could not be rebuilt from this file.');
    }catch(error){overrideConfig=previous;applyOverrides();loadShip(activeShipId,selectedName,false,true);throw error;}
    commitHistory(before,'Import '+file.name);
    hasUnsavedChanges=true;updateSaveIndicator();
    setStatus('Imported '+Object.keys(next).length+' model configuration(s) from '+file.name+'. This is an unsaved draft; press Save to ship files to commit it.');
  }catch(error){setStatus('Import failed: '+error.message,true);}
  finally{event.target.value='';}
});
function updateMarqueeOverlay(start,end){
  const rect=renderer.domElement.getBoundingClientRect();
  marqueeOverlay.style.left=(Math.min(start.x,end.x)-rect.left)+'px';
  marqueeOverlay.style.top=(Math.min(start.y,end.y)-rect.top)+'px';
  marqueeOverlay.style.width=Math.abs(end.x-start.x)+'px';marqueeOverlay.style.height=Math.abs(end.y-start.y)+'px';
  marqueeOverlay.classList.toggle('crossing',end.x<start.x);
}
function finishMarqueeSelection(event){
  if(!marqueeStart)return;
  const start=marqueeStart,end={x:event.clientX,y:event.clientY};
  const moved=Math.hypot(end.x-start.x,end.y-start.y)>=6;
  marqueeStart=null;marqueeOverlay.hidden=true;orbit.enabled=true;
  if(event.pointerId!==undefined&&renderer.domElement.hasPointerCapture?.(event.pointerId)){try{renderer.domElement.releasePointerCapture(event.pointerId);}catch{}}
  suppressCanvasClick=moved;
  if(moved)selectPartsInRectangle(start,end,start.append);
}
renderer.domElement.addEventListener('pointerdown',event=>{
  if(!marqueeMode||event.button!==0||gizmo.dragging||gizmo.axis)return;
  // Capture phase runs before OrbitControls' target listener so orbit never
  // begins a drag that box selection then has to interrupt. Do not cancel the
  // pointer press: a short click must still reach the normal part-picking handler.
  orbit.enabled=false;
  suppressCanvasClick=false;
  marqueeStart={x:event.clientX,y:event.clientY,append:event.shiftKey||event.ctrlKey||event.metaKey};
  marqueeOverlay.hidden=false;updateMarqueeOverlay(marqueeStart,marqueeStart);orbit.enabled=false;
  try{renderer.domElement.setPointerCapture(event.pointerId);}catch{}
},true);
window.addEventListener('pointermove',event=>{if(marqueeStart)updateMarqueeOverlay(marqueeStart,event);});
window.addEventListener('pointerup',finishMarqueeSelection);
window.addEventListener('pointercancel',finishMarqueeSelection);
renderer.domElement.addEventListener('click',event=>{
  if(suppressCanvasClick){suppressCanvasClick=false;return;}
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
  if(marqueeMode&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey)clearSelection();
});
gizmo.addEventListener('mouseDown',()=>{
  if(selectedNames.length>1&&selectionPivot){groupDragSession=beginGroupTransform();return;}
  dragSnapshot=captureDocumentSnapshot();
});
gizmo.addEventListener('mouseUp',()=>{
  if(groupDragSession){
    const session=finishGroupTransform();
    if(session){syncCurrentShipState();commitHistory(session.before,'Group transform '+session.members.length+' components');refreshTransformFields();refreshSelectionTools();refreshPartInspector();}
    return;
  }
  if(!dragSnapshot)return;
  syncCurrentShipState();commitHistory(dragSnapshot,'Gizmo transform '+selectedName);
  dragSnapshot=null;refreshTransformFields();updateSelectionHelpers();
});
window.addEventListener('keydown',event=>{
  const target=event.target;
  const typing=target instanceof HTMLElement&&(
    target.isContentEditable||
    ['INPUT','TEXTAREA','SELECT'].includes(target.tagName)
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
  else if(key==='f'&&ship&&(selectedName||selectedNames.length))frameSelection();
  else if(key==='q')toggleBoxSelect();
});
function resize(){
  const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
const animationClock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const delta=Math.min(animationClock.getDelta(),.05);
  if(!windSettings.paused&&ship?.userData.animateShip)ship.userData.animateShip(delta,windSettings);
  updateSailingTelemetry();
  updateSloopRockingTelemetry();
  orbit.update();updateSelectionHelpers();renderer.render(scene,camera);
}
refreshModelOptions(categorySelector.value,selector.value);
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
