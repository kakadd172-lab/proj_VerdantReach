import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WorldGenerator } from './world/terrain.js';
import { WorldManager } from './world/world-manager.js';
import { createSharedWorldAssets } from './world/chunk.js';
import { Player } from './entities/player.js';
import { RPGSystem } from './systems/rpg.js';
import { CivilizationSystem } from './systems/civilization.js';
import { EcosystemSystem } from './systems/ecosystem.js';
import { WeatherSystem } from './systems/weather.js';
import { TransportSystem } from './systems/transport.js';
import { CombatSystem } from './systems/combat.js';
import { WorldIntelligence } from './world/world-intelligence.js';
import { WorldActorManager } from './world/world-actors.js';
import { WeatherVisuals } from './world/weather-visuals.js';
import { saveWorld, loadWorld, hasAnySave, getLatestSave, listSavedWorlds, deleteWorld } from './systems/persistence.js';
import { GameInterface } from './ui/interface.js';
import { formatSeed } from './core/random.js';
import { TEST_WORLD_SEED, TEST_WORLD_NAME, createFieldTestLayout } from './world/field-test-world.js';
import { FieldTestCourse } from './world/field-test-course.js';
import { WorldNeedsSystem } from './systems/world-needs.js';
import { WorldEditSystem } from './systems/world-editing.js';
import { MaritimeSystem } from './systems/maritime.js';
import { resolveGameMode } from './systems/game-mode.js';
import { createCreativeEntity, disposeCreativeEntity } from './world/creative-entities.js';
import { getShipTypeFromCreativeKind, getShipDesign, WORLD_UNITS_PER_METRE } from './world/ship-designs.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#world-canvas');
const ui = new GameInterface();

// Keep the title-screen controls alive even if the rendering setup fails.
// Previously these listeners were attached at the very bottom of this file,
// after WebGL and the entire game scene had already initialized.
function reportStartupError(title, error) {
  const detail = error?.stack || error?.message || String(error ?? 'Unknown startup error');
  console.error(`[Verdant Reach] ${title}`, error);
  try {
    ui.hideLoading();
    ui.showMenu();
  } catch (uiError) {
    console.error('[Verdant Reach] Could not restore the title screen', uiError);
  }
  if (typeof window.__verdantReportError === 'function') {
    window.__verdantReportError(title, detail);
  } else {
    window.alert(`${title}\n\n${detail}`);
  }
}

function runMenuAction(title, action) {
  Promise.resolve().then(action).catch((error) => reportStartupError(title, error));
}

$('#random-seed').addEventListener('click', () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = '';
  for (let i = 0; i < 10; i += 1) seed += alphabet[Math.floor(Math.random() * alphabet.length)];
  ui.setSeed(seed);
});
$('#start-world').addEventListener('click', () => {
  runMenuAction('Could not start this world', () => startWorld(ui.getSeed(), true, ui.getSelectedMode()));
});
$('#continue-world').addEventListener('click', () => runMenuAction('Could not continue the saved world', async () => {
  const latest = await getLatestSave();
  if (!latest?.seed) {
    ui.toast('No saved journey found', 'Create a new world to begin.');
    return;
  }
  ui.setSeed(latest.seed);
  await startWorld(latest.seed, true);
}));

// These listeners run before renderer construction so a WebGL failure can be
// surfaced to the player instead of leaving a visible but inert menu.
window.addEventListener('error', (event) => {
  // Do not throw the player back to the title screen for an unrelated error
  // after they have entered a running world.
  if (!ui.menu.classList.contains('hidden') && (event?.error || event?.message)) {
    reportStartupError('A game script encountered an error', event.error ?? event.message);
  }
}, true);
window.addEventListener('unhandledrejection', (event) => {
  if (!ui.menu.classList.contains('hidden')) reportStartupError('A game operation failed', event.reason);
});

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  reportStartupError('Verdant Reach could not initialize WebGL 2', error);
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb3a4);
scene.fog = new THREE.FogExp2(0x9eb3a4, 0.00175);

const camera = new THREE.PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(30, 42, 38);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = false;
controls.rotateSpeed = 0.52;
controls.zoomSpeed = 0.82;
controls.minDistance = 23;
controls.maxDistance = 90;
controls.minPolarAngle = 0.42;
controls.maxPolarAngle = 1.23;
controls.target.set(0, 2, 0);
controls.update();

const hemiLight = new THREE.HemisphereLight(0xd9e7dc, 0x465349, 1.15);
scene.add(hemiLight);
const sun = new THREE.DirectionalLight(0xffe5bd, 2.05);
sun.position.set(-70, 105, -55);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -90;
sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 260;
sun.shadow.bias = -0.00014;
sun.shadow.normalBias = 0.035;
scene.add(sun);
scene.add(sun.target);

const fillLight = new THREE.DirectionalLight(0x8fbdc3, 0.42);
fillLight.position.set(50, 36, 60);
scene.add(fillLight);

const sharedAssets = createSharedWorldAssets();
const clock = new THREE.Timer();
clock.connect(document);
const keys = new Set();
const input = { forward: false, backward: false, left: false, right: false, run: false };

let generator = null;
let worldManager = null;
let player = null;
let rpg = null;
let intelligence = null;
let civilization = null;
let ecosystem = null;
let weatherSystem = null;
let transport = null;
let combat = null;
let needsSystem = null;
let worldEdits = null;
let maritime = null;
let gameMode = 'survival';
let creativeRoot = null;
const creativeModels = new Map();
let creativeTimeOffsetMinutes = 0;
let creativeWeatherOverride = null;
let mountedCreativeShipId = null;
let worldActors = null;
let weatherVisuals = null;
let fieldTestLayout = null;
let fieldTestCourse = null;
let isFieldTestWorld = false;
let currentWeather = null;
let currentMarketSettlement = null;
let lastSimulatedDay = -1;
let currentSeason = '';
let worldSeed = '';
let worldStartPosition = null;
let gameActive = false;
let paused = false;
let worldSeconds = 0;
let dayCount = 1;
let saveTimer = 0;
let streamTick = 0;
let currentNearby = null;
let lastExploredCell = '';
const collectedItems = new Set();
const exploredSectors = new Set();
const visualEffects = [];

const pulseGeometry = new THREE.TorusGeometry(1, 0.045, 8, 64);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
}
window.addEventListener('resize', resize);

function setCameraEnabled(enabled) {
  controls.enabled = enabled;
}

function setPaused(value) {
  paused = value;
  setCameraEnabled(!value && !ui.currentPanel);
  if (!value) ui.pauseScreen.classList.add('hidden');
}

function setInput() {
  input.forward = keys.has('KeyW') || keys.has('ArrowUp');
  input.backward = keys.has('KeyS') || keys.has('ArrowDown');
  input.left = keys.has('KeyA') || keys.has('ArrowLeft');
  input.right = keys.has('KeyD') || keys.has('ArrowRight');
  input.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
}

function makeWeatherOverride(baseWeather, type) {
  if (!baseWeather || !type || type === 'natural') return baseWeather;
  const profile = {
    clear: { label: 'CLEAR SKIES', intensity: 0, windStrength: 0.12, visibility: 1 },
    overcast: { label: 'OVERCAST', intensity: 0.3, windStrength: 0.24, visibility: 0.92 },
    rain: { label: 'RAIN', intensity: 0.62, windStrength: 0.42, visibility: 0.78 },
    storm: { label: 'STORM', intensity: 0.95, windStrength: 0.92, visibility: 0.58 },
    snow: { label: 'SNOW', intensity: 0.68, windStrength: 0.48, visibility: 0.72 },
    fog: { label: 'FOG', intensity: 0.45, windStrength: 0.12, visibility: 0.38 },
  }[type];
  if (!profile) return baseWeather;
  return { ...baseWeather, ...profile, type, forced: true };
}

function isCreativeWatercraftKind(kind) {
  return ['rowboat', 'sailing-ship', 'large-ship'].includes(kind) || Boolean(getShipTypeFromCreativeKind(kind));
}

function syncCreativeModels() {
  if (!creativeRoot || !worldEdits) return;
  for (const model of creativeModels.values()) disposeCreativeEntity(model);
  creativeModels.clear();
  for (const entity of worldEdits.entities) {
    if (entity.kind !== 'village' && entity.kind !== 'port') createCreativeVisual(entity);
  }
}

function createCreativeVisual(record) {
  if (!creativeRoot || !record || record.kind === 'village' || record.kind === 'port') return null;
  const previous = creativeModels.get(record.id);
  if (previous) disposeCreativeEntity(previous);
  const model = createCreativeEntity(record.kind);
  const ground = generator.heightAt(record.x, record.z);
  const isWatercraft = isCreativeWatercraftKind(record.kind);
  const shipType = getShipTypeFromCreativeKind(record.kind);
  const y = Number.isFinite(record.y) ? record.y : (isWatercraft && ground < 1.4 ? -0.12 : ground);
  model.position.set(record.x, y, record.z);
  // The historical model meshes have their bow along local -Z; player/editor
  // facing is expressed along +Z, so rotate those hulls by half a turn.
  model.rotation.y = (Number(record.yaw) || 0) + (shipType ? Math.PI : 0);
  if (isWatercraft) {
    const design = shipType ? getShipDesign(shipType) : null;
    model.userData.vehicle = { mode: 'boat', vesselType: shipType, deckHeight: design ? design.deckHeightUnits : 0.45, label: shipType ? `Board ${design.label}` : 'Board skiff' };
    if (record.shipState && model.userData.applyShipState) model.userData.applyShipState(record.shipState);
  }
  model.scale.setScalar(Math.max(0.35, Math.min(4, Number(record.scale) || 1)));
  model.userData.worldX = record.x;
  model.userData.worldZ = record.z;
  model.userData.creativeId = record.id;
  creativeRoot.add(model);
  creativeModels.set(record.id, model);
  return model;
}

function updateCreativeVisibility() {
  if (!creativeRoot || !player) return;
  for (const model of creativeModels.values()) {
    const distance = Math.hypot((model.userData.worldX ?? 0) - player.position.x, (model.userData.worldZ ?? 0) - player.position.z);
    model.visible = distance <= 1050;
  }
}

function pruneCreativeModels() {
  if (!worldEdits) return;
  const liveIds = new Set(worldEdits.entities.map((entity) => entity.id));
  for (const [id, model] of creativeModels) {
    if (liveIds.has(id)) continue;
    disposeCreativeEntity(model);
    creativeModels.delete(id);
  }
}

