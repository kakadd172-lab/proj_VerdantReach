import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

/**
 * Crowned Rampant Lion Figurehead (preserved in beakheads/ folder).
 */
export class LionBeakhead {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'LionBeakhead';

    const goldMat = this.materials.get('goldLeaf');
    const darkMat = this.materials.get('darkTimber');

    const bowZ = CoordinateSystem.stationToZ(1.0, this.h.length);
    const tipZ = bowZ + this.h.bowOverhang * 0.66;
    const tipY = this.lines.getSheerY(1.0) + 1.37;

    const lion = new THREE.Group();
    const torsoPts = [
      new THREE.Vector2(0.06, -0.34),
      new THREE.Vector2(0.11, -0.22),
      new THREE.Vector2(0.13, -0.05),
      new THREE.Vector2(0.19, 0.16),
      new THREE.Vector2(0.17, 0.34),
      new THREE.Vector2(0.11, 0.44),
    ];
    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 12), goldMat);
    torso.rotation.x = 0.22;
    torso.castShadow = true;
    lion.add(torso);

    [-0.10, 0.10].forEach((sideX) => {
      lion.add(
        new THREE.Mesh(
          GeometryHelpers.createCurvedTimber(
            [
              new THREE.Vector3(sideX, -0.14, 0.02),
              new THREE.Vector3(sideX * 1.15, -0.32, 0.06),
              new THREE.Vector3(sideX * 0.95, -0.52, -0.06),
            ],
            0.085,
            0.095,
            8,
            (t) => 1.0 - t * 0.35
          ),
          goldMat
        )
      );
    });

    [-0.12, 0.12].forEach((sideX) => {
      lion.add(
        new THREE.Mesh(
          GeometryHelpers.createCurvedTimber(
            [
              new THREE.Vector3(sideX, 0.24, 0.08),
              new THREE.Vector3(sideX * 1.15, 0.18, 0.28),
              new THREE.Vector3(sideX * 0.95, 0.34, 0.36),
              new THREE.Vector3(sideX * 0.90, 0.32, 0.48),
            ],
            0.075,
            0.075,
            10,
            (t) => 1.0 - t * 0.25
          ),
          goldMat
        )
      );
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), goldMat);
      paw.scale.set(1.0, 0.75, 1.35);
      paw.position.set(sideX * 0.90, 0.30, 0.50);
      lion.add(paw);
    });

    const head = new THREE.Group();
    head.position.set(0, 0.52, 0.16);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), goldMat);
    skull.scale.set(0.95, 1.02, 1.1);
    head.add(skull);
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.15), goldMat);
    muzzle.position.set(0, -0.02, 0.14);
    head.add(muzzle);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), darkMat);
    nose.position.set(0, 0.02, 0.215);
    head.add(nose);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.12), goldMat);
    jaw.position.set(0, -0.09, 0.11);
    jaw.rotation.x = 0.22;
    head.add(jaw);

    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const lock = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 6), goldMat);
      lock.position.set(Math.cos(ang) * 0.12, Math.sin(ang) * 0.12 - 0.02, -0.04);
      lock.rotation.z = ang - Math.PI * 0.5;
      lock.rotation.x = -0.35;
      head.add(lock);
    }

    const crown = new THREE.Group();
    crown.position.set(0, 0.15, 0.01);
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.095, 0.06, 12), goldMat));
    for (let a = 0; a < 4; a++) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.014, 5, 10, Math.PI),
        goldMat
      );
      arch.rotation.y = (a / 4) * Math.PI;
      arch.position.y = 0.03;
      crown.add(arch);
    }
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), goldMat);
    orb.position.y = 0.135;
    crown.add(orb);
    head.add(crown);
    lion.add(head);

    lion.scale.setScalar(1.18);
    lion.position.set(0, tipY + 0.06, tipZ + 0.04);
    lion.rotation.x = 0.14;
    group.add(lion);

    return group;
  }
}
