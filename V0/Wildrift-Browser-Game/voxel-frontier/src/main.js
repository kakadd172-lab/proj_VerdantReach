import * as THREE from 'three';
import { VoxelWorld } from './world/world.js';
import { BLOCK, BLOCK_BY_ID, HOTBAR_DEFAULT } from './world/blocks.js';
import { seedFromString, randomSeedString } from './world/noise.js';
import { PlayerController } from './player/controller.js';
import { raycastVoxels } from './player/raycast.js';
import { interactWithBlock } from './player/interactions.js';
import { Environment } from './systems/environment.js';
import { WorldStorage } from './systems/storage.js';
import { createGameRenderer, resizeGameRenderer } from './systems/renderer.js';
import { GameUI } from './ui/interface.js';

const viewport = document.getElementById('viewport');
const renderer = createGameRenderer(viewport);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb9b8);
const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 900);
const environment = new Environment(scene);
const clock = new THREE.Clock();
const ui = new GameUI();
const storage = new WorldStorage();

let world = null;
let player = null;
let gameMode = 'menu';
let seedValue = null;
let seedLabel = '';
let hotbarSlots = [...HOTBAR_DEFAULT];
let inventory = new Map();
let selectedSlot = 0;
let lastSaveAt = 0;
let lastStatsAt = 0;
let frames = 0;
let fps = 0;
let lastBiome = '';
let currentSettings = { renderDistance: 3, fov: 78, sensitivity: 0.12 };
let pendingSave = false;

const initialInventory = () => new Map([
  [BLOCK.GRASS, 32], [BLOCK.DIRT, 64], [BLOCK.STONE, 64], [BLOCK.SAND, 32],
  [BLOCK.LOG, 24], [BLOCK.LEAVES, 32], [BLOCK.PLANKS, 48], [BLOCK.COBBLE, 32],
  [BLOCK.FLOWER, 12], [BLOCK.GRAVEL, 16], [BLOCK.SNOW, 16], [BLOCK.COAL, 0],
  [BLOCK.IRON, 0], [BLOCK.GOLD, 0], [BLOCK.DIAMOND, 0], [BLOCK.CACTUS, 0],
  [BLOCK.MUSHROOM, 0], [BLOCK.MUD, 0], [BLOCK.CLAY, 0]
]);

function showFatalError(error) {
  console.error(error);
  ui.showError(`WILDRIFT COULD NOT START\n${error?.message || error}\n\nCheck your internet connection (Three.js loads from a CDN) and try again.`);
}

function findSpawn(generator) {
  const origin = generator.sampleColumn(0, 0);
  if (origin.height > 31 && origin.height < 64 && !['ocean', 'beach', 'swamp', 'desert'].includes(origin.biome)) return { x: 0, z: 0, column: origin };
  for (let radius = 4; radius <= 160; radius += 4) {
    for (let a = 0; a < 24; a++) {
      const angle = (a / 24) * Math.PI * 2;
      const x = Math.round(Math.cos(angle) * radius);
      const z = Math.round(Math.sin(angle) * radius);
      const column = generator.sampleColumn(x, z);
      if (column.height > 32 && column.height < 62 && ['plains', 'forest', 'denseForest', 'flowerField', 'savanna'].includes(column.biome)) return { x, z, column };
    }
  }
  return { x: 0, z: 0, column: origin };
}

function restoreInventory(save) {
  const restored = initialInventory();
  if (save?.inventory && typeof save.inventory === 'object') {
    for (const [key, value] of Object.entries(save.inventory)) {
      const id = Number(key), count = Math.max(0, Math.floor(Number(value) || 0));
      if (BLOCK_BY_ID[id] && id !== BLOCK.AIR) restored.set(id, count);
    }
  }
  return restored;
}

function getSaveRecord() {
  return {
    seed: seedValue,
    seedLabel,
    player: player ? {
      x: player.position.x, y: player.position.y, z: player.position.z,
      yaw: player.yaw, pitch: player.pitch
    } : null,
    inventory: Object.fromEntries(inventory.entries()),
    hotbarSlots,
    selectedSlot,
    overrides: world?.getOverridesForSave() ?? [],
    settings: currentSettings
  };
}

