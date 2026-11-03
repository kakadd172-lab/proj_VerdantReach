import { BLOCK_BY_ID, INVENTORY_BLOCKS, blockHex } from '../world/blocks.js';

const $ = (id) => document.getElementById(id);

export class GameUI {
  constructor() {
    this.mainMenu = $('main-menu');
    this.pauseScreen = $('pause-screen');
    this.settingsScreen = $('settings-screen');
    this.loadingScreen = $('loading-screen');
    this.inventoryScreen = $('inventory-screen');
    this.hud = $('hud');
    this.inventoryOpen = false;
    this.hotbarSlots = [];
    this.inventory = new Map();
    this.selectedSlot = 0;
    this.callbacks = {};
    this.bind();
  }

  bind() {
    $('play-button').addEventListener('click', () => this.callbacks.onPlay?.($('seed-input').value));
    $('random-seed').addEventListener('click', () => this.callbacks.onRandomSeed?.());
    $('continue-button').addEventListener('click', () => this.callbacks.onContinue?.());
    $('resume-button').addEventListener('click', () => this.callbacks.onResume?.());
    $('save-button').addEventListener('click', () => this.callbacks.onSave?.());
    $('quit-button').addEventListener('click', () => this.callbacks.onQuit?.());
    $('settings-button').addEventListener('click', () => this.showSettings());
    $('settings-back').addEventListener('click', () => this.hideSettings());
    $('inventory-close').addEventListener('click', () => this.callbacks.onCloseInventory?.());
    $('render-distance').addEventListener('input', (event) => {
      $('render-distance-value').textContent = `${event.target.value} chunks`;
      this.callbacks.onRenderDistance?.(Number(event.target.value));
    });
    $('fov-setting').addEventListener('input', (event) => {
      $('fov-value').textContent = `${event.target.value}°`;
      this.callbacks.onFov?.(Number(event.target.value));
    });
    $('sensitivity-setting').addEventListener('input', (event) => {
      $('sensitivity-value').textContent = Number(event.target.value).toFixed(2);
      this.callbacks.onSensitivity?.(Number(event.target.value));
    });
  }

  setCallbacks(callbacks) { this.callbacks = callbacks; }

  showOnly(screen) {
    for (const item of [this.mainMenu, this.pauseScreen, this.settingsScreen, this.loadingScreen, this.inventoryScreen]) item.classList.remove('visible');
    if (screen) screen.classList.add('visible');
  }

  showMain(lastWorld = null) {
    this.hud.classList.add('hidden');
    this.showOnly(this.mainMenu);
    $('continue-button').hidden = !lastWorld;
    if (lastWorld?.seedLabel) $('seed-input').value = lastWorld.seedLabel;
  }

  showLoading(message = 'Finding the first horizon…') {
    this.showOnly(this.loadingScreen);
    $('loading-message').textContent = message;
    $('loading-progress').style.width = '8%';
    this.hud.classList.add('hidden');
  }

  setLoadingProgress(value, message) {
    $('loading-progress').style.width = `${Math.max(0, Math.min(100, value))}%`;
    if (message) $('loading-message').textContent = message;
  }

  showHud() {
    this.showOnly(null);
    this.hud.classList.remove('hidden');
  }

  showPause(seedLabel) {
    $('pause-world-label').textContent = `Seed: ${seedLabel} · Your progress is saved locally.`;
    this.showOnly(this.pauseScreen);
    this.hud.classList.remove('hidden');
  }

  showSettings() { this.showOnly(this.settingsScreen); }
  hideSettings() { this.showOnly(this.pauseScreen); }

  showInventory() {
    this.inventoryOpen = true;
    this.showOnly(this.inventoryScreen);
    this.hud.classList.remove('hidden');
    this.renderInventory();
  }

  hideInventory() {
    this.inventoryOpen = false;
    this.showOnly(null);
  }

  setSettings(settings = {}) {
    if (settings.renderDistance != null) {
      $('render-distance').value = settings.renderDistance;
      $('render-distance-value').textContent = `${settings.renderDistance} chunks`;
    }
    if (settings.fov != null) {
      $('fov-setting').value = settings.fov;
      $('fov-value').textContent = `${settings.fov}°`;
    }
    if (settings.sensitivity != null) {
      $('sensitivity-setting').value = settings.sensitivity;
      $('sensitivity-value').textContent = Number(settings.sensitivity).toFixed(2);
    }
  }

  setWorldState(hotbarSlots, inventory, selectedSlot) {
    this.hotbarSlots = [...hotbarSlots];
    this.inventory = inventory;
    this.selectedSlot = selectedSlot;
    this.renderHotbar();
    if (this.inventoryOpen) this.renderInventory();
  }

  renderHotbar() {
    const root = $('hotbar');
    root.innerHTML = '';
    this.hotbarSlots.forEach((id, index) => {
      const block = BLOCK_BY_ID[id];
      const count = this.inventory.get(id) || 0;
      const slot = document.createElement('div');
      slot.className = `hotbar-slot${index === this.selectedSlot ? ' selected' : ''}`;
      slot.innerHTML = `<span class="slot-number">${index + 1}</span><span class="block-icon" style="background:${blockHex(id)}"></span><span class="slot-count">${count > 0 ? count : ''}</span>`;
      slot.title = `${block?.name ?? 'Unknown'} (${count})`;
      root.appendChild(slot);
    });
  }

  renderInventory() {
    const root = $('inventory-grid');
    root.innerHTML = '';
    for (const id of INVENTORY_BLOCKS) {
      const block = BLOCK_BY_ID[id];
      const count = this.inventory.get(id) || 0;
      const isSelected = this.hotbarSlots[this.selectedSlot] === id;
      const button = document.createElement('button');
      button.className = `inventory-item${isSelected ? ' active' : ''}`;
      button.innerHTML = `<span class="block-icon" style="background:${blockHex(id)}"></span><span class="inventory-name">${block.name}</span><span class="inventory-count">${count}</span>`;
      button.disabled = count <= 0;
      button.addEventListener('click', () => this.callbacks.onChooseInventoryBlock?.(id));
      root.appendChild(button);
    }
  }

  updateStats(position, fps, biome, targetName) {
    $('coords-label').textContent = `X ${Math.floor(position.x)} · Y ${Math.floor(position.y)} · Z ${Math.floor(position.z)}`;
    $('fps-counter').textContent = `${Math.round(fps)} FPS`;
    if (biome) $('biome-label').textContent = biome.toUpperCase();
    $('target-label').textContent = targetName ? targetName.toUpperCase() : '';
  }

  toast(message) {
    const node = $('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => node.classList.remove('show'), 1550);
  }

  saved() {
    const node = $('save-indicator');
    node.classList.add('show');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => node.classList.remove('show'), 1250);
  }

  showError(message) {
    const node = $('error-panel');
    node.textContent = message;
    node.classList.remove('hidden');
  }
}
