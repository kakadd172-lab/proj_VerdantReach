import * as THREE from 'three';
import { GeometryHelpers } from '../../utils/GeometryHelpers.js';

export class RunningRiggingGenerator {
  constructor(c, m, l, a) { this.h = c.hull; this.materials = m; this.lines = l; this.anchors = a || {}; this.dynamicBraces = []; }
  generate() {
    const g = new THREE.Group(); g.name = 'RunningRiggingAssembly'; this.dynamicBraces = [];
    ['fore', 'main'].forEach((k) => {
      const md = this.anchors[k]; if (!md || !md.yards) return;
      md.yards.forEach((yard) => {
        [-1, 1].forEach((side) => {
          const bu = THREE.MathUtils.clamp(md.station - 0.14, 0.05, 0.92), bz = CoordinateSystem.stationToZ(bu, this.h.length);
          const by = this.lines.getBulwarkTopY(bu) - 0.1, bx = side * Math.abs(this.lines.getHullPoint(bu, 0.94, 1).x) * 0.92;
          const deckAnchor = new THREE.Vector3(bx, by, bz);
          const lineGeo = new THREE.BufferGeometry().setFromPoints([yard.center.clone(), deckAnchor.clone()]);
          const braceLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xa88b63, transparent: true, opacity: 0.85 }));
          braceLine.frustumCulled = false; g.add(braceLine);
          this.dynamicBraces.push({ yard, side, deckAnchor, lineGeo });
        });
      });
    });
    return g;
  }
  update(inv) {
    const tipL = new THREE.Vector3(), tipW = new THREE.Vector3();
    for (let i = 0; i < this.dynamicBraces.length; i++) {
      const b = this.dynamicBraces[i]; if (!b.yard.pivotGroup) continue;
      b.yard.pivotGroup.updateWorldMatrix(true, false);
      tipL.set(b.side * b.yard.span * 0.48, 0, 0);
      tipW.copy(tipL).applyMatrix4(b.yard.pivotGroup.matrixWorld);
      if (inv) tipW.applyMatrix4(inv);
      const pos = b.lineGeo.attributes.position;
      pos.setXYZ(0, tipW.x, tipW.y, tipW.z); pos.setXYZ(1, b.deckAnchor.x, b.deckAnchor.y, b.deckAnchor.z);
      pos.needsUpdate = true;
    }
  }
}
