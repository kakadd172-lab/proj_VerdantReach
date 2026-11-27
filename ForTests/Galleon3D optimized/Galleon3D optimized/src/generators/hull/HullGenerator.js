import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

export class HullGenerator {
  constructor(c, m, l) { this.h = c.hull; this.materials = m; this.lines = l; }
  generate() {
    const g = new THREE.Group(); g.name = 'HullAssembly';
    const darkMat = this.materials.get('darkTimber'), oakMat = this.materials.get('weatheredOak'),
          tarMat = this.materials.get('tarredHull'), goldMat = this.materials.get('goldLeaf'),
          crimsonMat = this.materials.get('crimsonTrim');

    // Keel curving smoothly into the bow forefoot (continuous transition into the cutwater knee)
    const keelPts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const kz = CoordinateSystem.stationToZ(u, this.h.length) + this.lines.getSternZOffset(u, 0) + this.lines.getBowZOffset(u, 0);
      keelPts.push(new THREE.Vector3(0, this.lines.getKeelBottomY(u) + this.h.keelThickness * 0.5, kz));
    }
    for (let iv = 1; iv <= 4; iv++) {
      const pStem = this.lines.getHullPoint(1.0, (iv / 4) * 0.42, 0);
      keelPts.push(new THREE.Vector3(0, pStem.y, pStem.z + 0.04));
    }
    const bkM = this.lines.getBeakheadMetrics();
    const bowZ = bkM.bowStem.z, bowSheerY = this.lines.getSheerY(1);
    const keel = new THREE.Mesh(GeometryHelpers.createCurvedTimber(keelPts, this.h.keelWidth, this.h.keelThickness, 34), darkMat);
    keel.castShadow = true; g.add(keel);

