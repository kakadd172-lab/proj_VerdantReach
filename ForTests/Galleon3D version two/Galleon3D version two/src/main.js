import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GalleonMaster } from './core/GalleonMaster.js';
import { UIManager } from './ui/UIManager.js';

const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x84a6c4);
scene.fog = new THREE.FogExp2(0x84a6c4, 0.0045);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.2, 500);
camera.position.set(24, 12, 26);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 4;
controls.maxDistance = 120;
controls.target.set(0, 3.2, 0);

const CAMERA_PRESETS = {
  overview: { pos: [24, 12, 26], target: [0, 3.2, 0] },
  quarterdeck: { pos: [2.2, 6.2, -9.2], target: [0, 5.2, -6.2] },
  sternRudder: { pos: [7.5, 2.5, -18.5], target: [0, 1.5, -11.5] },
  deckGuns: { pos: [10.5, 4.5, 1.5], target: [0, 2.8, 0] },
  riggingTop: { pos: [10.0, 14.5, 9.0], target: [0, 11.0, 0] },
  bowAnchor: { pos: [8.5, 3.2, 16.5], target: [0, 1.4, 10.5] },
};

function setCameraView(name) {
  const p = CAMERA_PRESETS[name] || CAMERA_PRESETS.overview;
  camera.position.set(...p.pos);
  controls.target.set(...p.target);
  controls.update();
}

const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e3a5f, 0.9);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
sunLight.position.set(42, 60, 32);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 160;
const bound = 28;
sunLight.shadow.camera.left = -bound;
sunLight.shadow.camera.right = bound;
sunLight.shadow.camera.top = bound;
sunLight.shadow.camera.bottom = -bound;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
rimLight.position.set(-35, 18, -38);
scene.add(rimLight);

const waterGeo = new THREE.PlaneGeometry(420, 420, 64, 64);
waterGeo.rotateX(-Math.PI / 2);
const waterPos = waterGeo.attributes.position;
const waterBaseY = new Float32Array(waterPos.count);
for (let i = 0; i < waterPos.count; i++) waterBaseY[i] = waterPos.getY(i);

const waterMat = new THREE.MeshStandardMaterial({
  color: 0x0c3854,
  roughness: 0.22,
  metalness: 0.14,
  transparent: true,
  opacity: 0.88,
});
const waterMesh = new THREE.Mesh(waterGeo, waterMat);
waterMesh.receiveShadow = true;
scene.add(waterMesh);

const galleon = new GalleonMaster();
scene.add(galleon.generate());
window.galleon = galleon;

function applyLightingMood(mood) {
  if (mood === 'golden') {
    scene.background.setHex(0xd99b66);
    scene.fog.color.setHex(0xd99b66);
    sunLight.color.setHex(0xffb469);
    sunLight.intensity = 2.8;
    sunLight.position.set(50, 22, -36);
    hemiLight.color.setHex(0xfde68a);
    hemiLight.intensity = 0.75;
    waterMat.color.setHex(0x133b5c);
  } else if (mood === 'night') {
    scene.background.setHex(0x091326);
    scene.fog.color.setHex(0x091326);
    sunLight.color.setHex(0x93c5fd);
    sunLight.intensity = 0.75;
    sunLight.position.set(-40, 52, -32);
    hemiLight.color.setHex(0x1e3a8a);
    hemiLight.intensity = 0.42;
    waterMat.color.setHex(0x041526);
    galleon.setEnvironment({ lanternsLit: true });
    ui.syncAnchorAndLanternUI();
  } else if (mood === 'stormy') {
    scene.background.setHex(0x334155);
    scene.fog.color.setHex(0x334155);
    sunLight.color.setHex(0x94a3b8);
    sunLight.intensity = 1.35;
    hemiLight.color.setHex(0x64748b);
    hemiLight.intensity = 0.65;
    waterMat.color.setHex(0x0f293a);
  } else {
    scene.background.setHex(0x84a6c4);
    scene.fog.color.setHex(0x84a6c4);
    sunLight.color.setHex(0xfff4e0);
    sunLight.intensity = 2.5;
    sunLight.position.set(42, 60, 32);
    hemiLight.color.setHex(0xe0f2fe);
    hemiLight.intensity = 0.9;
    waterMat.color.setHex(0x0c3854);
  }
}

const ui = new UIManager(galleon, {
  onCameraPreset: setCameraView,
  onLightingMood: applyLightingMood,
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'r') setCameraView('overview');
  else if (k === '1') galleon.setSailDeployment('full');
  else if (k === '2') galleon.setSailDeployment('half');
  else if (k === '3') galleon.setSailDeployment('battle');
  else if (k === '4') galleon.setSailDeployment('furled');
  else if (k === '5') galleon.setSailDeployment('none');
  else if (k === 'f') galleon.fireBroadside('both');
  else if (k === 'a') {
    galleon.setEnvironment({ anchorDropped: !galleon.envState.anchorDropped });
    ui.syncAnchorAndLanternUI();
  } else if (k === 'l') {
    galleon.setEnvironment({ lanternsLit: !galleon.envState.lanternsLit });
    ui.syncAnchorAndLanternUI();
  } else if (k === ' ') {
    e.preventDefault();
    galleon.setEnvironment({ autoDemo: !galleon.envState.autoDemo });
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  const swell = galleon.envState.seaState;
  for (let i = 0; i < waterPos.count; i++) {
    const x = waterPos.getX(i);
    const z = waterPos.getZ(i);
    const wave =
      Math.sin(x * 0.09 + elapsed * 1.45) * 0.14 * swell +
      Math.cos(z * 0.08 + elapsed * 1.15) * 0.12 * swell;
    waterPos.setY(i, waterBaseY[i] + wave);
  }
  waterPos.needsUpdate = true;

  galleon.update(dt);
  controls.update();
  renderer.render(scene, camera);
}

animate();
