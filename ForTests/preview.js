import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SHIP_DESIGNS } from './ship-designs.js?v=0.8.5';
import { createShipModel, disposeShipModel } from './ship-models.js?v=0.8.5';

const viewport=document.querySelector('#viewport'),selector=document.querySelector('#ship-select'),status=document.querySelector('#status');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101a22);scene.fog=new THREE.Fog(0x101a22,120,900);
const camera=new THREE.PerspectiveCamera(42,1,.1,4000);camera.position.set(30,24,40);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;
controls.maxPolarAngle=Math.PI*.49;controls.minDistance=3;controls.maxDistance=900;
scene.add(new THREE.HemisphereLight(0xc9e0e7,0x463d32,2.1));
const key=new THREE.DirectionalLight(0xffe5bf,3);key.position.set(-55,90,-35);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-100;key.shadow.camera.right=100;key.shadow.camera.top=100;key.shadow.camera.bottom=-100;scene.add(key);
const fill=new THREE.DirectionalLight(0x9ac6db,1.2);fill.position.set(50,35,65);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshStandardMaterial({color:0x203943,roughness:.88,metalness:.04}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(500,50,0x58717a,0x324b55);grid.material.transparent=true;grid.material.opacity=.28;scene.add(grid);
for(const [id,d] of Object.entries(SHIP_DESIGNS)){const o=document.createElement('option');o.value=id;o.textContent=d.label;selector.appendChild(o);}
let ship=null;
function fit(object){
 object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const diameter=Math.max(size.x,size.y,size.z,1),distance=diameter*1.7;
 camera.position.set(center.x+distance*.88,center.y+distance*.62,center.z+distance*1.15);
 camera.near=Math.max(.05,diameter/1000);camera.far=Math.max(2000,diameter*30);camera.updateProjectionMatrix();
 controls.target.copy(center);controls.minDistance=Math.max(1,diameter*.12);controls.maxDistance=diameter*8;controls.update();
 const y=box.min.y-Math.max(.25,diameter*.008);ground.position.y=y;grid.position.y=y+.015;
}
function load(type){
 if(ship){disposeShipModel(ship);ship=null;}
 const d=SHIP_DESIGNS[type];if(!d){status.textContent='Unknown vessel design.';return;}
 try{
  ship=createShipModel(type);scene.add(ship);fit(ship);
  document.querySelector('#length').textContent=d.hullLength.toFixed(2)+' m';
  document.querySelector('#beam').textContent=d.beam.toFixed(2)+' m';
  document.querySelector('#draft').textContent=d.draft.toFixed(2)+' m';
  document.querySelector('#masts').textContent=d.masts.length;
  document.querySelector('#parts').textContent=ship.userData.partNames.length;
  document.querySelector('#description').textContent=d.hullProfile+' '+(d.reference||'');
  status.textContent='Loaded '+d.label+' · '+ship.userData.partNames.length+' registered parts';
 }catch(e){status.textContent='Could not build ship: '+(e?.message||String(e));console.error(e);}
}
selector.addEventListener('change',()=>load(selector.value));
document.querySelector('#reset-camera').addEventListener('click',()=>{if(ship)fit(ship);});
function resize(){const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
load(selector.value||Object.keys(SHIP_DESIGNS)[0]);animate();
window.addEventListener('beforeunload',()=>{resizeObserver.disconnect();if(ship)disposeShipModel(ship);renderer.dispose();});
