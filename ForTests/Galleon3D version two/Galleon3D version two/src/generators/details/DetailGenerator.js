import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

/**
 * Generates authentic Golden Hind (c. 1575) deck fittings & ornamentation:
 *  - Single central octagonal stern poop lantern with toggleable PointLight
 *  - Bower anchors slung at bow catheads with animated drop/weigh kinematics
 *  - Waist capstan & bilge pump (Pumpe)
 *  - Quarterdeck Whipstaff helm assembly (`HelmWhipstaffAssembly`)
 *  - Stowed clinker ship's longboat (Boot) on chocks amidships
 *  - Oak cargo barrels, ship's bell belfry, and fluttering Tudor/St. George flags
 */
export class DetailGenerator {
  constructor(config, materials, linesEngine, mastAnchors) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.anchors = mastAnchors || {};
    this.h = config.hull;

    this.lanternLight = null;
    this.lanternGlassMat = null;
    this.anchorAssemblies = [];
    this.flags = [];
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'DetailsAssembly';

    const goldMat = this.materials.get('goldLeaf');
    const ironMat = this.materials.get('agedIron');
    const oakMat = this.materials.get('weatheredOak');
    const darkMat = this.materials.get('darkTimber');
    const ropeMat = this.materials.get('hempRope');
    const crimsonMat = this.materials.get('crimsonTrim');

    this._buildCentralPoopLantern(group, goldMat);
    this._buildAnchors(group, ironMat, darkMat, ropeMat);
    this._buildCapstanPumpAndWhipstaff(group, oakMat, darkMat, goldMat);
    this._buildShipsBoat(group, oakMat, darkMat);
    this._buildBarrelsAndBell(group, oakMat, ironMat, goldMat);
    this._buildFlagsAndPennants(group, crimsonMat, goldMat);