function creativePlacement(kind, ahead = false) {
  const facing = player?.facing ?? 0;
  const distance = ahead ? 24 : 8;
  let x = player.position.x + Math.sin(facing) * distance;
  let z = player.position.z + Math.cos(facing) * distance;
  const watercraft = isCreativeWatercraftKind(kind);
  const shipType = getShipTypeFromCreativeKind(kind);
  const shipFits = (candidateX, candidateZ) => {
    if (!shipType) return generator.heightAt(candidateX, candidateZ) <= 0.75;
    const design = getShipDesign(shipType);
    const forwardX = Math.sin(facing);
    const forwardZ = Math.cos(facing);
    const sideX = forwardZ;
    const sideZ = -forwardX;
    // Check the bow, waist and stern on both sides of the hull. This avoids
    // placing a 40 m schooner with half its hull sitting on a beach.
    const stations = [-0.46, -0.23, 0, 0.23, 0.46];
    const sides = [-0.34, 0, 0.34];
    let shallowest = -Infinity;
    for (const station of stations) for (const side of sides) {
      const sx = candidateX + forwardX * design.hullLengthUnits * station + sideX * design.beamUnits * side;
      const sz = candidateZ + forwardZ * design.hullLengthUnits * station + sideZ * design.beamUnits * side;
      const height = generator.heightAt(sx, sz);
      if (height > 0.45) return false;
      // The shallowest sampled seabed governs whether the full draft clears.
      shallowest = Math.max(shallowest, height);
    }
    return shallowest < -Math.max(1.0, design.draftUnits * 0.52);
  };
  if (watercraft && !shipFits(x, z)) {
    let found = null;
    for (let radius = 18; radius <= 1500 && !found; radius += 30) {
      for (let i = 0; i < 24; i += 1) {
        const angle = i * Math.PI * 2 / 24;
        const candidateX = x + Math.cos(angle) * radius;
        const candidateZ = z + Math.sin(angle) * radius;
        if (shipFits(candidateX, candidateZ)) {
          found = { x: candidateX, z: candidateZ, y: -0.12 };
          break;
        }
      }
    }
    if (found) return { ...found, yaw: facing };
    if (shipType) return null;
  }
  const height = generator.heightAt(x, z);
  return { x, z, y: watercraft && height < 1.4 ? -0.12 : height, yaw: facing };
}

function teleportPlayerToWorldPosition(x, z) {
  if (!player || !worldManager) throw new Error('The world is not ready for teleportation.');
  if (transport?.mounted) {
    if (mountedCreativeShipId) {
      const vessel = worldEdits?.entities.find((entity) => entity.id === mountedCreativeShipId);
      const model = creativeModels.get(mountedCreativeShipId);
      if (vessel) {
        vessel.x = player.position.x;
        vessel.z = player.position.z;
        vessel.y = -0.12;
        vessel.yaw = player.facing;
      }
      if (model && vessel) {
        model.position.set(vessel.x, -0.12, vessel.z);
        model.userData.worldX = vessel.x;
        model.userData.worldZ = vessel.z;
      }
      mountedCreativeShipId = null;
    } else if (transport.vehicleId) {
      worldActors?.vehiclePosition(transport.vehicleId, player.position.x, player.position.z, player.position.y);
    }
    transport.dismount();
  }
  player.setPosition(x, z);
  worldManager.setRenderOrigin(x, z);
  player.setRenderOrigin(worldManager.renderOriginX, worldManager.renderOriginZ);
  worldManager.update(x, z);
  worldManager.processQueue(9);
  worldActors?.refreshNow(x, z, dayCount);
  worldActors?.update(0, x, z, getWorldClock().hour, getWorldClock().day, worldManager.renderOriginX, worldManager.renderOriginZ);
  if (creativeRoot) creativeRoot.position.set(-worldManager.renderOriginX, 0, -worldManager.renderOriginZ);
  controls.target.set(x - worldManager.renderOriginX, player.position.y + 1.12, z - worldManager.renderOriginZ);
  camera.position.set(controls.target.x + 33, controls.target.y + 42, controls.target.z + 35);
  controls.update();
}

function findTeleportArrival(destination) {
  const radius = destination.type === 'freeCity' ? (destination.urbanRadius ?? 418) + 50
    : destination.type === 'ruinedCastle' ? 256
      : ['port', 'market', 'village'].includes(destination.type) ? 38 : 12;
  const preferred = destination.type === 'freeCity'
    ? { x: destination.x, z: destination.z - radius }
    : destination.type === 'ruinedCastle'
      ? { x: destination.x, z: destination.z + radius }
      : { x: destination.x, z: destination.z };
  const offsets = [{ x: preferred.x, z: preferred.z }];
  for (let ring = 0; ring <= 7; ring += 1) {
    const ringRadius = ring * 18;
    for (let i = 0; i < 16; i += 1) {
      const angle = i * Math.PI * 2 / 16;
      offsets.push({ x: preferred.x + Math.cos(angle) * ringRadius, z: preferred.z + Math.sin(angle) * ringRadius });
    }
  }
  let best = null;
  for (const candidate of offsets) {
    const sample = generator.sample(candidate.x, candidate.z, true);
    if (sample.height < 3.2 || sample.height > 118 || sample.slope > 0.95) continue;
    const score = sample.slope * 2 + Math.abs(sample.height - 12) * 0.008 + Math.hypot(candidate.x - preferred.x, candidate.z - preferred.z) * 0.001;
    if (!best || score < best.score) best = { ...candidate, score };
    if (score < 0.25) break;
  }
  return best ? { x: best.x, z: best.z } : null;
}

