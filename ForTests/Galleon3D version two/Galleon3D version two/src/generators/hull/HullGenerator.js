import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

/**
 * Generates the structural hull of the Golden Hind (c. 1575):
 *  - Continuous oak keel, curved stempost, and raked sternpost
 *  - Lofted hull planking (tarred below waterline, weathered oak above)
 *  - Longitudinal heavy wales & gunwale rails
 *  - Beakhead (Galion) with curved headrails, grating, and gilded figurehead
 *  - Hinged gunport frames & lids
 */
export class HullGenerator {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'HullAssembly';

    this._buildKeelAndPosts(group);
    this._buildHullPlanking(group);
    this._buildWalesAndRails(group);
    this._buildBeakhead(group);
    this._buildGunports(group);

    return group;
  }

  _buildKeelAndPosts(parent) {
    const darkTimber = this.materials.get('darkTimber');
    const uSteps = 28;
    const keelPts = [];
    for (let i = 0; i <= uSteps; i++) {
      const u = i / uSteps;
      const z = CoordinateSystem.stationToZ(u, this.h.length);
      const y = this.lines.getKeelBottomY(u) + this.h.keelThickness * 0.5;
      keelPts.push(new THREE.Vector3(0, y, z));
    }
    // Extend stempost upward and forward
    const bowZ = CoordinateSystem.stationToZ(1.0, this.h.length);
    const bowTopY = this.lines.getBulwarkTopY(1.0);
    keelPts.push(new THREE.Vector3(0, bowTopY * 0.55, bowZ + 0.55));
    keelPts.push(new THREE.Vector3(0, bowTopY + 0.2, bowZ + 0.95));

    const keelGeo = GeometryHelpers.createCurvedTimber(
      keelPts,
      this.h.keelWidth,
      this.h.keelThickness,
      40
    );
    const keelMesh = new THREE.Mesh(keelGeo, darkTimber);
    keelMesh.castShadow = true;
    keelMesh.receiveShadow = true;
    parent.add(keelMesh);

    // Raked sternpost
    const sternZ = CoordinateSystem.stationToZ(0.0, this.h.length);
    const sternBotY = this.lines.getKeelBottomY(0.0);
    const sternTopY = this.lines.getSheerY(0.0) + 0.4;
    const sternPts = [
      new THREE.Vector3(0, sternBotY, sternZ),
      new THREE.Vector3(0, (sternBotY + sternTopY) * 0.5, sternZ - 0.35),
      new THREE.Vector3(0, sternTopY, sternZ - 0.72),
    ];
    const sternPost = new THREE.Mesh(
      GeometryHelpers.createCurvedTimber(sternPts, this.h.keelWidth, this.h.keelThickness * 0.95, 12),
      darkTimber
    );
    sternPost.castShadow = true;
    parent.add(sternPost);
  }

  _buildHullPlanking(parent) {
    const oakMat = this.materials.get('weatheredOak');
    const tarMat = this.materials.get('tarredHull');
    const uSegs = 44;
    const vSegs = 20;
    const waterlineV = 0.34;

    [-1, 1].forEach((side) => {
      // Lower tarred hull (v: 0 -> waterlineV)
      parent.add(this._createLoftedSurface(side, 0.0, waterlineV, uSegs, 8, tarMat));
      // Upper weathered oak hull (v: waterlineV -> 1.0)
      parent.add(this._createLoftedSurface(side, waterlineV, 1.0, uSegs, 14, oakMat));
    });
  }

  _createLoftedSurface(side, vStart, vEnd, uSegs, vSegs, material) {
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      for (let iv = 0; iv <= vSegs; iv++) {
        const v = CoordinateSystem.lerp(vStart, vEnd, iv / vSegs);
        const pt = this.lines.getHullPoint(u, v, side);
        positions.push(pt.x, pt.y, pt.z);
        uvs.push(u * 6, (iv / vSegs) * 2);
      }
    }

    const row = vSegs + 1;
    for (let iu = 0; iu < uSegs; iu++) {
      for (let iv = 0; iv < vSegs; iv++) {
        const a = iu * row + iv;
        const b = (iu + 1) * row + iv;
        const c = (iu + 1) * row + (iv + 1);
        const d = iu * row + (iv + 1);
        if (side === 1) {
          indices.push(a, b, c, a, c, d);
        } else {
          indices.push(a, c, b, a, d, c);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  _buildWalesAndRails(parent) {
    const darkMat = this.materials.get('darkTimber');
    const goldMat = this.materials.get('goldLeaf');
    const waleVs = [0.42, 0.54, 0.72, 0.98];

    [-1, 1].forEach((side) => {
      waleVs.forEach((v, idx) => {
        const pts = [];
        for (let i = 0; i <= 32; i++) {
          const u = i / 32;
          const pt = this.lines.getHullPoint(u, v, side);
          pt.x += side * 0.045;
          pts.push(pt);
        }
        const thick = idx < 2 ? 0.14 : 0.10;
        const mat = idx === 3 ? darkMat : darkMat;
        const mesh = new THREE.Mesh(GeometryHelpers.createCurvedTimber(pts, thick, thick, 36), mat);
        mesh.castShadow = true;
        parent.add(mesh);
      });

      // Decorative Tudor gold sheer molding strip
      const trimPts = [];
      for (let i = 0; i <= 28; i++) {
        const u = i / 28;
        const pt = this.lines.getHullPoint(u, 0.86, side);
        pt.x += side * 0.04;
        trimPts.push(pt);
      }
      const trimMesh = new THREE.Mesh(GeometryHelpers.createCurvedTimber(trimPts, 0.055, 0.06, 30), goldMat);
      parent.add(trimMesh);
    });
  }

  _buildBeakhead(parent) {
    const darkMat = this.materials.get('darkTimber');
    const oakMat = this.materials.get('weatheredOak');
    const goldMat = this.materials.get('goldLeaf');

    const stemZ = CoordinateSystem.stationToZ(1.0, this.h.length);
    const baseY = this.lines.getSheerY(1.0) - 0.15;
    const tipZ = stemZ + this.h.bowOverhang;
    const tipY = baseY + 0.85;

    // Central knee of the head (cutwater)
    const kneePts = [
      new THREE.Vector3(0, baseY - 1.1, stemZ + 0.25),
      new THREE.Vector3(0, baseY - 0.2, stemZ + this.h.bowOverhang * 0.5),
      new THREE.Vector3(0, tipY, tipZ),
    ];
    const knee = new THREE.Mesh(
      GeometryHelpers.createCurvedTimber(kneePts, 0.22, 0.38, 16, (t) => 1.0 - t * 0.45),
      darkMat
    );
    knee.castShadow = true;
    parent.add(knee);

    // Port & Starboard curved headrails
    [-1, 1].forEach((side) => {
      const upperRail = [
        new THREE.Vector3(side * 1.15, baseY + 0.95, stemZ - 0.55),
        new THREE.Vector3(side * 0.68, baseY + 0.62, stemZ + this.h.bowOverhang * 0.45),
        new THREE.Vector3(side * 0.14, tipY + 0.12, tipZ - 0.15),
      ];
      parent.add(
        new THREE.Mesh(GeometryHelpers.createCurvedTimber(upperRail, 0.09, 0.09, 16), goldMat)
      );

      const lowerRail = [
        new THREE.Vector3(side * 0.92, baseY + 0.25, stemZ - 0.35),
        new THREE.Vector3(side * 0.52, baseY + 0.15, stemZ + this.h.bowOverhang * 0.45),
        new THREE.Vector3(side * 0.12, tipY - 0.18, tipZ - 0.2),
      ];
      parent.add(
        new THREE.Mesh(GeometryHelpers.createCurvedTimber(lowerRail, 0.08, 0.08, 16), darkMat)
      );
    });

    // Beakhead grating platform
    const grateLen = this.h.bowOverhang * 0.78;
    const grateGeo = new THREE.BoxGeometry(0.9, 0.08, grateLen);
    const grate = new THREE.Mesh(grateGeo, oakMat);
    grate.position.set(0, baseY + 0.28, stemZ + grateLen * 0.48);
    grate.rotation.x = -0.14;
    parent.add(grate);

    // Gilded Golden Hind figurehead at the beakhead tip
    const figGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.52, 6, 10), goldMat);
    body.rotation.x = Math.PI * 0.32;
    figGroup.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), goldMat);
    head.position.set(0, 0.32, 0.26);
    figGroup.add(head);
    figGroup.position.set(0, tipY + 0.18, tipZ + 0.1);
    parent.add(figGroup);
  }

  _buildGunports(parent) {
    const darkMat = this.materials.get('darkTimber');
    const crimsonMat = this.materials.get('crimsonTrim');
    const count = this.h.gunportsPerSide;

    [-1, 1].forEach((side) => {
      for (let i = 0; i < count; i++) {
        const u = CoordinateSystem.lerp(0.28, 0.72, i / Math.max(1, count - 1));
        const v = 0.66;
        const pt = this.lines.getHullPoint(u, v, side);

        const port = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.48), darkMat);
        port.add(frame);

        // Hinged port lid raised open
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.44), crimsonMat);
        lid.position.set(side * 0.2, 0.28, 0);
        lid.rotation.z = side * -0.95;
        port.add(lid);

        port.position.set(pt.x + side * 0.02, pt.y, pt.z);
        parent.add(port);
      }
    });
  }
}
