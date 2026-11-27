import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Clean, bold Skull & Crossed Sword (Cutlass) Beakhead Figurehead
 * mounted at the upturned tip of the beakhead cutwater.
 */
export class SkullSwordBeakhead {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'SkullSwordBeakhead';

    const goldMat = this.materials.get('goldLeaf');
    const darkMat = this.materials.get('darkTimber');
    const ironMat = this.materials.get('agedIron');
    const sailMat = this.materials.get('sailCanvas');

    const bowZ = CoordinateSystem.stationToZ(1.0, this.h.length);
    const tipZ = bowZ + this.h.bowOverhang * 0.66;
    const tipY = this.lines.getSheerY(1.0) + 1.37;

    const fh = new THREE.Group();

    // 1. Gilded Pedestal Scroll Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.26, 10), goldMat);
    collar.position.y = -0.18;
    collar.rotation.x = 0.22;
    fh.add(collar);

    // 2. Sculpted Skull (Cranium + Cheekbones + Jaw + Dark Eye Sockets & Nasal Cavity)
    const skullGroup = new THREE.Group();
    skullGroup.position.set(0, 0.18, 0.06);

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), sailMat);
    cranium.scale.set(0.92, 1.05, 1.08);
    cranium.castShadow = true;
    skullGroup.add(cranium);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.14, 0.20), sailMat);
    jaw.position.set(0, -0.17, 0.06);
    skullGroup.add(jaw);

    // Dark eye sockets
    [-0.082, 0.082].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), darkMat);
      eye.scale.set(1.0, 0.9, 0.65);
      eye.position.set(ex, 0.01, 0.195);
      skullGroup.add(eye);
    });

    // Nasal cavity
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.075, 4), darkMat);
    nose.position.set(0, -0.065, 0.205);
    skullGroup.add(nose);

    // Teeth notches
    for (let t = -2; t <= 2; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.03), darkMat);
      tooth.position.set(t * 0.036, -0.18, 0.162);
      skullGroup.add(tooth);
    }

    fh.add(skullGroup);

    // 3. Crossed Naval Cutlasses / Swords behind the Skull
    [-1, 1].forEach((side) => {
      const sword = new THREE.Group();
      // Tapered steel blade pointing forward/upward
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.95, 0.09), ironMat);
      blade.position.y = 0.24;
      sword.add(blade);
      // Gilded S-guard & pommel
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.24), goldMat);
      guard.position.y = -0.22;
      sword.add(guard);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 8), darkMat);
      grip.position.y = -0.32;
      sword.add(grip);
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), goldMat);
      pommel.position.y = -0.42;
      sword.add(pommel);

      sword.position.set(0, 0.16, -0.08);
      sword.rotation.z = side * 0.62;
      sword.rotation.x = 0.18;
      fh.add(sword);
    });

    fh.position.set(0, tipY + 0.12, tipZ + 0.05);
    fh.rotation.x = 0.18;
    group.add(fh);

    return group;
  }
}
