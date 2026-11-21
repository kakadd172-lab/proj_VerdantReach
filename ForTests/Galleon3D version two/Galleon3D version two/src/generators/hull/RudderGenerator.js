import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Generates the raked pintle-and-gudgeon rudder hung on the sternpost,
 * wrapped in a named `RudderAssembly` pivot for live steering kinematics.
 */
export class RudderGenerator {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'RudderRoot';

    const darkMat = this.materials.get('darkTimber');
    const ironMat = this.materials.get('agedIron');

    const sternZ = CoordinateSystem.stationToZ(0.0, this.h.length) - 0.42;
    const keelY = this.lines.getKeelBottomY(0.0);
    const topY = this.lines.getSheerY(0.0) + 0.35;
    const rudderHeight = topY - keelY;

    const rudderPivot = new THREE.Group();
    rudderPivot.name = 'RudderAssembly';
    rudderPivot.position.set(0, keelY, sternZ);

    // Tapered rudder blade (wider below waterline)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-0.95, 0.08);
    shape.lineTo(-0.82, rudderHeight * 0.55);
    shape.lineTo(-0.42, rudderHeight);
    shape.lineTo(0, rudderHeight);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    // Rotate so blade extends aft (-Z) and thickness is along X
    geo.rotateY(Math.PI * 0.5);
    geo.translate(-0.09, 0, 0);

    const blade = new THREE.Mesh(geo, darkMat);
    blade.castShadow = true;
    rudderPivot.add(blade);

    // Iron pintle & gudgeon straps
    for (let i = 0; i < 4; i++) {
      const sy = (i + 0.4) * (rudderHeight / 4.2);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.55), ironMat);
      strap.position.set(0, sy, -0.22);
      rudderPivot.add(strap);
    }

    group.add(rudderPivot);
    return group;
  }
}