    return group;
  }

  _buildCentralPoopLantern(parent, goldMat) {
    this.lanternGlassMat = this.materials.get('lanternGlass');
    const sternZ = CoordinateSystem.stationToZ(0.0, this.h.length) - 0.35;
    const poopTopY = this.lines.getSheerY(0.0) + 2.5;

    const lantern = new THREE.Group();
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.55, 8), goldMat);
    bracket.rotation.x = 0.5;
    bracket.position.set(0, 0.2, -0.18);
    lantern.add(bracket);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.52, 8), this.lanternGlassMat);
    core.position.set(0, 0.54, -0.35);
    lantern.add(core);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.28, 8), goldMat);
    cap.position.set(0, 0.92, -0.35);
    lantern.add(cap);

    const base = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 8), goldMat);
    base.rotation.x = Math.PI;
    base.position.set(0, 0.2, -0.35);
    lantern.add(base);

    this.lanternLight = new THREE.PointLight(0xffaa44, 2.2, 16);
    this.lanternLight.position.set(0, 0.54, -0.55);
    lantern.add(this.lanternLight);

    lantern.position.set(0, poopTopY, sternZ);
    parent.add(lantern);
  }

  setLanternsLit(lit) {
    if (this.lanternLight) this.lanternLight.intensity = lit ? 2.2 : 0.0;
    if (this.lanternGlassMat) this.lanternGlassMat.emissiveIntensity = lit ? 1.4 : 0.05;
  }

  _buildAnchors(parent, ironMat, darkMat, ropeMat) {
    this.anchorAssemblies = [];
    const u = 0.87;
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const sheerY = this.lines.getSheerY(u) + 0.5;

    [-1, 1].forEach((side) => {
      const hullX = Math.abs(this.lines.getHullPoint(u, 0.85, 1).x);

      // Cathead beam
      const cathead = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.18), darkMat);
      cathead.position.set(side * (hullX + 0.15), sheerY + 0.95, z + 0.2);
      parent.add(cathead);

      const anchor = new THREE.Group();
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.85, 8), ironMat);
      anchor.add(shank);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.15, 0.16), darkMat);
      stock.position.set(0, 0.72, 0);
      anchor.add(stock);

      const armPts = [
        new THREE.Vector3(-0.68, -0.58, 0),
        new THREE.Vector3(-0.38, -0.9, 0),
        new THREE.Vector3(0, -0.98, 0),
        new THREE.Vector3(0.38, -0.9, 0),
        new THREE.Vector3(0.68, -0.58, 0),
      ];
      const arms = new THREE.Mesh(
        GeometryHelpers.createCurvedTimber(armPts, 0.1, 0.11, 14),
        ironMat
      );
      anchor.add(arms);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 14), ironMat);
      ring.position.set(0, 1.0, 0);
      anchor.add(ring);

      const stowedY = sheerY - 0.15;
      anchor.position.set(side * (hullX + 0.32), stowedY, z);
      anchor.rotation.z = side * 0.15;
      anchor.rotation.y = side * (Math.PI * 0.5);
      parent.add(anchor);

      this.anchorAssemblies.push({ mesh: anchor, stowedY, side });

      const cable = GeometryHelpers.createRopeSegment(
        new THREE.Vector3(side * (hullX + 0.32), sheerY + 0.85, z),
        new THREE.Vector3(side * (hullX - 0.05), sheerY + 0.25, z + 0.9),
        0.035,
        0.16,
        8
      );
      parent.add(new THREE.Mesh(cable, ropeMat));
    });
  }

  updateAnchors(progress = 0) {
    this.anchorAssemblies.forEach((a, idx) => {
      if (idx === 0) {
        // Drop starboard/port bower anchor
        a.mesh.position.y = a.stowedY - progress * 4.2;
      }
    });
  }

  _buildCapstanPumpAndWhipstaff(parent, oakMat, darkMat, goldMat) {
    // 1. Main Waist Capstan
    const capU = 0.55;
    const capZ = CoordinateSystem.stationToZ(capU, this.h.length);
    const capY = this.lines.getSheerY(capU) + 0.08;
    const capstan = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.8, 10), darkMat);
    barrel.position.y = 0.4;
    capstan.add(barrel);
    const drumhead = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 0.18, 10), oakMat);
    drumhead.position.y = 0.84;
    capstan.add(drumhead);
    capstan.position.set(0, capY, capZ);
    parent.add(capstan);

    // 2. Bilge Pump (Pumpe) aft of mainmast
    const pumpU = 0.44;
    const pumpZ = CoordinateSystem.stationToZ(pumpU, this.h.length);
    const pumpY = this.lines.getSheerY(pumpU) + 0.08;
    const pump = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.05, 8), darkMat);
    tube.position.y = 0.52;
    pump.add(tube);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.85), oakMat);
    handle.position.set(0, 1.02, 0.18);
    handle.rotation.x = 0.25;
    pump.add(handle);
    pump.position.set(0.65, pumpY, pumpZ);
    parent.add(pump);

    // 3. Quarterdeck Whipstaff (Kolderstock) per Golden Hind M 1:100 blueprint
    const helmU = 0.26;
    const helmZ = CoordinateSystem.stationToZ(helmU, this.h.length);
    const helmY = this.lines.getSheerY(helmU) + 1.24;

    const whipHousing = new THREE.Group();
    const binnacle = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.55), oakMat);
    binnacle.position.y = 0.32;
    whipHousing.add(binnacle);

    const whipPivot = new THREE.Group();
    whipPivot.name = 'HelmWhipstaffAssembly';
    whipPivot.position.set(0, 0.64, 0);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.25, 8), goldMat);
    staff.position.y = 0.55;
    whipPivot.add(staff);
    whipHousing.add(whipPivot);

    whipHousing.position.set(0, helmY, helmZ);
    parent.add(whipHousing);
  }

  _buildShipsBoat(parent, oakMat, darkMat) {
    // Clinker longboat (Boot) stowed on chocks in the waist
    const u = 0.64;
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const y = this.lines.getSheerY(u) + 0.45;

    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.5, 6, 10), oakMat);
    hull.rotation.x = Math.PI * 0.5;
    hull.scale.set(1.0, 1.0, 0.55);
    boat.add(hull);

    // Thwarts (benches)
    [-0.8, 0, 0.8].forEach((tz) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.22), darkMat);
      bench.position.set(0, 0.2, tz);
      boat.add(bench);
    });

    boat.position.set(0, y, z);
    parent.add(boat);
  }

  _buildBarrelsAndBell(parent, oakMat, ironMat, goldMat) {
    const u = 0.52;
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const y = this.lines.getSheerY(u) + 0.28;

    [-1.4, 1.4].forEach((x) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 10), oakMat);
      barrel.position.set(x, y, z);
      parent.add(barrel);
    });

    // Ship's bell belfry at forecastle edge
    const bU = 0.77;
    const bZ = CoordinateSystem.stationToZ(bU, this.h.length);
    const bY = this.lines.getSheerY(bU) + 1.42;
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 10), goldMat);
    bell.position.set(0, bY + 0.38, bZ);
    parent.add(bell);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.08), ironMat);
    post.position.set(0, bY + 0.25, bZ);
    parent.add(post);
  }

  _buildFlagsAndPennants(parent, crimsonMat, goldMat) {
    this.flags = [];

    // Mainmast Tudor Pennant
    if (this.anchors.main) {
      const flagGeo = new THREE.PlaneGeometry(2.4, 0.55, 10, 2);
      flagGeo.translate(1.2, 0, 0);
      const flag = new THREE.Mesh(flagGeo, crimsonMat);
      flag.position.set(0, this.anchors.main.mastheadY - 0.15, this.anchors.main.z);
      parent.add(flag);
      this.flags.push({ mesh: flag, basePos: flagGeo.attributes.position.array.slice(), phase: 0 });
    }

    // Stern Ensign
    const sternZ = CoordinateSystem.stationToZ(0.0, this.h.length) - 0.45;
    const sternY = this.lines.getSheerY(0.0) + 2.75;
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.2, 6), goldMat);
    staff.position.set(0, sternY + 0.9, sternZ);
    staff.rotation.x = -0.3;
    parent.add(staff);

    const ensignGeo = new THREE.PlaneGeometry(1.8, 1.0, 8, 4);
    ensignGeo.translate(0.9, 0, 0);
    const ensign = new THREE.Mesh(ensignGeo, crimsonMat);
    ensign.position.set(0, sternY + 1.35, sternZ - 0.25);
    parent.add(ensign);
    this.flags.push({ mesh: ensign, basePos: ensignGeo.attributes.position.array.slice(), phase: 1.5 });
  }

  updateFlags(elapsed, windStrength = 0.78, windAngleRad = 0.3) {
    this.flags.forEach((f) => {
      f.mesh.rotation.y = windAngleRad - Math.PI * 0.5;
      const pos = f.mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = f.basePos[i * 3];
        const wave = Math.sin(bx * 3.2 - elapsed * (4.0 + windStrength * 4.0) + f.phase) * 0.12 * (bx / 2.0);
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
    });
  }
}
