import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

export class FigureheadGenerator {
  constructor(c, m, l) { this.config = c; this.h = c.hull; this.materials = m; this.lines = l; }
  generate() {
    const g = new THREE.Group(); g.name = 'FigureheadAssembly';
    const gold = this.materials.get('goldLeaf'), dark = this.materials.get('darkTimber'),
          iron = this.materials.get('agedIron'),
          ivory = new THREE.MeshStandardMaterial({ color: 0xebe3d2, roughness: 0.52, metalness: 0.05 });
    const { tipZ, tipY } = this.lines.getBeakheadMetrics();
    if (this.config.figureheadStyle === 'lion') {
      const lion = this._buildCrownedLion(gold, dark);
      lion.position.set(0, tipY + 0.06, tipZ + 0.04);
      lion.rotation.x = 0.14;
      g.add(lion);
    } else {
      const skullSword = this._buildSkullAndSwords(gold, dark, iron, ivory);
      skullSword.position.set(0, tipY + 0.12, tipZ + 0.05);
      skullSword.rotation.x = 0.18;
      g.add(skullSword);
    }
    return g;
  }
  _buildSkullAndSwords(goldMat, darkMat, ironMat, ivoryMat) {
    const fh = new THREE.Group();
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.26, 10), goldMat);
    collar.position.y = -0.18; collar.rotation.x = 0.22; fh.add(collar);

    const skull = new THREE.Group(); skull.position.set(0, 0.18, 0.06);
    const cran = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), ivoryMat);
    cran.scale.set(0.92, 1.05, 1.08); cran.castShadow = true; skull.add(cran);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.14, 0.20), ivoryMat);
    jaw.position.set(0, -0.17, 0.06); skull.add(jaw);
    [-0.082, 0.082].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), darkMat);
      eye.scale.set(1.0, 0.9, 0.65); eye.position.set(ex, 0.01, 0.195); skull.add(eye);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.075, 4), darkMat);
    nose.position.set(0, -0.065, 0.205); skull.add(nose);
    for (let t = -2; t <= 2; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.03), darkMat);
      tooth.position.set(t * 0.036, -0.18, 0.162); skull.add(tooth);
    }
    fh.add(skull);

    [-1, 1].forEach((side) => {
      const sw = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.72, 0.08), ironMat);
      blade.position.y = 0.14; sw.add(blade);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.24), goldMat);
      guard.position.y = -0.22; sw.add(guard);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 8), darkMat);
      grip.position.y = -0.32; sw.add(grip);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), goldMat);
      pom.position.y = -0.42; sw.add(pom);
      sw.position.set(0, 0.16, -0.08);
      sw.rotation.z = side * 0.62; sw.rotation.x = 0.18;
      fh.add(sw);
    });
    return fh;
  }
  _buildCrownedLion(goldMat, darkMat) {
    const lion = new THREE.Group();
    const torsoPts = [
      new THREE.Vector2(0.06, -0.34), new THREE.Vector2(0.11, -0.22), new THREE.Vector2(0.13, -0.05),
      new THREE.Vector2(0.19, 0.16), new THREE.Vector2(0.17, 0.34), new THREE.Vector2(0.11, 0.44),
    ];
    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 12), goldMat);
    torso.rotation.x = 0.22; torso.castShadow = true; lion.add(torso);

    [-0.10, 0.10].forEach((sx) => {
      lion.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber([
        new THREE.Vector3(sx, -0.14, 0.02), new THREE.Vector3(sx * 1.15, -0.32, 0.06), new THREE.Vector3(sx * 0.95, -0.52, -0.06),
      ], 0.085, 0.095, 8, (t) => 1.0 - t * 0.35), goldMat));
    });

    [-0.12, 0.12].forEach((sx) => {
      lion.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber([
        new THREE.Vector3(sx, 0.24, 0.08), new THREE.Vector3(sx * 1.15, 0.18, 0.28),
        new THREE.Vector3(sx * 0.95, 0.34, 0.36), new THREE.Vector3(sx * 0.90, 0.32, 0.48),
      ], 0.075, 0.075, 10, (t) => 1.0 - t * 0.25), goldMat));
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), goldMat);
      paw.scale.set(1.0, 0.75, 1.35); paw.position.set(sx * 0.90, 0.30, 0.50); lion.add(paw);
    });

    const head = new THREE.Group(); head.position.set(0, 0.52, 0.16);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), goldMat);
    skull.scale.set(0.95, 1.02, 1.1); head.add(skull);
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.15), goldMat);
    muzzle.position.set(0, -0.02, 0.14); head.add(muzzle);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), darkMat);
    nose.position.set(0, 0.02, 0.215); head.add(nose);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.12), goldMat);
    jaw.position.set(0, -0.09, 0.11); jaw.rotation.x = 0.22; head.add(jaw);
    [-0.095, 0.095].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.07, 6), goldMat);
      ear.position.set(ex, 0.12, 0.02); ear.rotation.z = ex * -2.2; head.add(ear);
    });
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const lock = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 6), goldMat);
      lock.position.set(Math.cos(ang) * 0.12, Math.sin(ang) * 0.12 - 0.02, -0.04);
      lock.rotation.z = ang - Math.PI * 0.5; lock.rotation.x = -0.35; head.add(lock);
    }
    const crown = new THREE.Group(); crown.position.set(0, 0.15, 0.01);
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.095, 0.06, 12), goldMat));
    for (let a = 0; a < 4; a++) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 5, 10, Math.PI), goldMat);
      arch.rotation.y = (a / 4) * Math.PI; arch.position.y = 0.03; crown.add(arch);
    }
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), goldMat);
    orb.position.y = 0.135; crown.add(orb);
    head.add(crown);
    lion.add(head);

    lion.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber([
      new THREE.Vector3(0, -0.22, -0.08), new THREE.Vector3(0.14, -0.08, -0.18),
      new THREE.Vector3(0.16, 0.12, -0.12), new THREE.Vector3(0.08, 0.22, -0.16),
    ], 0.038, 0.038, 10, (t) => 1.0 - t * 0.3), goldMat));

    lion.scale.setScalar(1.18);
    return lion;
  }
}
