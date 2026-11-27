/**
 * Interactive Environmental & Kinematics Test Bench HUD for the Golden Hind (c. 1575).
 */
export class UIManager {
  constructor(galleon, callbacks = {}) {
    this.galleon = galleon;
    this.callbacks = callbacks;
    this._injectStyles();
    this._buildPanel();
  }

  _injectStyles() {
    if (document.getElementById('galleon-hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'galleon-hud-styles';
    style.textContent = `
      #galleon-test-hud {
        position: fixed;
        top: 14px;
        right: 14px;
        width: 318px;
        max-height: calc(100vh - 28px);
        overflow-y: auto;
        background: rgba(10, 17, 30, 0.88);
        backdrop-filter: blur(12px);
        color: #f1f5f9;
        font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;
        font-size: 12px;
        border: 1px solid rgba(251, 191, 36, 0.35);
        border-radius: 12px;
        padding: 12px 14px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        z-index: 9999;
        user-select: none;
      }
      #galleon-test-hud h2 {
        margin: 0 0 8px 0;
        font-size: 12.5px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #fbbf24;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .gh-section {
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        padding-top: 8px;
        margin-top: 8px;
      }
      .gh-label {
        display: flex;
        justify-content: space-between;
        color: #cbd5e1;
        margin-bottom: 4px;
        font-weight: 600;
      }
      .gh-val { color: #fbbf24; font-variant-numeric: tabular-nums; }
      .gh-btn-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        margin-bottom: 4px;
      }
      .gh-btn-grid.two-col { grid-template-columns: repeat(2, 1fr); }
      .gh-btn {
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.28);
        color: #e2e8f0;
        padding: 5px 6px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s ease;
      }
      .gh-btn:hover { background: rgba(51, 65, 85, 0.95); border-color: #fbbf24; }
      .gh-btn.active { background: #b45309; border-color: #fbbf24; color: #fff; font-weight: 600; }
      .gh-btn.fire-btn { background: rgba(153, 27, 27, 0.85); border-color: rgba(248, 113, 113, 0.45); }
      .gh-btn.fire-btn:hover { background: #dc2626; }
      .gh-slider { width: 100%; accent-color: #fbbf24; cursor: pointer; margin-bottom: 6px; }
      .gh-toggle-row { display: flex; flex-wrap: wrap; gap: 5px; }
      .gh-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(30, 41, 59, 0.75);
        padding: 3px 7px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  _buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'galleon-test-hud';
    panel.innerHTML = `
      <h2>
        <span>GOLDEN HIND KINEMATICS</span>
        <button class="gh-btn" id="gh-autodemo-btn">Auto Sweep</button>
      </h2>

      <div class="gh-section">
        <div class="gh-label"><span>Sail Trim</span><span class="gh-val" id="gh-sail-state">FULL</span></div>
        <div class="gh-btn-grid" id="gh-sail-btns">
          <button class="gh-btn active" data-sail="full">Full Sails</button>
          <button class="gh-btn" data-sail="half">Half Sails</button>
          <button class="gh-btn" data-sail="battle">Battle</button>
          <button class="gh-btn" data-sail="furled">Furled</button>
          <button class="gh-btn" data-sail="none">Bare Poles</button>
        </div>
      </div>

      <div class="gh-section">
        <div class="gh-label"><span>Motion Regime</span><span class="gh-val" id="gh-motion-state">SAILING</span></div>
        <div class="gh-btn-grid two-col" id="gh-motion-btns">
          <button class="gh-btn" data-motion="anchored">Anchored</button>
          <button class="gh-btn" data-motion="drifting">Drifting</button>
          <button class="gh-btn active" data-motion="sailing">Under Sail</button>
          <button class="gh-btn" data-motion="storm">Heavy Gale</button>
        </div>
        <div class="gh-btn-grid two-col" style="margin-top:4px;">
          <button class="gh-btn" id="gh-anchor-btn">Drop Anchor</button>
          <button class="gh-btn active" id="gh-lantern-btn">Lantern: ON</button>
        </div>
        <div class="gh-label" style="margin-top:6px;"><span>Sea Swell</span><span class="gh-val" id="gh-sea-val">1.0x</span></div>
        <input type="range" class="gh-slider" id="gh-sea-slider" min="0" max="2.2" step="0.1" value="1.0" />
      </div>

      <div class="gh-section">
        <div class="gh-label"><span>Wind Angle (Yard Bracing)</span><span class="gh-val" id="gh-wind-val">25&deg;</span></div>
        <input type="range" class="gh-slider" id="gh-wind-slider" min="-180" max="180" step="1" value="25" />
        <div class="gh-label"><span>Rudder &amp; Whipstaff</span><span class="gh-val" id="gh-rudder-val">0&deg;</span></div>
        <input type="range" class="gh-slider" id="gh-rudder-slider" min="-35" max="35" step="1" value="0" />
      </div>

      <div class="gh-section">
        <div class="gh-label"><span>Naval Ordnance</span></div>
        <div class="gh-btn-grid two-col">
          <button class="gh-btn fire-btn" data-fire="port">Fire Port</button>
          <button class="gh-btn fire-btn" data-fire="starboard">Fire Starboard</button>
          <button class="gh-btn fire-btn" data-fire="both">Full Broadside</button>
          <button class="gh-btn fire-btn" data-fire="stern">Stern Chasers</button>
          <button class="gh-btn fire-btn" id="gh-mortar-fire" style="grid-column:span 2;">Fire Siege Mortar [M]</button>
        </div>
      </div>

      <div class="gh-section">
        <div class="gh-label"><span>Mortar Elevation</span><span class="gh-val" id="gh-mortar-elev-val">45°</span></div>
        <input class="gh-slider" id="gh-mortar-elev" type="range" min="25" max="70" step="1" value="45">
        <div class="gh-label"><span>Camera &amp; Mood</span></div>
        <div class="gh-btn-grid" id="gh-cam-btns">
          <button class="gh-btn" data-cam="overview">Overview</button>
          <button class="gh-btn" data-cam="quarterdeck">Whipstaff</button>
          <button class="gh-btn" data-cam="sternRudder">Transom</button>
          <button class="gh-btn" data-cam="deckGuns">Waist Guns</button>
          <button class="gh-btn" data-cam="riggingTop">Rigging</button>
          <button class="gh-btn" data-cam="bowAnchor">Beakhead</button>
        </div>
        <div class="gh-btn-grid two-col" id="gh-mood-btns" style="margin-top:4px;">
          <button class="gh-btn active" data-mood="daylight">Daylight</button>
          <button class="gh-btn" data-mood="golden">Golden Hour</button>
          <button class="gh-btn" data-mood="night">Night</button>
          <button class="gh-btn" data-mood="stormy">Stormy</button>
        </div>
        <div style="margin-top:6px;">
          <div class="gh-label"><span>Sun Angle</span><span class="gh-val" id="gh-sun-az-val">53°</span></div>
          <input class="gh-slider" id="gh-sun-az" type="range" min="0" max="360" step="1" value="53">
          <div class="gh-label"><span>Sun Elevation</span><span class="gh-val" id="gh-sun-el-val">48°</span></div>
          <input class="gh-slider" id="gh-sun-el" type="range" min="10" max="85" step="1" value="48">
        </div>
      </div>

      <div class="gh-section">
        <div class="gh-label"><span>Layers</span></div>
        <div class="gh-toggle-row" id="gh-layer-toggles">
          <label class="gh-chip"><input type="checkbox" data-layer="sails" checked /> Sails</label>
          <label class="gh-chip"><input type="checkbox" data-layer="standingRigging" checked /> Standing</label>
          <label class="gh-chip"><input type="checkbox" data-layer="runningRigging" checked /> Running</label>
          <label class="gh-chip"><input type="checkbox" data-layer="weapons" checked /> Guns</label>
          <label class="gh-chip"><input type="checkbox" data-layer="details" checked /> Details</label>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    this._wireEvents(panel);
  }

  _wireEvents(panel) {
    const sailBtns = panel.querySelectorAll('#gh-sail-btns .gh-btn');
    sailBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        sailBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.sail;
        panel.querySelector('#gh-sail-state').textContent = mode.toUpperCase();
        this.galleon.setSailDeployment(mode);
      });
    });

    const motionBtns = panel.querySelectorAll('#gh-motion-btns .gh-btn');
    motionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        motionBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const motionMode = btn.dataset.motion;
        panel.querySelector('#gh-motion-state').textContent = motionMode.toUpperCase();
        this.galleon.setEnvironment({ motionMode });
      });
    });

    panel.querySelector('#gh-anchor-btn').addEventListener('click', () => {
      const next = !this.galleon.envState.anchorDropped;
      this.galleon.setEnvironment({ anchorDropped: next });
      this.syncAnchorAndLanternUI();
    });

    panel.querySelector('#gh-lantern-btn').addEventListener('click', () => {
      const next = !this.galleon.envState.lanternsLit;
      this.galleon.setEnvironment({ lanternsLit: next });
      this.syncAnchorAndLanternUI();
    });

    panel.querySelector('#gh-sea-slider').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      panel.querySelector('#gh-sea-val').textContent = `${val.toFixed(1)}x`;
      this.galleon.setEnvironment({ seaState: val });
    });

    panel.querySelector('#gh-wind-slider').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      panel.querySelector('#gh-wind-val').textContent = `${val}\u00B0`;
      this.galleon.setEnvironment({ windAngleDeg: val });
    });

    panel.querySelector('#gh-rudder-slider').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      panel.querySelector('#gh-rudder-val').textContent = `${val}\u00B0`;
      this.galleon.setEnvironment({ rudderAngleDeg: val });
    });

    panel.querySelectorAll('[data-fire]').forEach((btn) => {
      btn.addEventListener('click', () => this.galleon.fireBroadside(btn.dataset.fire));
    });

    panel.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.callbacks.onCameraPreset) this.callbacks.onCameraPreset(btn.dataset.cam);
      });
    });

    const mBtn = panel.querySelector('#gh-mortar-fire');
    if (mBtn) mBtn.addEventListener('click', () => { if (this.galleon.fireMortar) this.galleon.fireMortar(); });
    const mEl = panel.querySelector('#gh-mortar-elev'), mElVal = panel.querySelector('#gh-mortar-elev-val');
    if (mEl) mEl.addEventListener('input', () => {
      mElVal.textContent = `${mEl.value}°`;
      if (this.galleon.setMortarElevation) this.galleon.setMortarElevation(Number(mEl.value));
    });
    const moodBtns = panel.querySelectorAll('#gh-mood-btns .gh-btn');
    moodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        moodBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.callbacks.onLightingMood) this.callbacks.onLightingMood(btn.dataset.mood);
      });
    });

    const slAz = panel.querySelector('#gh-sun-az'), slEl = panel.querySelector('#gh-sun-el');
    const vAz = panel.querySelector('#gh-sun-az-val'), vEl = panel.querySelector('#gh-sun-el-val');
    const emitSun = () => {
      vAz.textContent = `${slAz.value}°`;
      vEl.textContent = `${slEl.value}°`;
      if (this.callbacks.onSunAngle) this.callbacks.onSunAngle(Number(slAz.value), Number(slEl.value));
    };
    slAz.addEventListener('input', emitSun);
    slEl.addEventListener('input', emitSun);

    panel.querySelectorAll('#gh-layer-toggles input').forEach((chk) => {
      chk.addEventListener('change', () => {
        this.galleon.setComponentVisibility(chk.dataset.layer, chk.checked);
      });
    });

    const demoBtn = panel.querySelector('#gh-autodemo-btn');
    demoBtn.addEventListener('click', () => {
      const next = !this.galleon.envState.autoDemo;
      this.galleon.setEnvironment({ autoDemo: next });
      demoBtn.classList.toggle('active', next);
    });
  }

  syncAnchorAndLanternUI() {
    const aBtn = document.getElementById('gh-anchor-btn');
    const lBtn = document.getElementById('gh-lantern-btn');
    if (aBtn) {
      const dropped = this.galleon.envState.anchorDropped;
      aBtn.textContent = dropped ? 'Weigh Anchor' : 'Drop Anchor';
      aBtn.classList.toggle('active', dropped);
    }
    if (lBtn) {
      const lit = this.galleon.envState.lanternsLit;
      lBtn.textContent = lit ? 'Lantern: ON' : 'Lantern: OFF';
      lBtn.classList.toggle('active', lit);
    }
  }
}