async function handleCreativeAction(payload = {}) {
  if (gameMode !== 'creative' || !gameActive || !player || !worldEdits) return;
  const action = payload.action;
  let message = '';
  let title = 'World edited';
  try {
    if (action === 'summon' || action === 'summon-ahead') {
      const kind = payload.entity;
      const position = creativePlacement(kind, action === 'summon-ahead');
      if (!position) throw new Error('No suitable water was found nearby for that vessel. Move closer to a coast or open-water area.');
      const record = worldEdits.summon(kind, position.x, position.z, { yaw: position.yaw, createdAt: dayCount, scale: Number(payload.scale) || 1 });
      if (!record) throw new Error('That entity could not be placed. Choose another entity and try again.');
      pruneCreativeModels();
      record.y = position.y;
      const stored = worldEdits.entities.find((item) => item.id === record.id);
      if (stored) stored.y = position.y;
      if (kind === 'village' || kind === 'port') {
        const settlement = intelligence.addCustomSettlement({ id: record.id, x: position.x, z: position.z, kind, name: kind === 'port' ? 'New Tidehaven' : 'Newstead' });
        if (!settlement) {
          worldEdits.removeEntity(record.id);
          throw new Error(kind === 'port' ? 'A port needs suitable coastal land. Move closer to a shoreline and try again.' : 'No suitable settlement ground was found nearby. Try a flatter grassland or forest area.');
        }
        if (stored) { stored.x = settlement.x; stored.z = settlement.z; stored.y = settlement.elevation; }
        worldEdits.addSettlement({ id: settlement.id, x: settlement.x, z: settlement.z, kind, name: settlement.name, basePopulation: settlement.basePopulation, buildingCount: settlement.buildingCount });
        civilization.registerSettlements([settlement], dayCount);
        worldActors.refreshNow(player.position.x, player.position.z, dayCount);
        maritime.registerPorts(intelligence.settlementsNear(player.position.x, player.position.z, 2600));
        message = `${settlement.name} created with residents, buildings and a local market.`;
      } else {
        createCreativeVisual({ ...record, y: position.y });
        message = `${kind.replaceAll('-', ' ')} summoned nearby.`;
      }
      title = 'Entity summoned';
    } else if (action === 'move-selected' || action === 'duplicate-selected') {
      const source = worldEdits.entities.find((entity) => entity.id === payload.objectId);
      if (!source) throw new Error('Select a nearby creation first.');
      const position = creativePlacement(source.kind, true);
      if (!position) throw new Error('No suitable water was found ahead for this vessel.');
      if (action === 'move-selected') {
        if (!worldEdits.moveEntity(source.id, position.x, position.z, position.y)) throw new Error('That object could not be moved.');
        const updated = worldEdits.entities.find((entity) => entity.id === source.id);
        if (updated) updated.yaw = position.yaw;
        createCreativeVisual(updated);
        message = `${source.kind.replaceAll('-', ' ')} moved to the new location.`;
      } else {
        const duplicate = worldEdits.duplicateEntity(source.id, position.x, position.z);
        if (!duplicate) throw new Error('That object could not be duplicated.');
        const stored = worldEdits.entities.find((entity) => entity.id === duplicate.id);
        if (stored) { stored.y = position.y; stored.yaw = position.yaw; }
        createCreativeVisual(stored ?? { ...duplicate, y: position.y, yaw: position.yaw });
        message = `${source.kind.replaceAll('-', ' ')} duplicated nearby.`;
      }
      title = action === 'move-selected' ? 'Object moved' : 'Object duplicated';
    } else if (action === 'rotate-selected') {
      if (!worldEdits.rotateEntity(payload.objectId, Math.PI / 12)) throw new Error('Select an object that can be rotated.');
      const updated = worldEdits.entities.find((entity) => entity.id === payload.objectId);
      createCreativeVisual(updated);
      message = 'Object rotated by 15 degrees.';
      title = 'Object rotated';
    } else if (action === 'delete-selected') {
      if (payload.objectId === mountedCreativeShipId) throw new Error('Disembark from this vessel before deleting it.');
      if (!worldEdits.removeEntity(payload.objectId)) throw new Error('Select an object that can be deleted.');
      const model = creativeModels.get(payload.objectId);
      if (model) disposeCreativeEntity(model);
      creativeModels.delete(payload.objectId);
      message = 'Selected object removed from this world.';
      title = 'Object deleted';
    } else if (action === 'undo' || action === 'redo') {
      if (mountedCreativeShipId) throw new Error('Disembark from your creative vessel before using undo or redo.');
      const changed = action === 'undo' ? worldEdits.undo() : worldEdits.redo();
      if (!changed) throw new Error(action === 'undo' ? 'There is no editor action to undo.' : 'There is no editor action to redo.');
      syncCreativeModels();
      message = action === 'undo' ? 'The last object edit was undone.' : 'The previous object edit was restored.';
      title = action === 'undo' ? 'Undo complete' : 'Redo complete';
    } else if (typeof action === 'string' && action.startsWith('ship-')) {
      const record = worldEdits.entities.find((entity) => entity.id === payload.shipId);
      if (!record || !getShipTypeFromCreativeKind(record.kind)) throw new Error('Choose one of your nearby historical vessels first.');
      let model = creativeModels.get(record.id);
      if (!model) model = createCreativeVisual(record);
      if (!model) throw new Error('That vessel is not currently available to edit.');
      let changed = false;
      if (action === 'ship-detach-part') changed = model.userData.detachPart?.(payload.shipPart) ?? false;
      else if (action === 'ship-relink-part') changed = model.userData.relinkPart?.(payload.shipPart) ?? false;
      else if (action === 'ship-toggle-part') {
        const shipState = model.userData.getShipState?.() ?? { hiddenParts: {} };
        const currentlyHidden = Boolean(shipState.hiddenParts?.[payload.shipPart]);
        changed = model.userData.setPartVisible?.(payload.shipPart, currentlyHidden) ?? false;
      } else if (action === 'ship-rudder') changed = model.userData.setRudderAngle?.(THREE.MathUtils.degToRad(Number(payload.rudderAngle) || 0)) ?? false;
      else if (action === 'ship-sail-trim') changed = model.userData.setSailTrim?.(payload.mastId, THREE.MathUtils.degToRad(Number(payload.sailTrim) || 0)) ?? false;
      else if (action === 'ship-mast-lean') changed = model.userData.setMastLean?.(payload.mastId, THREE.MathUtils.degToRad(Number(payload.mastLean) || 0)) ?? false;
      else if (action === 'ship-part-transform') changed = model.userData.setPartTransform?.(payload.shipPart, {
        x: (Number(payload.partX) || 0) * WORLD_UNITS_PER_METRE,
        y: (Number(payload.partY) || 0) * WORLD_UNITS_PER_METRE,
        z: (Number(payload.partZ) || 0) * WORLD_UNITS_PER_METRE,
        rx: THREE.MathUtils.degToRad(Number(payload.partRx) || 0),
        ry: THREE.MathUtils.degToRad(Number(payload.partRy) || 0),
        rz: THREE.MathUtils.degToRad(Number(payload.partRz) || 0),
      }) ?? false;
      else if (action === 'ship-part-reset') changed = model.userData.resetPartTransform?.(payload.shipPart) ?? false;
      if (!changed) throw new Error('That component or adjustment is not available on this vessel.');
      record.shipState = model.userData.getShipState?.() ?? record.shipState ?? {};
      message = `${payload.shipPart || payload.mastId || 'Ship controls'} updated. Component changes are saved with this vessel.`;
      title = 'Vessel component updated';
    } else if (action === 'paint-biome') {
      const patch = worldEdits.paintBiome(player.position.x, player.position.z, payload.radius, payload.biome);
      if (!patch) throw new Error('That biome could not be applied.');
      generator.setBiomeOverrides(worldEdits.biomeOverrides);
      worldManager.invalidateAll();
      worldManager.update(player.position.x, player.position.z);
      worldManager.processQueue(9);
      message = `${payload.biome} painted within ${Math.round(patch.radius)} metres. Terrain height and the world seed remain unchanged.`;
      title = 'Biome painted';
    } else if (action === 'restore-biome') {
      const removed = worldEdits.clearBiome(player.position.x, player.position.z, payload.radius);
      generator.setBiomeOverrides(worldEdits.biomeOverrides);
      worldManager.invalidateAll();
      worldManager.update(player.position.x, player.position.z);
      worldManager.processQueue(9);
      message = removed ? `${removed} overlapping biome patch${removed === 1 ? '' : 'es'} removed. Natural biome generation restored.` : 'There are no creative biome patches in this area.';
      title = 'Natural biomes restored';
    } else if (action === 'set-time') {
      const hour = Math.max(0, Math.min(23, Math.round(Number(payload.hour) || 0)));
      const current = getWorldClock();
      const targetMinutes = (current.day - 1) * 1440 + hour * 60;
      creativeTimeOffsetMinutes = targetMinutes - Math.floor(worldSeconds * 3 + 8 * 60);
      message = `World time set to ${String(hour).padStart(2, '0')}:00.`;
      title = 'Time changed';
    } else if (action === 'set-weather') {
      creativeWeatherOverride = payload.weather === 'natural' ? null : payload.weather;
      message = creativeWeatherOverride ? `${creativeWeatherOverride.toUpperCase()} weather is now forced in this world.` : 'The world has returned to seed-driven natural weather.';
      title = 'Weather changed';
    } else if (action === 'heal') {
      rpg.health = rpg.maxHealth;
      rpg.stamina = rpg.maxStamina;
      needsSystem.refill();
      message = 'Health, stamina, hunger and thirst restored.';
      title = 'Character restored';
    } else if (action === 'grant-supplies') {
      for (const [item, count] of Object.entries({ rations: 12, freshWater: 12, moonleaf: 8, gameMeat: 8, timber: 30, stone: 30, silverPetal: 250, echoGlass: 5 })) rpg.addItem(item, count);
      message = 'Added building materials, food, water and crafting supplies to your pack.';
      title = 'Supplies granted';
    } else if (action === 'clear-nearby') {
      const withinRadius = worldEdits.entities.find((entity) => entity.id === mountedCreativeShipId
        && Math.hypot(entity.x - player.position.x, entity.z - player.position.z) <= 180);
      if (withinRadius) throw new Error('Disembark from your vessel before clearing nearby creations.');
      const removed = worldEdits.removeNearby(player.position.x, player.position.z, 180);
      for (const id of removed.entityIds) {
        const model = creativeModels.get(id);
        if (model) disposeCreativeEntity(model);
        creativeModels.delete(id);
      }
      for (const id of removed.settlementIds) {
        intelligence.removeCustomSettlement(id);
        civilization.removeSettlement(id);
        maritime.removePort(id);
      }
      if (removed.settlementIds.length) worldActors.refreshNow(player.position.x, player.position.z, dayCount);
      message = `Removed ${removed.entities} summoned object${removed.entities === 1 ? '' : 's'} and ${removed.settlements} custom settlement${removed.settlements === 1 ? '' : 's'} nearby.`;
      title = 'Nearby creations cleared';
    } else if (action === 'teleport-destination') {
      const destinations = intelligence.teleportDestinationsNear(player.position.x, player.position.z, 18000);
      const destination = destinations.find((entry) => entry.id === payload.destination);
      if (!destination) throw new Error('Choose a destination from the nearby landmark list.');
      const arrival = findTeleportArrival(destination);
      if (!arrival) throw new Error('There is no safe landing point near that location. Try another landmark.');
      teleportPlayerToWorldPosition(arrival.x, arrival.z);
      message = `Arrived near ${destination.name} · ${destination.category}.`;
      title = 'Destination reached';
    } else if (action === 'teleport-home') {
      if (!worldStartPosition) throw new Error('The world starting location is unavailable.');
      teleportPlayerToWorldPosition(worldStartPosition.x, worldStartPosition.z);
      message = 'Returned to the world starting location.';
      title = 'Teleported home';
    } else if (action === 'save-world') {
      await saveCurrentWorld();
      message = 'All world edits and mode settings are saved.';
      title = 'World saved';
    } else {
      return;
    }
    ui.toast(title, message, 'success');
    if (action !== 'save-world') await saveCurrentWorld();
    updateHudOnce();
    if (ui.currentPanel === 'creative') openPanel('creative');
  } catch (error) {
    ui.toast('Creative action failed', error?.message ?? String(error), 'normal');
  }
}

window.addEventListener('keydown', (event) => {
  if (isTypingTarget(event.target)) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  setInput();
  if (!gameActive) return;
  if (event.code === 'Escape') {
    if (paused) {
      ui.hidePause();
    } else if (ui.currentPanel) {
      ui.closePanel();
    } else {
      setPaused(true);
      ui.showPause();
    }
    return;
  }
  if (paused) return;
  if (event.code === 'Tab') {
    event.preventDefault();
    openPanel('inventory');
  }
  if (event.code === 'KeyI') openPanel('inventory');
  if (event.code === 'KeyJ') openPanel('journal');
  if (event.code === 'KeyM') openPanel('map');
  if (event.code === 'KeyG') openPanel('realm');
  if (event.code === 'KeyC') openPanel('character');
  if (event.code === 'KeyB' && gameMode === 'creative') openPanel('creative');
  if (!event.repeat && event.code === 'KeyE') interact();
  if (!event.repeat && event.code === 'KeyF') resonancePulse();
  if (!event.repeat && event.code === 'KeyR') toggleVehicle();
  if (!event.repeat && event.code === 'Space') strikeNearestHostile();
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
  setInput();
});
window.addEventListener('blur', () => {
  keys.clear();
  setInput();
  if (gameActive && !paused) {
    setPaused(true);
    ui.showPause();
  }
});

function openPanel(type) {
  if (!gameActive || paused || !rpg) return;
  if (type === 'creative' && gameMode !== 'creative') return;
  setCameraEnabled(false);
  const nearest = worldActors?.nearestSettlement(player.position.x, player.position.z, 1100) ?? null;
  const realmState = nearest ? nearest.state : null;
  const time = getWorldClock();
  const state = {
    rpg, player, chunkCount: worldManager?.chunks.size ?? 0,
    settlement: nearest?.settlement ?? null,
    market: realmState,
    wildlife: ecosystem?.getPopulationSummary(player.position.x, player.position.z, 900),
    weather: currentWeather,
    day: time.day,
    tradeLinks: nearest ? intelligence?.roadLinksFor([...worldActors.settlements.values()].map((record) => record.settlement)).length ?? 0 : 0,
    activeConvoys: civilization?.tradeConvoys.filter((convoy) => convoy.status === 'enroute').length ?? 0,
    migrations: civilization?.migrationLog.slice(-3) ?? [],
    gameMode, needs: needsSystem?.getSaveData() ?? null,
    maritimeShips: maritime?.voyages.filter((voyage) => voyage.status === 'enroute').length ?? 0,
    creativeShips: (worldEdits?.entities ?? []).filter((entity) => getShipTypeFromCreativeKind(entity.kind))
      .map((entity) => {
        const design = getShipDesign(getShipTypeFromCreativeKind(entity.kind));
        return { id: entity.id, kind: entity.kind, label: design?.label ?? entity.kind, distance: Math.hypot(entity.x - player.position.x, entity.z - player.position.z), parts: design?.partNames ?? [], masts: design?.masts.map((mast) => mast.id) ?? [], shipState: entity.shipState ?? null };
      }).filter((entity) => entity.distance <= 5000).sort((a, b) => a.distance - b.distance).slice(0, 40),
    worldEditCounts: { entities: worldEdits?.entities.length ?? 0, biomes: worldEdits?.biomeOverrides.length ?? 0, settlements: worldEdits?.settlements.length ?? 0 },
    creativeEntities: (worldEdits?.entities ?? []).filter((entity) => entity.kind !== 'village' && entity.kind !== 'port')
      .map((entity) => ({ ...entity, distance: Math.hypot(entity.x - player.position.x, entity.z - player.position.z) }))
      .filter((entity) => entity.distance <= 1800).sort((a, b) => a.distance - b.distance).slice(0, 80),
    teleportDestinations: type === 'creative' ? (intelligence?.teleportDestinationsNear(player.position.x, player.position.z, 18000) ?? []) : [],
    hour: getWorldClock().hour,
    creativeWeatherOverride: creativeWeatherOverride ?? 'natural',
  };
  ui.showPanel(type, state);
}