async function saveWorld(showFeedback = true) {
  if (!world || seedValue == null || pendingSave) return;
  pendingSave = true;
  try {
    await storage.save(getSaveRecord());
    lastSaveAt = performance.now();
    if (showFeedback) ui.saved();
  } catch (error) {
    console.error('Save failed:', error);
    ui.toast('Could not save — browser storage may be disabled');
  } finally {
    pendingSave = false;
  }
}

function updateInventoryUI() {
  ui.setWorldState(hotbarSlots, inventory, selectedSlot);
}

function selectSlot(index) {
  if (index < 0 || index >= hotbarSlots.length) return;
  selectedSlot = index;
  updateInventoryUI();
}

function addToInventory(id, amount = 1) {
  if (!id || id === BLOCK.WATER || id === BLOCK.BEDROCK) return;
  inventory.set(id, (inventory.get(id) || 0) + amount);
  updateInventoryUI();
}

function chooseInventoryBlock(id) {
  const count = inventory.get(id) || 0;
  if (count <= 0) return;
  hotbarSlots[selectedSlot] = id;
  updateInventoryUI();
  ui.toast(`${BLOCK_BY_ID[id]?.name ?? 'Block'} selected`);
}

function toggleInventory() {
  if (gameMode === 'playing') {
    gameMode = 'inventory';
    player.unlock();
    ui.showInventory();
  } else if (gameMode === 'inventory') {
    gameMode = 'playing';
    ui.hideInventory();
    player.lock();
  }
}

function pauseGame() {
  if (gameMode !== 'playing') return;
  gameMode = 'paused';
  player?.unlock();
  ui.showPause(seedLabel);
  saveWorld(false);
}

function resumeGame() {
  if (!player || gameMode !== 'paused') return;
  gameMode = 'playing';
  ui.showHud();
  player.lock();
}

function configureUI() {
  ui.setCallbacks({
    onPlay: (value) => startWorld(value, null),
    onRandomSeed: () => { document.getElementById('seed-input').value = randomSeedString(); },
    onContinue: async () => {
      try {
        const last = await storage.lastWorld();
        if (last) startWorld(last.seedLabel || String(last.seed), last);
      } catch (error) { showFatalError(error); }
    },
    onResume: resumeGame,
    onSave: () => saveWorld(true),
    onQuit: async () => {
      await saveWorld(false);
      returnToMenu();
    },
    onCloseInventory: () => toggleInventory(),
    onChooseInventoryBlock: chooseInventoryBlock,
    onRenderDistance: (value) => {
      currentSettings.renderDistance = value;
      if (world) { world.renderDistance = value; world.lastCenter = null; }
    },
    onFov: (value) => {
      currentSettings.fov = value;
      player?.setFov(value);
    },
    onSensitivity: (value) => {
      currentSettings.sensitivity = value;
      player?.setSensitivity(value);
    }
  });
}

async function startWorld(label, existingSave = null) {
  if (gameMode === 'loading') return;
  gameMode = 'loading';
  ui.showLoading('Reading your world seed…');
  try {
    seedLabel = String(label || 'wildrift').trim() || 'wildrift';
    seedValue = existingSave?.seed ?? seedFromString(seedLabel);
    let saved = existingSave;
    if (!saved) {
      try { saved = await storage.load(seedValue); }
      catch (storageError) { console.warn('Could not read saved data; starting a fresh world.', storageError); saved = null; }
    }
    currentSettings = { ...currentSettings, ...(saved?.settings || {}) };
    ui.setSettings(currentSettings);
    if (world) world.dispose();
    if (player) player.dispose();

    world = new VoxelWorld(scene, seedValue, { renderDistance: currentSettings.renderDistance });
    if (saved?.overrides) world.loadOverrides(saved.overrides);

    inventory = saved ? restoreInventory(saved) : initialInventory();
    hotbarSlots = Array.isArray(saved?.hotbarSlots) && saved.hotbarSlots.length === 9 ? saved.hotbarSlots.map(Number) : [...HOTBAR_DEFAULT];
    selectedSlot = Math.max(0, Math.min(8, Number(saved?.selectedSlot) || 0));

    const spawn = findSpawn(world.generator);
    let px = spawn.x + 0.5, py = spawn.column.height + 1.05, pz = spawn.z + 0.5;
    let yaw = 0, pitch = 0;
    if (saved?.player && Number.isFinite(saved.player.x + saved.player.y + saved.player.z)) {
      px = saved.player.x; py = saved.player.y; pz = saved.player.z;
      yaw = Number(saved.player.yaw) || 0; pitch = Number(saved.player.pitch) || 0;
    }

    ui.setLoadingProgress(25, 'Carving the first landscape…');
    const cx = Math.floor(px / 16), cz = Math.floor(pz / 16);
    world.loadSync(cx, cz);
    world.update(px, pz);

    player = new PlayerController(camera, renderer.domElement, world, currentSettings);
    player.setPosition(px, py, pz);
    player.setLook(yaw, pitch);
    player.onLockChange = (locked) => {
      if (!locked && gameMode === 'playing') pauseGame();
    };
    camera.fov = currentSettings.fov;
    camera.updateProjectionMatrix();

    updateInventoryUI();
    ui.setLoadingProgress(72, 'Loading nearby chunks…');
    // The spawn chunk is ready synchronously; surrounding chunks stream in from workers.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    ui.setLoadingProgress(100, 'Ready when you are.');
    gameMode = 'playing';
    ui.showHud();
    lastSaveAt = performance.now();
    player.lock();
    ui.toast(`Seed ${seedLabel} · click the world if mouse look does not engage`);
  } catch (error) {
    gameMode = 'menu';
    showFatalError(error);
    ui.showMain(null);
  }
}

