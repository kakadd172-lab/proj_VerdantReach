import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

export class MortarGenerator {
  constructor(c, m, l) {
    this.h = c.hull; this.materials = m; this.lines = l;
    this.group = null; this.mortarPivot = null; this.carriage = null;
    this.frontWindlass = null; this.elevChains = [];
    this.recoilTimer = -1; this.shells = []; this.smokePuffs = [];
    this.baseZ = 0; this.elevDeg = 45; this.elevRad = THREE.MathUtils.degToRad(45);
    this.rotX = Math.PI * 0.5 - this.elevRad;
  }
  generate() {
    const g = new THREE.Group(); g.name = 'MortarAssembly';
    const iron = this.materials.get('agedIron'), gold = this.materials.get('goldLeaf'),
          oak = this.materials.get('weatheredOak'), dark = this.materials.get('darkTimber'),
          rope = this.materials.get('hempRope'), boreMat = new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.9, metalness: 0.2 });

    const carriage = new THREE.Group();
    const sc = 0.52;

    // 1. Heavy Oak Bed Platform + Riveted Iron Perimeter Straps
    const bedW = 1.08, bedH = 0.14, bedL = 1.56;
    const bed = new THREE.Mesh(new THREE.BoxGeometry(bedW, bedH, bedL), oak);
    bed.position.y = 0.26; bed.castShadow = true; bed.receiveShadow = true; carriage.add(bed);
    const fStrap = new THREE.Mesh(new THREE.BoxGeometry(bedW + 0.03, bedH + 0.02, 0.06), iron);
    fStrap.position.set(0, 0.26, bedL * 0.5 - 0.01); carriage.add(fStrap);
    const bStrap = new THREE.Mesh(new THREE.BoxGeometry(bedW + 0.03, bedH + 0.02, 0.06), iron);
    bStrap.position.set(0, 0.26, -bedL * 0.5 + 0.01); carriage.add(bStrap);
    [-1, 1].forEach((side) => {
      const sStrap = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, bedL + 0.02), iron);
      sStrap.position.set(side * (bedW * 0.5 + 0.005), 0.25, 0); carriage.add(sStrap);
    });

    // 2. Four Stout Iron-Rimmed Oak Truck Wheels + Axles
    [-0.48, 0.48].forEach((az) => {
      const axle = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.10, 0.10), dark);
      axle.position.set(0, 0.20, az); carriage.add(axle);
      [-0.64, 0.64].forEach((wx) => {
        const whl = new THREE.Group();
        const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.13, 14), oak);
        wood.rotation.z = Math.PI * 0.5; wood.castShadow = true; whl.add(wood);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.11, 14, 1, true), iron);
        tire.rotation.z = Math.PI * 0.5; whl.add(tire);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.17, 10), dark);
        hub.rotation.z = Math.PI * 0.5; whl.add(hub);
        whl.position.set(wx, 0.21, az); carriage.add(whl);
      });
    });

    // 3. Stepped Curved Oak Side Cheeks + Iron Straps, Cap-Squares & Mooring Rings
    const cheekShape = new THREE.Shape();
    cheekShape.moveTo(-0.72, 0);
    cheekShape.lineTo(0.72, 0);
    cheekShape.lineTo(0.72, 0.16);
    cheekShape.quadraticCurveTo(0.46, 0.22, 0.26, 0.62);
    cheekShape.lineTo(-0.04, 0.62);
    cheekShape.lineTo(-0.18, 0.48);
    cheekShape.lineTo(-0.42, 0.42);
    cheekShape.quadraticCurveTo(-0.56, 0.22, -0.72, 0.16);
    cheekShape.closePath();
    const cheekGeo = new THREE.ExtrudeGeometry(cheekShape, { depth: 0.13, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 });
    cheekGeo.rotateY(-Math.PI * 0.5);
    cheekGeo.translate(0.065, 0, 0);

    [-1, 1].forEach((side) => {
      const cx = side * 0.40;
      const cheek = new THREE.Mesh(cheekGeo, oak);
      cheek.position.set(cx, 0.33, 0); cheek.castShadow = true; carriage.add(cheek);

      // Vertical iron cheek straps & trunnion cap-square
      [0.14, -0.28].forEach((sz, idx) => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, idx === 0 ? 0.62 : 0.44, 0.065), iron);
        strap.position.set(cx, idx === 0 ? 0.64 : 0.55, sz); carriage.add(strap);
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 10), iron);
      cap.rotation.z = Math.PI * 0.5; cap.position.set(cx, 0.94, 0.11); carriage.add(cap);

      // Diamond bolt plate & iron mooring ring
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.15), iron);
      plate.rotation.x = Math.PI * 0.25; plate.position.set(cx + side * 0.075, 0.64, -0.10); carriage.add(plate);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 10), iron);
      ring.rotation.y = Math.PI * 0.5; ring.position.set(cx + side * 0.095, 0.64, -0.10); carriage.add(ring);
    });

    // Cross transoms
    const frontTransom = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.18), dark);
    frontTransom.position.set(0, 0.42, 0.40); carriage.add(frontTransom);

    // 4. Front & Rear Elevation Windlass Rollers with Collared Hand-Spikes & Rope Wrap
    [0.52, -0.56].forEach((rz, idx) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(0, idx === 0 ? 0.56 : 0.46, rz);
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 1.08, 12), dark);
      roller.rotation.z = Math.PI * 0.5; wGroup.add(roller);
      [-0.54, 0.54].forEach((hx) => {
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.075, 10), iron);
        collar.rotation.z = Math.PI * 0.5; collar.position.x = hx; wGroup.add(collar);
        for (let sp = 0; sp < 4; sp++) {
          const ang = sp * Math.PI * 0.5 + 0.35;
          const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.20, 6), oak);
          spike.position.set(hx, Math.cos(ang) * 0.14, Math.sin(ang) * 0.14);
          spike.rotation.x = ang; wGroup.add(spike);
        }
      });
      if (idx === 0) {
        const ropeWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.28, 12), rope);
        ropeWrap.rotation.z = Math.PI * 0.5; wGroup.add(ropeWrap);
        this.frontWindlass = wGroup;
      }
      carriage.add(wGroup);
    });

    // 5. Heavy Cast-Iron & Brass-Banded Mortar Barrel (pivoting at trunnions)
    const barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, 0.94, 0.11);

    const bPts = [
      new THREE.Vector2(0.01, -0.44),
      new THREE.Vector2(0.07, -0.40),
      new THREE.Vector2(0.04, -0.35),
      new THREE.Vector2(0.24, -0.31),
      new THREE.Vector2(0.26, -0.27),
      new THREE.Vector2(0.23, -0.10),
      new THREE.Vector2(0.32, -0.02),
      new THREE.Vector2(0.32, 0.24),
      new THREE.Vector2(0.34, 0.27),
      new THREE.Vector2(0.30, 0.30),
      new THREE.Vector2(0.30, 0.56),
      new THREE.Vector2(0.38, 0.64),
      new THREE.Vector2(0.35, 0.70),
      new THREE.Vector2(0.23, 0.70),
      new THREE.Vector2(0.22, 0.10),
      new THREE.Vector2(0.01, 0.08),
    ];
    const barGeo = new THREE.LatheGeometry(bPts, 20);
    const barrel = new THREE.Mesh(barGeo, iron);
    barrel.castShadow = true; barrelPivot.add(barrel);

    const borePlug = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.18, 16), boreMat);
    borePlug.position.y = 0.20; barrelPivot.add(borePlug);

    // Two polished brass/gold reinforce bands around muzzle neck and chase
    [0.57, 0.27].forEach((by, idx) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(idx === 0 ? 0.315 : 0.335, 0.024, 8, 22), gold);
      band.rotation.x = Math.PI * 0.5; band.position.y = by; barrelPivot.add(band);
    });

    // Massive cylindrical trunnions + end flanges
    const trun = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 1.02, 12), iron);
    trun.rotation.z = Math.PI * 0.5; barrelPivot.add(trun);

    // Forged iron lifting dolphins on top of the barrel
    [-0.08, 0.08].forEach((dx) => {
      const dol = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI * 1.25), iron);
      dol.rotation.y = Math.PI * 0.5; dol.rotation.z = -0.35;
      dol.position.set(dx, 0.18, 0.31); barrelPivot.add(dol);
    });

    // Cascabel ring at breech
    const breechRing = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 6, 12), iron);
    breechRing.position.set(0, -0.46, 0); barrelPivot.add(breechRing);

    // Dynamic linked iron elevating chains from top of brass muzzle band to front windlass
    this.elevChains = [];
    [-1, 1].forEach((side) => {
      const links = [];
      for (let li = 0; li < 11; li++) {
        const lnk = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 5, 8), iron);
        if (li % 2 === 1) lnk.rotation.y = Math.PI * 0.5;
        carriage.add(lnk);
        links.push(lnk);
      }
      this.elevChains.push({ side, links });
    });

    barrelPivot.rotation.x = this.rotX;
    carriage.add(barrelPivot);
    this.mortarPivot = barrelPivot;
    this._updateChains(this.rotX);

    // Mount cleanly on the open forecastle deck centerline (u = 0.90)
    const mU = 0.89;
    const mZ = CoordinateSystem.stationToZ(mU, this.h.length);
    const mY = this.lines.getForecastleDeckY(mU) + 0.135;
    carriage.scale.setScalar(sc);
    carriage.position.set(0, mY, mZ);
    this.baseZ = mZ;
    this.carriage = carriage;
    g.add(carriage);

    this.group = g;
    return g;
  }
  setElevation(deg) {
    this.elevDeg = THREE.MathUtils.clamp(deg, 25, 70);
    this.elevRad = THREE.MathUtils.degToRad(this.elevDeg);
    this.rotX = Math.PI * 0.5 - this.elevRad;
    if (this.mortarPivot && this.recoilTimer < 0) this.mortarPivot.rotation.x = this.rotX;
    if (this.frontWindlass) this.frontWindlass.rotation.x = (this.elevDeg - 45) * 0.14;
    this._updateChains(this.rotX);
  }
  _updateChains(rotX) {
    if (!this.elevChains.length) return;
    const xAxis = new THREE.Vector3(1, 0, 0);
    const piv = new THREE.Vector3(0, 0.94, 0.11);
    this.elevChains.forEach(({ side, links }) => {
      const lug = new THREE.Vector3(side * 0.14, 0.57, -0.30).applyAxisAngle(xAxis, rotX).add(piv);
      const mid = new THREE.Vector3(side * 0.14, 0.65, 0.42).applyAxisAngle(xAxis, rotX * 0.3).add(new THREE.Vector3(0, 0.42, 0.18));
      const spool = new THREE.Vector3(side * 0.14, 0.62, 0.52);
      const curve = new THREE.QuadraticBezierCurve3(lug, lug.clone().lerp(spool, 0.45).add(new THREE.Vector3(0, 0.10, 0.08)), spool);
      const n = links.length;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const pt = curve.getPoint(t);
        const tan = curve.getTangent(t);
        links[i].position.copy(pt);
        links[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
        if (i % 2 === 1) links[i].rotateY(Math.PI * 0.5);
      }
    });
  }
  triggerMortar() {
    if (this.recoilTimer >= 0) return;
    this.recoilTimer = 0;
    if (!this.group || !this.carriage) return;
    const sc = 0.52;
    const muzLocal = new THREE.Vector3(0, 0.70, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), this.rotX).add(new THREE.Vector3(0, 0.94, 0.11)).multiplyScalar(sc);
    const mPos = this.carriage.position.clone().add(muzLocal);
    // Muzzle smoke plume
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.75 });
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.32 + i * 0.08, 8, 8), mat);
      puff.position.copy(mPos).add(new THREE.Vector3((Math.random() - 0.5) * 0.25, i * 0.16, i * 0.18));
      this.group.add(puff);
      this.smokePuffs.push({ mesh: puff, age: 0, vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.8 + i * 0.4, 2.2 + i * 0.5) });
    }
    // Heavy iron bomb shell on a 45-degree parabolic ballistic arc
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), this.materials.get('agedIron'));
    shell.position.copy(mPos);
    shell.castShadow = true;
    this.group.add(shell);
    const speed = 19.5;
    this.shells.push({
      mesh: shell,
      vel: new THREE.Vector3(0, speed * Math.sin(this.elevRad), speed * Math.cos(this.elevRad)),
      age: 0,
    });
  }
  update(dt) {
    if (this.recoilTimer >= 0 && this.carriage && this.mortarPivot) {
      this.recoilTimer += dt;
      if (this.recoilTimer > 1.35) {
        this.recoilTimer = -1;
        this.carriage.position.z = this.baseZ;
        this.mortarPivot.rotation.x = this.rotX;
        this._updateChains(this.rotX);
      } else {
        const t = this.recoilTimer;
        const kick = t < 0.12 ? t / 0.12 : Math.max(0, 1 - (t - 0.12) / 1.23);
        this.carriage.position.z = this.baseZ - kick * 0.34;
        const rx = this.rotX - kick * 0.12;
        this.mortarPivot.rotation.x = rx;
        this._updateChains(rx);
      }
    }
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.age += dt;
      s.vel.y -= 9.81 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      if (s.mesh.position.y < -0.4 || s.age > 5.0) {
        // Water splash puff
        const spMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.8 });
        const sp = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), spMat);
        sp.position.set(s.mesh.position.x, 0.1, s.mesh.position.z);
        this.group.add(sp);
        this.smokePuffs.push({ mesh: sp, age: 0, vel: new THREE.Vector3(0, 2.2, 0) });
        this.group.remove(s.mesh);
        s.mesh.geometry.dispose();
        this.shells.splice(i, 1);
      }
    }
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const p = this.smokePuffs[i]; p.age += dt;
      if (p.age > 1.8) { this.group.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); this.smokePuffs.splice(i, 1); }
      else { const pr = p.age / 1.8; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.scale.setScalar(1 + pr * 3.2); p.mesh.material.opacity = 0.75 * (1 - pr); }
    }
  }
}