function openMarket(actor) {
  const settlementId = actor?.settlement?.id;
  const settlement = actor?.settlement;
  if (!settlementId || !settlement || !civilization) return;
  currentMarketSettlement = settlementId;
  const market = civilization.ensureSettlement(settlement, dayCount);
  setCameraEnabled(false);
  ui.showPanel('market', { rpg, settlement, market, player });
}

function tradeAtMarket(action) {
  if (!currentMarketSettlement || !civilization || !rpg) return;
  const result = civilization.trade(currentMarketSettlement, action, rpg);
  ui.toast(result.ok ? 'Trade complete' : 'Trade unavailable', result.message, result.ok ? 'success' : 'normal');
  if (result.ok) advanceFieldTest('trade');
  const record = worldActors?.settlements.get(currentMarketSettlement);
  if (record) ui.showPanel('market', { rpg, settlement: record.settlement, market: record.state, player });
}

function craftItem(recipe) {
  if (!rpg) return;
  const result = rpg.craft(recipe);
  ui.toast(result.ok ? 'Crafting complete' : 'Cannot craft', result.message, result.ok ? 'success' : 'normal');
  if (result.ok && recipe === 'trail-ration') advanceFieldTest('craft');
  if (ui.currentPanel === 'inventory') ui.showPanel('inventory', { rpg, player, chunkCount: worldManager?.chunks.size ?? 0 });
}

function spendSkillPoint(skill) {
  if (!rpg) return;
  const result = rpg.spendSkillPoint(skill);
  ui.toast(result.ok ? 'Skill improved' : 'Training unavailable', result.message, result.ok ? 'success' : 'normal');
  if (ui.currentPanel === 'character') ui.showPanel('character', { rpg, player });
}

function updateFieldTestUi() {
  if (!fieldTestCourse || !isFieldTestWorld) {
    ui.setFieldTestGuide(null);
    return;
  }
  const completed = fieldTestCourse.completed.size;
  ui.setFieldTestGuide({
    step: fieldTestCourse.currentStep,
    current: Math.max(0, fieldTestCourse.currentIndex),
    total: fieldTestCourse.steps.length,
    completed,
    finished: fieldTestCourse.finished,
  });
}

function advanceFieldTest(stepId) {
  if (!fieldTestCourse || !isFieldTestWorld) return false;
  const result = fieldTestCourse.complete(stepId);
  if (!result.ok) return false;
  updateFieldTestUi();
  if (result.finished) {
    ui.toast('Wayfarer’s Circuit complete', 'You have visited the core systems test route. The world remains open for further exploration.', 'success');
  } else if (result.next) {
    ui.toast(`Test ${fieldTestCourse.completed.size} / ${fieldTestCourse.steps.length} complete`, result.next.title, 'success');
  }
  if (gameActive) saveCurrentWorld().catch((error) => console.warn('Test-course autosave failed:', error));
  return true;
}

ui.onPanelOpen = (type) => openPanel(type);
ui.onPanelClose = () => setCameraEnabled(gameActive && !paused);
$('#pause-button').addEventListener('click', () => setPaused(true));
ui.onResume = () => setPaused(false);
ui.onSave = saveCurrentWorld;
ui.onReturnMenu = async () => {
  await saveCurrentWorld();
  stopWorld();
  ui.showMenu();
};
ui.onCameraSensitivity = (value) => {
  controls.rotateSpeed = 0.52 * value;
  controls.zoomSpeed = 0.82 * value;
};
ui.onTrade = tradeAtMarket;
ui.onCraft = craftItem;
ui.onSkillSpend = spendSkillPoint;
ui.onNeedsAction = (action) => {
  if (gameMode !== 'survival' || !needsSystem || !rpg) return;
  let result = { ok: false, message: 'That action is unavailable.' };
  if (action.startsWith('eat-')) result = needsSystem.eat(rpg, action.slice(4));
  if (action === 'drink-water') result = needsSystem.drink(rpg);
  ui.toast(result.ok ? 'Needs restored' : 'Cannot do that', result.message, result.ok ? 'success' : 'normal');
  if (ui.currentPanel === 'inventory') openPanel('inventory');
  updateHudOnce();
  if (result.ok) saveCurrentWorld().catch((error) => console.warn('Needs save failed:', error));
};
ui.onCreativeAction = handleCreativeAction;
ui.onOpenSavedWorlds = () => refreshSavedWorldLibrary().catch((error) => reportStartupError('Could not read saved worlds', error));
ui.onLoadWorld = async (seed) => {
  try {
    ui.setSeed(seed);
    await startWorld(seed, true);
  } catch (error) {
    reportStartupError(`Could not load world “${seed}”`, error);
  }
};
ui.onDeleteWorld = async (seed) => {
  try {
    if (String(seed).toUpperCase() === TEST_WORLD_SEED) return;
    if (!window.confirm(`Delete the saved world “${seed}”? This cannot be undone.`)) return;
    await deleteWorld(seed);
    await refreshSavedWorldLibrary();
    ui.setContinueAvailable(await hasAnySave());
  } catch (error) {
    reportStartupError('Could not delete that saved world', error);
  }
};

async function refreshSavedWorldLibrary() {
  const records = await listSavedWorlds();
  const testRecord = records.find((record) => String(record.seedKey ?? record.seed).toUpperCase() === TEST_WORLD_SEED);
  const testSlot = {
    ...(testRecord ?? {}),
    seed: TEST_WORLD_SEED,
    seedKey: TEST_WORLD_SEED,
    worldName: TEST_WORLD_NAME,
    worldKind: 'test',
    isTestSlot: true,
  };
  ui.showSavedWorlds([testSlot, ...records.filter((record) => String(record.seedKey ?? record.seed).toUpperCase() !== TEST_WORLD_SEED)]);
}

function discoverNearbySectors() {
  if (!player) return;
  const sectorSize = 36;
  const sx = Math.floor(player.position.x / sectorSize);
  const sz = Math.floor(player.position.z / sectorSize);
  const cell = `${sx}:${sz}`;
  if (cell === lastExploredCell) return;
  lastExploredCell = cell;
  for (let dz = -2; dz <= 2; dz += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (dx * dx + dz * dz <= 5) exploredSectors.add(`${sx + dx}:${sz + dz}`);
    }
  }
}

function applyPersistentChunkState(chunk) {
  for (const item of chunk.interactables) {
    const info = item.userData.interactable;
    if (!info) continue;
    if (info.type === 'moonleaf' && collectedItems.has(info.id)) item.userData.collected = true;
    if (info.type === 'waystone' && rpg?.discoveredWaystones.has(info.id)) item.userData.discovered = true;
  }
}

