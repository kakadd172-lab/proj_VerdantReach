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
    this.onTrade = null;
    this.onCraft = null;
    this.onSkillSpend = null;
    this.onOpenSavedWorlds = null;
    this.onLoadWorld = null;
    this.onDeleteWorld = null;
    this.currentPanel = null;
    this.explored = new Set();
    this.mapGenerator = null;
    this.mapCenter = { x: 0, z: 0 };

    $('#open-saved-worlds').addEventListener('click', () => {
      this.showSavedWorldsView();
      this.onOpenSavedWorlds?.();
    });
    $('#saved-worlds-back').addEventListener('click', () => this.showMainMenuView());
    $('#saved-worlds-list').addEventListener('click', (event) => {
      const loadButton = event.target.closest('[data-load-world]');
      const deleteButton = event.target.closest('[data-delete-world]');
      if (loadButton) this.onLoadWorld?.(loadButton.dataset.loadWorld);
      if (deleteButton) this.onDeleteWorld?.(deleteButton.dataset.deleteWorld);
    });
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
    this.showMainMenuView();
  }

  showMainMenuView() {
    $('.seed-panel').classList.remove('hidden');
    $('#saved-worlds-view').classList.add('hidden');
    $('.menu-footnote').classList.remove('hidden');
  }

  showSavedWorldsView() {
    $('.seed-panel').classList.add('hidden');
    $('#saved-worlds-view').classList.remove('hidden');
    $('.menu-footnote').classList.add('hidden');
  }

  showSavedWorlds(records = []) {
    const list = $('#saved-worlds-list');
    if (!records.length) {
      list.innerHTML = '<div class="saved-worlds-empty">No saved worlds yet. Begin a journey to create your first world.</div>';
      return;
    }
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
    list.innerHTML = records.map((record) => {
      const seed = escape(record.seed);
      const title = escape(record.worldName || record.seed || 'Unnamed realm');
      const isTest = Boolean(record.isTestSlot || record.worldKind === 'test');
      const savedAt = record.savedAt ? new Date(record.savedAt).toLocaleString() : 'Prepared test world · not yet entered';
      const day = Number.isFinite(record.dayCount) ? `Day ${record.dayCount}` : record.worldSeconds ? `World time ${Math.floor(record.worldSeconds / 20)} min` : 'Fresh world';
      const level = record.rpg?.level ? `Level ${record.rpg.level}` : 'Level 1';
      const detail = `${escape(record.seed)} · ${escape(day)} · ${escape(level)} · ${escape(savedAt)}`;
      const deleteButton = isTest ? '' : `<button class="saved-world-delete" data-delete-world="${seed}" type="button">Delete</button>`;
      return `<article class="saved-world-card ${isTest ? 'test-slot' : ''}">
        <div class="saved-world-seal">${isTest ? '✦' : '⌖'}</div>
        <div class="saved-world-copy"><b>${title}${isTest ? ' · TEST CIRCUIT' : ''}</b><span>${detail}</span></div>
        <div class="saved-world-actions"><button class="saved-world-load" data-load-world="${seed}" type="button">${record.savedAt ? 'Enter' : 'Start test'}</button>${deleteButton}</div>
      </article>`;
    }).join('');
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

  setFieldTestGuide(progress = null) {
    const guide = $('#field-test-guide');
    if (!progress) {
      guide.classList.add('hidden');
      return;
    }
    guide.classList.remove('hidden');
    const { step, current = 0, total = 12, completed = 0, finished = false } = progress;
    $('#field-test-count').textContent = finished ? `${total} / ${total}` : `${Math.min(total, current + 1)} / ${total}`;
    $('#field-test-title').textContent = finished ? 'Circuit complete' : (step?.title ?? 'Wayfarer’s Circuit');
    $('#field-test-hint').textContent = finished
      ? 'You have tested the Reach’s core systems. Keep exploring, or return to the menu for another world.'
      : (step?.hint ?? 'Follow the markers in order to test the world systems.');
    $('#field-test-progress').style.width = `${Math.min(100, (completed / Math.max(1, total)) * 100)}%`;
  }

  setSeed(seed) {
    $('#world-seed').value = seed;
  }

  getSeed() {
    return $('#world-seed').value.trim();
  }

  updateHUD({ rpg, player, sample, timeOfDay, day, nearby, nearbyVehicle, nearbyHostile, weather, chunkCount }) {
    const biomeName = BIOMES[sample.biome]?.name ?? 'The Reach';
    $('#biome-name').textContent = biomeName;
    $('#world-coords').textContent = `${Math.round(player.position.x)}, ${Math.round(player.position.z)} · DAY ${day}`;
    $('#world-time').textContent = timeOfDay;
    $('#weather-label').textContent = weather?.label ?? (sample.temperature < 0.18 ? 'FROST AIR' : sample.moisture > 0.76 ? 'MISTY' : 'CLEAR');
    $('#health-value').textContent = `${Math.ceil(rpg.health)} / ${rpg.maxHealth}`;
    $('#health-bar').style.width = `${(rpg.health / rpg.maxHealth) * 100}%`;
    $('#stamina-value').textContent = `${Math.round(rpg.stamina)} / ${rpg.maxStamina}`;
    $('#stamina-bar').style.width = `${(rpg.stamina / rpg.maxStamina) * 100}%`;
    $('#level-value').textContent = rpg.level;
    $('#xp-value').textContent = `${Math.floor(rpg.xp)} / ${rpg.nextXp} XP`;
    $('#xp-bar').style.width = `${(rpg.xp / rpg.nextXp) * 100}%`;
    const quest = rpg.currentQuest;
    $('#quest-chip-title').textContent = quest.title;
    $('#quest-chip-progress').textContent = quest.openEnded ? 'No fixed path — explore freely' : `${quest.objective} ${Math.min(quest.progress, quest.target)} / ${quest.target}`;
    const promptTarget = nearbyVehicle ?? nearbyHostile ?? nearby;
    this.prompt.classList.toggle('hidden', !promptTarget);
    if (promptTarget) {
      const key = this.prompt.querySelector('.key-cap');
      if (key) key.textContent = nearbyVehicle ? 'R' : nearbyHostile ? 'SPACE' : 'E';
      this.promptText.textContent = nearbyVehicle
        ? (nearbyVehicle.group?.userData.vehicle?.label ?? 'Use vehicle')
        : nearbyHostile
          ? (nearbyHostile.group?.userData.interactable?.label ?? 'Defend yourself')
          : (nearby?.userData.interactable?.label ?? 'Interact');
    }
  }

  showPanel(type, state = {}) {
    this.currentPanel = type;
    this.panelLayer.classList.remove('hidden');
    this.panelLayer.classList.add('panel-visible');
    this.panelContent.innerHTML = this._panelMarkup(type, state);
    if (type === 'map') this._drawMap(state.player);
    this.panelContent.querySelectorAll('[data-trade]').forEach((button) => button.addEventListener('click', () => this.onTrade?.(button.dataset.trade)));
    this.panelContent.querySelectorAll('[data-craft]').forEach((button) => button.addEventListener('click', () => this.onCraft?.(button.dataset.craft)));
    this.panelContent.querySelectorAll('[data-skill-upgrade]').forEach((button) => button.addEventListener('click', () => this.onSkillSpend?.(button.dataset.skillUpgrade)));
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
          ${this._itemCard('rations', 'Trail rations', 'Food prepared for long journeys.', '◈', rpg?.inventory.rations ?? 0)}
          ${this._itemCard('gameMeat', 'Game meat', 'Fresh provisions gathered from wildlife.', '❖', rpg?.inventory.gameMeat ?? 0)}
          ${this._itemCard('hides', 'Hides', 'Useful material for practical equipment.', '▧', rpg?.inventory.hides ?? 0)}
          ${this._itemCard('wispDust', 'Wisp dust', 'A harmless echo left where a roaming wisp dispersed.', '✧', rpg?.inventory.wispDust ?? 0)}
        </div>
        <div class="panel-eyebrow">FIELD CRAFTING</div>
        <div class="setting-row"><div><b>Trail rations</b><span>1 game meat + 1 moonleaf → 2 rations</span></div><button class="secondary-button" data-craft="trail-ration">Craft</button></div>
        <div class="setting-row"><div><b>Field charm</b><span>1 echo glass + 2 moonleaf → 5 silver petals</span></div><button class="secondary-button" data-craft="field-charm">Craft</button></div>
      `;
    }
    if (type === 'market') {
      const settlement = state.settlement;
      const market = state.market;
      const commerce = rpg?.skills?.commerce ?? 1;
      const rationCost = Math.max(3, 5 - Math.floor((commerce - 1) / 3));
      const herbPrice = 3 + Math.floor((commerce - 1) / 3);
      const meatPrice = 4 + Math.floor((commerce - 1) / 3);
      return `
        <div class="panel-eyebrow">LOCAL EXCHANGE · ${settlement?.type?.toUpperCase() ?? 'MARKET'}</div>
        <h2>${settlement?.name ?? 'Market'}</h2>
        <p class="panel-lede">Trade with local merchants. Prices and stock belong to this settlement and continue changing while you travel.</p>
        <div class="journal-stats"><div><b>${market?.population ?? 0}</b><span>POPULATION</span></div><div><b>${Math.floor(market?.food ?? 0)}</b><span>FOOD STORES</span></div><div><b>${Math.floor(market?.wealth ?? 0)}</b><span>MARKET WEALTH</span></div></div>
        <div class="setting-row"><div><b>Buy a travel ration</b><span>${rationCost} silver petals · ${market?.stock?.rations ?? 0} in stock</span></div><button class="secondary-button" data-trade="buy-ration">Buy</button></div>
        <div class="setting-row"><div><b>Sell moonleaf</b><span>Receive ${herbPrice} silver petals for one sprig</span></div><button class="secondary-button" data-trade="sell-moonleaf">Sell</button></div>
        <div class="setting-row"><div><b>Sell game meat</b><span>Receive ${meatPrice} silver petals for one portion</span></div><button class="secondary-button" data-trade="sell-meat">Sell</button></div>
        <div class="panel-note"><span>✦</span> Commerce ${commerce} affects these prices. Your purse: ${rpg?.inventory.silverPetal ?? 0} silver petals.</div>
      `;
    }
    if (type === 'realm') {
      const settlement = state.settlement;
      const market = state.market;
      const wildlife = state.wildlife;
      return `
        <div class="panel-eyebrow">THE LIVING REACH</div>
        <h2>${settlement?.name ?? 'Beyond the Known Roads'}</h2>
        <p class="panel-lede">${settlement ? `${settlement.type} · ${settlement.continent} · ${settlement.biome}` : 'No settlement is close enough to call this place home.'}</p>
        <div class="journal-stats"><div><b>${market?.population ?? '—'}</b><span>POPULATION</span></div><div><b>${market ? Math.floor(market.food) : '—'}</b><span>FOOD STORES</span></div><div><b>${wildlife?.total ?? 0}</b><span>WILDLIFE NEARBY</span></div></div>
        <div class="setting-row"><div><b>Season and weather</b><span>${state.weather?.season ?? 'spring'} · ${state.weather?.label ?? 'CLEAR'} · wind ${Math.round((state.weather?.windStrength ?? 0) * 100)}%</span></div><strong>DAY ${state.day ?? 1}</strong></div>
        <div class="setting-row"><div><b>Local economy</b><span>${market ? `${market.farms} farms · ${market.workshops} workshops · ${market.stock?.rations ?? 0} rations in market` : 'No settlement market in reach'}</span></div><strong>${market ? `${Math.round(market.prosperity * 100)}%` : '—'}</strong></div>
        <div class="setting-row"><div><b>Known trade roads</b><span>Terrain-routed roads, bridges, and local routes.</span></div><strong>${state.tradeLinks ?? 0}</strong></div>
        <div class="setting-row"><div><b>Active cargo shipments</b><span>Persistent caravans moving goods between known markets.</span></div><strong>${state.activeConvoys ?? 0}</strong></div>
        <div class="setting-row"><div><b>Population movement</b><span>${market ? `${market.migrationsIn ?? 0} arrivals · ${market.migrationsOut ?? 0} departures` : 'Regional migration is simulated between known settlements.'}</span></div><strong>${(state.migrations ?? []).length}</strong></div>
        <div class="panel-note"><span>⌖</span> Residents can move between settlements, shipments carry stored goods, and unloaded communities continue their coarse daily simulation.</div>
      `;
    }
    if (type === 'character') {
      return `
        <div class="panel-eyebrow">TRAVELLER RECORD</div>
        <h2>Character</h2>
        <p class="panel-lede">Your growing strengths, skills, and equipped field gear.</p>
        <div class="journal-stats"><div><b>${rpg?.level ?? 1}</b><span>LEVEL</span></div><div><b>${rpg?.skillPoints ?? 0}</b><span>SKILL POINTS</span></div><div><b>${rpg?.health ?? 100}</b><span>HEALTH</span></div></div>
        <div class="panel-note">Unspent training points: <b>${rpg?.skillPoints ?? 0}</b>. Training changes the practical benefits of each skill.</div>
        ${this._skillRow('foraging', 'Foraging', 'Gathering yield and field knowledge', rpg)}
        ${this._skillRow('tracking', 'Tracking', 'Wildlife harvest yield and field awareness', rpg)}
        ${this._skillRow('endurance', 'Endurance', 'Travel speed and stamina efficiency', rpg)}
        ${this._skillRow('commerce', 'Commerce', 'Market prices and trade experience', rpg)}
        ${this._skillRow('navigation', 'Navigation', 'Waystone lore and route finding', rpg)}
        <div class="panel-note"><span>✦</span> Equipped: ${rpg?.equipment?.weapon ?? 'staff'} · ${rpg?.equipment?.armor ?? 'cloak'} · ${rpg?.equipment?.tool ?? 'knife'}.</div>
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
      <div class="setting-row"><div><b>World generation</b><span>Seeded terrain and vegetation with stable coordinates.</span></div><strong>v0.4.0</strong></div>
      <div class="panel-note"><span>◷</span> Graphics quality controls and accessibility options are planned for a later build.</div>
    `;
  }

  _skillRow(id, label, description, rpg) {
    const level = rpg?.skills?.[id] ?? 1;
    const canTrain = (rpg?.skillPoints ?? 0) > 0 && level < 10;
    return `<div class="setting-row"><div><b>${label} · ${level}</b><span>${description}</span></div><button class="secondary-button" data-skill-upgrade="${id}" ${canTrain ? '' : 'disabled'}>Train</button></div>`;
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
