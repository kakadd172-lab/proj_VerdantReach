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
import { DetailGenerator } from '../generators/details/DetailGenerator.js';

/**
 * Central master controller orchestrating all 9 Golden Hind subsystems,
 * live nautical kinematics (yard bracing, dynamic brace lines, whipstaff-to-rudder
 * coupling, sailing/anchored/storm motion, anchor drop/weigh, stern lantern,
 * broadside recoil & smoke, and flag wind flutter), and clean disposal.
 */
export class GalleonMaster {
  constructor(userConfig = {}) {
    this.config = createGalleonConfig(userConfig);
    this.materials = null;
    this.linesEngine = null;
    this.mastAnchors = {};
    this.runningRiggingGen = null;
    this.weaponGen = null;
    this.detailGen = null;
    this.elapsedTime = 0;

    this.envState = {
      motionMode: 'sailing', // 'anchored' | 'drifting' | 'sailing' | 'storm'
      shipSpeedKnots: 6.0,
      seaState: 1.0,
      windAngleDeg: 25,
      windStrength: 0.78,
      rudderAngleDeg: 0,
      anchorDropped: false,
      anchorProgress: 0,
      lanternsLit: true,
      autoDemo: false,
    };

    this.root = new THREE.Group();
    this.root.name = 'GalleonRoot';

    this.components = {
      hull: new THREE.Group(),
      decks: new THREE.Group(),
      superstructure: new THREE.Group(),
      masts: new THREE.Group(),
      sails: new THREE.Group(),
      standingRigging: new THREE.Group(),
      runningRigging: new THREE.Group(),
      weapons: new THREE.Group(),
      details: new THREE.Group(),
    };

    Object.entries(this.components).forEach(([name, group]) => {
      group.name = name;
      this.root.add(group);
    });
  }

  generate() {
    this.disposeGeometry();
    if (this.materials) this.materials.dispose();

    this.materials = new ProceduralMaterials(this.config);
    this.linesEngine = new HullLinesEngine(this.config);

    // 1. Hull & Rudder
    const hullGen = new HullGenerator(this.config, this.materials, this.linesEngine);
    this.components.hull.add(hullGen.generate());

    const rudderGen = new RudderGenerator(this.config, this.materials, this.linesEngine);
    this.components.hull.add(rudderGen.generate());

    // 2. Decks
    const deckGen = new DeckGenerator(this.config, this.materials, this.linesEngine);
    this.components.decks.add(deckGen.generate());

    // 3. Superstructure
    const superGen = new SuperstructureGenerator(this.config, this.materials, this.linesEngine);
    this.components.superstructure.add(superGen.generate());

    // 4. Masts & Articulated Yards
    const mastGen = new MastGenerator(this.config, this.materials, this.linesEngine);
    this.components.masts.add(mastGen.generate());
    this.mastAnchors = mastGen.getAnchors();

    // 5. Sails
    const sailGen = new SailGenerator(this.config, this.materials, this.linesEngine, this.mastAnchors);
    this.components.sails.add(sailGen.generate());

    // 6. Standing Rigging
    const standingGen = new StandingRiggingGenerator(
      this.config,
      this.materials,
      this.linesEngine,
      this.mastAnchors
    );
    this.components.standingRigging.add(standingGen.generate());

    // 7. Dynamic Running Rigging
    this.runningRiggingGen = new RunningRiggingGenerator(
      this.config,
      this.materials,
      this.linesEngine,
      this.mastAnchors
    );
    this.components.runningRigging.add(this.runningRiggingGen.generate());

    // 8. Weapons
    this.weaponGen = new WeaponGenerator(this.config, this.materials, this.linesEngine);
    this.components.weapons.add(this.weaponGen.generate());

    // 9. Details (Single Poop Lantern, Whipstaff, Anchors, Longboat, Flags)
    this.detailGen = new DetailGenerator(
      this.config,
      this.materials,
      this.linesEngine,
      this.mastAnchors
    );
    this.components.details.add(this.detailGen.generate());
    this.detailGen.setLanternsLit(this.envState.lanternsLit);
    this.detailGen.updateAnchors(this.envState.anchorProgress);

    this.root.scale.setScalar(this.config.scale);
    this._applyKinematics(0, 0.016);
    return this.root;
  }