async function startWorld(seedInput, shouldLoad = true, requestedMode = ui.getSelectedMode()) {
  const seed = formatSeed(seedInput);
  if (!seed) return;
  isFieldTestWorld = seed.toUpperCase() === TEST_WORLD_SEED;
  ui.showLoading('Listening for the shape of the land…');
  ui.menu.classList.add('hidden');
  ui.updateLoading(6, 'Reading the old earth…');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const saved = shouldLoad ? await loadWorld(seed) : null;
  worldSeed = seed;
  gameMode = resolveGameMode(saved, requestedMode);
  ui.setSelectedMode(gameMode);
  ui.menu.classList.toggle('mode-creative', gameMode === 'creative');
  worldEdits = new WorldEditSystem(saved?.worldEdits ?? null);
  creativeTimeOffsetMinutes = Number(saved?.creativeTimeOffsetMinutes ?? 0);
  creativeWeatherOverride = saved?.creativeWeatherOverride ?? null;
  generator = new WorldGenerator(seed);
  generator.setBiomeOverrides(worldEdits.biomeOverrides);
  fieldTestLayout = isFieldTestWorld ? createFieldTestLayout(generator) : null;
  rpg = new RPGSystem(saved?.rpg ?? null);
  needsSystem = new WorldNeedsSystem(saved?.worldSystems?.needs ?? null);
  maritime = new MaritimeSystem(generator, saved?.worldSystems?.maritime ?? null);
  const isFreshTestEntry = isFieldTestWorld && !saved;
  if (isFreshTestEntry) {
    // A fresh test slot begins with enough supplies to exercise every RPG loop
    // without farming for materials before the guided circuit starts.
    rpg.addItem('moonleaf', 2);
    rpg.addItem('echoGlass', 1);
    rpg.addItem('silverPetal', 40);
    rpg.addItem('gameMeat', 2);
    rpg.addItem('timber', 10);
    rpg.addItem('stone', 6);
    rpg.addItem('rations', 2);
    rpg.skillPoints = Math.max(rpg.skillPoints, 3);
    rpg.health = rpg.maxHealth;
    rpg.stamina = rpg.maxStamina;
  }
  collectedItems.clear();
  for (const id of saved?.collectedItems ?? []) collectedItems.add(id);
  exploredSectors.clear();
  for (const sector of saved?.exploredSectors ?? []) exploredSectors.add(sector);
  worldSeconds = saved?.worldSeconds ?? 0;
  dayCount = 1;
  lastExploredCell = '';
  ui.bindMap(generator, exploredSectors);

  const spawn = saved?.player
    ? { x: Number(saved.player.x) || 0, z: Number(saved.player.z) || 0 }
    : (fieldTestLayout?.spawn ?? generator.findSpawn());
  worldStartPosition = saved?.worldStartPosition && Number.isFinite(saved.worldStartPosition.x) && Number.isFinite(saved.worldStartPosition.z)
    ? { x: saved.worldStartPosition.x, z: saved.worldStartPosition.z }
    : { x: spawn.x, z: spawn.z };

  if (worldActors) worldActors.dispose();
  if (weatherVisuals) weatherVisuals.dispose();
  intelligence = new WorldIntelligence(generator, worldStartPosition ?? spawn, { scenario: fieldTestLayout, customSettlements: worldEdits.settlements });
  civilization = new CivilizationSystem(generator.seed, intelligence, saved?.worldSystems?.civilization ?? null);
  ecosystem = new EcosystemSystem(generator.seed, generator, saved?.worldSystems?.ecosystem ?? null);
  if (fieldTestLayout) {
    const habitatCellX = Math.floor(fieldTestLayout.wildlife.x / 320);
    const habitatCellZ = Math.floor(fieldTestLayout.wildlife.z / 320);
    const savedHabitatCell = saved?.worldSystems?.ecosystem?.cells?.[`${habitatCellX}:${habitatCellZ}`];
    if (!savedHabitatCell) ecosystem.seedTestPopulation(fieldTestLayout.wildlife.x, fieldTestLayout.wildlife.z, 6);
    const habitatAnimals = ecosystem.animalsNear(fieldTestLayout.wildlife.x, fieldTestLayout.wildlife.z, 300)
      .sort((a, b) => Math.hypot(a.x - fieldTestLayout.wildlife.x, a.z - fieldTestLayout.wildlife.z)
        - Math.hypot(b.x - fieldTestLayout.wildlife.x, b.z - fieldTestLayout.wildlife.z));
    if (habitatAnimals[0]) {
      fieldTestLayout.wildlife = { x: habitatAnimals[0].x, z: habitatAnimals[0].z };
      const wildlifeStep = fieldTestLayout.courseSteps.find((step) => step.id === 'wildlife');
      if (wildlifeStep) Object.assign(wildlifeStep, fieldTestLayout.wildlife);
    }
  }
  weatherSystem = new WeatherSystem(generator.seed);
  transport = new TransportSystem(saved?.worldSystems?.transport ?? null);
  combat = new CombatSystem(generator.seed, generator, intelligence, saved?.worldSystems?.combat ?? null);
  if (fieldTestLayout) {
    combat.addScenarioHostile({
      id: 'field-test:practice-wisp', name: 'Practice wisp', kind: 'thorn-wisp',
      x: fieldTestLayout.hostile.x, z: fieldTestLayout.hostile.z,
      y: generator.heightAt(fieldTestLayout.hostile.x, fieldTestLayout.hostile.z),
      maxHealth: 28, speed: 0.72, phase: 1.4,
    });
  }
  worldActors = null;
  weatherVisuals = null;
  currentMarketSettlement = null;
  lastSimulatedDay = -1;
  currentSeason = '';
  currentWeather = weatherSystem.at(spawn.x, spawn.z, worldSeconds, generator.sample(spawn.x, spawn.z));

  if (worldManager) worldManager.dispose();
  worldManager = new WorldManager(scene, generator, sharedAssets, {
    chunkSize: 88,
    resolution: 40,
    radius: 3,
    onChunkLoaded: applyPersistentChunkState,
  });
  worldManager.update(spawn.x, spawn.z);
  worldManager.setRenderOrigin(spawn.x, spawn.z);
  ui.updateLoading(18, 'Raising the first hills…');
  worldManager.processQueue(9);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  ui.updateLoading(42, 'Rooting the first wilds…');
  worldManager.processQueue(4);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  if (player) player.dispose();
  player = new Player(scene, generator, spawn.x, spawn.z);
  if (saved?.player) player.applySaveData(saved.player);
  player.setRenderOrigin(worldManager.renderOriginX, worldManager.renderOriginZ);
  controls.target.set(player.position.x - worldManager.renderOriginX, player.position.y + 1.05, player.position.z - worldManager.renderOriginZ);
  camera.position.set(player.position.x - worldManager.renderOriginX + 33, player.position.y + 42, player.position.z - worldManager.renderOriginZ + 35);
  controls.update();
  discoverNearbySectors();
  worldActors = new WorldActorManager(scene, generator, intelligence, civilization, ecosystem, combat);
  worldActors.update(0, player.position.x, player.position.z, getWorldClock().hour, getWorldClock().day, worldManager.renderOriginX, worldManager.renderOriginZ);
  if (creativeRoot) {
    for (const model of creativeModels.values()) disposeCreativeEntity(model);
    creativeModels.clear();
    scene.remove(creativeRoot);
  }
  creativeRoot = new THREE.Group();
  creativeRoot.position.set(-worldManager.renderOriginX, 0, -worldManager.renderOriginZ);
  scene.add(creativeRoot);
  for (const entity of worldEdits.entities) {
    if (entity.kind === 'village' || entity.kind === 'port') continue;
    createCreativeVisual(entity);
  }
  if (fieldTestLayout) {
    const localSettlements = [...worldActors.settlements.values()].map((record) => record.settlement);
    const localLinks = intelligence.roadLinksFor(localSettlements, 4400);
    const testSettlementIds = new Set(Object.values(fieldTestLayout.settlementIds));
    const bridgeLink = localLinks.find((link) => link.path?.some((point) => point.bridge)
      && (testSettlementIds.has(link.a.id) || testSettlementIds.has(link.b.id)))
      ?? localLinks.find((link) => link.path?.some((point) => point.bridge));
    const convoyLink = bridgeLink ?? localLinks[0];
    if (!saved?.worldSystems?.civilization?.tradeConvoys?.some((convoy) => convoy.id === 'field-test:starter-convoy') && convoyLink) {
      civilization.seedTestConvoy(convoyLink.a.id, convoyLink.b.id, convoyLink.id, getWorldClock().day);
    }
    if (bridgeLink) {
      const bridgePoint = bridgeLink.path?.find((point) => point.bridge) ?? bridgeLink.path?.[Math.floor((bridgeLink.path.length - 1) / 2)];
      const roadStep = fieldTestLayout.courseSteps.find((step) => step.id === 'road');
      if (bridgePoint && roadStep) Object.assign(roadStep, { x: bridgePoint.x, z: bridgePoint.z });
    }
    const portRecord = worldActors.settlements.get(fieldTestLayout.settlementIds.port);
    let testBoat = [...worldActors.vehicles.values()].find((vehicle) => vehicle.mode === 'boat' && vehicle.settlementId === fieldTestLayout.settlementIds.port);
    if (!testBoat && portRecord) {
      testBoat = worldActors.ensureVehicle('boat', 'field-test:tidewatch-skiff', fieldTestLayout.shore.x, fieldTestLayout.shore.z, -0.12);
      if (testBoat) testBoat.settlementId = fieldTestLayout.settlementIds.port;
    }
    if (testBoat) {
      const boatStep = fieldTestLayout.courseSteps.find((step) => step.id === 'boat');
      if (boatStep) Object.assign(boatStep, { x: testBoat.x, z: testBoat.z });
    }
    if (!saved?.worldSystems?.civilization?.tradeConvoys?.some((convoy) => convoy.id === 'field-test:starter-convoy')) {
      worldActors.refreshNow(player.position.x, player.position.z, getWorldClock().day);
    }
    fieldTestCourse = new FieldTestCourse(scene, generator, fieldTestLayout, saved?.worldSystems?.fieldTest ?? null);
  } else {
    if (fieldTestCourse) fieldTestCourse.dispose();
    fieldTestCourse = null;
  }
  weatherVisuals = new WeatherVisuals(scene, seed);
  const initialClock = getWorldClock();
  dayCount = initialClock.day;
  if (transport.mounted) {
    const savedPosition = transport.position ?? { x: player.position.x, z: player.position.z, y: player.position.y };
    const creativeVessel = worldEdits.entities.find((entity) => entity.id === transport.vehicleId && getShipTypeFromCreativeKind(entity.kind));
    if (transport.mode === 'boat' && creativeVessel) {
      mountedCreativeShipId = creativeVessel.id;
      const model = creativeModels.get(creativeVessel.id);
      if (model) {
        const mountedDesign = getShipDesign(transport.vesselType);
        transport.deckHeight = mountedDesign?.deckHeightUnits ?? 0.45;
        player.setPosition(savedPosition.x, savedPosition.z);
        player.position.y = -0.12 + transport.deckHeight;
        player.facing = Number(creativeVessel.yaw) || 0;
        player.group.position.set(player.position.x - worldManager.renderOriginX, player.position.y, player.position.z - worldManager.renderOriginZ);
        player.group.rotation.y = player.facing;
        creativeVessel.x = savedPosition.x;
        creativeVessel.z = savedPosition.z;
        creativeVessel.y = -0.12;
        model.position.set(creativeVessel.x, -0.12, creativeVessel.z);
        model.rotation.y = player.facing + Math.PI;
        transport.setPosition(savedPosition.x, savedPosition.z, player.position.y);
      } else transport.dismount();
    } else {
      const vehicle = worldActors.ensureVehicle(transport.mode, transport.vehicleId ?? `restored:${transport.mode}`, savedPosition.x, savedPosition.z, savedPosition.y);
      if (vehicle) {
        player.setPosition(savedPosition.x, savedPosition.z);
        if (transport.mode === 'boat') player.position.y = -0.12 + transport.deckHeight;
        transport.vehicleId = vehicle.id;
        transport.setPosition(savedPosition.x, savedPosition.z, player.position.y);
        worldActors.vehiclePosition(vehicle.id, player.position.x, player.position.z, player.position.y);
      } else transport.dismount();
    }
  }
  const initialSettlements = intelligence.settlementsNear(player.position.x, player.position.z, 2600);
  civilization.registerSettlements(initialSettlements, initialClock.day);
  maritime.registerPorts(initialSettlements);
  civilization.advanceTo(initialClock.day, currentWeather.season);
  ecosystem.advanceTo(initialClock.day, currentWeather.season);
  maritime.advanceTo(initialClock.day + initialClock.hour / 24, civilization);
  lastSimulatedDay = initialClock.day;
  currentSeason = currentWeather.season;
  sharedAssets.leafMaterial.color.setHex(currentSeason === 'autumn' ? 0x8d7044 : currentSeason === 'winter' ? 0x82918b : currentSeason === 'spring' ? 0x5f8c57 : 0x476f4b);

  ui.updateLoading(70, 'Waking the waymarks…');
  worldManager.processQueue(4);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  ui.updateLoading(100, 'The Reach is yours to wander.');
  await new Promise((resolve) => setTimeout(resolve, 250));
  ui.hideLoading();
  ui.enterGame();
  ui.hud.classList.toggle('mode-creative', gameMode === 'creative');
  gameActive = true;
  window.__verdantGameReady = true;
  setPaused(false);
  updateFieldTestUi();
  ui.toast(saved ? 'Welcome back to the Reach' : 'A new horizon awaits', saved ? 'Your previous journey has been restored.' : `World seed: ${seed}`, 'success');
  updateHudOnce();
}

