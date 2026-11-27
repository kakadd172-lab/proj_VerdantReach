import * as THREE from 'three';
import { createGalleonConfig } from '../config/GalleonConfig.js';
import { ProceduralMaterials } from '../materials/ProceduralMaterials.js';
import { HullLinesEngine } from '../generators/hull/HullLinesEngine.js';
import { HullGenerator } from '../generators/hull/HullGenerator.js';
import { RudderGenerator } from '../generators/hull/RudderGenerator.js';
import { DeckGenerator } from '../generators/decks/DeckGenerator.js';
import { SuperstructureGenerator } from '../generators/superstructure/SuperstructureGenerator.js';
import { MastGenerator } from '../generators/masts/MastGenerator.js';
import { SailGenerator } from '../generators/sails/SailGenerator.js';
import { StandingRiggingGenerator } from '../generators/rigging/StandingRiggingGenerator.js';
import { RunningRiggingGenerator } from '../generators/rigging/RunningRiggingGenerator.js';
import { WeaponGenerator } from '../generators/weapons/WeaponGenerator.js';
import { MortarGenerator } from '../generators/mortar/MortarGenerator.js';
import { DetailGenerator } from '../generators/details/DetailGenerator.js';
import { FigureheadGenerator } from '../generators/figurehead/FigureheadGenerator.js';
import { MeshOptimizer } from '../utils/MeshOptimizer.js';