  setEnvironment(partial = {}) {
    Object.assign(this.envState, partial);
    if (partial.lanternsLit !== undefined && this.detailGen) {
      this.detailGen.setLanternsLit(this.envState.lanternsLit);
    }
  }

  setSailDeployment(deployment) {
    this.regenerate({ sails: { deployment } });
  }

  fireBroadside(side = 'both') {
    if (this.weaponGen) this.weaponGen.triggerBroadside(side);
  }

  setComponentVisibility(name, visible) {
    if (this.components[name]) this.components[name].visible = visible;
  }

  regenerate(newConfig = {}) {
    this.config = createGalleonConfig({ ...this.config, ...newConfig });
    return this.generate();
  }

  update(dt = 0.016) {
    this.elapsedTime += dt;
    const t = this.elapsedTime;

    if (this.envState.autoDemo) {
      this.envState.windAngleDeg = Math.sin(t * 0.35) * 65;
      this.envState.rudderAngleDeg = Math.sin(t * 0.5) * 24;
    }

    // Smooth anchor drop/weigh transition
    const targetAnchor = this.envState.anchorDropped ? 1 : 0;
    this.envState.anchorProgress += (targetAnchor - this.envState.anchorProgress) * Math.min(1, dt * 3.5);
    if (this.detailGen) {
      this.detailGen.updateAnchors(this.envState.anchorProgress);
      this.detailGen.updateFlags(
        t,
        this.envState.windStrength,
        THREE.MathUtils.degToRad(this.envState.windAngleDeg)
      );
    }

    if (this.weaponGen) this.weaponGen.update(dt);
    this._applyKinematics(t, dt);
  }

  _applyKinematics(t, dt) {
    const { motionMode, seaState, windAngleDeg, windStrength, rudderAngleDeg } = this.envState;

    // 1. Hull heave, pitch & roll
    const modeScale =
      motionMode === 'anchored' ? 0.18 : motionMode === 'drifting' ? 0.55 : motionMode === 'storm' ? 1.85 : 1.0;
    const amp = seaState * modeScale;

    this.root.position.y = Math.sin(t * 1.15) * 0.12 * amp;
    this.root.rotation.x = Math.sin(t * 0.92) * 0.018 * amp;
    const heelBias = motionMode === 'sailing' || motionMode === 'storm' ? Math.sin(THREE.MathUtils.degToRad(windAngleDeg)) * 0.045 * windStrength : 0;
    this.root.rotation.z = Math.cos(t * 0.84) * 0.024 * amp + heelBias;

    // 2. Yardarm wind bracing (clamped to +/- 42 deg historical bracing limit)
    const braceRad = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(windAngleDeg) * 0.55, -0.73, 0.73);
    ['fore', 'main'].forEach((key) => {
      const mData = this.mastAnchors[key];
      if (!mData || !mData.yards) return;
      mData.yards.forEach((yard) => {
        if (yard.pivotGroup) yard.pivotGroup.rotation.y = braceRad;
      });
    });
    if (this.mastAnchors.bowsprit && this.mastAnchors.bowsprit.yardPivotGroup) {
      this.mastAnchors.bowsprit.yardPivotGroup.rotation.y = braceRad * 0.65;
    }

    // 3. Rudder & Whipstaff coupled steering
    const rudderRad = THREE.MathUtils.degToRad(rudderAngleDeg);
    const rudderPivot = this.components.hull.getObjectByName('RudderAssembly');
    if (rudderPivot) rudderPivot.rotation.y = rudderRad;

    const whipPivot = this.components.details.getObjectByName('HelmWhipstaffAssembly');
    if (whipPivot) whipPivot.rotation.z = -rudderRad * 0.85;

    // 4. Dynamic running rigging braces
    this.root.updateMatrixWorld(true);
    if (this.runningRiggingGen) {
      const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
      this.runningRiggingGen.update(inv);
    }
  }

  disposeGeometry() {
    Object.values(this.components).forEach((group) => {
      group.traverse((child) => {
        if (child.isMesh && child.geometry) child.geometry.dispose();
      });
      while (group.children.length > 0) group.remove(group.children[0]);
    });
  }

  dispose() {
    this.disposeGeometry();
    if (this.materials) this.materials.dispose();
  }
}