function getNearbyTargets() {
  if (!player || !worldManager) return { interactable: null, vehicle: null };
  const candidates = [];
  const item = worldManager.nearestInteractable(player.position.x, player.position.z, 5.5);
  if (item) candidates.push({ object: item.object, distance: item.distance });
  const npc = worldActors?.nearestNPC(player.position.x, player.position.z, 5.5);
  if (npc) candidates.push({ object: npc.actor.group, distance: npc.distance });
  const animal = worldActors?.nearestAnimal(player.position.x, player.position.z, 5.5);
  if (animal) candidates.push({ object: animal.actor.group, distance: animal.distance });
  const ruin = worldActors?.nearestRuin(player.position.x, player.position.z, 23);
  if (ruin) candidates.push({ object: ruin.actor.group, distance: ruin.distance });
  const courseMarker = fieldTestCourse?.nearest(player.position.x, player.position.z, 6.5);
  if (courseMarker) candidates.push({ object: courseMarker.object, distance: courseMarker.distance });
  candidates.sort((a, b) => a.distance - b.distance);
  let vehicle = transport?.mounted ? null : worldActors?.nearestVehicle(player.position.x, player.position.z, 7)?.vehicle ?? null;
  if (!transport?.mounted && worldEdits) {
    let nearestShip = null;
    let nearestDistance = 7;
    for (const entity of worldEdits.entities) {
      if (!isCreativeWatercraftKind(entity.kind)) continue;
      const shipType = getShipTypeFromCreativeKind(entity.kind);
      const design = shipType ? getShipDesign(shipType) : null;
      const dx = player.position.x - entity.x;
      const dz = player.position.z - entity.z;
      const yaw = (Number(entity.yaw) || 0) + (shipType ? Math.PI : 0);
      const forward = Math.abs(dx * Math.sin(yaw) + dz * Math.cos(yaw));
      const lateral = Math.abs(dx * Math.cos(yaw) - dz * Math.sin(yaw));
      const halfLength = (design?.hullLengthUnits ?? 8) * (Number(entity.scale) || 1) * 0.5;
      const halfBeam = (design?.beamUnits ?? 3) * (Number(entity.scale) || 1) * 0.5;
      const edgeDistance = Math.hypot(Math.max(0, forward - halfLength), Math.max(0, lateral - halfBeam));
      if (edgeDistance >= nearestDistance) continue;
      const model = creativeModels.get(entity.id);
      if (!model) continue;
      nearestDistance = edgeDistance;
      nearestShip = { id: entity.id, mode: 'boat', vesselType: shipType,
        deckHeight: design?.deckHeightUnits ?? 0.45, x: entity.x, z: entity.z,
        group: model, creative: true, record: entity };
    }
    if (nearestShip && (!vehicle || nearestDistance < Math.hypot(vehicle.x - player.position.x, vehicle.z - player.position.z))) vehicle = nearestShip;
  }
  const hostile = worldActors?.nearestHostile(player.position.x, player.position.z, 5)?.actor ?? null;
  return { interactable: candidates[0]?.object ?? null, vehicle, hostile };
}

function updateHudOnce() {
  if (!player || !generator || !rpg) return;
  const sample = generator.sample(player.position.x, player.position.z);
  const time = getWorldClock();
  currentWeather = weatherSystem?.at(player.position.x, player.position.z, worldSeconds, sample) ?? null;
  if (currentWeather && creativeWeatherOverride) currentWeather = makeWeatherOverride(currentWeather, creativeWeatherOverride);
  const targets = getNearbyTargets();
  currentNearby = targets.interactable;
  ui.updateHUD({ rpg, player, sample, timeOfDay: time.label, day: time.day, nearby: currentNearby, nearbyVehicle: targets.vehicle, nearbyHostile: targets.hostile, weather: currentWeather, chunkCount: worldManager.chunks.size, gameMode, needs: needsSystem });
}