export class GalleonMaster {
  constructor(userConfig = {}) {
    this.config = createGalleonConfig(userConfig);
    this.materials = null;
    this.linesEngine = null;
    this.mastAnchors = {};
    this.sailGen = null;
    this.runningRiggingGen = null;
    this.weaponGen = null;
    this.mortarGen = null;
    this.detailGen = null;
    this.elapsedTime = 0;
    this.wireframe = false;
    this.currentBraceRad = 0;
    this.currentRudderRad = 0;
    this.envState = {
      motionMode: 'sailing', seaState: 1.0, windAngleDeg: 25, windStrength: 0.78,
      rudderAngleDeg: 0, anchorDropped: false, anchorProgress: 0, lanternsLit: true, autoDemo: false,
    };
    this.root = new THREE.Group();
    this.components = {
      hull: new THREE.Group(), decks: new THREE.Group(), superstructure: new THREE.Group(),
      masts: new THREE.Group(), sails: new THREE.Group(), standingRigging: new THREE.Group(),
      runningRigging: new THREE.Group(), weapons: new THREE.Group(), details: new THREE.Group(), figurehead: new THREE.Group(),
    };
    Object.entries(this.components).forEach(([n, gr]) => { gr.name = n; this.root.add(gr); });
  }
  generate() {
    this.disposeGeometry();
    if (this.materials) this.materials.dispose();
    this.materials = new ProceduralMaterials(this.config);
    this.materials.setWireframe(this.wireframe);
    this.linesEngine = new HullLinesEngine(this.config);

    this.components.hull.add(new HullGenerator(this.config, this.materials, this.linesEngine).generate());
    this.components.hull.add(new RudderGenerator(this.config, this.materials, this.linesEngine).generate());
    this.components.decks.add(new DeckGenerator(this.config, this.materials, this.linesEngine).generate());
    this.components.superstructure.add(new SuperstructureGenerator(this.config, this.materials, this.linesEngine).generate());

    const mastGen = new MastGenerator(this.config, this.materials, this.linesEngine);
    this.components.masts.add(mastGen.generate());
    this.mastAnchors = mastGen.getAnchors();

    this.sailGen = new SailGenerator(this.config, this.materials, this.linesEngine, this.mastAnchors);
    this.components.sails.add(this.sailGen.generate());

    this.components.standingRigging.add(new StandingRiggingGenerator(this.config, this.materials, this.linesEngine, this.mastAnchors).generate());
    this.runningRiggingGen = new RunningRiggingGenerator(this.config, this.materials, this.linesEngine, this.mastAnchors);
    this.components.runningRigging.add(this.runningRiggingGen.generate());

    this.weaponGen = new WeaponGenerator(this.config, this.materials, this.linesEngine);
    this.components.weapons.add(this.weaponGen.generate());
    this.mortarGen = new MortarGenerator(this.config, this.materials, this.linesEngine);
    this.components.weapons.add(this.mortarGen.generate());

    this.detailGen = new DetailGenerator(this.config, this.materials, this.linesEngine, this.mastAnchors);
    this.components.details.add(this.detailGen.generate());
    this.components.figurehead.add(new FigureheadGenerator(this.config, this.materials, this.linesEngine).generate());
    this.detailGen.setLanternsLit(this.envState.lanternsLit);
    this.detailGen.updateAnchors(this.envState.anchorProgress);

    this._applyKinematics(0, 0.016);
    return this.root;
  }
  setSailDeployment(mode) {
    if (this.sailGen) this.sailGen.setMode(mode);
  }
  regenerate(overrides = {}) {
    this.config = createGalleonConfig({
      ...this.config,
      ...overrides,
      hull: { ...this.config.hull, ...(overrides.hull || {}) },
      masts: {
        ...this.config.masts,
        ...(overrides.masts || {}),
        fore: { ...this.config.masts.fore, ...((overrides.masts && overrides.masts.fore) || {}) },
        main: { ...this.config.masts.main, ...((overrides.masts && overrides.masts.main) || {}) },
      },
      sails: { ...this.config.sails, ...(overrides.sails || {}) },
    });
    return this.generate();
  }
  setWireframe(enabled) {
    this.wireframe = enabled;
    if (this.materials) this.materials.setWireframe(enabled);
  }
  setEnvironment(p = {}) {
    Object.assign(this.envState, p);
    if (p.lanternsLit !== undefined && this.detailGen) this.detailGen.setLanternsLit(this.envState.lanternsLit);
  }
  fireBroadside(side) { if (this.weaponGen) this.weaponGen.triggerBroadside(side); }
  fireMortar() { if (this.mortarGen) this.mortarGen.triggerMortar(); }
  setMortarElevation(deg) { if (this.mortarGen) this.mortarGen.setElevation(deg); }
  setComponentVisibility(n, v) { if (this.components[n]) this.components[n].visible = v; }
  update(dt = 0.016) {
    this.elapsedTime += dt;
    const t = this.elapsedTime;
    if (this.envState.autoDemo) {
      this.envState.windAngleDeg = Math.sin(t * 0.35) * 65;
      this.envState.rudderAngleDeg = Math.sin(t * 0.5) * 24;
    }
    this.envState.anchorProgress += ((this.envState.anchorDropped ? 1 : 0) - this.envState.anchorProgress) * Math.min(1, dt * 3.5);
    if (this.sailGen) this.sailGen.update(dt, t, this.envState.windStrength);
    if (this.detailGen) {
      this.detailGen.updateAnchors(this.envState.anchorProgress);
      this.detailGen.updateFlags(t, this.envState.windStrength, THREE.MathUtils.degToRad(this.envState.windAngleDeg));
    }
    if (this.weaponGen) this.weaponGen.update(dt);
    if (this.mortarGen) this.mortarGen.update(dt);
    this._applyKinematics(t, dt);
  }
  _applyKinematics(t, dt = 0.016) {
    const { motionMode, seaState, windAngleDeg, windStrength, rudderAngleDeg } = this.envState;
    const ms = motionMode === 'anchored' ? 0.18 : motionMode === 'drifting' ? 0.55 : motionMode === 'storm' ? 1.85 : 1.0;
    const amp = seaState * ms;
    this.root.position.y = Math.sin(t * 1.15) * 0.12 * amp;
    this.root.rotation.x = Math.sin(t * 0.92) * 0.018 * amp;
    const heel = (motionMode === 'sailing' || motionMode === 'storm') ? Math.sin(THREE.MathUtils.degToRad(windAngleDeg)) * 0.045 * windStrength : 0;
    this.root.rotation.z = Math.cos(t * 0.84) * 0.024 * amp + heel;

    // Smooth yardarm bracing within historical +/- 42 deg limit
    const targetBrace = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(windAngleDeg) * 0.55, -0.73, 0.73);
    this.currentBraceRad += (targetBrace - this.currentBraceRad) * Math.min(1, dt * 5.0);
    ['fore', 'main'].forEach((k) => {
      const md = this.mastAnchors[k];
      if (md && md.yards) md.yards.forEach((y) => { if (y.pivotGroup) y.pivotGroup.rotation.y = this.currentBraceRad; });
    });
    if (this.mastAnchors.mizzen && this.mastAnchors.mizzen.yards[0]) {
      this.mastAnchors.mizzen.yards[0].pivotGroup.rotation.y = this.currentBraceRad * 0.35;
    }
    if (this.mastAnchors.bowsprit && this.mastAnchors.bowsprit.yardPivotGroup) {
      this.mastAnchors.bowsprit.yardPivotGroup.rotation.y = this.currentBraceRad * 0.65;
    }

    // Smooth rudder + 7.5x helm wheel + whipstaff coupled rotation
    const targetRud = THREE.MathUtils.degToRad(rudderAngleDeg);
    this.currentRudderRad += (targetRud - this.currentRudderRad) * Math.min(1, dt * 6.0);
    const rP = this.components.hull.getObjectByName('RudderAssembly'); if (rP) rP.rotation.y = this.currentRudderRad;
    const wP = this.components.details.getObjectByName('HelmWhipstaffAssembly'); if (wP) wP.rotation.z = -this.currentRudderRad * 0.85;
    const whP = this.components.details.getObjectByName('HelmWheelAssembly'); if (whP) whP.rotation.z = this.currentRudderRad * 7.5;

    this.root.updateMatrixWorld(true);
    if (this.runningRiggingGen) {
      this.runningRiggingGen.update(new THREE.Matrix4().copy(this.root.matrixWorld).invert());
    }
  }
  disposeGeometry() {
    Object.values(this.components).forEach((gr) => {
      gr.traverse((ch) => { if (ch.isMesh && ch.geometry) ch.geometry.dispose(); });
      while (gr.children.length > 0) gr.remove(gr.children[0]);
    });
  }
}
