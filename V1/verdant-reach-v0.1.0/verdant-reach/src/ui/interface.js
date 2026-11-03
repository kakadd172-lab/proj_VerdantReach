import { BIOMES } from '../world/biomes.js';

const $ = (selector) => document.querySelector(selector);

export class GameInterface {
  constructor() {
    this.menu = $('#main-menu');
    this.hud = $('#hud');
    this.panelLayer = $('#panel-layer');
    this.panelContent = $('#panel-content');
    this.pauseScreen = $('#pause-screen');
    this.loadingCover = $('#loading-cover');
    this.toastStack = $('#toast-stack');
    this.prompt = $('#interaction-prompt');
    this.promptText = $('#interaction-text');
    this.onPanelOpen = null;
    this.onPanelClose = null;
    this.onSave = null;
    this.onResume = null;
    this.onReturnMenu = null;
    this.onCameraSensitivity = null;
    this.currentPanel = null;
    this.explored = new Set();
    this.mapGenerator = null;
    this.mapCenter = { x: 0, z: 0 };

    $('#close-panel').addEventListener('click', () => this.closePanel());
    $('.panel-scrim').addEventListener('click', () => this.closePanel());
    $('#pause-button').addEventListener('click', () => this.showPause());
    $('#open-journal').addEventListener('click', () => this.onPanelOpen?.('journal'));
    $('#resume-game').addEventListener('click', () => this.hidePause());
    $('#save-game').addEventListener('click', async () => {
      await this.onSave?.();
      this.toast('Journey saved', 'Your path is safely recorded.');
    });
    $('#return-menu').addEventListener('click', () => this.onReturnMenu?.());
    document.querySelectorAll('[data-panel]').forEach((button) => {
      button.addEventListener('click', () => this.onPanelOpen?.(button.dataset.panel));
    });
  }

  bindMap(generator, explored) {
    this.mapGenerator = generator;
    this.explored = explored;
  }

  showMenu() {
    this.menu.classList.remove('hidden');
    this.menu.classList.add('screen-visible');
    this.hud.classList.add('hidden');
    this.panelLayer.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
  }

  enterGame() {
    this.menu.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
  }

  showLoading(message = 'Reading the old earth…') {
    this.loadingCover.classList.remove('hidden');
    $('#loading-status').textContent = message;
    $('#loading-progress').style.width = '8%';
  }

  updateLoading(progress, message) {
    $('#loading-progress').style.width = `${Math.max(0, Math.min(100, progress))}%`;
    if (message) $('#loading-status').textContent = message;
  }

  hideLoading() {
    this.loadingCover.classList.add('hidden');
  }

  setContinueAvailable(available) {
    $('#continue-world').classList.toggle('hidden', !available);
  }

  setSeed(seed) {
    $('#world-seed').value = seed;
  }

  getSeed() {
    return $('#world-seed').value.trim();
  }

  updateHUD({ rpg, player, sample, timeOfDay, day, nearby, chunkCount }) {
    const biomeName = BIOMES[sample.biome]?.name ?? 'The Reach';
    $('#biome-name').textContent = biomeName;
    $('#world-coords').textContent = `${Math.round(player.position.x)}, ${Math.round(player.position.z)} · DAY ${day}`;
    $('#world-time').textContent = timeOfDay;
    $('#weather-label').textContent = sample.temperature < 0.18 ? 'FROST AIR' : sample.moisture > 0.76 ? 'MISTY' : 'CLEAR';
    $('#stamina-value').textContent = `${Math.round(rpg.stamina)} / ${rpg.maxStamina}`;
    $('#stamina-bar').style.width = `${(rpg.stamina / rpg.maxStamina) * 100}%`;
    $('#level-value').textContent = rpg.level;
    $('#xp-value').textContent = `${Math.floor(rpg.xp)} / ${rpg.nextXp} XP`;
    $('#xp-bar').style.width = `${(rpg.xp / rpg.nextXp) * 100}%`;
    const quest = rpg.currentQuest;
    $('#quest-chip-title').textContent = quest.title;
    $('#quest-chip-progress').textContent = quest.openEnded ? 'No fixed path — explore freely' : `${quest.objective} ${Math.min(quest.progress, quest.target)} / ${quest.target}`;
    this.prompt.classList.toggle('hidden', !nearby);
    if (nearby) this.promptText.textContent = nearby.userData.interactable?.label ?? 'Interact';
  }

