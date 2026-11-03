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
import { saveWorld, loadWorld, hasAnySave, getLatestSave } from './systems/persistence.js';
import { GameInterface } from './ui/interface.js';
import { formatSeed } from './core/random.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#world-canvas');
const ui = new GameInterface();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
const clock = new THREE.Clock();
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
let worldActors = null;
let weatherVisuals = null;
let currentWeather = null;
let currentMarketSettlement = null;
let lastSimulatedDay = -1;
let currentSeason = '';
let worldSeed = '';
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
  const record = worldActors?.settlements.get(currentMarketSettlement);
  if (record) ui.showPanel('market', { rpg, settlement: record.settlement, market: record.state, player });
}

function craftItem(recipe) {
  if (!rpg) return;
  const result = rpg.craft(recipe);
  ui.toast(result.ok ? 'Crafting complete' : 'Cannot craft', result.message, result.ok ? 'success' : 'normal');
  if (ui.currentPanel === 'inventory') ui.showPanel('inventory', { rpg, player, chunkCount: worldManager?.chunks.size ?? 0 });
}

function spendSkillPoint(skill) {
  if (!rpg) return;
  const result = rpg.spendSkillPoint(skill);
  ui.toast(result.ok ? 'Skill improved' : 'Training unavailable', result.message, result.ok ? 'success' : 'normal');
  if (ui.currentPanel === 'character') ui.showPanel('character', { rpg, player });
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

async function startWorld(seedInput, shouldLoad = true) {
  const seed = formatSeed(seedInput);
  if (!seed) return;
  ui.showLoading('Listening for the shape of the land…');
  ui.menu.classList.add('hidden');
  ui.updateLoading(6, 'Reading the old earth…');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const saved = shouldLoad ? await loadWorld(seed) : null;
  worldSeed = seed;
  generator = new WorldGenerator(seed);
  rpg = new RPGSystem(saved?.rpg ?? null);
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
    : generator.findSpawn();

  if (worldActors) worldActors.dispose();
  if (weatherVisuals) weatherVisuals.dispose();
  intelligence = new WorldIntelligence(generator, spawn);
  civilization = new CivilizationSystem(generator.seed, intelligence, saved?.worldSystems?.civilization ?? null);
  ecosystem = new EcosystemSystem(generator.seed, generator, saved?.worldSystems?.ecosystem ?? null);
  weatherSystem = new WeatherSystem(generator.seed);
  transport = new TransportSystem(saved?.worldSystems?.transport ?? null);
  combat = new CombatSystem(generator.seed, generator, intelligence, saved?.worldSystems?.combat ?? null);
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
  weatherVisuals = new WeatherVisuals(scene, seed);
  const initialClock = getWorldClock();
  dayCount = initialClock.day;
  if (transport.mounted) {
    const savedPosition = transport.position ?? { x: player.position.x, z: player.position.z, y: transport.mode === 'boat' ? -0.12 : player.position.y };
    if (transport.mode === 'boat') player.position.y = -0.12;
    const vehicle = worldActors.ensureVehicle(transport.mode, transport.vehicleId ?? `restored:${transport.mode}`, savedPosition.x, savedPosition.z, savedPosition.y);
    if (vehicle) {
      transport.vehicleId = vehicle.id;
      transport.setPosition(savedPosition.x, savedPosition.z, savedPosition.y);
      worldActors.vehiclePosition(vehicle.id, player.position.x, player.position.z, player.position.y);
    } else {
      transport.dismount();
    }
  }
  civilization.advanceTo(initialClock.day, currentWeather.season);
  ecosystem.advanceTo(initialClock.day, currentWeather.season);
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
  gameActive = true;
  setPaused(false);
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
  candidates.sort((a, b) => a.distance - b.distance);
  const vehicle = transport?.mounted ? null : worldActors?.nearestVehicle(player.position.x, player.position.z, 7)?.vehicle ?? null;
  const hostile = worldActors?.nearestHostile(player.position.x, player.position.z, 5)?.actor ?? null;
  return { interactable: candidates[0]?.object ?? null, vehicle, hostile };
}

function updateHudOnce() {
  if (!player || !generator || !rpg) return;
  const sample = generator.sample(player.position.x, player.position.z);
  const time = getWorldClock();
  currentWeather = weatherSystem?.at(player.position.x, player.position.z, worldSeconds, sample) ?? null;
  const targets = getNearbyTargets();
  currentNearby = targets.interactable;
  ui.updateHUD({ rpg, player, sample, timeOfDay: time.label, day: time.day, nearby: currentNearby, nearbyVehicle: targets.vehicle, nearbyHostile: targets.hostile, weather: currentWeather, chunkCount: worldManager.chunks.size });
}

function getWorldClock() {
  const totalMinutes = Math.floor(worldSeconds / 20 * 60) + 8 * 60;
  const day = Math.floor(totalMinutes / (24 * 60)) + 1;
  const minuteOfDay = totalMinutes % (24 * 60);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return { hour, minute, day, label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

function interact() {
  if (!gameActive || paused || !player || !worldManager) return;
  const targets = getNearbyTargets();
  const object = targets.interactable;
  if (!object) {
    ui.toast('Nothing close enough', 'Move closer to a landmark, local resident, or wild creature.');
    return;
  }
  const info = object.userData.interactable;
  if (!info) return;
  if (info.type === 'moonleaf') {
    object.userData.collected = true;
    collectedItems.add(info.id);
    const harvest = 1 + Math.floor(Math.max(0, rpg.skills.foraging - 1) / 4);
    const result = rpg.addMoonleaf(harvest);
    ui.toast('Moonleaf gathered', `Collected ${harvest} sprig${harvest === 1 ? '' : 's'}.`, 'success');
    for (const quest of result.completed ?? []) ui.toast(`${quest.title} complete`, `New thread: ${quest.unlocked}`, 'success');
  } else if (info.type === 'waystone') {
    attuneWaystone(object);
  } else if (info.type === 'npc') {
    const actor = worldActors?.npcs.get(info.id);
    if (!actor) return;
    if (actor.npc.profession === 'trader' || actor.npc.profession === 'fisher') {
      openMarket(actor);
    } else {
      const result = civilization.talkTo(info.id, dayCount);
      rpg.awardSkill('commerce', 2);
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
      ui.toast('Wild provisions gathered', `${reward.label}: +${reward.gameMeat} game meat${reward.hide ? `, +${reward.hide} hide` : ''}.`, 'success');
    }
  }
  updateHudOnce();
}

function toggleVehicle() {
  if (!gameActive || paused || !player || !transport || !worldActors) return;
  if (transport.mounted) {
    if (transport.mode === 'boat' && generator.heightAt(player.position.x, player.position.z) < 0.65) {
      ui.toast('Stay aboard for now', 'Bring the skiff to a shallow shore before disembarking.');
      return;
    }
    const id = transport.vehicleId;
    const mode = transport.dismount();
    const parkedX = player.position.x + 3.5;
    const parkedZ = player.position.z + 2.5;
    worldActors.vehiclePosition(id, parkedX, parkedZ, generator.heightAt(parkedX, parkedZ));
    ui.toast('Travel on foot', `You left the ${mode} nearby.`, 'success');
    updateHudOnce();
    return;
  }
  const nearby = worldActors.nearestVehicle(player.position.x, player.position.z, 8);
  if (!nearby) {
    ui.toast('No vehicle nearby', 'Look for a stable, handcart, or coastal skiff in a settlement.');
    return;
  }
  const vehicle = nearby.vehicle;
  if (!transport.mount({ id: vehicle.id, mode: vehicle.mode })) return;
  worldActors.detachVehicle(vehicle.id);
  player.setPosition(vehicle.x, vehicle.z);
  if (vehicle.mode === 'boat') player.position.y = -0.12;
  player.group.position.set(player.position.x - worldManager.renderOriginX, player.position.y, player.position.z - worldManager.renderOriginZ);
  transport.setPosition(player.position.x, player.position.z, player.position.y);
  worldActors.vehiclePosition(vehicle.id, player.position.x, player.position.z, player.position.y);
  ui.toast(vehicle.mode === 'boat' ? 'Skiff launched' : 'Journey mounted', vehicle.mode === 'horse' ? 'The horse is ready to travel.' : vehicle.mode === 'cart' ? 'The handcart is ready to roll.' : 'The coast opens into the sea.', 'success');
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
    version: '0.3.0',
    generationVersion: generator.version,
    player: player.getSaveData(),
    rpg: rpg.getSaveData(),
    collectedItems: [...collectedItems],
    exploredSectors: [...exploredSectors],
    worldSeconds,
    dayCount,
    worldSystems: {
      civilization: civilization?.getSaveData() ?? null,
      ecosystem: ecosystem?.getSaveData() ?? null,
      transport: transport?.getSaveData() ?? null,
      combat: combat?.getSaveData() ?? null,
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
  generator = null;
  rpg = null;
  intelligence = null;
  civilization = null;
  ecosystem = null;
  weatherSystem = null;
  transport = null;
  combat = null;
  currentWeather = null;
  currentNearby = null;
  for (const effect of visualEffects) {
    scene.remove(effect.mesh);
    effect.material.dispose();
  }
  visualEffects.length = 0;
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

function animate() {
  requestAnimationFrame(animate);
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
    worldActors?.vehiclePosition(transport.vehicleId, player.position.x, player.position.z, player.position.y);
  }

  worldManager.update(player.position.x, player.position.z);
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
  if (lastSimulatedDay !== clockInfo.day) {
    const knownSettlements = intelligence.settlementsNear(player.position.x, player.position.z, 2600);
    civilization.registerSettlements(knownSettlements, clockInfo.day);
    civilization.advanceTo(clockInfo.day, currentWeather.season);
    ecosystem.advanceTo(clockInfo.day, currentWeather.season);
    lastSimulatedDay = clockInfo.day;
  }
  if (currentSeason !== currentWeather.season) {
    currentSeason = currentWeather.season;
    const seasonalLeaf = currentSeason === 'autumn' ? 0x8d7044 : currentSeason === 'winter' ? 0x82918b : currentSeason === 'spring' ? 0x5f8c57 : 0x476f4b;
    sharedAssets.leafMaterial.color.setHex(seasonalLeaf);
  }
  worldActors?.update(delta, player.position.x, player.position.z, clockInfo.hour + clockInfo.minute / 60, clockInfo.day, worldManager.renderOriginX, worldManager.renderOriginZ);
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
  for (const hostile of worldActors.hostiles.values()) {
    const distance = Math.hypot(hostile.x - player.position.x, hostile.z - player.position.z);
    if (distance <= 2.9) {
      inDanger = true;
      const impact = combat.contact(hostile.id, rpg, worldSeconds);
      if (impact.hit) ui.toast('A wisp presses close', `Health ${Math.ceil(impact.health)} / ${rpg.maxHealth}. Create some distance or strike back.`, 'normal');
    }
  }
  combat.recover(delta, rpg, worldSeconds, inDanger);
  ui.updateHUD({ rpg, player, sample, timeOfDay: clockInfo.label, day: clockInfo.day, nearby: currentNearby, nearbyVehicle: targets.vehicle, nearbyHostile: targets.hostile, weather: currentWeather, chunkCount: worldManager.chunks.size });

  saveTimer += delta;
  if (saveTimer > 75) {
    saveTimer = 0;
    saveCurrentWorld().catch((error) => console.warn('Autosave failed:', error));
  }
  renderer.render(scene, camera);
}

$('#random-seed').addEventListener('click', () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = '';
  for (let i = 0; i < 10; i += 1) seed += alphabet[Math.floor(Math.random() * alphabet.length)];
  ui.setSeed(seed);
});
$('#start-world').addEventListener('click', () => startWorld(ui.getSeed(), true));
$('#continue-world').addEventListener('click', async () => {
  const latest = await getLatestSave();
  if (!latest?.seed) {
    ui.toast('No saved journey found', 'Create a new world to begin.');
    return;
  }
  ui.setSeed(latest.seed);
  await startWorld(latest.seed, true);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameActive) saveCurrentWorld().catch((error) => console.warn('Save on tab hide failed:', error));
});

async function boot() {
  const hasSave = await hasAnySave();
  ui.setContinueAvailable(hasSave);
  controls.enabled = false;
  renderer.render(scene, camera);
  animate();
}

boot();
