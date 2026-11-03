import { BIOMES } from '../world/biomes.js';
import { CREATIVE_ENTITY_TYPES } from '../systems/world-editing.js';
import { SHIP_DESIGNS, getShipTypeFromCreativeKind, describeShipDimensions } from '../world/ship-designs.js';

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
    this.selectedMode = 'survival';
    this.onNeedsAction = null;
    this.onCreativeAction = null;

    document.querySelectorAll('[data-world-mode]').forEach((button) => {
      button.addEventListener('click', () => this.setSelectedMode(button.dataset.worldMode));
    });
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

  setSelectedMode(mode) {
    this.selectedMode = mode === 'creative' ? 'creative' : 'survival';
    document.querySelectorAll('[data-world-mode]').forEach((button) => {
      const selected = button.dataset.worldMode === this.selectedMode;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  getSelectedMode() { return this.selectedMode; }

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
      const mode = String(record.gameMode ?? record.mode ?? 'survival').toUpperCase();
      const detail = `${escape(record.seed)} · ${escape(mode)} · ${escape(day)} · ${escape(level)} · ${escape(savedAt)}`;
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

  updateHUD({ rpg, player, sample, timeOfDay, day, nearby, nearbyVehicle, nearbyHostile, weather, chunkCount, gameMode = 'survival', needs = null }) {
    const biomeName = BIOMES[sample.biome]?.name ?? 'The Reach';
    $('#biome-name').textContent = biomeName;
    $('#world-coords').textContent = `${Math.round(player.position.x)}, ${Math.round(player.position.z)} · DAY ${day}`;
    $('#world-time').textContent = timeOfDay;
    $('#weather-label').textContent = weather?.label ?? (sample.temperature < 0.18 ? 'FROST AIR' : sample.moisture > 0.76 ? 'MISTY' : 'CLEAR');
    $('#game-mode-chip').textContent = String(gameMode).toUpperCase();
    $('#survival-needs').classList.toggle('hidden', gameMode === 'creative');
    if (needs) {
      $('#hunger-value').textContent = `${Math.round(needs.hunger)}%`;
      $('#hunger-bar').style.width = `${needs.hunger}%`;
      $('#thirst-value').textContent = `${Math.round(needs.thirst)}%`;
      $('#thirst-bar').style.width = `${needs.thirst}%`;
    }
    $('#creative-tools-button').classList.toggle('hidden', gameMode !== 'creative');
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
    this.panelContent.querySelectorAll('[data-needs-action]').forEach((button) => button.addEventListener('click', () => this.onNeedsAction?.(button.dataset.needsAction)));
    this.panelContent.querySelectorAll('[data-creative-action]').forEach((button) => button.addEventListener('click', () => {
      const value = (id) => this.panelContent.querySelector(`#${id}`)?.value;
      this.onCreativeAction?.({
        action: button.dataset.creativeAction,
        entity: value('creative-entity'),
        biome: value('creative-biome'),
        radius: Number(value('creative-radius')) || 80,
        scale: (Number(value('creative-scale')) || 100) / 100,
        hour: Number(value('creative-hour')),
        weather: value('creative-weather'),
        objectId: value('creative-object'),
        destination: value('creative-destination'),
        shipId: value('creative-ship-id'),
        shipPart: value('creative-ship-part'),
        mastId: value('creative-ship-mast'),
        rudderAngle: Number(value('creative-rudder-angle')) || 0,
        sailTrim: Number(value('creative-sail-trim')) || 0,
        mastLean: Number(value('creative-mast-lean')) || 0,
        partX: Number(value('creative-ship-part-x')) || 0,
        partY: Number(value('creative-ship-part-y')) || 0,
        partZ: Number(value('creative-ship-part-z')) || 0,
        partRx: Number(value('creative-ship-part-rx')) || 0,
        partRy: Number(value('creative-ship-part-ry')) || 0,
        partRz: Number(value('creative-ship-part-rz')) || 0,
      });
    }));
    const shipSelect = this.panelContent.querySelector('#creative-ship-id');
    if (shipSelect) {
      const ships = state.creativeShips ?? [];
      const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
      shipSelect.addEventListener('change', () => {
        const ship = ships.find((item) => item.id === shipSelect.value);
        const parts = this.panelContent.querySelector('#creative-ship-part');
        const masts = this.panelContent.querySelector('#creative-ship-mast');
        if (parts) parts.innerHTML = (ship?.parts ?? []).map((part) => `<option value="${escape(part)}">${escape(part.replaceAll('-', ' '))}</option>`).join('');
        if (masts) masts.innerHTML = (ship?.masts ?? []).map((mast) => `<option value="${escape(mast)}">${escape(mast)}</option>`).join('');
      });
    }
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
          ${this._itemCard('fish', 'Fish', 'Fresh catch from the waterways.', '≈', rpg?.inventory.fish ?? 0)}
          ${this._itemCard('freshWater', 'Fresh water', 'Clean water carried for the road.', '⌁', rpg?.inventory.freshWater ?? 0)}
          ${this._itemCard('hides', 'Hides', 'Useful material for practical equipment.', '▧', rpg?.inventory.hides ?? 0)}
          ${this._itemCard('wispDust', 'Wisp dust', 'A harmless echo left where a roaming wisp dispersed.', '✧', rpg?.inventory.wispDust ?? 0)}
        </div>
        ${state.gameMode === 'survival' ? `<div class="panel-eyebrow">FIELD NEEDS</div>
        <div class="setting-row"><div><b>Eat trail ration</b><span>Restore hunger using one ration.</span></div><button class="secondary-button" data-needs-action="eat-rations" ${(rpg?.inventory.rations ?? 0) > 0 ? '' : 'disabled'}>Eat</button></div>
        <div class="setting-row"><div><b>Eat game meat</b><span>Restore hunger using fresh provisions.</span></div><button class="secondary-button" data-needs-action="eat-gameMeat" ${(rpg?.inventory.gameMeat ?? 0) > 0 ? '' : 'disabled'}>Eat</button></div>
        <div class="setting-row"><div><b>Drink fresh water</b><span>Restore thirst using one water flask.</span></div><button class="secondary-button" data-needs-action="drink-water" ${(rpg?.inventory.freshWater ?? 0) > 0 ? '' : 'disabled'}>Drink</button></div>` : `<div class="panel-note"><span>✥</span> Creative mode: survival needs are disabled.</div>`}
        <div class="panel-eyebrow">FIELD CRAFTING</div>
        <div class="setting-row"><div><b>Trail rations</b><span>1 game meat + 1 moonleaf → 2 rations</span></div><button class="secondary-button" data-craft="trail-ration">Craft</button></div>
        <div class="setting-row"><div><b>Field charm</b><span>1 echo glass + 2 moonleaf → 5 silver petals</span></div><button class="secondary-button" data-craft="field-charm">Craft</button></div>
      `;
    }
    if (type === 'creative') {
      const entityOptions = CREATIVE_ENTITY_TYPES.filter((kind) => !['sailing-ship', 'large-ship'].includes(kind)).map((kind) => {
        const shipType = getShipTypeFromCreativeKind(kind);
        const label = shipType ? `${SHIP_DESIGNS[shipType].label} · ${describeShipDimensions(SHIP_DESIGNS[shipType])}` : kind.replaceAll('-', ' ');
        return `<option value="${kind}">${label}</option>`;
      }).join('');
      const objectOptions = (state.creativeEntities ?? []).map((entity) => {
        const shipType = getShipTypeFromCreativeKind(entity.kind);
        const label = shipType ? SHIP_DESIGNS[shipType].label : entity.kind.replaceAll('-', ' ');
        return `<option value="${String(entity.id).replaceAll('\"', '&quot;')}">${label} · ${Math.round(entity.distance)} m away</option>`;
      }).join('');
      const shipCards = Object.values(SHIP_DESIGNS).map((design) => {
        const sourceLinks = (design.sources ?? []).map((source) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label}</a>`).join(' · ');
        const evidenceLabel = /game-design estimate|reconstruction|representative size envelope/i.test(design.reference ?? '')
          ? 'Reference / reconstruction note' : 'Historical reference';
        return `<article class="ship-model-card"><b>${design.label}</b><span>${describeShipDimensions(design)}</span><small>${design.draft.toFixed(1)} m draft · ${design.mastCount} principal mast${design.mastCount === 1 ? '' : 's'}${design.totalMastSpars > design.mastCount ? ` + ${design.totalMastSpars - design.mastCount} auxiliary spar` : ''}</small><small>${design.era}</small><small>${design.rig}</small><small><b>${evidenceLabel}:</b> ${design.reference}</small><small class="ship-model-sources">${sourceLinks}</small></article>`;
      }).join('');
      const biomeOptions = Object.entries(BIOMES).map(([key, biome]) => `<option value="${key}">${biome.name}</option>`).join('');
      const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
      const destinationGroups = new Map();
      for (const destination of state.teleportDestinations ?? []) {
        const category = destination.category ?? 'Landmarks';
        if (!destinationGroups.has(category)) destinationGroups.set(category, []);
        destinationGroups.get(category).push(destination);
      }
      const destinationOptions = [...destinationGroups.entries()].map(([category, entries]) => {
        const options = entries.sort((a, b) => a.distance - b.distance).map((entry) => {
          const kilometres = entry.distance >= 1000 ? `${(entry.distance / 1000).toFixed(1)} km` : `${Math.round(entry.distance)} m`;
          return `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.name)} · ${kilometres}</option>`;
        }).join('');
        return `<optgroup label="${escapeHtml(category)}">${options}</optgroup>`;
      }).join('');
      const ships = state.creativeShips ?? [];
      const selectedShip = ships[0] ?? null;
      const shipOptions = ships.map((ship) => `<option value="${String(ship.id).replaceAll('\"', '&quot;')}">${ship.label} · ${Math.round(ship.distance)} m</option>`).join('');
      const shipPartOptions = (selectedShip?.parts ?? []).map((part) => `<option value="${part}">${part.replaceAll('-', ' ')}</option>`).join('');
      const shipMastOptions = (selectedShip?.masts ?? []).map((mast) => `<option value="${mast}">${mast}</option>`).join('');
      const shipDisabled = ships.length === 0;
      const counts = state.worldEditCounts ?? {};
      const selectedWeather = state.creativeWeatherOverride ?? 'natural';
      return `
        <div class="panel-eyebrow">WORLD BUILDER · CREATIVE MODE</div>
        <h2>Shape the Reach</h2>
        <p class="panel-lede">Summon objects and inhabitants, paint nearby biomes, and direct the world's atmosphere. All edits are saved with this world.</p>
        <div class="creative-summary"><div><b>${counts.entities ?? 0}</b><span>SUMMONED</span></div><div><b>${counts.biomes ?? 0}</b><span>BIOME PATCHES</span></div><div><b>${counts.settlements ?? 0}</b><span>BUILT TOWNS</span></div></div>
        <section class="creative-section">
          <h3>Teleport to a nearby place</h3>
          <div class="creative-field"><label for="creative-destination">DESTINATION · GROUPED BY PLACE TYPE</label><select id="creative-destination" ${destinationOptions ? '' : 'disabled'}><option value="">${destinationOptions ? 'Choose a discovered nearby place…' : 'No nearby destinations found'}</option>${destinationOptions}</select></div>
          <button class="primary-button" data-creative-action="teleport-destination" ${destinationOptions ? '' : 'disabled'}>Teleport to selected place</button>
          <p class="panel-note">Destinations include free cities, villages, markets, ports, abandoned castles and nearby natural landmarks. You arrive at a safe point near the selected site.</p>
        </section>
        <section class="creative-section">
          <h3>Summon an entity</h3>
          <div class="creative-field"><label for="creative-entity">ENTITY / STRUCTURE</label><select id="creative-entity">${entityOptions}</select></div>
          <div class="creative-field"><label for="creative-scale">OBJECT SCALE · <output id="creative-scale-value">100</output>%</label><input id="creative-scale" type="range" min="35" max="300" step="5" value="100" oninput="document.getElementById('creative-scale-value').value=this.value" /></div>
          <div class="creative-actions"><button class="primary-button" data-creative-action="summon">Summon near me</button><button class="secondary-button" data-creative-action="summon-ahead">Place ahead</button></div>
          <p class="panel-note">Includes natural props, wildlife, villagers, mounts, buildings, bridges, boats and ${Object.keys(SHIP_DESIGNS).length} historically researched sailing designs. Villages and ports become real settlements with residents and markets.</p>
          <div class="ship-model-grid">${shipCards}</div>
        </section>
        <section class="creative-section">
          <h3>Shipyard · linked components</h3>
          <p class="panel-note">Each vessel is a linked, articulated assembly. Hull shell, planking, deck, keel, sternworks, rudder, helm, anchors, mast sections, yards, booms, individual sails, shrouds, ratlines and stays are named components. Detach or relink parts, hide them, or edit local transforms. Component transforms persist with the ship; sail, mast and rudder controls animate their linked parts.</p>
          <div class="creative-field"><label for="creative-ship-id">VESSEL TO EDIT</label><select id="creative-ship-id" ${shipDisabled ? 'disabled' : ''}>${shipOptions || '<option value="">Summon a ship first</option>'}</select></div>
          <div class="creative-field"><label for="creative-ship-part">LINKED COMPONENT</label><select id="creative-ship-part" ${shipDisabled ? 'disabled' : ''}>${shipPartOptions}</select></div>
          <div class="creative-actions"><button class="secondary-button" data-creative-action="ship-detach-part" ${shipDisabled ? 'disabled' : ''}>Unlink part</button><button class="secondary-button" data-creative-action="ship-relink-part" ${shipDisabled ? 'disabled' : ''}>Relink part</button><button class="secondary-button" data-creative-action="ship-toggle-part" ${shipDisabled ? 'disabled' : ''}>Toggle visibility</button></div>
          <div class="creative-field"><label for="creative-ship-mast">MAST / SAIL GROUP</label><select id="creative-ship-mast" ${shipDisabled ? 'disabled' : ''}>${shipMastOptions}</select></div>
          <div class="creative-field"><label for="creative-rudder-angle">RUDDER ANGLE · <output id="creative-rudder-angle-value">0</output>°</label><input id="creative-rudder-angle" type="range" min="-35" max="35" step="1" value="0" oninput="document.getElementById('creative-rudder-angle-value').value=this.value" /></div>
          <button class="secondary-button" data-creative-action="ship-rudder" ${shipDisabled ? 'disabled' : ''}>Apply rudder angle</button>
          <div class="creative-field"><label for="creative-sail-trim">SAIL TRIM · <output id="creative-sail-trim-value">0</output>°</label><input id="creative-sail-trim" type="range" min="-60" max="60" step="1" value="0" oninput="document.getElementById('creative-sail-trim-value').value=this.value" /></div>
          <button class="secondary-button" data-creative-action="ship-sail-trim" ${shipDisabled ? 'disabled' : ''}>Apply sail trim</button>
          <div class="creative-field"><label for="creative-mast-lean">MAST LEAN · <output id="creative-mast-lean-value">0</output>°</label><input id="creative-mast-lean" type="range" min="-8" max="8" step="1" value="0" oninput="document.getElementById('creative-mast-lean-value').value=this.value" /></div>
          <button class="secondary-button" data-creative-action="ship-mast-lean" ${shipDisabled ? 'disabled' : ''}>Apply mast lean</button>
          <h4>Selected component transform</h4>
          <div class="creative-grid-two">
            <div class="creative-field"><label for="creative-ship-part-x">LOCAL X · METRES</label><input id="creative-ship-part-x" type="number" min="-5" max="5" step="0.1" value="0" /></div>
            <div class="creative-field"><label for="creative-ship-part-y">LOCAL Y · METRES</label><input id="creative-ship-part-y" type="number" min="-5" max="5" step="0.1" value="0" /></div>
            <div class="creative-field"><label for="creative-ship-part-z">LOCAL Z · METRES</label><input id="creative-ship-part-z" type="number" min="-5" max="5" step="0.1" value="0" /></div>
            <div class="creative-field"><label for="creative-ship-part-rx">ROTATE X · DEGREES</label><input id="creative-ship-part-rx" type="number" min="-180" max="180" step="1" value="0" /></div>
            <div class="creative-field"><label for="creative-ship-part-ry">ROTATE Y · DEGREES</label><input id="creative-ship-part-ry" type="number" min="-180" max="180" step="1" value="0" /></div>
            <div class="creative-field"><label for="creative-ship-part-rz">ROTATE Z · DEGREES</label><input id="creative-ship-part-rz" type="number" min="-180" max="180" step="1" value="0" /></div>
          </div>
          <div class="creative-actions"><button class="secondary-button" data-creative-action="ship-part-transform" ${shipDisabled ? 'disabled' : ''}>Apply component transform</button><button class="secondary-button" data-creative-action="ship-part-reset" ${shipDisabled ? 'disabled' : ''}>Reset component</button></div>
        </section>
        <section class="creative-section">
          <h3>Object tools</h3>
          <div class="creative-field"><label for="creative-object">NEARBY CREATION · UP TO 1.8 KM</label><select id="creative-object" ${objectOptions ? '' : 'disabled'}>${objectOptions || '<option value="">No nearby creations</option>'}</select></div>
          <div class="creative-actions"><button class="secondary-button" data-creative-action="move-selected" ${objectOptions ? '' : 'disabled'}>Move ahead</button><button class="secondary-button" data-creative-action="rotate-selected" ${objectOptions ? '' : 'disabled'}>Rotate 15°</button><button class="secondary-button" data-creative-action="duplicate-selected" ${objectOptions ? '' : 'disabled'}>Duplicate</button><button class="secondary-button" data-creative-action="delete-selected" ${objectOptions ? '' : 'disabled'}>Delete</button><button class="secondary-button" data-creative-action="undo">Undo</button><button class="secondary-button" data-creative-action="redo">Redo</button></div>
          <p class="panel-note">Move places the selected object ahead of your character. Ship placement searches for suitable water. Undo and redo cover object creation and transforms during the current editing session.</p>
        </section>
        <section class="creative-section">
          <h3>Biome painter</h3>
          <div class="creative-field"><label for="creative-biome">REPLACE NEARBY BIOME WITH</label><select id="creative-biome">${biomeOptions}</select></div>
          <div class="creative-field"><label for="creative-radius">BRUSH RADIUS · <output id="creative-radius-value">120</output> METRES</label><input id="creative-radius" type="range" min="20" max="420" step="10" value="120" oninput="document.getElementById('creative-radius-value').value=this.value" /></div>
          <div class="creative-actions"><button class="secondary-button" data-creative-action="paint-biome">Paint around me</button><button class="secondary-button" data-creative-action="restore-biome">Restore natural biome</button></div>
        </section>
        <section class="creative-section">
          <h3>World atmosphere</h3>
          <div class="creative-field"><label for="creative-hour">TIME OF DAY · HOUR</label><input id="creative-hour" type="range" min="0" max="23" step="1" value="${Math.max(0, Math.min(23, Math.round(state.hour ?? 12)))}" /></div>
          <button class="secondary-button" data-creative-action="set-time">Set world time</button>
          <div class="creative-field"><label for="creative-weather">WEATHER</label><select id="creative-weather"><option value="natural" ${selectedWeather === 'natural' ? 'selected' : ''}>Follow natural weather</option><option value="clear" ${selectedWeather === 'clear' ? 'selected' : ''}>Clear skies</option><option value="overcast" ${selectedWeather === 'overcast' ? 'selected' : ''}>Overcast</option><option value="rain" ${selectedWeather === 'rain' ? 'selected' : ''}>Rain</option><option value="storm" ${selectedWeather === 'storm' ? 'selected' : ''}>Storm</option><option value="snow" ${selectedWeather === 'snow' ? 'selected' : ''}>Snow</option><option value="fog" ${selectedWeather === 'fog' ? 'selected' : ''}>Fog</option></select></div>
          <button class="secondary-button" data-creative-action="set-weather">Apply weather</button>
        </section>
        <section class="creative-section">
          <h3>World utilities</h3>
          <div class="creative-actions"><button class="secondary-button" data-creative-action="heal">Restore character</button><button class="secondary-button" data-creative-action="grant-supplies">Grant supplies</button><button class="secondary-button" data-creative-action="teleport-home">Teleport to start</button><button class="secondary-button" data-creative-action="clear-nearby">Clear nearby creations</button><button class="secondary-button" data-creative-action="save-world">Save world now</button></div>
        </section>
        <div class="creative-warning">Creative edits alter this save only. The original procedural terrain seed stays intact; biome paint is stored as an editable overlay, and summoned objects remain available when their region streams out and back in.</div>
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
      <div class="setting-row"><div><b>World generation</b><span>Seeded terrain, major landforms and streamed settlements with stable coordinates.</span></div><strong>v0.8.0</strong></div>
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
