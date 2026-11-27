import * as THREE from 'three';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

export class RudderGenerator {
  constructor(c, m, l) { this.h = c.hull; this.materials = m; this.lines = l; }
  generate() {
    const g = new THREE.Group();
    const oakMat = this.materials.get('weatheredOak'), darkMat = this.materials.get('darkTimber'),
          tarMat = this.materials.get('tarredHull'), ironMat = this.materials.get('agedIron'),
          crimMat = this.materials.get('crimsonTrim'), ropeMat = this.materials.get('hempRope');

    const pHeel = this.lines.getHullPoint(0, 0.0, 0);
    const pHelm = this.lines.getHullPoint(0, 0.48, 0);
    const kY = this.lines.getKeelBottomY(0), rH = pHelm.y - kY;
    const rakeAngle = Math.atan2(pHelm.z - pHeel.z, rH);

    // Fixed Helmport Collar Arch at stern counter entry
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 6, 12, Math.PI), crimMat);
    collar.position.set(0, pHelm.y - 0.04, pHelm.z - 0.22);
    collar.rotation.x = -0.35;
    g.add(collar);

    // Articulated Rudder Assembly
    const pivot = new THREE.Group(); pivot.name = 'RudderAssembly';
    pivot.position.set(0, kY, pHeel.z - 0.10);

    // 1. Main Oak Rudder Stock & Upper Blade (above waterline)
    const waterSplit = Math.min(0.68, Math.max(0.35, -kY / rH));
    const upperShape = new THREE.Shape();
    upperShape.moveTo(0, rH * waterSplit);
    upperShape.lineTo(0.86, rH * waterSplit);
    upperShape.lineTo(0.62, rH * 0.85);
    upperShape.lineTo(0.42, rH);
    upperShape.lineTo(0, rH);
    upperShape.closePath();
    const upperGeo = new THREE.ExtrudeGeometry(upperShape, { depth: 0.20, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 });
    upperGeo.rotateY(Math.PI * 0.5); upperGeo.translate(-0.10, 0, 0);
    const upperBlade = new THREE.Mesh(upperGeo, oakMat); upperBlade.castShadow = true; pivot.add(upperBlade);

    // 2. Tarred Lower Rudder Blade (below waterline)
    const lowerShape = new THREE.Shape();
    lowerShape.moveTo(0, 0);
    lowerShape.lineTo(1.16, 0.05);
    lowerShape.lineTo(0.98, rH * waterSplit * 0.55);
    lowerShape.lineTo(0.86, rH * waterSplit);
    lowerShape.lineTo(0, rH * waterSplit);
    lowerShape.closePath();
    const lowerGeo = new THREE.ExtrudeGeometry(lowerShape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 });
    lowerGeo.rotateY(Math.PI * 0.5); lowerGeo.translate(-0.11, 0, 0);
    const lowerBlade = new THREE.Mesh(lowerGeo, tarMat); lowerBlade.castShadow = true; pivot.add(lowerBlade);

    // 3. Beveled Timber Afterpiece Spine & Rounded Rudder Head
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, rH + 0.12, 8), darkMat);
    spine.position.set(0, rH * 0.5, -0.06); pivot.add(spine);

    // 4. Five Forged Iron Pintle & Gudgeon Hinge Straps wrapping port & starboard
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.35) / 5.2;
      const sy = t * rH;
      const strapLen = CoordinateSystem.lerp(0.95, 0.45, t);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, strapLen), ironMat);
      strap.position.set(0, sy, -strapLen * 0.45 + 0.06);
      pivot.add(strap);
      const pintle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 6), ironMat);
      pintle.position.set(0, sy, 0.04);
      pivot.add(pintle);
    }

    // 5. Rudder Preventer Chains (curving from aft blade eye forward to stern quarters)
    const eyeY = rH * 0.55, eyeZ = -0.82;
    const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 10), ironMat);
    eyeRing.position.set(0, eyeY, eyeZ); eyeRing.rotation.y = Math.PI * 0.5; pivot.add(eyeRing);

    pivot.rotation.x = rakeAngle;
    g.add(pivot);

    // Preventer chains anchored to hull quarters
    [-1, 1].forEach((side) => {
      const pStart = new THREE.Vector3(0, kY + eyeY * Math.cos(rakeAngle), pHeel.z - 0.10 + eyeY * Math.sin(rakeAngle) + eyeZ * Math.cos(rakeAngle));
      const pEnd = this.lines.getHullPoint(0.06, 0.55, side);
      pEnd.x += side * 0.06;
      g.add(new THREE.Mesh(GeometryHelpers.createRopeSegment(pStart, pEnd, 0.022, 0.22, 8), ironMat));
    });

    return g;
  }
}
