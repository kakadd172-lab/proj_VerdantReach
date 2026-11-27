import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

export class SuperstructureGenerator {
  constructor(c, m, l) { this.h = c.hull; this.materials = m; this.lines = l; }
  generate() {
    const g = new THREE.Group(); g.name = 'SuperstructureAssembly';
    const oak = this.materials.get('weatheredOak'), dark = this.materials.get('darkTimber'),
          gold = this.materials.get('goldLeaf'), crest = this.materials.get('transomCrest');
    const fc0 = this.lines.getForecastleDeckY(0.77) + 0.135, qd0 = this.lines.getQuarterDeckY(0.43) + 0.135, pp0 = this.lines.getPoopDeckY(0.18) + 0.135;
    const bkM = this.lines.getBeakheadMetrics();
    this._bulkhead(g, 0.77, this.lines.getSheerY(0.77), fc0 - this.lines.getSheerY(0.77), oak, dark);
    this._buildForecastleFrontBulkhead(g, bkM, this.lines.getForecastleDeckY(bkM.fcFrontU) + 0.64, oak, dark);
    const crimMat = this.materials.get('crimsonTrim');
    this._bulkhead(g, 0.43, this.lines.getSheerY(0.43), qd0 - this.lines.getSheerY(0.43), oak, dark);
    this._bulkhead(g, 0.18, this.lines.getQuarterDeckY(0.18) + 0.135, pp0 - (this.lines.getQuarterDeckY(0.18) + 0.135), oak, dark, true, null, true);

    // Solid enclosed oak castle side walls up to deck level + open timber balustrade rails above
    this._buildCastleSideWall(g, 0.77, bkM.fcFrontU, (u) => this.lines.getBulwarkTopY(u) - 0.04, (u) => this.lines.getForecastleDeckY(u) + 0.15, (u) => this.lines.getForecastleDeckY(u) + 0.64, oak, dark, gold);
    this._buildCastleSideWall(g, 0.18, 0.43, (u) => this.lines.getBulwarkTopY(u) - 0.04, (u) => this.lines.getQuarterDeckY(u) + 0.15, (u) => this.lines.getQuarterDeckY(u) + 0.64, oak, dark, gold);
    this._buildCastleSideWall(g, 0.00, 0.18, (u) => this.lines.getBulwarkTopY(u) - 0.04, (u) => this.lines.getPoopDeckY(u) + 0.12, (u) => this.lines.getPoopDeckY(u) + 0.64, oak, dark, gold);

    // Clean flush oak upper stern transom closing the stern cleanly (no windows, corbels, or protruding ledges)
    const pEdge = this.lines.getHullPoint(0, 1.0, 1);
    const sTop = this.lines.getPoopDeckY(0) + 0.64;
    const cabBaseY = pEdge.y;
    const cabH = sTop - cabBaseY;
    const hwBot = Math.abs(pEdge.x);
    const hwTop = Math.abs(this.lines.getCastleWallX(0, sTop, 1));
    const aftRake = -0.22;
    const zTop = pEdge.z + aftRake * Math.max(0, sTop - cabBaseY);

    const tPos = [
      -hwBot, cabBaseY, pEdge.z,
      hwBot, cabBaseY, pEdge.z,
      hwTop, sTop, zTop,
      -hwTop, sTop, zTop,
    ];
    const tUvs = [0, 0, 1, 0, 1, 1, 0, 1];
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
    tGeo.setAttribute('uv', new THREE.Float32BufferAttribute(tUvs, 2));
    tGeo.setIndex([0, 2, 1, 0, 3, 2]);
    tGeo.computeVertexNormals();
    const tMesh = new THREE.Mesh(tGeo, oak);
    tMesh.castShadow = true; tMesh.receiveShadow = true;
    g.add(tMesh);
    this._buildSternGallery(g, oak, dark, gold, this.materials.get('cabinGlass'), crimMat);
    // 2 Stern Chaser Gunports side by side just above the rudder
    const pSternPort = this.lines.getHullPoint(0, 0.63, 0);
    [-0.64, 0.64].forEach((sx) => {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.16), dark);
      sp.position.set(sx, pSternPort.y, pSternPort.z - 0.06); g.add(sp);
      const sl = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.36, 0.06), crimMat);
      sl.position.set(sx, pSternPort.y + 0.25, pSternPort.z - 0.20); sl.rotation.x = -0.9; g.add(sl);
    });
    return g;
  }
  _buildSternGallery(parent, oak, dark, gold, glassMat, crimMat) {
    const u0 = 0.0, u1 = 0.125, aftRake = -0.22;
    const pAft = this.lines.getHullPoint(u0, 0.96, 1);
    const pFwd = this.lines.getHullPoint(u1, 0.96, 1);
    const galH = 1.52, outAft = 0.66, outSide = 0.46;

    const zAftFloor = pAft.z - outAft;
    const zAftRoof = zAftFloor + aftRake * galH;
    const hwAft = Math.abs(pAft.x) + outSide * 0.88;
    const hwFwd = Math.abs(pFwd.x) + outSide * 0.58;
    const yAftFloor = pAft.y + 0.24, yFwdFloor = pFwd.y + 0.28;
    const zFwdFloor = pFwd.z, zFwdRoof = zFwdFloor + aftRake * galH;

    const floorThick = 0.12;
    const buildUStrip = (yA, yF, zA, zF, hwA, hwF, mat, thick) => {
      const pts = [
        [-hwF, yF, zF], [-hwA, yA, zA], [hwA, yA, zA], [hwF, yF, zF],
        [-Math.abs(pFwd.x) * 0.92, yF, zF], [-Math.abs(pAft.x) * 0.92, yA, pAft.z + 0.08],
        [Math.abs(pAft.x) * 0.92, yA, pAft.z + 0.08], [Math.abs(pFwd.x) * 0.92, yF, zF]
      ];
      const pos = [], idx = [];
      pts.forEach((p) => pos.push(p[0], p[1], p[2]));
      pts.forEach((p) => pos.push(p[0], p[1] - thick, p[2]));
      for (let i = 0; i < 3; i++) {
        const a = i, b = i + 1, c = i + 5, d = i + 4;
        idx.push(a, b, c, a, c, d);
        idx.push(8 + a, 8 + c, 8 + b, 8 + a, 8 + d, 8 + c);
        idx.push(a, 8 + a, 8 + b, a, 8 + b, b);
      }
      idx.push(0, 4, 12, 0, 12, 8,  3, 11, 15, 3, 15, 7);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
      return m;
    };
    parent.add(buildUStrip(yAftFloor, yFwdFloor, zAftFloor, zFwdFloor, hwAft, hwFwd, dark, floorThick));
    parent.add(buildUStrip(yAftFloor + 0.03, yFwdFloor + 0.03, zAftFloor - 0.03, zFwdFloor, hwAft + 0.03, hwFwd + 0.03, gold, 0.045));

    parent.add(buildUStrip(yAftFloor + galH + 0.14, yFwdFloor + galH + 0.12, zAftRoof - 0.04, zFwdRoof, hwAft + 0.05, hwFwd + 0.04, dark, 0.14));
    parent.add(buildUStrip(yAftFloor + galH + 0.03, yFwdFloor + galH + 0.01, zAftRoof - 0.06, zFwdRoof, hwAft + 0.06, hwFwd + 0.05, gold, 0.045));

    const corbShape = new THREE.Shape();
    corbShape.moveTo(0, 0);
    corbShape.lineTo(0.36, 0);
    corbShape.bezierCurveTo(0.34, -0.14, 0.18, -0.18, 0.14, -0.34);
    corbShape.lineTo(0.0, -0.38);
    corbShape.closePath();
    const corbGeo = new THREE.ExtrudeGeometry(corbShape, { depth: 0.09, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008 });
    corbGeo.translate(0, 0, -0.045);

    for (let i = 0; i < 5; i++) {
      const cx = CoordinateSystem.lerp(-hwAft * 0.78, hwAft * 0.78, i / 4);
      const corb = new THREE.Mesh(corbGeo, i % 2 === 0 ? gold : dark);
      corb.rotation.y = Math.PI * 0.5;
      corb.position.set(cx, yAftFloor - floorThick + 0.02, pAft.z + 0.04);
      parent.add(corb);
    }
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const t = 0.20 + i * 0.32;
        const cy = CoordinateSystem.lerp(yAftFloor, yFwdFloor, t) - floorThick + 0.02;
        const cz = CoordinateSystem.lerp(pAft.z + 0.12, pFwd.z - 0.12, t);
        const cx = side * CoordinateSystem.lerp(Math.abs(pAft.x), Math.abs(pFwd.x), t) - side * 0.03;
        const corb = new THREE.Mesh(corbGeo, i === 1 ? gold : dark);
        if (side === -1) corb.rotation.y = Math.PI;
        corb.position.set(cx, cy, cz);
        parent.add(corb);
      }
    });

    const makeArchShape = (w, h) => {
      const s = new THREE.Shape();
      const archY = h * 0.18;
      s.moveTo(-w * 0.5, -h * 0.5);
      s.lineTo(w * 0.5, -h * 0.5);
      s.lineTo(w * 0.5, archY);
      s.absarc(0, archY, w * 0.5, 0, Math.PI, false);
      s.lineTo(-w * 0.5, -h * 0.5);
      return s;
    };
    const makeArchedWindow = (w, h) => {
      const wg = new THREE.Group();
      const frameGeo = new THREE.ExtrudeGeometry(makeArchShape(w + 0.08, h + 0.06), { depth: 0.05, bevelEnabled: false });
      frameGeo.translate(0, 0, -0.025);
      wg.add(new THREE.Mesh(frameGeo, dark));

      const paneGeo = new THREE.ExtrudeGeometry(makeArchShape(w * 0.84, h * 0.86), { depth: 0.062, bevelEnabled: false });
      paneGeo.translate(0, 0, -0.031);
      wg.add(new THREE.Mesh(paneGeo, glassMat));

      const trim = new THREE.Mesh(new THREE.TorusGeometry(w * 0.46, 0.018, 6, 14, Math.PI), gold);
      trim.position.set(0, h * 0.18, 0.032); wg.add(trim);

      [[-0.22, 0.72, -0.04], [0, 0.90, 0.02], [0.22, 0.72, -0.04]].forEach(([mx, hFrac, yOff]) => {
        const vbar = new THREE.Mesh(new THREE.BoxGeometry(0.018, h * hFrac, 0.072), dark);
        vbar.position.set(mx * w, h * yOff, 0); wg.add(vbar);
      });
      [-0.22, 0.02, 0.24].forEach((my) => {
        const hbar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.84, 0.018, 0.072), dark);
        hbar.position.set(0, my * h, 0); wg.add(hbar);
      });
      return wg;
    };

    const aftRakeAng = Math.atan2(zAftRoof - zAftFloor, galH);
    const aftWall = new THREE.Mesh(new THREE.BoxGeometry(hwAft * 1.98, galH + 0.06, 0.10), oak);
    aftWall.position.set(0, yAftFloor + galH * 0.5, (zAftFloor + zAftRoof) * 0.5 + 0.05);
    aftWall.rotation.x = aftRakeAng;
    parent.add(aftWall);

    for (let i = 0; i < 4; i++) {
      const wx = CoordinateSystem.lerp(-hwAft * 0.72, hwAft * 0.72, i / 3);
      const win = makeArchedWindow(0.42, 0.90);
      win.position.set(wx, yAftFloor + galH * 0.48, (zAftFloor + zAftRoof) * 0.5 - 0.01);
      win.rotation.x = aftRakeAng;
      parent.add(win);
    }

    // Lofted Quarter-Gallery side walls matching exact floor/roof slope & stern rake
    [-1, 1].forEach((side) => {
      const dx = (hwFwd - hwAft) * side, dz = zFwdFloor - zAftFloor;
      const yaw = Math.atan2(dx, dz);
      const xA = side * hwAft, xF = side * hwFwd, inX = side * -0.08;
      const sPos = [
        xA, yAftFloor, zAftFloor,       xF, yFwdFloor, zFwdFloor,
        xF, yFwdFloor + galH, zFwdRoof, xA, yAftFloor + galH, zAftRoof,
        xA + inX, yAftFloor, zAftFloor, xF + inX, yFwdFloor, zFwdFloor,
        xF + inX, yFwdFloor + galH, zFwdRoof, xA + inX, yAftFloor + galH, zAftRoof,
      ];
      const sIdx = side === 1
        ? [0, 1, 2, 0, 2, 3,  4, 6, 5, 4, 7, 6,  1, 5, 6, 1, 6, 2]
        : [0, 2, 1, 0, 3, 2,  4, 5, 6, 4, 6, 7,  1, 6, 5, 1, 2, 6];
      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
      sGeo.setIndex(sIdx); sGeo.computeVertexNormals();
      const sWall = new THREE.Mesh(sGeo, oak);
      sWall.castShadow = true; sWall.receiveShadow = true;
      parent.add(sWall);

      const p0 = new THREE.Vector3(xA, yAftFloor, zAftFloor);
      const p1 = new THREE.Vector3(xF, yFwdFloor, zFwdFloor);
      const p3 = new THREE.Vector3(xA, yAftFloor + galH, zAftRoof);
      const vFwd = p1.clone().sub(p0);
      const vUp = p3.clone().sub(p0);
      const outN = (side === 1 ? vUp.clone().cross(vFwd) : vFwd.clone().cross(vUp)).normalize();
      for (let i = 0; i < 3; i++) {
        const t = (i + 0.5) / 3.0;
        const wx = side * CoordinateSystem.lerp(hwAft, hwFwd, t);
        const wy = CoordinateSystem.lerp(yAftFloor, yFwdFloor, t) + galH * 0.48;
        const wz = CoordinateSystem.lerp(zAftFloor, zFwdFloor, t) + aftRake * galH * 0.48;
        const win = makeArchedWindow(0.42, 0.88);
        const wPos = new THREE.Vector3(wx, wy, wz).addScaledVector(outN, 0.025);
        win.position.copy(wPos);
        win.lookAt(wPos.clone().add(outN));
        parent.add(win);
      }
    });

    // 5. Ornate Elizabethan Taffrail Arch, Gilded Heraldic Crest & Fine Acanthus Scrollwork
    const pEdgeTop = this.lines.getHullPoint(0, 1.0, 1);
    const sTop = this.lines.getPoopDeckY(0) + 0.64;
    const hwTop = Math.abs(this.lines.getCastleWallX(0, sTop, 1));
    const roofTopY = yAftFloor + galH + 0.14;
    const midY = (roofTopY + sTop) * 0.52;
    const zAt = (y) => pEdgeTop.z + aftRake * Math.max(0, y - pEdgeTop.y);
    const rakeX = Math.atan2(aftRake, 1);

    // Arched taffrail crown & gold moulding along the top of the poop transom
    const archPts = [], archGoldPts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x = CoordinateSystem.lerp(-hwTop * 1.02, hwTop * 1.02, t);
      const dome = Math.sin(t * Math.PI) * 0.24;
      const ay = sTop + dome;
      archPts.push(new THREE.Vector3(x, ay, zAt(ay)));
      archGoldPts.push(new THREE.Vector3(x, ay - 0.07, zAt(ay) - 0.03));
    }
    parent.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(archPts, 0.11, 0.09, 16), dark));
    parent.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(archGoldPts, 0.045, 0.04, 16), gold));

    // Arch fill panel under the taffrail dome
    const domePos = [], domeIdx = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x = CoordinateSystem.lerp(-hwTop, hwTop, t);
      const dome = Math.sin(t * Math.PI) * 0.22;
      domePos.push(x, sTop - 0.02, zAt(sTop),  x, sTop + dome, zAt(sTop + dome));
    }
    for (let i = 0; i < 16; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2;
      domeIdx.push(a, b, c, a, c, d);
    }
    const domeGeo = new THREE.BufferGeometry();
    domeGeo.setAttribute('position', new THREE.Float32BufferAttribute(domePos, 3));
    domeGeo.setIndex(domeIdx); domeGeo.computeVertexNormals();
    parent.add(new THREE.Mesh(domeGeo, oak));

    // Central Crimson & Gold Escutcheon Shield + Tudor Crown
    const crestG = new THREE.Group();
    const shShape = new THREE.Shape();
    shShape.moveTo(-0.20, 0.20); shShape.lineTo(0.20, 0.20);
    shShape.lineTo(0.18, -0.04); shShape.quadraticCurveTo(0.10, -0.22, 0, -0.28);
    shShape.quadraticCurveTo(-0.10, -0.22, -0.18, -0.04); shShape.closePath();
    const shGeo = new THREE.ExtrudeGeometry(shShape, { depth: 0.045, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 });
    crestG.add(new THREE.Mesh(shGeo, crimMat));
    const shBorder = new THREE.Mesh(new THREE.ExtrudeGeometry(shShape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.024, bevelThickness: 0.01 }), gold);
    shBorder.position.z = 0.005; crestG.add(shBorder);

    // Miniature Tudor Crown atop the shield
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.09, 8), gold);
    crown.position.set(0, 0.27, 0.025); crestG.add(crown);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), gold);
    orb.position.set(0, 0.34, 0.025); crestG.add(orb);

    // Fine symmetrical S-scrolls & rosettes flanking the shield
    [-1, 1].forEach((side) => {
      const s1Pts = [
        new THREE.Vector3(side * 0.22, 0.06, 0.025),
        new THREE.Vector3(side * 0.36, 0.16, 0.035),
        new THREE.Vector3(side * 0.50, 0.02, 0.03),
        new THREE.Vector3(side * 0.64, -0.12, 0.025),
        new THREE.Vector3(side * 0.78, -0.02, 0.025),
      ];
      crestG.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(s1Pts, 0.028, 0.024, 16), gold));
      const s2Pts = [
        new THREE.Vector3(side * 0.24, -0.08, 0.025),
        new THREE.Vector3(side * 0.40, -0.18, 0.032),
        new THREE.Vector3(side * 0.58, -0.06, 0.028),
        new THREE.Vector3(side * 0.72, 0.10, 0.025),
        new THREE.Vector3(side * 0.88, 0.04, 0.022),
      ];
      crestG.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(s2Pts, 0.024, 0.020, 16), gold));

      const rosette = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 12), gold);
      rosette.position.set(side * 0.48, 0.01, 0.032); crestG.add(rosette);
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), crimMat);
      boss.position.set(side * 0.48, 0.01, 0.034); crestG.add(boss);

      // Flanking carved gold corner pilasters
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.052, (sTop - roofTopY) * 0.82, 8), gold);
      pil.position.set(side * (hwTop * 0.90), -0.02, 0.02); crestG.add(pil);
    });

    crestG.position.set(0, midY, zAt(midY) - 0.06);
    crestG.rotation.x = rakeX;
    crestG.rotation.y = Math.PI;
    parent.add(crestG);
  }

  _buildCastleSideWall(parent, u0, u1, botYFn, solidTopFn, railTopFn, oak, dark, gold) {
    const segs = 10;
    [-1, 1].forEach((side) => {
      const pos = [], uvs = [], idx = [], railPts = [], sillPts = [], goldPts = [];
      for (let i = 0; i <= segs; i++) {
        const u = CoordinateSystem.lerp(u0, u1, i / segs);
        const ptBot = this.lines.getHullPoint(u, 1.0, side);
        const bY = Math.min(botYFn(u), solidTopFn(u) - 0.05);
        const sY = solidTopFn(u), rY = railTopFn(u);
        const xSolid = this.lines.getCastleWallX(u, sY, side);
        const xRail = this.lines.getCastleWallX(u, rY, side);
        const aftRake = u < 0.16 ? CoordinateSystem.smoothstep(0.16, 0.0, u) * -0.22 : 0;
        const zSolid = ptBot.z + aftRake * Math.max(0, sY - bY);
        const zRail = ptBot.z + aftRake * Math.max(0, rY - bY);
        pos.push(ptBot.x, bY, ptBot.z, xSolid, sY, zSolid);
        uvs.push(u * 6, 0, u * 6, Math.max(0.2, (sY - bY) * 0.65));
        sillPts.push(new THREE.Vector3(xSolid + side * 0.025, sY, zSolid));
        const midY = (bY + sY) * 0.5;
        goldPts.push(new THREE.Vector3(this.lines.getCastleWallX(u, midY, side) + side * 0.03, midY, (ptBot.z + zSolid) * 0.5));
        railPts.push(new THREE.Vector3(xRail, rY, zRail));
        if (i < segs) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.065, rY - sY, 0.065), dark);
          post.position.set((xSolid + xRail) * 0.5, (sY + rY) * 0.5, (zSolid + zRail) * 0.5);
          post.rotation.z = Math.atan2(xSolid - xRail, rY - sY);
          parent.add(post);
        }
      }
      for (let i = 0; i < segs; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2;
        if (side === 1) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx); geo.computeVertexNormals();
      const wall = new THREE.Mesh(geo, oak); wall.castShadow = true; wall.receiveShadow = true; parent.add(wall);
      // Matching brown wale & golden sheer trim lines along castle wall
      parent.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(sillPts, 0.09, 0.08, segs), dark));
      if (gold) parent.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(goldPts, 0.05, 0.055, segs), gold));
      parent.add(new THREE.Mesh(GeometryHelpers.createCurvedTimber(railPts, 0.10, 0.09, segs), dark));
    });
  }
  _buildForecastleFrontBulkhead(p, bkM, yTop, oak, dark) {
    const u = bkM.fcFrontU, { p72, p86, p100 } = bkM;
    const xTop = Math.abs(this.lines.getCastleWallX(u, yTop, 1)) * 1.02;
    const rows = [
      { x: p72.x * 1.03, y: p72.y - 0.06, z: p72.z },
      { x: p86.x * 1.03, y: p86.y, z: p86.z },
      { x: p100.x * 1.03, y: p100.y, z: p100.z },
      { x: xTop, y: yTop, z: p100.z },
    ];
    const thick = 0.22;
    const pos = [], uvs = [], idx = [];
    // Front face (0..7) & Back face (8..15)
    rows.forEach((r, i) => {
      const v = i / (rows.length - 1);
      pos.push(-r.x, r.y, r.z, r.x, r.y, r.z);
      uvs.push(0, v, 1, v);
    });
    rows.forEach((r, i) => {
      const v = i / (rows.length - 1);
      pos.push(-r.x, r.y, r.z - thick, r.x, r.y, r.z - thick);
      uvs.push(0, v, 1, v);
    });
    for (let i = 0; i < rows.length - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2;
      idx.push(a, b, c, a, c, d); // front
      const ba = 8 + a, bb = 8 + b, bc = 8 + c, bd = 8 + d;
      idx.push(ba, bc, bb, ba, bd, bc); // back
      idx.push(a, d, bd, a, bd, ba); // port side
      idx.push(b, bb, bc, b, bc, c); // starboard side
    }
    // Top & bottom caps
    idx.push(6, 7, 15, 6, 15, 14, 0, 9, 1, 0, 8, 9);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, oak);
    mesh.castShadow = true; mesh.receiveShadow = true;
    p.add(mesh);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(xTop * 2 + 0.12, 0.11, thick + 0.04), dark);
    cap.position.set(0, yTop, p100.z - thick * 0.5);
    p.add(cap);
  }
  _bulkhead(p, u, baseY, h, oak, dark, hasDoor = true, zOverride = null, offsetDoor = false) {
    const z = zOverride !== null ? zOverride : CoordinateSystem.stationToZ(u, this.h.length);
    const kRab = this.lines.getKeelBottomY(u) + this.h.keelThickness;
    const yBulwark = this.lines.getBulwarkTopY(u);
    const halfWidthAtY = (y) => {
      if (y <= yBulwark) {
        const v = CoordinateSystem.clamp01((y - kRab) / Math.max(0.5, yBulwark - kRab));
        return Math.abs(this.lines.getHullPoint(u, v, 1).x) * 0.985;
      }
      return Math.abs(this.lines.getCastleWallX(u, y, 1)) * 0.985;
    };
    const y0 = baseY - 0.06, y2 = baseY + h + 0.02;
    const ys = (yBulwark > y0 + 0.08 && yBulwark < y2 - 0.08) ? [y0, yBulwark, y2] : [y0, (y0 + y2) * 0.5, y2];
    const rows = ys.map((y) => ({ x: halfWidthAtY(y), y }));
    const halfT = 0.08;
    const pos = [], uvs = [], idx = [];
    rows.forEach((r, i) => {
      const v = i / (rows.length - 1);
      pos.push(-r.x, r.y, z + halfT, r.x, r.y, z + halfT);
      uvs.push(0, v, 1, v);
    });
    rows.forEach((r, i) => {
      const v = i / (rows.length - 1);
      pos.push(-r.x, r.y, z - halfT, r.x, r.y, z - halfT);
      uvs.push(0, v, 1, v);
    });
    const nRows = rows.length;
    for (let i = 0; i < nRows - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2;
      idx.push(a, b, c, a, c, d);
      const ba = nRows * 2 + a, bb = nRows * 2 + b, bc = nRows * 2 + c, bd = nRows * 2 + d;
      idx.push(ba, bc, bb, ba, bd, bc);
      idx.push(a, d, bd, a, bd, ba);
      idx.push(b, bb, bc, b, bc, c);
    }
    const tA = (nRows - 1) * 2, tB = tA + 1, tBA = nRows * 2 + tA, tBB = nRows * 2 + tB;
    idx.push(tA, tB, tBB, tA, tBB, tBA, 0, nRows * 2 + 1, 1, 0, nRows * 2, nRows * 2 + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const wall = new THREE.Mesh(geo, oak);
    wall.castShadow = true; wall.receiveShadow = true;
    p.add(wall);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(rows[nRows - 1].x * 2, 0.08, halfT * 2 + 0.04), dark);
    beam.position.set(0, baseY + h - 0.02, z); p.add(beam);
    if (hasDoor) {
      const doorW = 0.50, doorH = Math.min(1.24, h * 0.68);
      const doorX = offsetDoor ? 0.62 : 0;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.10, doorH + 0.06, halfT * 2 + 0.03), dark);
      frame.position.set(doorX, baseY + doorH * 0.5, z); p.add(frame);
      const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, halfT * 2 + 0.05), oak);
      door.position.set(doorX, baseY + doorH * 0.5, z); p.add(door);
      const glass = this.materials.get('cabinGlass');
      const winXs = offsetDoor ? [-0.62] : [-0.74, 0.74];
      winXs.forEach((wx) => {
        if (Math.abs(wx) + 0.25 < rows[nRows - 1].x) {
          const wf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, halfT * 2 + 0.03), dark);
          wf.position.set(wx, baseY + h * 0.54, z); p.add(wf);
          const wp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, halfT * 2 + 0.05), glass);
          wp.position.set(wx, baseY + h * 0.54, z); p.add(wp);
        }
      });
    }
  }
}
