import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

export class WeaponGenerator {
  constructor(c, m, l) { this.h = c.hull; this.materials = m; this.lines = l; this.cannons = []; this.smokePuffs = []; }
  generate() {
    const g = new THREE.Group(); g.name = 'WeaponsAssembly'; this.cannons = []; this.smokePuffs = [];
    const bronze = this.materials.get('agedIron'), oak = this.materials.get('weatheredOak'), dark = this.materials.get('darkTimber');
    const n = this.h.gunportsPerSide;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < n; i++) {
        const u = CoordinateSystem.lerp(0.47, 0.72, i / Math.max(1, n - 1));
        const z = CoordinateSystem.stationToZ(u, this.h.length);
        const hx = Math.abs(this.lines.getHullPoint(u, 0.78, 1).x);
        const gunX = side * (hx - 0.68);
        const deckHW = Math.abs(this.lines.getHullPoint(u, 0.78, 1).x) * 0.96;
        const xt = Math.min(1, Math.abs(gunX) / Math.max(0.5, deckHW));
        const camberY = (1 - xt * xt) * 0.14;
        const y = this.lines.getSheerY(u) + camberY + 0.01;
        const c = this._gun(bronze, oak, dark, 0.90);
        c.position.set(gunX, y, z); c.rotation.y = side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5; g.add(c);
        this.cannons.push({ mesh: c, side: side === 1 ? 'starboard' : 'port', baseX: c.position.x, baseZ: c.position.z, recoilTimer: -1, delay: i * 0.07 });
      }
      // Lower Gun-Deck Tier (7 cannons per side protruding from lower gunports)
      const lowerCount = 7;
      for (let j = 0; j < lowerCount; j++) {
        const lu = CoordinateSystem.lerp(0.24, 0.78, j / (lowerCount - 1));
        const lz = CoordinateSystem.stationToZ(lu, this.h.length);
        const stepUp = (j === 0) ? 0.52 : (j === 1) ? 0.44 : (j === lowerCount - 1) ? 0.48 : 0.0;
        const portY = 0.80 + (0.5 - lu) * 0.24 + stepUp;
        const kRab = this.lines.getKeelBottomY(lu) + this.h.keelThickness;
        const lv = CoordinateSystem.clamp01((portY - kRab) / Math.max(0.5, this.lines.getBulwarkTopY(lu) - kRab));
        const lhx = Math.abs(this.lines.getHullPoint(lu, lv, 1).x);
        const lc = this._gun(bronze, oak, dark, 0.92);
        lc.position.set(side * (lhx - 0.56), portY - 0.34, lz);
        lc.rotation.y = side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;
        g.add(lc);
        this.cannons.push({ mesh: lc, side: side === 1 ? 'starboard' : 'port', baseX: lc.position.x, baseZ: lc.position.z, recoilTimer: -1, delay: j * 0.06 + 0.03 });
      }
      [0.26, 0.36].forEach((u, idx) => {
        const z = CoordinateSystem.stationToZ(u, this.h.length), y = this.lines.getQuarterDeckY(u) + 0.14;
        const hx = Math.abs(this.lines.getCastleWallX(u, y, 1));
        const c = this._gun(bronze, oak, dark, 0.76);
        c.position.set(side * (hx - 0.58), y, z); c.rotation.y = side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5; g.add(c);
        this.cannons.push({ mesh: c, side: side === 1 ? 'starboard' : 'port', baseX: c.position.x, baseZ: c.position.z, recoilTimer: -1, delay: idx * 0.09 + 0.04 });
      });
    });
    // Forecastle deck cleared for the centerline Siege Mortar
    // 2 Lower Bow Chasers aligned along exact bow hull normal at u = 0.935
    const bu = 0.915;
    const bowPortY = this.lines.getSheerY(1.0) - 0.86;
    const bKRab = this.lines.getKeelBottomY(bu) + this.h.keelThickness;
    const bv = CoordinateSystem.clamp01((bowPortY - bKRab) / Math.max(0.5, this.lines.getBulwarkTopY(bu) - bKRab));
    [-1, 1].forEach((side, idx) => {
      const bPt = this.lines.getHullPoint(bu, bv, side);
      const pA = this.lines.getHullPoint(bu - 0.02, bv, side);
      const pF = this.lines.getHullPoint(Math.min(1, bu + 0.02), bv, side);
      const yaw = Math.atan2(pF.x - pA.x, pF.z - pA.z);
      const outAngle = yaw + (side === 1 ? Math.PI * 0.5 : -Math.PI * 0.5);
      const lbY = bPt.y - 0.28;
      const bx = bPt.x - Math.sin(outAngle) * 0.46;
      const bz = bPt.z - Math.cos(outAngle) * 0.46;
      const lbc = this._gun(bronze, oak, dark, 0.80);
      lbc.position.set(bx, lbY, bz);
      lbc.rotation.y = outAngle;
      g.add(lbc);
      this.cannons.push({ mesh: lbc, side: 'bow', baseX: bx, baseZ: bz, recoilTimer: -1, delay: (idx + 2) * 0.09 });
    });

    // 2 Stern Chasers side by side just above the rudder (carriages tucked inboard, muzzles protruding)
    const pSternGun = this.lines.getHullPoint(0, 0.63, 0);
    const sz1 = pSternGun.z + 0.62, sy1 = pSternGun.y - 0.28;
    [-0.64, 0.64].forEach((x, idx) => {
      const ch = this._gun(bronze, oak, dark, 0.84);
      ch.position.set(x, sy1, sz1);
      ch.rotation.y = Math.PI;
      g.add(ch);
      this.cannons.push({ mesh: ch, side: 'stern', baseX: x, baseZ: sz1, recoilTimer: -1, delay: idx * 0.08 });
    });
    this.group = g; return g;
  }
  _gun(barrelMat, oakMat, darkMat, sc) {
    const gun = new THREE.Group();
    // Stepped 2-cheek naval carriage + front/rear axletrees + 4 truck wheels
    [-0.14, 0.14].forEach((cx) => {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.82), oakMat);
      cheek.position.set(cx, 0.20, 0); gun.add(cheek);
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.42), oakMat);
      step.position.set(cx, 0.32, 0.18); gun.add(step);
    });
    const transom = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.16), darkMat);
    transom.position.set(0, 0.20, 0.26); gun.add(transom);
    [[-0.20, -0.26], [0.20, -0.26], [-0.20, 0.26], [0.20, 0.26]].forEach(([wx, wz]) => {
      const whl = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 10), darkMat);
      whl.rotation.z = Math.PI * 0.5; whl.position.set(wx, 0.10, wz); gun.add(whl);
    });
    // LatheGeometry bronze demi-culverin barrel (cascabel -> breech ring -> reinforces -> chase -> muzzle swell)
    const pts = [
      new THREE.Vector2(0.01, -0.58), new THREE.Vector2(0.045, -0.54), new THREE.Vector2(0.03, -0.49),
      new THREE.Vector2(0.115, -0.46), new THREE.Vector2(0.128, -0.43), new THREE.Vector2(0.108, -0.40),
      new THREE.Vector2(0.102, -0.05), new THREE.Vector2(0.112, -0.03), new THREE.Vector2(0.092, -0.01),
      new THREE.Vector2(0.072, 0.62), new THREE.Vector2(0.096, 0.70), new THREE.Vector2(0.078, 0.74),
      new THREE.Vector2(0.042, 0.74), new THREE.Vector2(0.042, 0.55)
    ];
    const barGeo = new THREE.LatheGeometry(pts, 12);
    barGeo.rotateX(Math.PI * 0.5);
    const bar = new THREE.Mesh(barGeo, barrelMat);
    bar.position.set(0, 0.38, 0.18); bar.castShadow = true; gun.add(bar);
    // Side trunnions
    const trun = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 8), barrelMat);
    trun.rotation.z = Math.PI * 0.5; trun.position.set(0, 0.36, 0.14); gun.add(trun);
    gun.scale.setScalar(sc); return gun;
  }
  triggerBroadside(side = 'both') {
    this.cannons.forEach((c) => {
      if ((side === 'both' && (c.side === 'port' || c.side === 'starboard')) || c.side === side) c.recoilTimer = -c.delay;
    });
  }
  update(dt) {
    this.cannons.forEach((c) => {
      if (c.recoilTimer === -1) return;
      const prev = c.recoilTimer; c.recoilTimer += dt;
      if (prev < 0 && c.recoilTimer >= 0 && this.group) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 });
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), mat);
        const dx = c.side === 'starboard' ? 1 : c.side === 'port' ? -1 : 0, dz = c.side === 'stern' ? -1 : c.side === 'bow' ? 1 : 0;
        puff.position.set(c.mesh.position.x + dx * 0.9, c.mesh.position.y + 0.35, c.mesh.position.z + dz * 0.9);
        this.group.add(puff);
        this.smokePuffs.push({ mesh: puff, age: 0, vel: new THREE.Vector3(dx * 2.2, 0.9, dz * 2.2) });
      }
      if (c.recoilTimer >= 0) {
        const t = c.recoilTimer;
        if (t > 1.2) { c.recoilTimer = -1; c.mesh.position.x = c.baseX; c.mesh.position.z = c.baseZ; }
        else {
          const kick = t < 0.14 ? t / 0.14 : Math.max(0, 1 - (t - 0.14) / 1.06);
          if (c.side === 'stern') c.mesh.position.z = c.baseZ + kick * 0.45;
          else if (c.side === 'bow') c.mesh.position.z = c.baseZ - kick * 0.45;
          else c.mesh.position.x = c.baseX + (c.side === 'starboard' ? -1 : 1) * kick * 0.42;
        }
      }
    });
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const p = this.smokePuffs[i]; p.age += dt;
      if (p.age > 1.5) { this.group.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); this.smokePuffs.splice(i, 1); }
      else { const pr = p.age / 1.5; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.scale.setScalar(1 + pr * 3); p.mesh.material.opacity = 0.65 * (1 - pr); }
    }
  }
}
