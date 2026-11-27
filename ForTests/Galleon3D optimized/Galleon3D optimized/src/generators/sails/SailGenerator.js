import * as THREE from 'three';

export class SailGenerator {
  constructor(c, m, l, a) {
    this.config = c; this.materials = m; this.anchors = a || {};
    this.morphSails = [];
    this.furledBundles = [];
    this.lateenMesh = null;
    this.currentDeploy = this._targetForMode(c.sails.deployment);
    this.targetDeploy = this.currentDeploy;
  }
  _targetForMode(mode) {
    if (mode === 'full') return 1.0;
    if (mode === 'half') return 0.52;
    if (mode === 'battle') return 0.42;
    if (mode === 'furled' || mode === 'none') return 0.0;
    return 1.0;
  }
  setMode(mode) {
    this.config.sails.deployment = mode;
    this.targetDeploy = this._targetForMode(mode);
  }
  generate() {
    const g = new THREE.Group(); g.name = 'SailsAssembly';
    this.morphSails = []; this.furledBundles = []; this.lateenMesh = null;
    const sailMat = this.materials.get('sailCanvas'), darkMat = this.materials.get('darkTimber');

    ['fore', 'main', 'mizzen'].forEach((k) => {
      const md = this.anchors[k]; if (!md || !md.yards) return;
      md.yards.forEach((yard) => {
        if (yard.isLateen) {
          const lm = this._lateen(yard.span * 0.85, yard.drop, sailMat);
          yard.pivotGroup.add(lm);
          this.lateenMesh = lm;
          const fb = this._furled(yard.span * 0.82, sailMat, darkMat);
          fb.rotation.z = Math.PI * 0.5;
          fb.rotation.x = -Math.PI * 0.28;
          yard.pivotGroup.add(fb);
          this.furledBundles.push({ mesh: fb, isLateen: true });
        } else {
          const sq = this._createMorphSquare(yard.span * 0.88, yard.drop, sailMat);
          yard.pivotGroup.add(sq.mesh);
          this.morphSails.push({ ...sq, isTopsail: yard.name.includes('Top') });
          const fb = this._furled(yard.span * 0.86, sailMat, darkMat);
          yard.pivotGroup.add(fb);
          this.furledBundles.push({ mesh: fb, isLateen: false });
        }
      });
    });

    if (this.anchors.bowsprit && this.anchors.bowsprit.yardPivotGroup) {
      const sp = this._createMorphSquare(this.anchors.bowsprit.yardHalfSpan * 1.75, 1.95, sailMat);
      this.anchors.bowsprit.yardPivotGroup.add(sp.mesh);
      this.morphSails.push({ ...sp, isTopsail: false, isSprit: true });
      const fb = this._furled(this.anchors.bowsprit.yardHalfSpan * 1.7, sailMat, darkMat);
      this.anchors.bowsprit.yardPivotGroup.add(fb);
      this.furledBundles.push({ mesh: fb, isLateen: false });
    }

    this.update(0.016, 0);
    return g;
  }
  _createMorphSquare(w, h, mat) {
    const segX = 16, segY = 12;
    const geo = new THREE.PlaneGeometry(w, h, segX, segY);
    const basePos = geo.attributes.position.array.slice();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return { mesh, geo, basePos, width: w, height: h };
  }
  _lateen(len, drop, mat) {
    // Subdivided curved triangular lateen sail with head aligned along the angled yard (PI * 0.28)
    const segU = 12, segV = 10;
    const pos = [], uvs = [], idx = [];
    const yardAng = -Math.PI * 0.28;
    const dirY = new THREE.Vector3(0, Math.cos(yardAng), Math.sin(yardAng));
    const headStart = dirY.clone().multiplyScalar(-len * 0.42); // forward/lower tack
    const headEnd = dirY.clone().multiplyScalar(len * 0.46);    // aft/upper peak
    const clew = new THREE.Vector3(0, headStart.y + 0.15, -len * 0.34); // horizontal foot clearing poop & lantern

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      const topPt = headStart.clone().lerp(headEnd, u);
      for (let iv = 0; iv <= segV; iv++) {
        const v = iv / segV; // 0 = along yard, 1 = toward clew/foot
        const footPt = topPt.clone().lerp(clew, v);
        // Smooth wind belly perpendicular to sail plane
        const belly = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.65;
        footPt.x += belly;
        pos.push(footPt.x, footPt.y, footPt.z);
        uvs.push(u, v);
      }
    }
    const row = segV + 1;
    for (let iu = 0; iu < segU; iu++) {
      for (let iv = 0; iv < segV; iv++) {
        const a = iu * row + iv, b = (iu + 1) * row + iv, c = (iu + 1) * row + iv + 1, d = iu * row + iv + 1;
        idx.push(a, b, c, a, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m;
  }
  _furled(w, sailMat, darkMat) {
    const fg = new THREE.Group();
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, w, 8), sailMat);
    r.rotation.z = Math.PI * 0.5; r.position.y = -0.15; fg.add(r);
    for (let i = -3; i <= 3; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 5, 8), darkMat);
      t.rotation.y = Math.PI * 0.5; t.position.set((i / 3.5) * (w * 0.45), -0.15, 0); fg.add(t);
    }
    return fg;
  }
  update(dt, elapsed, windStrength = 0.78) {
    // Smoothly animate sail deployment (furling / unfurling)
    this.currentDeploy += (this.targetDeploy - this.currentDeploy) * Math.min(1, dt * 3.8);
    const mode = this.config.sails.deployment;
    const isNone = mode === 'none';

    this.furledBundles.forEach((fb) => {
      fb.mesh.visible = !isNone && this.currentDeploy < 0.22;
      if (fb.mesh.visible) {
        const sc = 1.0 - this.currentDeploy * 2.5;
        fb.mesh.scale.set(1, Math.max(0.3, sc), Math.max(0.3, sc));
      }
    });

    if (this.lateenMesh) {
      this.lateenMesh.visible = !isNone && this.currentDeploy > 0.15;
      this.lateenMesh.scale.setScalar(Math.max(0.1, this.currentDeploy));
    }

    const billowAmp = this.config.sails.billow * (0.45 + 0.55 * windStrength);
    this.morphSails.forEach((s) => {
      s.mesh.visible = !isNone && this.currentDeploy > 0.06;
      if (!s.mesh.visible) return;

      // Battle mode: topsails stay fuller than courses
      let d = this.currentDeploy;
      if (mode === 'battle' && s.isTopsail) d = Math.max(d, 0.82);

      const pos = s.geo.attributes.position;
      const h = s.height, w = s.width;
      // Scalloped festoon gather when partially reefed (d in 0.2..0.85)
      const reefFactor = Math.sin(Math.min(1, Math.max(0, d)) * Math.PI);

      for (let i = 0; i < pos.count; i++) {
        const bx = s.basePos[i * 3];
        const by = s.basePos[i * 3 + 1];
        const nx = bx / (w * 0.5); // -1..1
        const nyFromHead = 1.0 - (by + h * 0.5) / h; // 0 at yardarm head, 1 at foot

        // Graceful scalloped festoons (3 lobes gathered up by buntlines!)
        const festoon = Math.abs(Math.sin(nx * Math.PI * 1.5)) * 0.28 * reefFactor;
        const dropFactor = Math.max(0.04, d - festoon * nyFromHead);
        const yNew = -nyFromHead * h * dropFactor;

        // Taper width slightly toward head + inward pinch when clewed up
        const pinch = 1.0 - (1.0 - d) * 0.16 * nyFromHead;
        const xNew = bx * (1.0 - (1.0 - nyFromHead) * 0.08) * pinch;

        // Dynamic wind billow + gentle breathing
        const breathe = 1.0 + Math.sin(elapsed * 2.1 + nx * 1.4) * 0.06;
        const localBillow = billowAmp * Math.min(1.0, h / 4.2);
        const zNew = Math.cos(nx * Math.PI * 0.5) * Math.sin(nyFromHead * Math.PI) * localBillow * d * breathe;

        pos.setXYZ(i, xNew, yNew, zNew);
      }
      pos.needsUpdate = true;
      s.geo.computeVertexNormals();
    });
  }
}
