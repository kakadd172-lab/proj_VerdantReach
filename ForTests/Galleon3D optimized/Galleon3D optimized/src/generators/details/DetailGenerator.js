import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';
import { createAsset as createRowboatAsset } from './rowboat-c42d85.mjs';

export class DetailGenerator {
  constructor(c, m, l, a) { this.h = c.hull; this.materials = m; this.lines = l; this.anchors = a || {}; this.anchorAssemblies = []; this.flags = []; }
  generate() {
    const g = new THREE.Group(); g.name = 'DetailsAssembly';
    const gold = this.materials.get('goldLeaf'), iron = this.materials.get('agedIron'),
          oak = this.materials.get('weatheredOak'), dark = this.materials.get('darkTimber'),
          crim = this.materials.get('crimsonTrim');

    // Single central octagonal poop lantern mounted cleanly on top of the taffrail arch
    this.lanternGlassMat = this.materials.get('lanternGlass');
    this.cabinGlassMat = this.materials.get('cabinGlass');
    const pEdgeLan = this.lines.getHullPoint(0, 1.0, 0);
    const poopY = this.lines.getPoopDeckY(0) + 0.86;
    const sternZ = pEdgeLan.z + (-0.22) * Math.max(0, poopY - pEdgeLan.y);
    const lan = new THREE.Group();
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.48, 8), gold); br.rotation.x = -1.12; br.position.set(0, 0.10, -0.18); lan.add(br);
    const baseCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 8), gold); baseCone.rotation.x = Math.PI; baseCone.position.set(0, 0.24, -0.36); lan.add(baseCone);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.54, 8), this.lanternGlassMat); core.position.set(0, 0.60, -0.36); lan.add(core);
    const lanCap = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.30, 8), gold); lanCap.position.set(0, 1.00, -0.36); lan.add(lanCap);
    this.lanternLight = new THREE.PointLight(0xffaa44, 2.2, 16); this.lanternLight.position.set(0, 0.62, -0.60); lan.add(this.lanternLight);
    lan.position.set(0, poopY, sternZ); g.add(lan);

    // Authentic 16th-Century Admiralty Bower Anchors (tapered hoop-bound stock, crown, curved arms & triangular spade flukes)
    this.anchorAssemblies = [];
    const aU = 0.88, aZ = CoordinateSystem.stationToZ(aU, this.h.length);
    const catY = this.lines.getForecastleDeckY(aU) + 0.12;
    [-1, 1].forEach((side) => {
      const hx = Math.abs(this.lines.getHullPoint(aU, 0.88, 1).x);
      const hxBelly = Math.abs(this.lines.getHullPoint(aU - 0.03, 0.52, 1).x);
      const pA = this.lines.getHullPoint(aU - 0.02, 0.72, side);
      const pF = this.lines.getHullPoint(aU + 0.02, 0.72, side);
      const hullYaw = Math.atan2(pF.x - pA.x, pF.z - pA.z);
      const axAbs = Math.max(hx + 0.64, hxBelly + 0.38);
      const chInner = hx - 0.30, chOuter = axAbs + 0.14, chLen = chOuter - chInner;
      const ch = new THREE.Mesh(new THREE.BoxGeometry(chLen, 0.16, 0.20), dark);
      ch.position.set(side * (chInner + chLen * 0.5), catY, aZ + 0.15); g.add(ch);
      const anc = new THREE.Group();

      // 1. Tapered iron shank + crown boss
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.072, 1.92, 10), iron);
      anc.add(shank);
      const headBlock = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13), iron);
      headBlock.position.y = 0.82; anc.add(headBlock);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 8), iron);
      crown.rotation.x = Math.PI; crown.position.y = -1.02; anc.add(crown);

      // 2. Tapered wooden stock bound with 4 iron hoops
      const stock = new THREE.Mesh(GeometryHelpers.createCurvedTimber([
        new THREE.Vector3(-0.80, 0.78, 0), new THREE.Vector3(0, 0.78, 0), new THREE.Vector3(0.80, 0.78, 0)
      ], 0.16, 0.17, 10, (t) => 0.65 + 0.45 * Math.sin(t * Math.PI)), dark);
      anc.add(stock);
      [-0.58, -0.22, 0.22, 0.58].forEach((bx) => {
        const hoop = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.18), iron);
        hoop.position.set(bx, 0.78, 0); anc.add(hoop);
      });

      // 3. Swept curved iron arms + broad triangular spade flukes (palms)
      const arms = new THREE.Mesh(GeometryHelpers.createCurvedTimber([
        new THREE.Vector3(-0.74, -0.48, 0),
        new THREE.Vector3(-0.42, -0.84, 0),
        new THREE.Vector3(0, -0.96, 0),
        new THREE.Vector3(0.42, -0.84, 0),
        new THREE.Vector3(0.74, -0.48, 0)
      ], 0.10, 0.12, 16, (t) => 0.72 + 0.48 * Math.sin(t * Math.PI)), iron);
      anc.add(arms);

      const flukeShape = new THREE.Shape();
      flukeShape.moveTo(0, 0.22);
      flukeShape.lineTo(-0.19, -0.14);
      flukeShape.lineTo(0.19, -0.14);
      flukeShape.closePath();
      const flukeGeo = new THREE.ExtrudeGeometry(flukeShape, { depth: 0.035, bevelEnabled: false });
      flukeGeo.translate(0, 0, -0.0175);
      [-1, 1].forEach((fSide) => {
        const fluke = new THREE.Mesh(flukeGeo, iron);
        fluke.position.set(fSide * 0.67, -0.52, 0);
        fluke.rotation.y = Math.PI * 0.5;
        fluke.rotation.x = fSide * -0.58;
        anc.add(fluke);
      });

      // 4. Forged iron anchor ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.034, 8, 16), iron);
      ring.position.y = 1.06; anc.add(ring);

      const stowedY = catY - 1.36;
      const ax = side * axAbs;
      // Pivot from cathead tip so outward tilt never leans the anchor forward/aft
      const hinge = new THREE.Group();
      hinge.position.set(ax, catY - 0.08, aZ + 0.15);
      hinge.rotation.z = side * 0.08;
      g.add(hinge);

      anc.position.set(0, stowedY - (catY - 0.08), 0);
      anc.rotation.y = side * Math.PI * 0.5 + hullYaw;
      hinge.add(anc);

      // Visible rope pendant from cathead underside down to the anchor ring
      const pendLen = Math.max(0.10, (catY - 0.08) - (stowedY + 1.12));
      const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, pendLen, 8), new THREE.MeshStandardMaterial({ color: 0x9c8256, roughness: 0.9 }));
      pendant.position.set(0, -pendLen * 0.5, 0);
      hinge.add(pendant);

      const cableGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, stowedY - (catY - 0.08) + 1.04, 0)
      ]);
      const cableLine = new THREE.Line(cableGeo, new THREE.LineBasicMaterial({ color: 0xa68b60 }));
      cableLine.frustumCulled = false; hinge.add(cableLine);
      this.anchorAssemblies.push({ mesh: anc, stowedY: stowedY - (catY - 0.08), ax: 0, az: 0, catY: 0, cableGeo });
    });

    // Capstan in open waist (u = 0.53) with drumhead & 4 radial capstan bars
    const capstanGroup = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.76, 10), dark); bar.position.y = 0.38; capstanGroup.add(bar);
    const drm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.40, 0.18, 10), oak); drm.position.y = 0.80; capstanGroup.add(drm);
    for (let cb = 0; cb < 2; cb++) {
      const capBar = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.055, 0.055), oak);
      capBar.position.y = 0.82; capBar.rotation.y = (cb * Math.PI) * 0.5; capstanGroup.add(capBar);
    }
    capstanGroup.position.set(0, this.lines.getSheerY(0.53) + 0.12, CoordinateSystem.stationToZ(0.53, this.h.length)); g.add(capstanGroup);

    // Quarterdeck Whipstaff + 7.5x Geared Helm Wheel Assembly
    const helmY = this.lines.getQuarterDeckY(0.26) + 0.05, helmZ = CoordinateSystem.stationToZ(0.26, this.h.length);
    const helmHousing = new THREE.Group();
    const bin = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.55), oak); bin.position.y = 0.32; helmHousing.add(bin);

    const whipP = new THREE.Group(); whipP.name = 'HelmWhipstaffAssembly'; whipP.position.set(0, 0.64, 0.1);
    const stf = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.25, 8), gold); stf.position.y = 0.55; whipP.add(stf);
    helmHousing.add(whipP);

    const wheelP = new THREE.Group(); wheelP.name = 'HelmWheelAssembly'; wheelP.position.set(0, 0.82, -0.32);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 16), oak); wheelP.add(rim);
    for (let s = 0; s < 8; s++) {
      const spk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.96, 6), gold);
      spk.rotation.z = (s / 8) * Math.PI * 2;
      wheelP.add(spk);
    }
    helmHousing.add(wheelP);
    helmHousing.position.set(0, helmY, helmZ); g.add(helmHousing);

    // Ship's Rowboat (rowboat-c42d85) seated cleanly on deck chocks at u = 0.63
    const bGroup = new THREE.Group();
    const bU = 0.63, bZ = CoordinateSystem.stationToZ(bU, this.h.length), bY = this.lines.getSheerY(bU) + 0.14;
    const rowboat = createRowboatAsset({ colorway: 'weathered-oak', length: 2.75, beam: 1.24, strakes: 4, thwarts: 3 });
    rowboat.traverse((ch) => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } });
    rowboat.position.y += 0.08;
    bGroup.add(rowboat);
    [-0.82, 0.82].forEach((cz) => {
      const chock = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.16, 0.14), dark);
      chock.position.set(0, 0.06, cz); bGroup.add(chock);
    });
    bGroup.position.set(0, bY, bZ); g.add(bGroup);

    // Flags
    this.flags = [];
    if (this.anchors.main) {
      const fg = new THREE.PlaneGeometry(2.4, 0.55, 8, 2); fg.translate(1.2, 0, 0);
      const fl = new THREE.Mesh(fg, crim); fl.position.set(0, this.anchors.main.mastheadY - 0.15, this.anchors.main.mastheadZ); g.add(fl);
      this.flags.push({ mesh: fl, basePos: fg.attributes.position.array.slice(), phase: 0 });
    }
    return g;
  }
  setLanternsLit(lit) {
    if (this.lanternLight) this.lanternLight.intensity = lit ? 2.2 : 0;
    if (this.lanternGlassMat) this.lanternGlassMat.emissiveIntensity = lit ? 1.4 : 0.05;
    if (this.cabinGlassMat) this.cabinGlassMat.emissiveIntensity = lit ? 0.65 : 0.04;
  }
  updateAnchors(p) {
    const a = this.anchorAssemblies[0];
    if (!a) return;
    const curY = a.stowedY - p * 5.6;
    a.mesh.position.y = curY;
    const pos = a.cableGeo.attributes.position;
    pos.setXYZ(0, a.ax, a.catY, a.az);
    pos.setXYZ(1, a.ax, curY + 0.95, a.az);
    pos.needsUpdate = true;
  }
  updateFlags(elapsed, ws, wa) {
    this.flags.forEach((f) => {
      f.mesh.rotation.y = wa - Math.PI * 0.5;
      const pos = f.mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = f.basePos[i * 3];
        pos.setZ(i, Math.sin(bx * 3.2 - elapsed * (4 + ws * 4) + f.phase) * 0.12 * (bx / 2));
      }
      pos.needsUpdate = true;
    });
  }
}
