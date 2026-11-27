import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

export class StandingRiggingGenerator {
  constructor(c, m, l, a) { this.config = c; this.h = c.hull; this.materials = m; this.lines = l; this.anchors = a || {}; }
  generate() {
    const g = new THREE.Group(); g.name = 'StandingRiggingAssembly';
    const rope = this.materials.get('hempRope'), dark = this.materials.get('darkTimber'), rR = this.config.rigging.ropeThickness;

    const getChanSample = (u, k) => {
      const yTop = k === 'mizzen' ? (this.lines.getQuarterDeckY(u) + 0.22) : (this.lines.getBulwarkTopY(u) - 0.02);
      const innerX = k === 'mizzen'
        ? Math.abs(this.lines.getCastleWallX(u, yTop, 1)) - 0.03
        : Math.abs(this.lines.getHullPoint(u, 0.98, 1).x) - 0.03;
      const z = CoordinateSystem.stationToZ(u, this.h.length);
      return { innerX, yTop, z };
    };

    ['fore', 'main', 'mizzen'].forEach((k) => {
      const md = this.anchors[k]; if (!md) return;
      const cnt = this.config.rigging.shroudsPerSide[k] || 4;
      const u0 = k === 'mizzen' ? 0.155 : k === 'main' ? 0.445 : (md.station - 0.08);
      const u1 = k === 'mizzen' ? 0.215 : k === 'main' ? 0.515 : (md.station - 0.01);
      const topY = k === 'mizzen' ? (md.stepY + (md.mastheadY - md.stepY) * 0.44) : (md.lowerTopY - 0.18);
      const topZ = k === 'mizzen' ? (md.z - 0.25) : md.lowerTopZ;
      const chanW = 0.36, chanH = 0.095, segs = 10;

      [-1, 1].forEach((side) => {
        // Loft curved 3D channel slab following the exact railing height & hull curve
        const cPos = [], cUvs = [], cIdx = [];
        const uPad0 = Math.max(0, u0 - 0.008), uPad1 = Math.min(0.93, u1 + 0.008);
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          const u = CoordinateSystem.lerp(uPad0, uPad1, t);
          const s = getChanSample(u, k);
          const xIn = side * s.innerX, xOut = side * (s.innerX + chanW);
          const yT = s.yTop, yB = s.yTop - chanH;
          // 4 vertices per cross-section: 0=inTop, 1=outTop, 2=outBot, 3=inBot
          cPos.push(xIn, yT, s.z,  xOut, yT, s.z,  xOut, yB, s.z,  xIn, yB, s.z);
          cUvs.push(0, t, 1, t, 1, t, 0, t);
        }
        for (let i = 0; i < segs; i++) {
          const b0 = i * 4, b1 = (i + 1) * 4;
          const pushQuad = (p0, p1, p2, p3) => {
            if (side === 1) cIdx.push(p0, p1, p2, p0, p2, p3);
            else cIdx.push(p0, p2, p1, p0, p3, p2);
          };
          pushQuad(b0 + 0, b0 + 1, b1 + 1, b1 + 0); // top
          pushQuad(b0 + 1, b0 + 2, b1 + 2, b1 + 1); // outer
          pushQuad(b0 + 2, b0 + 3, b1 + 3, b1 + 2); // bottom
          pushQuad(b0 + 3, b0 + 0, b1 + 0, b1 + 3); // inner
        }
        // End caps
        const eEnd = segs * 4;
        if (side === 1) {
          cIdx.push(0, 3, 2, 0, 2, 1,  eEnd + 0, eEnd + 1, eEnd + 2, eEnd + 0, eEnd + 2, eEnd + 3);
        } else {
          cIdx.push(0, 2, 3, 0, 1, 2,  eEnd + 0, eEnd + 2, eEnd + 1, eEnd + 0, eEnd + 3, eEnd + 2);
        }
        const cGeo = new THREE.BufferGeometry();
        cGeo.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3));
        cGeo.setAttribute('uv', new THREE.Float32BufferAttribute(cUvs, 2));
        cGeo.setIndex(cIdx); cGeo.computeVertexNormals();
        const chan = new THREE.Mesh(cGeo, dark);
        chan.castShadow = true; chan.receiveShadow = true; g.add(chan);

        const bots = [], top = new THREE.Vector3(side * 0.24, topY, topZ);
        for (let s = 0; s < cnt; s++) {
          const su = CoordinateSystem.lerp(u0, u1, s / Math.max(1, cnt - 1));
          const pt = getChanSample(su, k);
          const midX = side * (pt.innerX + chanW * 0.5);
          const bot = new THREE.Vector3(midX, pt.yTop, pt.z);
          bots.push(bot);
          const deadeye = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.045, 8), dark);
          deadeye.rotation.z = Math.PI * 0.5;
          deadeye.position.set(midX, pt.yTop + 0.025, pt.z);
          g.add(deadeye);
          g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(bot, top, rR, 0.02, 5), rope));
        }
        if (bots.length >= 2) {
          const avgBotY = (bots[0].y + bots[bots.length - 1].y) * 0.5;
          const rungs = Math.floor((top.y - avgBotY) / this.config.rigging.ratlineSpacing);
          for (let r = 1; r < rungs - 1; r++) {
            const t = r / rungs;
            g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(bots[0].clone().lerp(top, t), bots[bots.length - 1].clone().lerp(top, t), rR * 0.55, 0.01, 3), rope));
          }
        }
        // Topmast shrouds anchored cleanly from fighting top rim to exact raked topmast head!
        if (k !== 'mizzen') {
          const topRim = k === 'main' ? 1.02 : 0.84;
          const tmHead = new THREE.Vector3(side * 0.12, md.mastheadY - 0.45, md.mastheadZ);
          [-0.32, 0.02].forEach((dz) => {
            const tmBot = new THREE.Vector3(side * topRim, md.lowerTopY + 0.08, md.lowerTopZ + dz);
            g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(tmBot, tmHead, rR * 0.8, 0.015, 4), rope));
          });
        }
      });
    });
    const { fore, main, mizzen, bowsprit } = this.anchors;
    if (fore && bowsprit) {
      g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(new THREE.Vector3(0, fore.lowerTopY, fore.lowerTopZ), bowsprit.yardCenter, rR * 1.4, 0.15, 8), rope));
      g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(new THREE.Vector3(0, fore.mastheadY - 0.45, fore.mastheadZ), bowsprit.tip, rR * 1.05, 0.18, 8), rope));
    }
    if (main && fore) {
      g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(new THREE.Vector3(0, main.lowerTopY, main.lowerTopZ), new THREE.Vector3(0, fore.stepY + 1.8, fore.z), rR * 1.5, 0.18, 8), rope));
      g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(new THREE.Vector3(0, main.mastheadY - 0.45, main.mastheadZ), new THREE.Vector3(0, fore.lowerTopY, fore.lowerTopZ), rR * 1.05, 0.16, 8), rope));
    }
    if (mizzen && main) g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(new THREE.Vector3(0, mizzen.stepY + (mizzen.mastheadY - mizzen.stepY) * 0.44, mizzen.z - 0.25), new THREE.Vector3(0, main.stepY + 1.8, main.z), rR * 1.2, 0.14, 8), rope));
    return g;
  }
}