function getWorldClock() {
  const totalMinutes = Math.floor(worldSeconds * 3 + 8 * 60 + creativeTimeOffsetMinutes);
  const day = Math.floor(totalMinutes / (24 * 60)) + 1;
  const minuteOfDay = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return { hour, minute, day, label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

function interact() {
  if (!gameActive || paused || !player || !worldManager) return;
  const targets = getNearbyTargets();
  const object = targets.interactable;
  if (!object) {
    const riverDistance = intelligence?.riverDistanceAt(player.position.x, player.position.z, 48) ?? Infinity;
    if (gameMode === 'survival' && riverDistance <= 20) {
      const result = needsSystem.drinkFromSource(30);
      ui.toast('Fresh water gathered', result.message, 'success');
      updateHudOnce();
      saveCurrentWorld().catch((error) => console.warn('Water save failed:', error));
      return;
    }
    ui.toast('Nothing close enough', 'Move closer to a landmark, local resident, wild creature, or freshwater riverbank.');
    return;
  }
  const info = object.userData.interactable;
  if (!info) return;
  if (info.type === 'field-test-course') {
    activateFieldTestStation(info.id);
  } else if (info.type === 'moonleaf') {
    object.userData.collected = true;
    collectedItems.add(info.id);
    const harvest = 1 + Math.floor(Math.max(0, rpg.skills.foraging - 1) / 4);
    const result = rpg.addMoonleaf(harvest);
    ui.toast('Moonleaf gathered', `Collected ${harvest} sprig${harvest === 1 ? '' : 's'}.`, 'success');
    for (const quest of result.completed ?? []) ui.toast(`${quest.title} complete`, `New thread: ${quest.unlocked}`, 'success');
    advanceFieldTest('forage');
  } else if (info.type === 'waystone') {
    attuneWaystone(object);
  } else if (info.type === 'ruinedCastle') {
    const firstVisit = rpg.discoverLandmark(info.id);
    if (firstVisit) {
      const silver = 12 + Math.floor((Number(info.id.length) || 0) % 9);
      rpg.addItem('silverPetal', silver);
      rpg.addItem('stone', 2);
      ui.toast('Ancient keep explored', `You mapped ${info.label?.replace(/^Explore /, '') ?? 'the ruin'} and recovered ${silver} silver petals.`, 'success');
    } else {
      ui.toast('Familiar ruins', 'You have already recorded this abandoned castle in your travel journal.');
    }
    saveCurrentWorld().catch((error) => console.warn('Landmark discovery save failed:', error));
  } else if (info.type === 'npc') {
    const actor = worldActors?.npcs.get(info.id);
    if (!actor) return;
    const result = civilization.talkTo(info.id, dayCount);
    rpg.awardSkill('commerce', 2);
    advanceFieldTest('village');
    if (actor.npc.profession === 'trader' || actor.npc.profession === 'fisher') {
      openMarket(actor);
    } else {
      ui.toast(result?.repeated ? `${actor.npc.name} greets you again` : `You spoke with ${actor.npc.name}`, result?.repeated ? 'They return to their work with a nod.' : `A ${actor.npc.profession} of ${actor.settlement.name}. Local trust has grown.`, 'success');
    }
  } else if (info.type === 'wildlife') {
    const reward = ecosystem.harvest(info.id);
    if (!reward) {
      ui.toast('The trail is quiet', 'This animal has already moved on.');
    } else {
      const foragingBonus = Math.floor(Math.max(0, rpg.skills.foraging - 1) / 4);
      const trackingBonus = Math.floor(Math.max(0, rpg.skills.tracking - 1) / 4);
      rpg.addItem('gameMeat', reward.gameMeat + trackingBonus);
      rpg.addItem('hides', reward.hide + foragingBonus);
      rpg.addXp(reward.xp);
      rpg.awardSkill('tracking', 8);
      worldActors.removeAnimal(info.id);
      advanceFieldTest('wildlife');
      ui.toast('Wild provisions gathered', `${reward.label}: +${reward.gameMeat} game meat${reward.hide ? `, +${reward.hide} hide` : ''}.`, 'success');
    }
  }
  updateHudOnce();
}

function activateFieldTestStation(id) {
  if (!fieldTestCourse || !isFieldTestWorld || fieldTestCourse.currentStep?.id !== id) return;
  if (id === 'waystone') {
    const result = rpg.attuneWaystone('field-test:waystone');
    createPulseEffect(player.position.x, player.position.y + 0.15, player.position.z, 0x9ce1c4);
    ui.toast('Waystone attuned', 'The test landmark has been added to your discoveries.', 'success');
    for (const quest of result.completed ?? []) ui.toast(`${quest.title} complete`, `New thread: ${quest.unlocked}`, 'success');
    advanceFieldTest('waystone');
  } else if (id === 'forage') {
    const result = rpg.addMoonleaf(3);
    ui.toast('Field supplies gathered', 'Added three moonleaf sprigs to your pack.', 'success');
    for (const quest of result.completed ?? []) ui.toast(`${quest.title} complete`, `New thread: ${quest.unlocked}`, 'success');
    advanceFieldTest('forage');
  } else if (id === 'village') {
    const record = worldActors?.settlements.get(fieldTestLayout.settlementIds.village);
    const resident = record?.state?.npcs?.[0];
    if (!resident) {
      ui.toast('The village is quiet', 'Move a little closer to Trialstead and try again.');
      return;
    }
    const result = civilization.talkTo(resident.id, dayCount);
    rpg.awardSkill('commerce', 2);
    ui.toast(`You met ${resident.name}`, result?.repeated ? 'A familiar resident welcomes you again.' : `A ${resident.profession} of Trialstead shares local news.`, 'success');
    advanceFieldTest('village');
  } else if (id === 'trade') {
    const record = worldActors?.settlements.get(fieldTestLayout.settlementIds.market);
    if (!record) {
      ui.toast('Market not in reach', 'Approach Greenmead Market and try again.');
      return;
    }
    openMarket({ settlement: record.settlement });
  } else if (id === 'craft') {
    openPanel('inventory');
    ui.toast('Field crafting', 'Craft a trail ration using the supplied meat and moonleaf.');
  } else if (id === 'wildlife') {
    const nearby = worldActors?.nearestAnimal(player.position.x, player.position.z, 18);
    if (!nearby) {
      ui.toast('Follow the animal markers', 'Look around the habitat clearing for wildlife, then interact with an animal.');
      return;
    }
    const reward = ecosystem.harvest(nearby.actor.id);
    if (!reward) return;
    rpg.addItem('gameMeat', reward.gameMeat);
    rpg.addItem('hides', reward.hide);
    rpg.addXp(reward.xp);
    rpg.awardSkill('tracking', 8);
    worldActors.removeAnimal(nearby.actor.id);
    ui.toast('Wildlife study complete', `${reward.label} tracked; field provisions added.`, 'success');
    advanceFieldTest('wildlife');
  } else if (id === 'combat') {
    ui.toast('Practice wisp nearby', 'Move within reach and press Space to complete the encounter.');
  } else if (id === 'horse') {
    ui.toast('Stable mount ready', 'Press R beside the horse or handcart to mount it.');
  } else if (id === 'boat') {
    ui.toast('Coastal skiff ready', 'Press R beside the skiff to launch.');
  } else if (id === 'weather') {
    const sample = generator.sample(player.position.x, player.position.z);
    currentWeather = weatherSystem.at(player.position.x, player.position.z, worldSeconds, sample);
    if (creativeWeatherOverride) currentWeather = makeWeatherOverride(currentWeather, creativeWeatherOverride);
    ui.toast('Weather recorded', `${currentWeather.season} · ${currentWeather.label} · wind ${Math.round(currentWeather.windStrength * 100)}%.`, 'success');
    advanceFieldTest('weather');
  }
  updateHudOnce();
}

function toggleVehicle() {
  if (!gameActive || paused || !player || !transport || !worldActors) return;
  if (transport.mounted) {
    if (transport.mode === 'boat' && generator.heightAt(player.position.x, player.position.z) < 0.65) {
      ui.toast('Stay aboard for now', 'Bring the vessel to a shallow shore before disembarking.');
      return;
    }
    const id = transport.vehicleId;
    const mode = transport.dismount();
    const parkedX = player.position.x + 3.5;
    const parkedZ = player.position.z + 2.5;
    if (mountedCreativeShipId) {
      const record = worldEdits?.entities.find((entity) => entity.id === mountedCreativeShipId);
      const model = creativeModels.get(mountedCreativeShipId);
      if (record) {
        record.x = parkedX;
        record.z = parkedZ;
        record.y = -0.12;
        record.yaw = player.facing;
      }
      if (model) {
        model.position.set(parkedX, -0.12, parkedZ);
        model.userData.worldX = parkedX;
        model.userData.worldZ = parkedZ;
        model.rotation.y = player.facing + Math.PI;
      }
      mountedCreativeShipId = null;
    } else {
      worldActors.vehiclePosition(id, parkedX, parkedZ, generator.heightAt(parkedX, parkedZ));
    }
    player.setPosition(player.position.x, player.position.z);
    ui.toast('Travel on foot', `You left the ${mode === 'boat' ? 'vessel' : mode} nearby.`, 'success');
    saveCurrentWorld().catch((error) => console.warn('Vehicle save failed:', error));
    updateHudOnce();
    return;
  }
  const nearby = getNearbyTargets().vehicle;
  if (!nearby) {
    ui.toast('No vehicle nearby', 'Look for a stable mount, handcart, coastal skiff, or a ship placed in Creative mode.');
    return;
  }
  const vehicle = nearby;
  if (!transport.mount({ id: vehicle.id, mode: vehicle.mode, vesselType: vehicle.vesselType, deckHeight: vehicle.deckHeight })) return;
  if (vehicle.creative) {
    mountedCreativeShipId = vehicle.id;
    const record = vehicle.record;
    record.y = -0.12;
    player.setPosition(vehicle.x, vehicle.z);
    player.facing = Number(record.yaw) || 0;
    player.position.y = -0.12 + transport.deckHeight;
    player.group.position.set(player.position.x - worldManager.renderOriginX, player.position.y, player.position.z - worldManager.renderOriginZ);
    player.group.rotation.y = player.facing;
    vehicle.group.rotation.y = player.facing + Math.PI;
  } else {
    worldActors.detachVehicle(vehicle.id);
    player.setPosition(vehicle.x, vehicle.z);
    if (vehicle.mode === 'boat') player.position.y = -0.12 + transport.deckHeight;
    player.group.position.set(player.position.x - worldManager.renderOriginX, player.position.y, player.position.z - worldManager.renderOriginZ);
    worldActors.vehiclePosition(vehicle.id, player.position.x, player.position.z, player.position.y);
  }
  transport.setPosition(player.position.x, player.position.z, player.position.y);
  const label = vehicle.vesselType ? getShipDesign(vehicle.vesselType)?.label : vehicle.mode;
  ui.toast(vehicle.mode === 'boat' ? 'Vessel boarded' : 'Journey mounted', vehicle.vesselType ? `You boarded the ${label}.` : vehicle.mode === 'horse' ? 'The horse is ready to travel.' : vehicle.mode === 'cart' ? 'The handcart is ready to roll.' : 'The coast opens into the sea.', 'success');
  if (vehicle.mode === 'boat') advanceFieldTest('boat');
  else advanceFieldTest('horse');
  saveCurrentWorld().catch((error) => console.warn('Vehicle save failed:', error));
  updateHudOnce();
}

function strikeNearestHostile() {
  if (!gameActive || paused || !combat || !worldActors || !player) return;
  const nearby = worldActors.nearestHostile(player.position.x, player.position.z, 4.8);
  if (!nearby) {
    ui.toast('No wisp in reach', 'Move closer to a roaming wisp before striking.');
    return;
  }
  const result = combat.strike(nearby.actor.id, rpg, worldSeconds);
  if (!result.ok) {
    ui.toast('Strike unavailable', result.message);
    return;
  }
  if (result.defeated) {
    worldActors.removeHostile(nearby.actor.id);
    advanceFieldTest('combat');
    ui.toast('Wisp dispersed', result.message, 'success');
  } else {
    nearby.actor.health = result.health;
    nearby.actor.group.scale.setScalar(0.94 + (result.health / result.maxHealth) * 0.06);
    ui.toast('A clear strike', result.message, 'success');
  }
  updateHudOnce();
}

function attuneWaystone(object) {
  const info = object.userData.interactable;
  if (!info || info.type !== 'waystone') return;
  if (rpg.discoveredWaystones.has(info.id)) {
    object.userData.discovered = true;
    return;
  }
  const result = rpg.attuneWaystone(info.id);
  object.userData.discovered = true;
  createPulseEffect(object.position.x, object.position.y + 0.15, object.position.z, 0x9ce1c4);
  ui.toast('Waystone attuned', 'A quiet landmark is now remembered.', 'success');
  if (result.completed?.length) {
    for (const quest of result.completed) ui.toast(`${quest.title} complete`, `New thread: ${quest.unlocked}`, 'success');
  } else if (result.first) {
    ui.toast('A place remembered', 'A waystone has been added to your discoveries.', 'success');
  }
  advanceFieldTest('waystone');
}

function resonancePulse() {
  if (!gameActive || paused || !player || !worldManager || rpg.stamina < 16) return;
  let target = null;
  let best = 18 * 18;
  for (const object of worldManager.interactables) {
    const info = object.userData.interactable;
    if (info?.type !== 'waystone' || rpg.discoveredWaystones.has(info.id)) continue;
    const dx = object.position.x - player.position.x;
    const dz = object.position.z - player.position.z;
    const d = dx * dx + dz * dz;
    if (d < best) {
      best = d;
      target = object;
    }
  }
  if (!target) {
    ui.toast('The air is still', 'No old waystone answers from here.');
    return;
  }
  rpg.stamina -= 16;
  createPulseEffect(player.position.x, player.position.y + 0.2, player.position.z, 0x9bdcc3);
  attuneWaystone(target);
  updateHudOnce();
}

function createPulseEffect(x, y, z, color = 0x9fe0c4) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(pulseGeometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x - (worldManager?.renderOriginX ?? 0), y, z - (worldManager?.renderOriginZ ?? 0));
  mesh.scale.setScalar(0.35);
  scene.add(mesh);
  visualEffects.push({ mesh, material, age: 0, duration: 1.25 });
}

async function saveCurrentWorld() {
  if (!gameActive || !worldSeed || !player || !rpg) return;
  const payload = {
    version: '0.8.0',
    gameMode,
    generationVersion: generator.version,
    worldName: isFieldTestWorld ? TEST_WORLD_NAME : worldSeed,
    worldKind: isFieldTestWorld ? 'test' : 'standard',
    player: player.getSaveData(),
    worldStartPosition: worldStartPosition ? { ...worldStartPosition } : null,
    rpg: rpg.getSaveData(),
    collectedItems: [...collectedItems],
    exploredSectors: [...exploredSectors],
    worldSeconds,
    dayCount,
    creativeTimeOffsetMinutes,
    creativeWeatherOverride,
    worldEdits: worldEdits?.getSaveData() ?? null,
    worldSystems: {
      civilization: civilization?.getSaveData() ?? null,
      ecosystem: ecosystem?.getSaveData() ?? null,
      transport: transport?.getSaveData() ?? null,
      combat: combat?.getSaveData() ?? null,
      needs: needsSystem?.getSaveData() ?? null,
      maritime: maritime?.getSaveData() ?? null,
      fieldTest: fieldTestCourse?.getSaveData() ?? null,
    },
  };
  await saveWorld(worldSeed, payload);
  ui.setContinueAvailable(true);
}

function stopWorld() {
  gameActive = false;
  paused = false;
  setCameraEnabled(false);
  if (player) player.dispose();
  player = null;
  if (worldManager) worldManager.dispose();
  worldManager = null;
  if (worldActors) worldActors.dispose();
  worldActors = null;
  if (weatherVisuals) weatherVisuals.dispose();
  weatherVisuals = null;
  if (fieldTestCourse) fieldTestCourse.dispose();
  fieldTestCourse = null;
  if (creativeRoot) {
    for (const model of creativeModels.values()) disposeCreativeEntity(model);
    creativeModels.clear();
    scene.remove(creativeRoot);
    creativeRoot = null;
  }
  fieldTestLayout = null;
  isFieldTestWorld = false;
  generator = null;
  rpg = null;
  intelligence = null;
  civilization = null;
  ecosystem = null;
  weatherSystem = null;
  transport = null;
  combat = null;
  needsSystem = null;
  worldEdits = null;
  maritime = null;
  mountedCreativeShipId = null;
  gameMode = 'survival';
  worldStartPosition = null;
  creativeWeatherOverride = null;
  creativeTimeOffsetMinutes = 0;
  currentWeather = null;
  currentNearby = null;
  for (const effect of visualEffects) {
    scene.remove(effect.mesh);
    effect.material.dispose();
  }
  visualEffects.length = 0;
  ui.setFieldTestGuide(null);
  ui.hideAllOverlays();
}

function updateLighting(time, sample, weather) {
  const hour = time.hour + time.minute / 60;
  const daylight = THREE.MathUtils.clamp((Math.sin(((hour - 6) / 12) * Math.PI) + 0.15) / 1.15, 0.1, 1);
  const twilight = Math.max(0, 1 - Math.abs(hour - 6) / 2.2) + Math.max(0, 1 - Math.abs(hour - 18) / 2.2);
  const warm = THREE.MathUtils.clamp(twilight, 0, 1);
  const weatherDim = weather?.type === 'storm' ? 0.56 : weather?.type === 'overcast' || weather?.type === 'rain' || weather?.type === 'snow' ? 0.78 : 1;
  sun.intensity = (0.36 + daylight * 1.9) * weatherDim;
  hemiLight.intensity = (0.44 + daylight * 0.92) * (weather?.type === 'storm' ? 0.78 : 1);
  fillLight.intensity = (0.18 + daylight * 0.3) * weatherDim;
  sun.color.setRGB(1, 0.84 + (1 - warm) * 0.12, 0.68 + (1 - warm) * 0.29);
  const skyDay = new THREE.Color(0x9eb6ad);
  const skyNight = new THREE.Color(0x182b3a);
  const sky = skyNight.clone().lerp(skyDay, daylight);
  if (warm > 0) sky.lerp(new THREE.Color(0xb77e62), warm * 0.24);
  scene.background.copy(sky);
  scene.fog.color.copy(sky).lerp(new THREE.Color(0x6d8378), 0.18);
  const humidityMist = THREE.MathUtils.smoothstep(sample?.moisture ?? 0.45, 0.62, 0.94);
  const weatherFog = weather?.type === 'fog' ? 0.0021 : weather?.type === 'storm' ? 0.0007 : weather?.type === 'rain' || weather?.type === 'snow' ? 0.00035 : 0;
  scene.fog.density = (0.00135 + humidityMist * 0.00125 + ((sample?.temperature ?? 0.5) < 0.18 ? 0.00025 : 0) + weatherFog) / Math.max(0.42, weather?.visibility ?? 1);
  sun.position.set(player.position.x - worldManager.renderOriginX - 75, 55 + daylight * 68, player.position.z - worldManager.renderOriginZ - 48);
  sun.target.position.set(player.position.x - worldManager.renderOriginX, player.position.y, player.position.z - worldManager.renderOriginZ);
  sun.target.updateMatrixWorld();
}

function updateEffects(delta) {
  for (let i = visualEffects.length - 1; i >= 0; i -= 1) {
    const effect = visualEffects[i];
    effect.age += delta;
    const t = Math.min(1, effect.age / effect.duration);
    const scale = 0.35 + t * 8.2;
    effect.mesh.scale.setScalar(scale);
    effect.material.opacity = (1 - t) * 0.8;
    if (t >= 1) {
      scene.remove(effect.mesh);
      effect.material.dispose();
      visualEffects.splice(i, 1);
    }
  }
}

function animate(timestamp) {
  requestAnimationFrame(animate);
  clock.update(timestamp);
  const delta = Math.min(clock.getDelta(), 0.04);
  if (!gameActive || paused || ui.currentPanel || !player || !worldManager) {
    renderer.render(scene, camera);
    return;
  }

  setInput();
  player.update(delta, input, camera, rpg, transport, currentWeather);
  const rebase = worldManager.rebaseIfNeeded(player.position.x, player.position.z);
  if (rebase) {
    player.setRenderOrigin(worldManager.renderOriginX, worldManager.renderOriginZ);
    camera.position.x -= rebase.x;
    camera.position.z -= rebase.z;
    controls.target.x -= rebase.x;
    controls.target.z -= rebase.z;
  }
  controls.target.lerp(new THREE.Vector3(player.position.x - worldManager.renderOriginX, player.position.y + 1.12, player.position.z - worldManager.renderOriginZ), 1 - Math.pow(0.001, delta));
  controls.update();
  if (transport?.mounted) {
    transport.setPosition(player.position.x, player.position.z, player.position.y);
    if (mountedCreativeShipId) {
      const record = worldEdits?.entities.find((entity) => entity.id === mountedCreativeShipId);
      const model = creativeModels.get(mountedCreativeShipId);
      if (record && model) {
        record.x = player.position.x;
        record.z = player.position.z;
        record.y = -0.12;
        record.yaw = player.facing;
        model.position.set(record.x, -0.12 + Math.sin(worldSeconds * 1.8) * 0.055, record.z);
        model.rotation.y = player.facing + Math.PI;
        model.rotation.x = Math.sin(worldSeconds * 1.35 + (record.sequence ?? 0)) * 0.012;
        model.rotation.z = Math.cos(worldSeconds * 1.1 + (record.sequence ?? 0)) * 0.008;
        model.userData.worldX = record.x;
        model.userData.worldZ = record.z;
      } else {
        transport.dismount();
        mountedCreativeShipId = null;
      }
    } else worldActors?.vehiclePosition(transport.vehicleId, player.position.x, player.position.z, player.position.y);
  }

  worldManager.update(player.position.x, player.position.z);
  if (creativeRoot) creativeRoot.position.set(-worldManager.renderOriginX, 0, -worldManager.renderOriginZ);
  streamTick += delta;
  if (streamTick > 0.015) {
    worldManager.processQueue(1);
    streamTick = 0;
  }

  discoverNearbySectors();
  worldSeconds += delta;
  const clockInfo = getWorldClock();
  dayCount = clockInfo.day;
  const sample = generator.sample(player.position.x, player.position.z);
  currentWeather = weatherSystem.at(player.position.x, player.position.z, worldSeconds, sample);
  if (creativeWeatherOverride) currentWeather = makeWeatherOverride(currentWeather, creativeWeatherOverride);
  if (gameMode === 'survival') needsSystem?.update(delta, rpg, currentWeather, input.run);
  else { rpg.stamina = rpg.maxStamina; rpg.health = Math.min(rpg.maxHealth, rpg.health + delta * 0.8); }
  if (lastSimulatedDay !== clockInfo.day) {
    const knownSettlements = intelligence.settlementsNear(player.position.x, player.position.z, 2600);
    civilization.registerSettlements(knownSettlements, clockInfo.day);
    maritime.registerPorts(knownSettlements);
    civilization.advanceTo(clockInfo.day, currentWeather.season);
    ecosystem.advanceTo(clockInfo.day, currentWeather.season);
    maritime.advanceTo(clockInfo.day + clockInfo.hour / 24, civilization);
    lastSimulatedDay = clockInfo.day;
  }
  if (currentSeason !== currentWeather.season) {
    currentSeason = currentWeather.season;
    const seasonalLeaf = currentSeason === 'autumn' ? 0x8d7044 : currentSeason === 'winter' ? 0x82918b : currentSeason === 'spring' ? 0x5f8c57 : 0x476f4b;
    sharedAssets.leafMaterial.color.setHex(seasonalLeaf);
  }
  worldActors?.update(delta, player.position.x, player.position.z, clockInfo.hour + clockInfo.minute / 60, clockInfo.day, worldManager.renderOriginX, worldManager.renderOriginZ);
  maritime?.advanceTo(clockInfo.day + (clockInfo.hour + clockInfo.minute / 60) / 24, civilization);
  worldActors?.updateMaritimeShips(maritime?.voyages ?? [], clockInfo.day + (clockInfo.hour + clockInfo.minute / 60) / 24, player.position.x, player.position.z, delta, currentWeather);
  for (const model of creativeModels.values()) {
    if (model.visible && model.userData.shipType) model.userData.animateShip?.(delta, { windAngle: currentWeather?.windAngle ?? 0, windStrength: currentWeather?.windStrength ?? 0.25 });
  }
  updateCreativeVisibility();
  const fieldTestUpdate = fieldTestCourse?.update(delta, player.position.x, player.position.z, worldManager.renderOriginX, worldManager.renderOriginZ);
  if (fieldTestUpdate?.advanced) {
    updateFieldTestUi();
    ui.toast(`Test ${fieldTestCourse.completed.size} / ${fieldTestCourse.steps.length} complete`, fieldTestUpdate.next?.title ?? 'Circuit complete', 'success');
    saveCurrentWorld().catch((error) => console.warn('Test-course autosave failed:', error));
  }
  weatherVisuals?.update(delta, player.position.x - worldManager.renderOriginX, player.position.y, player.position.z - worldManager.renderOriginZ, currentWeather);
  updateLighting(clockInfo, sample, currentWeather);
  updateEffects(delta);

  // A soft, deterministic hover animation for waystones and gathered flora.
  for (const item of worldManager.interactables) {
    if (item.userData.collected || item.userData.discovered) continue;
    const info = item.userData.interactable;
    if (info?.type === 'moonleaf') item.position.y = item.userData.baseY + Math.sin(worldSeconds * 1.6 + item.position.x * 0.03) * 0.045;
    if (info?.type === 'waystone' && item.userData.cap) item.userData.cap.rotation.y += delta * 0.34;
  }

  const targets = getNearbyTargets();
  currentNearby = targets.interactable;
  let inDanger = false;
  for (const hostile of (gameMode === 'creative' ? [] : worldActors.hostiles.values())) {
    const distance = Math.hypot(hostile.x - player.position.x, hostile.z - player.position.z);
    if (distance <= 2.9) {
      inDanger = true;
      const impact = combat.contact(hostile.id, rpg, worldSeconds);
      if (impact.hit) ui.toast('A wisp presses close', `Health ${Math.ceil(impact.health)} / ${rpg.maxHealth}. Create some distance or strike back.`, 'normal');
    }
  }
  if (gameMode === 'survival') combat.recover(delta, rpg, worldSeconds, inDanger);
  ui.updateHUD({ rpg, player, sample, timeOfDay: clockInfo.label, day: clockInfo.day, nearby: currentNearby, nearbyVehicle: targets.vehicle, nearbyHostile: targets.hostile, weather: currentWeather, chunkCount: worldManager.chunks.size, gameMode, needs: needsSystem });

  saveTimer += delta;
  if (saveTimer > 75) {
    saveTimer = 0;
    saveCurrentWorld().catch((error) => console.warn('Autosave failed:', error));
  }
  renderer.render(scene, camera);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameActive) saveCurrentWorld().catch((error) => console.warn('Save on tab hide failed:', error));
});

async function boot() {
  const hasSave = await hasAnySave();
  ui.setContinueAvailable(hasSave);
  ui.setFieldTestGuide(null);
  controls.enabled = false;
  renderer.render(scene, camera);
  animate();
}

boot().catch((error) => reportStartupError('Verdant Reach could not finish starting', error));
