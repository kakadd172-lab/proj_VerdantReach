import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Generates Elizabethan naval ordnance (demi-culverins & sakers on 4-wheeled
 * wooden carriages + stern chasers) with staggered broadside recoil & smoke puffs.
 */
export class WeaponGenerator {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
    this.cannons = [];
    this.smokePuffs = [];
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'WeaponsAssembly';
    this.cannons = [];
    this.smokePuffs = [];

    const bronzeMat = this.materials.get('bronzeCannon');
    const oakMat = this.materials.get('weatheredOak');
    const darkMat = this.materials.get('darkTimber');

    // 1. Main deck broadside guns (aligned with gunports)
    const perSide = this.h.gunportsPerSide;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < perSide; i++) {
        const u = CoordinateSystem.lerp(0.28, 0.72, i / Math.max(1, perSide - 1));
        const z = CoordinateSystem.stationToZ(u, this.h.length);
        const y = this.lines.getSheerY(u) + 0.34;
        const hullX = Math.abs(this.lines.getHullPoint(u, 0.66, 1).x);

        const cannon = this._buildCannon(bronzeMat, oakMat, darkMat, 0.92);
        cannon.position.set(side * (hullX - 0.55), y, z);
        cannon.rotation.y = side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;
        group.add(cannon);

        this.cannons.push({
          mesh: cannon,
          side: side === 1 ? 'starboard' : 'port',
          baseX: cannon.position.x,
          baseZ: cannon.position.z,
          recoilTimer: -1,
          delay: i * 0.07,
        });
      }
    });

    // 2. Quarterdeck sakers (2 per side)
    [-1, 1].forEach((side) => {
      [0.26, 0.36].forEach((u, idx) => {
        const z = CoordinateSystem.stationToZ(u, this.h.length);
        const y = this.lines.getSheerY(u) + 1.48;
        const hullX = Math.abs(this.lines.getHullPoint(u, 0.85, 1).x);

        const cannon = this._buildCannon(bronzeMat, oakMat, darkMat, 0.76);
        cannon.position.set(side * (hullX - 0.48), y, z);
        cannon.rotation.y = side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;
        group.add(cannon);

        this.cannons.push({
          mesh: cannon,
          side: side === 1 ? 'starboard' : 'port',
          baseX: cannon.position.x,
          baseZ: cannon.position.z,
          recoilTimer: -1,
          delay: idx * 0.09 + 0.04,
        });
      });
    });

    // 3. Stern chasers (2 guns)
    const sternZ = CoordinateSystem.stationToZ(0.06, this.h.length);
    const sternY = this.lines.getSheerY(0.06) + 0.45;
    [-0.75, 0.75].forEach((x, idx) => {
      const chaser = this._buildCannon(bronzeMat, oakMat, darkMat, 0.85);
      chaser.position.set(x, sternY, sternZ);
      chaser.rotation.y = Math.PI;
      group.add(chaser);

      this.cannons.push({
        mesh: chaser,
        side: 'stern',
        baseX: x,
        baseZ: sternZ,
        recoilTimer: -1,
        delay: idx * 0.1,
      });
    });

    this.group = group;
    return group;
  }

  _buildCannon(barrelMat, oakMat, wheelMat, scale = 1.0) {
    const gun = new THREE.Group();

    const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.78), oakMat);
    carriage.position.y = 0.18;
    gun.add(carriage);

    // 4 trucks (wheels)
    [
      [-0.2, -0.24],
      [0.2, -0.24],
      [-0.2, 0.24],
      [0.2, 0.24],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8), wheelMat);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(wx, 0.09, wz);
      gun.add(wheel);
    });

    // Tapered bronze barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.105, 1.35, 10), barrelMat);
    barrel.rotation.x = Math.PI * 0.5;
    barrel.position.set(0, 0.34, 0.22);
    barrel.castShadow = true;
    gun.add(barrel);

    gun.scale.setScalar(scale);
    return gun;
  }

  triggerBroadside(side = 'both') {
    this.cannons.forEach((c) => {
      if (side === 'both' && (c.side === 'port' || c.side === 'starboard')) {
        c.recoilTimer = -c.delay;
      } else if (c.side === side) {
        c.recoilTimer = -c.delay;
      }
    });
  }

  update(dt) {
    // Update gun recoil
    this.cannons.forEach((c) => {
      if (c.recoilTimer === -1) return;
      const prev = c.recoilTimer;
      c.recoilTimer += dt;

      if (prev < 0 && c.recoilTimer >= 0) {
        this._spawnSmoke(c);
      }
      if (c.recoilTimer >= 0) {
        const t = c.recoilTimer;
        if (t > 1.2) {
          c.recoilTimer = -1;
          c.mesh.position.x = c.baseX;
          c.mesh.position.z = c.baseZ;
        } else {
          const kick = t < 0.14 ? t / 0.14 : Math.max(0, 1 - (t - 0.14) / 1.06);
          if (c.side === 'stern') {
            c.mesh.position.z = c.baseZ + kick * 0.45;
          } else {
            const dir = c.side === 'starboard' ? -1 : 1;
            c.mesh.position.x = c.baseX + dir * kick * 0.42;
          }
        }
      }
    });

    // Update smoke puffs
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const p = this.smokePuffs[i];
      p.age += dt;
      if (p.age > 1.6) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.smokePuffs.splice(i, 1);
      } else {
        const progress = p.age / 1.6;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.scale.setScalar(1 + progress * 3.2);
        p.mesh.material.opacity = 0.65 * (1 - progress);
      }
    }
  }

  _spawnSmoke(c) {
    if (!this.group) return;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.65,
    });
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), mat);
    const dirX = c.side === 'starboard' ? 1 : c.side === 'port' ? -1 : 0;
    const dirZ = c.side === 'stern' ? -1 : 0;
    puff.position.set(
      c.mesh.position.x + dirX * 0.9,
      c.mesh.position.y + 0.35,
      c.mesh.position.z + dirZ * 0.9
    );
    this.group.add(puff);
    this.smokePuffs.push({
      mesh: puff,
      age: 0,
      vel: new THREE.Vector3(dirX * 2.2, 0.9, dirZ * 2.2),
    });
  }
}
