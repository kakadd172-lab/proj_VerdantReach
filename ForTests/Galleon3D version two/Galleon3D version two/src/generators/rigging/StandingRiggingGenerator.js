import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

/**
 * Generates Standing Rigging:
 *  - External wooden channels & deadeyes
 *  - Lower & topmast shrouds with horizontal ratline ladders
 *  - Forestay, mainstay, mizzenstay, and bowsprit bobstay
 */
export class StandingRiggingGenerator {
  constructor(config, materials, linesEngine, mastAnchors) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.anchors = mastAnchors || {};
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'StandingRiggingAssembly';

    const ropeMat = this.materials.get('hempRope');
    const darkMat = this.materials.get('darkTimber');
    const ropeR = this.config.rigging.ropeThickness;

    // 1. Shrouds, Channels, Deadeyes & Ratlines
    ['fore', 'main', 'mizzen'].forEach((key) => {
      const mData = this.anchors[key];
      if (!mData) return;

      const shroudCount = this.config.rigging.shroudsPerSide[key] || 4;
      const uStart = mData.station - 0.09;
      const uEnd = mData.station + 0.02;
      const chanY = this.lines.getBulwarkTopY(mData.station) - 0.35;

      [-1, 1].forEach((side) => {
        // Channel shelf
        const chanZ = CoordinateSystem.stationToZ((uStart + uEnd) * 0.5, this.h.length);
        const chanX = side * (Math.abs(this.lines.getHullPoint(mData.station, 0.88, 1).x) + 0.16);
        const channel = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.1, shroudCount * 0.42),
          darkMat
        );
        channel.position.set(chanX, chanY, chanZ);
        group.add(channel);

        const shroudBottoms = [];
        const shroudTop = new THREE.Vector3(side * 0.28, mData.lowerTopY - 0.1, mData.z);

        for (let s = 0; s < shroudCount; s++) {
          const su = CoordinateSystem.lerp(uStart, uEnd, s / Math.max(1, shroudCount - 1));
          const sz = CoordinateSystem.stationToZ(su, this.h.length);
          const sx = side * (Math.abs(this.lines.getHullPoint(su, 0.88, 1).x) + 0.24);
          const bot = new THREE.Vector3(sx, chanY + 0.08, sz);
          shroudBottoms.push(bot);

          // Deadeye
          const deadeye = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), darkMat);
          deadeye.rotation.z = Math.PI * 0.5;
          deadeye.position.copy(bot);
          group.add(deadeye);

          // Shroud line
          const shroudGeo = GeometryHelpers.createRopeSegment(bot, shroudTop, ropeR, 0.03, 6);
          group.add(new THREE.Mesh(shroudGeo, ropeMat));
        }

        // Ratline rungs between first and last shroud
        if (shroudBottoms.length >= 2) {
          const first = shroudBottoms[0];
          const last = shroudBottoms[shroudBottoms.length - 1];
          const rungs = Math.floor((shroudTop.y - chanY) / this.config.rigging.ratlineSpacing);
          for (let r = 1; r < rungs - 1; r++) {
            const t = r / rungs;
            const pA = first.clone().lerp(shroudTop, t);
            const pB = last.clone().lerp(shroudTop, t);
            const rungGeo = GeometryHelpers.createRopeSegment(pA, pB, ropeR * 0.55, 0.01, 4);
            group.add(new THREE.Mesh(rungGeo, ropeMat));
          }
        }
      });
    });

    // 2. Longitudinal Stays (Forestay, Mainstay, Mizzenstay, Bobstay)
    const { fore, main, mizzen, bowsprit } = this.anchors;
    if (fore && bowsprit) {
      const fStay = GeometryHelpers.createRopeSegment(
        new THREE.Vector3(0, fore.lowerTopY, fore.z),
        bowsprit.yardCenter.clone().add(new THREE.Vector3(0, 0.4, 0)),
        ropeR * 1.4,
        0.15,
        10
      );
      group.add(new THREE.Mesh(fStay, ropeMat));

      const fTopStay = GeometryHelpers.createRopeSegment(
        new THREE.Vector3(0, fore.mastheadY - 0.6, fore.z),
        bowsprit.tip,
        ropeR * 1.1,
        0.18,
        10
      );
      group.add(new THREE.Mesh(fTopStay, ropeMat));
    }

    if (main && fore) {
      const mStay = GeometryHelpers.createRopeSegment(
        new THREE.Vector3(0, main.lowerTopY, main.z),
        new THREE.Vector3(0, fore.stepY + 1.8, fore.z),
        ropeR * 1.5,
        0.18,
        10
      );
      group.add(new THREE.Mesh(mStay, ropeMat));
    }

    if (mizzen && main) {
      const mzStay = GeometryHelpers.createRopeSegment(
        new THREE.Vector3(0, mizzen.lowerTopY, mizzen.z),
        new THREE.Vector3(0, main.stepY + 1.8, main.z),
        ropeR * 1.2,
        0.14,
        10
      );
      group.add(new THREE.Mesh(mzStay, ropeMat));
    }

    if (bowsprit) {
      const stemZ = CoordinateSystem.stationToZ(1.0, this.h.length);
      const bobstay = GeometryHelpers.createRopeSegment(
        new THREE.Vector3(0, -0.3, stemZ + 0.5),
        bowsprit.tip.clone().lerp(bowsprit.base, 0.25),
        ropeR * 1.4,
        0.04,
        8
      );
      group.add(new THREE.Mesh(bobstay, ropeMat));
    }

    return group;
  }
}