async function returnToMenu() {
  gameMode = 'menu';
  if (player) { player.dispose(); player = null; }
  if (world) { world.dispose(); world = null; }
  const last = await storage.lastWorld().catch(() => null);
  ui.showMain(last);
}

function interact(button) {
  if (gameMode !== 'playing' || !player?.pointerLocked || !world) return;
  interactWithBlock({
    button, world, camera, player, hotbarSlots, selectedSlot, inventory,
    onInventoryChanged: updateInventoryUI,
    onMessage: (message) => ui.toast(message)
  });
}

renderer.domElement.addEventListener('mousedown', (event) => {
  if (event.button === 0 || event.button === 2) {
    event.preventDefault();
    interact(event.button);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE' && (gameMode === 'playing' || gameMode === 'inventory')) {
    event.preventDefault();
    toggleInventory();
    return;
  }
  if (event.code === 'Escape' && gameMode === 'inventory') {
    event.preventDefault();
    toggleInventory();
    return;
  }
  if (gameMode === 'playing' && /^Digit[1-9]$/.test(event.code)) {
    selectSlot(Number(event.code.slice(5)) - 1);
  }
  if (event.code === 'Escape' && gameMode === 'paused') {
    event.preventDefault();
    resumeGame();
  }
});

window.addEventListener('resize', () => resizeGameRenderer(renderer, camera));

window.addEventListener('blur', () => {
  if (gameMode === 'playing' && player?.pointerLocked) pauseGame();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveWorld(false);
});

let lastUiUpdate = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (gameMode === 'playing' && player && world) {
    player.update(delta);
    world.update(player.position.x, player.position.z);
  } else if (world && gameMode === 'paused') {
    world.update(player?.position.x ?? 0, player?.position.z ?? 0);
  }
  environment.update(delta, camera);

  if (gameMode === 'playing' && player && world) {
    frames++;
    const now = performance.now();
    if (now - lastStatsAt > 500) {
      fps = frames * 1000 / (now - lastStatsAt || 1);
      frames = 0;
      lastStatsAt = now;
    }
    if (now - lastUiUpdate > 180) {
      const column = world.sampleColumn(Math.floor(player.position.x), Math.floor(player.position.z));
      lastBiome = column.biomeLabel;
      const direction = new THREE.Vector3(); camera.getWorldDirection(direction);
      const target = raycastVoxels(world, camera.position, direction, 7);
      ui.updateStats(player.position, fps, lastBiome, target ? BLOCK_BY_ID[target.id]?.name : '');
      lastUiUpdate = now;
    }
    if (now - lastSaveAt > 30000) saveWorld(false);
  }

  renderer.render(scene, camera);
}

async function boot() {
  configureUI();
  ui.showMain(null);
  ui.setSettings(currentSettings);
  try {
    const last = await storage.lastWorld();
    if (last) ui.showMain(last);
  } catch (error) {
    console.warn('Saved worlds are unavailable until this page is served over localhost or HTTPS.', error);
  }
  animate();
}

boot().catch(showFatalError);