    // Raked Sternpost tucked inside the stern cutout (v = 0 -> v = 0.46 helmport)
    const pHeel = this.lines.getHullPoint(0, 0.0, 0);
    const pHelm = this.lines.getHullPoint(0, 0.48, 0);
    g.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber([
      new THREE.Vector3(0, pHeel.y - 0.15, pHeel.z - 0.05),
      new THREE.Vector3(0, (pHeel.y + pHelm.y) * 0.5, (pHeel.z + pHelm.z) * 0.5 - 0.05),
      new THREE.Vector3(0, pHelm.y, pHelm.z - 0.05)
    ], this.h.keelWidth * 1.15, this.h.keelThickness * 1.1, 10), darkMat));

    // Lofted Solid Watertight Hull (upper strake stops cleanly at forecastle bulkhead fcFrontU so no sharp nose protrudes)
    [-1, 1].forEach((side) => {
      g.add(this._loft(side, 0, 0.34, 44, 8, tarMat, 0, 1.0));
      g.add(this._loft(side, 0.34, 0.72, 44, 14, oakMat, 0, 1.0));
      g.add(this._loft(side, 0.72, 1.0, 40, 10, oakMat, 0, bkM.fcFrontU));
      [0.42, 0.54, 0.72, 0.98].forEach((v, idx) => {
        const uEnd = v > 0.75 ? bkM.fcFrontU : 1.0;
        const pts = [];
        for (let i = 0; i <= 28; i++) {
          const p = this.lines.getHullPoint((i / 28) * uEnd, v, side); p.x += side * 0.045; pts.push(p);
        }
        g.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(pts, idx < 2 ? 0.14 : 0.1, idx < 2 ? 0.14 : 0.1, 30), darkMat));
      });
      const trimPts = [];
      for (let i = 0; i <= 26; i++) { const p = this.lines.getHullPoint((i / 26) * bkM.fcFrontU, 0.86, side); p.x += side * 0.04; trimPts.push(p); }
      g.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(trimPts, 0.055, 0.06, 26), goldMat));
    });

    // Lower Stern Transom Counter (closes the aft hull below the E R crest)
    g.add(this._buildLowerTransom(oakMat, darkMat));

    // Beakhead (Galion): watertight bow lid, continuous sweeping cutwater, and headrails flowing out of the 3D bulkhead
    const { fcFrontU, p72, p86, p100, bowPt0, bkLen, baseY, tipZ, tipY } = bkM;

    // 0. Watertight bow lid sealing the lower hull (v = 0.72) from fcFrontU to u = 1.0 so no water is visible
    {
      const lidPos = [], lidUvs = [], lidIdx = [];
      const lSegs = 8;
      for (let i = 0; i <= lSegs; i++) {
        const lu = CoordinateSystem.lerp(fcFrontU, 1.0, i / lSegs);
        const pL = this.lines.getHullPoint(lu, 0.72, -1);
        const pR = this.lines.getHullPoint(lu, 0.72, 1);
        lidPos.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
        lidUvs.push(0, i / lSegs, 1, i / lSegs);
      }
      for (let i = 0; i < lSegs; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2;
        lidIdx.push(a, c, b, a, d, c);
      }
      const lidGeo = new THREE.BufferGeometry();
      lidGeo.setAttribute('position', new THREE.Float32BufferAttribute(lidPos, 3));
      lidGeo.setAttribute('uv', new THREE.Float32BufferAttribute(lidUvs, 2));
      lidGeo.setIndex(lidIdx); lidGeo.computeVertexNormals();
      const lidMesh = new THREE.Mesh(lidGeo, darkMat);
      lidMesh.receiveShadow = true; g.add(lidMesh);
    }

    // 1. Single continuous sweeping stem + cutwater knee from keel forefoot (u=1,v=0) up to figurehead tip
    const kOrigY = bowPt0.y - 0.08, kOrigZ = bowPt0.z;
    const tipX = tipZ - kOrigZ, tipRelY = tipY - kOrigY;
    const fcRelZ = p72.z - kOrigZ, baseRelY = p72.y - kOrigY;
    const kneeShape = new THREE.Shape();
    kneeShape.moveTo(-0.30, -0.04);
    kneeShape.bezierCurveTo(1.25, 0.30, tipX * 0.62, tipRelY * 0.46, tipX, tipRelY - 0.08);
    kneeShape.lineTo(tipX - 0.14, tipRelY + 0.18);
    kneeShape.quadraticCurveTo(fcRelZ + (tipX - fcRelZ) * 0.45, baseRelY + 0.16, fcRelZ - 0.15, baseRelY + 0.24);
    kneeShape.lineTo(0.20, 0.90);
    kneeShape.closePath();
    const kneeGeo = new THREE.ExtrudeGeometry(kneeShape, { depth: 0.24, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    kneeGeo.rotateY(-Math.PI * 0.5);
    kneeGeo.translate(0.12, kOrigY, kOrigZ);
    const kneeMesh = new THREE.Mesh(kneeGeo, darkMat);
    kneeMesh.castShadow = true; g.add(kneeMesh);

    // 2. Sharp-forward V-grating deck tucked cleanly inside the headrails
    const deckSpan = tipZ - p72.z;
    const bkShape = new THREE.Shape();
    bkShape.moveTo(-0.72, 0); bkShape.lineTo(0.72, 0);
    bkShape.lineTo(0.10, deckSpan * 0.78); bkShape.lineTo(-0.10, deckSpan * 0.78);
    bkShape.closePath();
    const bkGeo = new THREE.ExtrudeGeometry(bkShape, { depth: 0.06, bevelEnabled: false });
    bkGeo.rotateX(Math.PI * 0.5);
    const bkDeck = new THREE.Mesh(bkGeo, oakMat);
    bkDeck.position.set(0, p72.y + 0.14, p72.z - 0.04);
    bkDeck.rotation.x = -0.17; g.add(bkDeck);

    // 3. Headrails starting flush at the exact 3D bulkhead corners & hull wales, curving naturally forward
    [-1, 1].forEach((side) => {
      const rails = [
        { p0: new THREE.Vector3(side * p100.x, p100.y, p100.z), y1: tipY + 0.20, x1: 0.15, mat: goldMat, r: 0.075 },
        { p0: new THREE.Vector3(side * p86.x, p86.y, p86.z), y1: tipY - 0.02, x1: 0.14, mat: darkMat, r: 0.06 },
        { p0: new THREE.Vector3(side * p72.x, p72.y + 0.02, p72.z), y1: tipY - 0.24, x1: 0.13, mat: goldMat, r: 0.06 },
      ];
      const railCurves = rails.map((rl) => {
        const p0 = rl.p0;
        const span = tipZ - p0.z;
        const pA = new THREE.Vector3(side * Math.abs(p0.x) * 0.62, p0.y - 0.16, p0.z + span * 0.18);
        const pm = new THREE.Vector3(side * Math.abs(p0.x) * 0.30, Math.min(p0.y, rl.y1) - 0.16, p0.z + span * 0.56);
        const p1 = new THREE.Vector3(side * rl.x1, rl.y1, tipZ - 0.06);
        const curve = new THREE.CatmullRomCurve3([p0, pA, pm, p1]);
        g.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber([p0, pA, pm, p1], rl.r, rl.r, 16), rl.mat));
        return curve;
      });
      for (let st = 1; st <= 5; st++) {
        const t = st / 6;
        const pTop = railCurves[0].getPointAt(t);
        const pBot = railCurves[2].getPointAt(t);
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, pTop.distanceTo(pBot), 0.05), darkMat);
        rib.position.copy(pTop).lerp(pBot, 0.5);
        rib.rotation.x = 0.22; g.add(rib);
      }
    });

    // Figurehead is now built by dedicated FigureheadGenerator

    // Flush, hull-following waist & lower-deck gunports (deeper frames + tangent yaw = zero gaps!)
    const makeSidePort = (u, targetY, side, hSize, wSize) => {
      const kRab = this.lines.getKeelBottomY(u) + this.h.keelThickness;
      const v = CoordinateSystem.clamp01((targetY - kRab) / Math.max(0.5, this.lines.getBulwarkTopY(u) - kRab));
      const pt = this.lines.getHullPoint(u, v, side);
      const pA = this.lines.getHullPoint(Math.max(0, u - 0.02), v, side);
      const pF = this.lines.getHullPoint(Math.min(1, u + 0.02), v, side);
      const yaw = Math.atan2(pF.x - pA.x, pF.z - pA.z);
      const port = new THREE.Group();
      port.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, hSize, wSize), darkMat));
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.06, hSize * 0.90, wSize * 0.90), crimsonMat);
      lid.position.set(side * 0.24, hSize * 0.56, 0); lid.rotation.z = side * -0.95; port.add(lid);
      port.position.set(pt.x - side * 0.04, pt.y, pt.z);
      port.rotation.y = yaw;
      g.add(port);
    };

    const gpCount = this.h.gunportsPerSide;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < gpCount; i++) {
        const u = CoordinateSystem.lerp(0.47, 0.72, i / Math.max(1, gpCount - 1));
        makeSidePort(u, this.lines.getSheerY(u) + 0.36, side, 0.46, 0.48);
      }
      const lowerCount = 7;
      for (let j = 0; j < lowerCount; j++) {
        const lu = CoordinateSystem.lerp(0.24, 0.78, j / (lowerCount - 1));
        const stepUp = (j === 0) ? 0.52 : (j === 1) ? 0.44 : (j === lowerCount - 1) ? 0.48 : 0.0;
        makeSidePort(lu, 0.80 + (0.5 - lu) * 0.24 + stepUp, side, 0.44, 0.46);
      }
    });

    // 2 Lower Bow Chaser Gunports using exact hull-tangent orientation at u = 0.935
    const bowPortY = bowSheerY - 0.86;
    const bu = 0.915;
    const bKRab = this.lines.getKeelBottomY(bu) + this.h.keelThickness;
    const bv = CoordinateSystem.clamp01((bowPortY - bKRab) / Math.max(0.5, this.lines.getBulwarkTopY(bu) - bKRab));
    [-1, 1].forEach((side) => {
      const bPt = this.lines.getHullPoint(bu, bv, side);
      const pA = this.lines.getHullPoint(bu - 0.02, bv, side);
      const pF = this.lines.getHullPoint(Math.min(1, bu + 0.02), bv, side);
      const yaw = Math.atan2(pF.x - pA.x, pF.z - pA.z);
      const bGroup = new THREE.Group();
      bGroup.position.set(bPt.x - side * 0.03, bPt.y, bPt.z);
      bGroup.rotation.y = yaw;
      bGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.40, 0.42), darkMat));
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.38), crimsonMat);
      bl.position.set(side * 0.22, 0.24, 0);
      bl.rotation.z = side * -0.95;
      bGroup.add(bl);
      g.add(bGroup);
    });
    return g;
  }
  _buildLowerTransom(oakMat, darkMat) {
    const pos = [], uvs = [], idx = [];
    const vs = [];
    for (let i = 0; i < 8; i++) vs.push(CoordinateSystem.lerp(0, 0.34, i / 8));
    for (let i = 0; i <= 24; i++) vs.push(CoordinateSystem.lerp(0.34, 1.0, i / 24));
    for (let iv = 0; iv < vs.length; iv++) {
      const v = vs[iv];
      const pL = this.lines.getHullPoint(0, v, -1);
      const pR = this.lines.getHullPoint(0, v, 1);
      pos.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
      uvs.push(0, v, 1, v);
    }
    for (let iv = 0; iv < vs.length - 1; iv++) {
      const a = iv * 2, b = iv * 2 + 1, c = (iv + 1) * 2 + 1, d = (iv + 1) * 2;
      idx.push(a, c, b, a, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, oakMat); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  _loft(side, v0, v1, uSegs, vSegs, mat, uMin = 0, uMax = 1) {
    const pos = [], uvs = [], idx = [];
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = CoordinateSystem.lerp(uMin, uMax, iu / uSegs);
      for (let iv = 0; iv <= vSegs; iv++) {
        const p = this.lines.getHullPoint(u, CoordinateSystem.lerp(v0, v1, iv / vSegs), side);
        pos.push(p.x, p.y, p.z); uvs.push(u * 6, (iv / vSegs) * 2);
      }
    }
    const row = vSegs + 1;
    for (let iu = 0; iu < uSegs; iu++) for (let iv = 0; iv < vSegs; iv++) {
      const a = iu * row + iv, b = (iu + 1) * row + iv, c = (iu + 1) * row + iv + 1, d = iu * row + iv + 1;
      // Outward-facing winding: +Z forward, +Y up, +X starboard
      if (side === 1) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
}
