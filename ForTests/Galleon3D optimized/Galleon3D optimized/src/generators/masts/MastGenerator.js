import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

export class MastGenerator {
  constructor(c, m, l) { this.h = c.hull; this.m = c.masts; this.materials = m; this.lines = l; this.anchors = {}; }
  generate() {
    const g = new THREE.Group(); g.name = 'MastsAssembly'; this.anchors = {};
    const spar = this.materials.get('sparWood'), dark = this.materials.get('darkTimber');

    ['fore', 'main'].forEach((key) => {
      const spec = this.m[key], z = CoordinateSystem.stationToZ(spec.station, this.h.length);
      const stepY = this.lines.getSheerY(spec.station) - 0.8, mg = new THREE.Group();
      mg.position.set(0, stepY, z); mg.rotation.x = key === 'fore' ? 0.02 : -0.04;
      const lowH = spec.height * 0.58, topH = spec.height * 0.44;
      const low = new THREE.Mesh(GeometryHelpers.createTaperedSpar(spec.baseRadius, spec.baseRadius * 0.72, lowH, 10), spar);
      low.castShadow = true; mg.add(low);
      for (let w = 0; w < 5; w++) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(spec.baseRadius * 0.96, spec.baseRadius * 0.96, 0.14, 10), dark);
        band.position.y = lowH * (0.28 + w * 0.13); mg.add(band);
      }
      const topR = key === 'main' ? 1.15 : 0.95;
      const fTopGroup = new THREE.Group();
      fTopGroup.position.y = lowH;
      fTopGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(topR * 0.85, topR * 0.65, 0.12, 12), dark));
      const guardRing = new THREE.Mesh(new THREE.TorusGeometry(topR, 0.055, 6, 14), dark);
      guardRing.rotation.x = Math.PI * 0.5; guardRing.position.y = 0.34; fTopGroup.add(guardRing);
      for (let ri = 0; ri < 8; ri++) {
        const ang = (ri / 8) * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.05), dark);
        rib.position.set(Math.cos(ang) * topR * 0.92, 0.18, Math.sin(ang) * topR * 0.92);
        fTopGroup.add(rib);
      }
      mg.add(fTopGroup);
      const topM = new THREE.Mesh(GeometryHelpers.createTaperedSpar(spec.baseRadius * 0.6, spec.baseRadius * 0.25, topH, 8), spar);
      topM.position.set(0, lowH, 0.14); topM.castShadow = true; mg.add(topM);

      const yards = [], cSpan = key === 'main' ? 11.4 : 9.4, tSpan = key === 'main' ? 7.6 : 6.2;
      const cYard = this._yard(cSpan, spec.baseRadius * 0.55, spar); cYard.position.set(0, lowH * 0.86, 0.26); mg.add(cYard);
      yards.push({ name: `${key}Course`, pivotGroup: cYard, span: cSpan, drop: lowH * 0.52, center: new THREE.Vector3(0, stepY + lowH * 0.86, z + 0.26), isLateen: false });
      const tYard = this._yard(tSpan, spec.baseRadius * 0.38, spar); tYard.position.set(0, lowH + topH * 0.68, 0.32); mg.add(tYard);
      yards.push({ name: `${key}Topsail`, pivotGroup: tYard, span: tSpan, drop: topH * 0.58, center: new THREE.Vector3(0, stepY + lowH + topH * 0.68, z + 0.32), isLateen: false });

      g.add(mg);
      const rake = key === 'fore' ? 0.02 : -0.04;
      const lowerTopPos = new THREE.Vector3(0, stepY + lowH * Math.cos(rake), z + lowH * Math.sin(rake));
      const mastheadPos = new THREE.Vector3(0, stepY + (lowH + topH) * Math.cos(rake), z + (lowH + topH) * Math.sin(rake) + 0.14);
      this.anchors[key] = { station: spec.station, z, stepY, lowerTopY: lowerTopPos.y, lowerTopZ: lowerTopPos.z, mastheadY: mastheadPos.y, mastheadZ: mastheadPos.z, yards };
    });

    // Mizzen
    {
      const spec = this.m.mizzen, z = CoordinateSystem.stationToZ(spec.station, this.h.length);
      const stepY = this.lines.getSheerY(spec.station) + 0.2, mg = new THREE.Group();
      mg.position.set(0, stepY, z); mg.rotation.x = -0.06;
      mg.add(new THREE.Mesh(GeometryHelpers.createTaperedSpar(spec.baseRadius, spec.baseRadius * 0.42, spec.height, 8), spar));
      const lp = new THREE.Group(); lp.position.set(0.18, spec.height * 0.64, 0);
      const ls = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 11.2, 8), spar); ls.rotation.x = -Math.PI * 0.28; lp.add(ls);
      mg.add(lp); g.add(mg);
      const mRake = -0.06;
      this.anchors.mizzen = {
        station: spec.station, z, stepY,
        lowerTopY: stepY + spec.height * 0.68 * Math.cos(mRake),
        lowerTopZ: z + spec.height * 0.68 * Math.sin(mRake),
        mastheadY: stepY + spec.height * Math.cos(mRake),
        mastheadZ: z + spec.height * Math.sin(mRake),
        yards: [{ name: 'mizzenLateen', pivotGroup: lp, span: 11.2, drop: spec.height * 0.46, center: new THREE.Vector3(0.18, stepY + spec.height * 0.64, z), isLateen: true }],
      };
    }

    // Bowsprit stepped on the main/gun deck (u = 0.78) and emerging cleanly at the forecastle-beakhead junction
    {
      const spec = this.m.bowsprit, bkM = this.lines.getBeakheadMetrics();
      const z = CoordinateSystem.stationToZ(0.78, this.h.length);
      const ang = THREE.MathUtils.degToRad(spec.angle);
      const exitZ = bkM.p86.z, exitY = bkM.p86.y + 0.04;
      const baseY = exitY - Math.tan(ang) * (exitZ - z);
      const exitDist = (exitZ - z) / Math.cos(ang);
      const totalLen = exitDist + spec.length * 0.96;
      const bg = new THREE.Group(); bg.position.set(0, baseY, z);
      const bp = new THREE.Group(); bp.rotation.x = Math.PI * 0.5 - ang;
      bp.add(new THREE.Mesh(GeometryHelpers.createTaperedSpar(spec.baseRadius, spec.baseRadius * 0.42, totalLen, 10), spar));
      // Partner collar right at the forecastle bulkhead exit + gammoning lashings over the beakhead
      const collar = new THREE.Mesh(new THREE.TorusGeometry(spec.baseRadius * 0.96, 0.055, 6, 12), dark);
      collar.rotation.x = Math.PI * 0.5; collar.position.y = exitDist; bp.add(collar);
      const gamm = new THREE.Mesh(new THREE.CylinderGeometry(spec.baseRadius * 0.90, spec.baseRadius * 0.90, 0.22, 10), dark);
      gamm.position.y = exitDist + 1.15; bp.add(gamm);
      bg.add(bp); g.add(bg);
      const dist = totalLen * 0.86, yY = baseY + Math.sin(ang) * dist - 0.22, yZ = z + Math.cos(ang) * dist;
      const sp = new THREE.Group(); sp.position.set(0, yY, yZ); sp.add(this._yard(5.6, 0.09, spar)); g.add(sp);
      this.anchors.bowsprit = {
        base: new THREE.Vector3(0, baseY, z),
        tip: new THREE.Vector3(0, baseY + Math.sin(ang) * totalLen, z + Math.cos(ang) * totalLen),
        yardPivotGroup: sp, yardCenter: new THREE.Vector3(0, yY, yZ), yardHalfSpan: 2.8,
      };
    }
    return g;
  }
  _yard(span, r, mat) {
    const p = new THREE.Group(), h = span * 0.5;
    [-1, 1].forEach((s) => {
      const arm = new THREE.Mesh(GeometryHelpers.createTaperedSpar(r, r * 0.52, h, 8), mat);
      arm.rotation.z = s * -Math.PI * 0.5; p.add(arm);
    });
    return p;
  }
  getAnchors() { return this.anchors; }
}
