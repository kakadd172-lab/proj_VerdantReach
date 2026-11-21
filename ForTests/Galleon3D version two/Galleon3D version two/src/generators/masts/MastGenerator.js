import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

/**
 * Generates the Golden Hind 3-mast + bowsprit spar assembly:
 *  - Foremast, Mainmast, Mizzenmast with historical rope woolding bands
 *  - Fighting tops (Mars) on fore & main masts
 *  - Articulated yardarm pivots for wind bracing
 *  - Lateen mizzen yard & bowsprit spritsail yard
 */
export class MastGenerator {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
    this.m = config.masts;
    this.anchors = {};
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'MastsAssembly';
    this.anchors = {};

    const sparMat = this.materials.get('sparWood');
    const darkMat = this.materials.get('darkTimber');

    // Foremast & Mainmast (square-rigged: lower mast + topmast + 2 yards)
    ['fore', 'main'].forEach((key) => {
      const spec = this.m[key];
      const z = CoordinateSystem.stationToZ(spec.station, this.h.length);
      const stepY = this.lines.getSheerY(spec.station) - 1.2;
      const rake = key === 'fore' ? 0.02 : -0.04;

      const mastGroup = new THREE.Group();
      mastGroup.position.set(0, stepY, z);
      mastGroup.rotation.x = rake;

      const lowerH = spec.height * 0.58;
      const topH = spec.height * 0.44;

      // Lower mast
      const lowerMesh = new THREE.Mesh(
        GeometryHelpers.createTaperedSpar(spec.baseRadius, spec.baseRadius * 0.72, lowerH, 12),
        sparMat
      );
      lowerMesh.castShadow = true;
      mastGroup.add(lowerMesh);

      // Black rope woolding bands (distinctive in Golden Hind 4K & 1:100 blueprints)
      for (let w = 0; w < 5; w++) {
        const wy = lowerH * (0.28 + w * 0.13);
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(spec.baseRadius * 0.96, spec.baseRadius * 0.96, 0.14, 12),
          darkMat
        );
        band.position.y = wy;
        mastGroup.add(band);
      }

      // Fighting Top (Mars)
      const topR = key === 'main' ? 1.15 : 0.95;
      const fightingTop = new THREE.Mesh(
        new THREE.CylinderGeometry(topR, topR * 0.76, 0.24, 12),
        darkMat
      );
      fightingTop.position.y = lowerH;
      fightingTop.castShadow = true;
      mastGroup.add(fightingTop);

      // Topmast
      const topMesh = new THREE.Mesh(
        GeometryHelpers.createTaperedSpar(spec.baseRadius * 0.6, spec.baseRadius * 0.25, topH, 10),
        sparMat
      );
      topMesh.position.set(0, lowerH, 0.14);
      topMesh.castShadow = true;
      mastGroup.add(topMesh);

      // Articulated Yardarms
      const yards = [];
      const courseSpan = key === 'main' ? 11.4 : 9.4;
      const topSpan = key === 'main' ? 7.6 : 6.2;

      const courseYard = this._createYard(courseSpan, spec.baseRadius * 0.55, sparMat);
      courseYard.position.set(0, lowerH * 0.86, 0.26);
      mastGroup.add(courseYard);
      yards.push({
        name: `${key}Course`,
        pivotGroup: courseYard,
        span: courseSpan,
        drop: lowerH * 0.52,
        center: new THREE.Vector3(0, stepY + lowerH * 0.86, z + 0.26),
        isLateen: false,
      });

      const topYard = this._createYard(topSpan, spec.baseRadius * 0.38, sparMat);
      topYard.position.set(0, lowerH + topH * 0.68, 0.32);
      mastGroup.add(topYard);
      yards.push({
        name: `${key}Topsail`,
        pivotGroup: topYard,
        span: topSpan,
        drop: topH * 0.58,
        center: new THREE.Vector3(0, stepY + lowerH + topH * 0.68, z + 0.32),
        isLateen: false,
      });

      group.add(mastGroup);
      this.anchors[key] = {
        station: spec.station,
        z,
        stepY,
        lowerTopY: stepY + lowerH,
        mastheadY: stepY + lowerH + topH,
        topRadius: topR,
        yards,
      };
    });

    // Mizzenmast (lateen-rigged on quarterdeck)
    {
      const spec = this.m.mizzen;
      const z = CoordinateSystem.stationToZ(spec.station, this.h.length);
      const stepY = this.lines.getSheerY(spec.station) + 0.2;

      const mizzenGroup = new THREE.Group();
      mizzenGroup.position.set(0, stepY, z);
      mizzenGroup.rotation.x = -0.06;

      const mastMesh = new THREE.Mesh(
        GeometryHelpers.createTaperedSpar(spec.baseRadius, spec.baseRadius * 0.42, spec.height, 10),
        sparMat
      );
      mastMesh.castShadow = true;
      mizzenGroup.add(mastMesh);

      // Lateen yard (angled fore-and-aft)
      const lateenPivot = new THREE.Group();
      lateenPivot.position.set(0.18, spec.height * 0.64, 0);
      const lateenLen = 11.2;
      const lateenSpar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.11, lateenLen, 8),
        sparMat
      );
      lateenSpar.rotation.x = Math.PI * 0.28;
      lateenPivot.add(lateenSpar);
      mizzenGroup.add(lateenPivot);

      group.add(mizzenGroup);
      this.anchors.mizzen = {
        station: spec.station,
        z,
        stepY,
        lowerTopY: stepY + spec.height * 0.68,
        mastheadY: stepY + spec.height,
        topRadius: 0.4,
        yards: [
          {
            name: 'mizzenLateen',
            pivotGroup: lateenPivot,
            span: lateenLen,
            drop: spec.height * 0.46,
            center: new THREE.Vector3(0.18, stepY + spec.height * 0.64, z),
            isLateen: true,
          },
        ],
      };
    }

    // Bowsprit & Spritsail Yard
    {
      const spec = this.m.bowsprit;
      const z = CoordinateSystem.stationToZ(0.94, this.h.length);
      const baseY = this.lines.getSheerY(0.94) + 1.05;
      const angleRad = THREE.MathUtils.degToRad(spec.angle);

      const bsGroup = new THREE.Group();
      bsGroup.position.set(0, baseY, z);

      const bsPivot = new THREE.Group();
      bsPivot.rotation.x = Math.PI * 0.5 - angleRad;

      const bsMesh = new THREE.Mesh(
        GeometryHelpers.createTaperedSpar(spec.baseRadius, spec.baseRadius * 0.42, spec.length, 10),
        sparMat
      );
      bsMesh.castShadow = true;
      bsPivot.add(bsMesh);
      bsGroup.add(bsPivot);

      // Spritsail yard slung beneath bowsprit
      const yardDist = spec.length * 0.72;
      const yardY = baseY + Math.sin(angleRad) * yardDist - 0.25;
      const yardZ = z + Math.cos(angleRad) * yardDist;

      const spritPivot = new THREE.Group();
      spritPivot.position.set(0, yardY, yardZ);
      const spritSpan = 5.6;
      const spritYard = this._createYard(spritSpan, 0.09, sparMat);
      spritPivot.add(spritYard);
      group.add(spritPivot);
      group.add(bsGroup);

      const tipY = baseY + Math.sin(angleRad) * spec.length;
      const tipZ = z + Math.cos(angleRad) * spec.length;

      this.anchors.bowsprit = {
        base: new THREE.Vector3(0, baseY, z),
        tip: new THREE.Vector3(0, tipY, tipZ),
        yardPivotGroup: spritPivot,
        yardCenter: new THREE.Vector3(0, yardY, yardZ),
        yardHalfSpan: spritSpan * 0.5,
      };
    }

    return group;
  }

  _createYard(span, radius, material) {
    const pivot = new THREE.Group();
    const half = span * 0.5;
    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(
        GeometryHelpers.createTaperedSpar(radius, radius * 0.52, half, 8),
        material
      );
      arm.rotation.z = side * -Math.PI * 0.5;
      arm.castShadow = true;
      pivot.add(arm);
    });
    return pivot;
  }

  getAnchors() {
    return this.anchors;
  }
}