  showPanel(type, state = {}) {
    this.currentPanel = type;
    this.panelLayer.classList.remove('hidden');
    this.panelLayer.classList.add('panel-visible');
    this.panelContent.innerHTML = this._panelMarkup(type, state);
    if (type === 'map') this._drawMap(state.player);
    const slider = $('#camera-sensitivity');
    if (slider) slider.addEventListener('input', () => this.onCameraSensitivity?.(Number(slider.value)));
  }

  closePanel() {
    this.panelLayer.classList.add('hidden');
    this.panelLayer.classList.remove('panel-visible');
    this.currentPanel = null;
    this.onPanelClose?.();
  }

  showPause() {
    this.pauseScreen.classList.remove('hidden');
  }

  hidePause() {
    this.pauseScreen.classList.add('hidden');
    this.onResume?.();
  }

  hideAllOverlays() {
    this.closePanel();
    this.pauseScreen.classList.add('hidden');
  }

  toast(title, message = '', tone = 'normal') {
    const node = document.createElement('div');
    node.className = `toast toast-${tone}`;
    node.innerHTML = `<span class="toast-mark">${tone === 'success' ? '✦' : '◇'}</span><div><b>${title}</b><small>${message}</small></div>`;
    this.toastStack.appendChild(node);
    requestAnimationFrame(() => node.classList.add('toast-in'));
    window.setTimeout(() => {
      node.classList.remove('toast-in');
      window.setTimeout(() => node.remove(), 350);
    }, 3400);
  }

  _panelMarkup(type, state) {
    const { rpg } = state;
    if (type === 'inventory') {
      return `
        <div class="panel-eyebrow">TRAVELLER'S PACK</div>
        <h2>Inventory</h2>
        <p class="panel-lede">A small collection gathered from the living Reach.</p>
        <div class="inventory-grid">
          ${this._itemCard('moonleaf', 'Moonleaf', 'A cool, silver-veined herb found near woodland edges.', '✿', rpg?.inventory.moonleaf ?? 0)}
          ${this._itemCard('echoGlass', 'Echo glass', 'A clear shard that holds a faint, remembered tone.', '◇', rpg?.inventory.echoGlass ?? 0)}
          ${this._itemCard('silverPetal', 'Silver petals', 'A simple trade token used by travelling folk.', '✧', rpg?.inventory.silverPetal ?? 0)}
        </div>
        <div class="panel-note"><span>✦</span> Equipment and crafting will grow from this pack system in a later chapter.</div>
      `;
    }
    if (type === 'journal') {
      const quest = rpg?.currentQuest;
      const completed = state.completedQuests ?? [];
      return `
        <div class="panel-eyebrow">FIELD NOTES</div>
        <h2>Journey journal</h2>
        <p class="panel-lede">Threads worth following, places worth remembering.</p>
        <article class="quest-card active-quest">
          <div class="quest-card-top"><span class="quest-status">ACTIVE THREAD</span><span class="quest-reward">${quest?.reward ?? ''}</span></div>
          <h3>${quest?.title ?? 'The Open Horizon'}</h3>
          <p>${quest?.description ?? ''}</p>
          <div class="quest-objective"><span>${quest?.objective ?? ''}</span><b>${quest?.openEnded ? 'ONGOING' : `${Math.min(quest?.progress ?? 0, quest?.target ?? 1)} / ${quest?.target ?? 1}`}</b></div>
          ${quest?.openEnded ? '' : `<div class="quest-progress"><i style="width:${Math.min(100, ((quest?.progress ?? 0) / Math.max(1, quest?.target ?? 1)) * 100)}%"></i></div>`}
        </article>
        <div class="journal-stats"><div><b>${rpg?.level ?? 1}</b><span>TRAVELLER LEVEL</span></div><div><b>${rpg?.discoveredWaystones.size ?? 0}</b><span>WAYSTONES FOUND</span></div><div><b>${state.chunkCount ?? 0}</b><span>REGIONS LOADED</span></div></div>
        <div class="panel-note"><span>⌖</span> The Reach is generated from your world seed. Returning to the same seed returns to the same geography.</div>
      `;
    }
    if (type === 'map') {
      return `
        <div class="panel-eyebrow">A CHART THAT GROWS WITH YOU</div>
        <h2>World chart</h2>
        <p class="panel-lede">Untravelled places remain veiled. Follow the pale marker to see where you stand.</p>
        <div class="map-wrap"><canvas id="world-map" width="540" height="540"></canvas><div class="map-north">N ↑</div></div>
        <div class="map-legend"><span><i class="legend-land"></i> Known land</span><span><i class="legend-water"></i> Known sea</span><span><i class="legend-player"></i> You</span><span><i class="legend-unknown"></i> Unexplored</span></div>
        <div class="panel-note"><span>⌖</span> Map knowledge is remembered as you travel and is stored with your save.</div>
      `;
    }
    return `
      <div class="panel-eyebrow">REALM OPTIONS</div>
      <h2>Settings</h2>
      <p class="panel-lede">Fine-tune the view of the Reach.</p>
      <div class="setting-row"><div><b>Camera sensitivity</b><span>How quickly the view responds to orbit controls.</span></div><input id="camera-sensitivity" type="range" min="0.25" max="1.8" step="0.05" value="1" /></div>
      <div class="setting-row"><div><b>Render distance</b><span>Terrain regions currently stream around you.</span></div><strong>7 × 7 regions</strong></div>
      <div class="setting-row"><div><b>World generation</b><span>Seeded terrain and vegetation with stable coordinates.</span></div><strong>v0.1.0</strong></div>
      <div class="panel-note"><span>◷</span> Graphics quality controls and accessibility options are planned for a later build.</div>
    `;
  }

