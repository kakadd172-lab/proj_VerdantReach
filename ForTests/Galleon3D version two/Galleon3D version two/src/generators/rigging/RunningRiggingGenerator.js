import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Generates dynamic Running Rigging (yardarm braces) that stay continuously
 * attached to rotating `yard.pivotGroup` tips during wind bracing, plus deck
 * belaying cleats and coiled hemp falls.
 */
export class RunningRiggingGenerator {
  constructor(config, materials, linesEngine, mastAnchors) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.anchors = mastAnchors || {};
    this.h = config.hull;
    this.dynamicBraces = [];
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'RunningRiggingAssembly';
    this.dynamicBraces = [];

    const ropeMat = this.materials.get('hempRope');
    const darkMat = this.materials.get('darkTimber');

    ['fore', 'main'].forEach((key) => {
      const mData = this.anchors[key];
      if (!mData || !mData.yards) return;

      mData.yards.forEach((yard) => {
        if (yard.isLateen) return;
        [-1, 1].forEach((side) => {
          const belayU = THREE.MathUtils.clamp(mData.station - 0.14, 0.05, 0.92);
          const belayZ = CoordinateSystem.stationToZ(belayU, this.h.length);
          const belayY = this.lines.getBulwarkTopY(belayU) - 0.1;
          const belayX = side * Math.abs(this.lines.getHullPoint(belayU, 0.94, 1).x) * 0.92;
          const deckAnchor = new THREE.Vector3(belayX, belayY, belayZ);

          const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.2), darkMat);
          cleat.position.copy(deckAnchor);
          group.add(cleat);

          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            yard.center.clone(),
            deckAnchor.clone(),
          ]);
          const braceLine = new THREE.Line(
            lineGeo,
            new THREE.LineBasicMaterial({ color: 0xa88b63, transparent: true, opacity: 0.85 })
          );
          braceLine.frustumCulled = false;
          group.add(braceLine);

          this.dynamicBraces.push({ yard, side, deckAnchor, lineGeo });
        });
      });
    });

    // Bowsprit spritsail yard braces
    if (this.anchors.bowsprit && this.anchors.bowsprit.yardPivotGroup) {
      const bs = this.anchors.bowsprit;
      [-1, 1].forEach((side) => {
        const belayU = 0.82;
        const belayZ = CoordinateSystem.stationToZ(belayU, this.h.length);
        const belayY = this.lines.getBulwarkTopY(belayU);
        const belayX = side * Math.abs(this.lines.getHullPoint(belayU, 0.94, 1).x) * 0.92;
        const deckAnchor = new THREE.Vector3(belayX, belayY, belayZ);

        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          bs.yardCenter.clone(),
          deckAnchor.clone(),
        ]);
        const braceLine = new THREE.Line(
          lineGeo,
          new THREE.LineBasicMaterial({ color: 0xa88b63, transparent: true, opacity: 0.85 })
        );
        braceLine.frustumCulled = false;
        group.add(braceLine);

        this.dynamicBraces.push({
          yard: { pivotGroup: bs.yardPivotGroup, span: bs.yardHalfSpan * 2 },
          side,
          deckAnchor,
          lineGeo,
        });
      });
    }

    // Coiled rope falls along the waist fife rails
    [0.66, 0.46].forEach((u) => {
      const z = CoordinateSystem.stationToZ(u, this.h.length);
      const y = this.lines.getSheerY(u) + 0.08;
      [-0.85, 0.85].forEach((x) => {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 6, 12), ropeMat);
        coil.rotation.x = Math.PI * 0.5;
        coil.position.set(x, y, z);
        group.add(coil);
      });
    });

    return group;
  }

  update(rootMatrixWorldInverse) {
    if (!this.dynamicBraces.length) return;
    const tipLocal = new THREE.Vector3();
    const tipWorld = new THREE.Vector3();

    for (let i = 0; i < this.dynamicBraces.length; i++) {
      const b = this.dynamicBraces[i];
      if (!b.yard.pivotGroup) continue;
      b.yard.pivotGroup.updateWorldMatrix(true, false);
      tipLocal.set(b.side * b.yard.span * 0.48, 0, 0);
      tipWorld.copy(tipLocal).applyMatrix4(b.yard.pivotGroup.matrixWorld);
      if (rootMatrixWorldInverse) {
        tipWorld.applyMatrix4(rootMatrixWorldInverse);
      }
      const pos = b.lineGeo.attributes.position;
      pos.setXYZ(0, tipWorld.x, tipWorld.y, tipWorld.z);
      pos.setXYZ(1, b.deckAnchor.x, b.deckAnchor.y, b.deckAnchor.z);
      pos.needsUpdate = true;
    }
  }
}