  _itemCard(id, title, description, icon, count) {
    return `<article class="item-card"><div class="item-icon item-${id}">${icon}</div><div class="item-copy"><b>${title}</b><span>${description}</span></div><strong class="item-count">${count}</strong></article>`;
  }

  _drawMap(player) {
    const canvas = $('#world-map');
    if (!canvas || !this.mapGenerator || !player) return;
    const context = canvas.getContext('2d');
    const cells = 30;
    const cellSize = canvas.width / cells;
    const worldStep = 36;
    const centerX = Math.floor(player.position.x / worldStep);
    const centerZ = Math.floor(player.position.z / worldStep);
    context.fillStyle = '#182b2d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let z = 0; z < cells; z += 1) {
      for (let x = 0; x < cells; x += 1) {
        const sx = centerX + x - Math.floor(cells / 2);
        const sz = centerZ + z - Math.floor(cells / 2);
        if (!this.explored.has(`${sx}:${sz}`)) continue;
        const wx = sx * worldStep + worldStep * 0.5;
        const wz = sz * worldStep + worldStep * 0.5;
        const sample = this.mapGenerator.sample(wx, wz);
        const color = {
          ocean: '#315c6b', coast: '#b5a77c', grassland: '#929b61', forest: '#4d7150',
          deepForest: '#315840', jungle: '#2f7251', desert: '#b99460', marsh: '#657e68',
          alpine: '#858e88', snow: '#c5d5d3', tundra: '#93a99a', savanna: '#afa064',
        }[sample.biome] ?? '#82946c';
        context.fillStyle = color;
        context.fillRect(x * cellSize, z * cellSize, cellSize + 1, cellSize + 1);
        const fleck = Math.abs(Math.sin((sx * 3.1 + sz * 4.7) * 0.16)) * 0.07;
        context.fillStyle = `rgba(240,230,190,${fleck})`;
        context.fillRect(x * cellSize, z * cellSize, cellSize, cellSize);
      }
    }
    // The player's current cell is visible even on first opening.
    const px = Math.floor(cells / 2);
    const pz = Math.floor(cells / 2);
    context.beginPath();
    context.arc((px + 0.5) * cellSize, (pz + 0.5) * cellSize, 7, 0, Math.PI * 2);
    context.fillStyle = '#f5e7b2';
    context.shadowColor = '#f5e7b2';
    context.shadowBlur = 16;
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = 'rgba(245,231,178,.8)';
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc((px + 0.5) * cellSize, (pz + 0.5) * cellSize, 12, 0, Math.PI * 2);
    context.stroke();
  }
}
