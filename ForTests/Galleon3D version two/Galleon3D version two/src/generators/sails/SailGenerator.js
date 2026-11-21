import * as THREE from 'three';

/**
 * Generates billowing square sails (courses + bonnets, topsails, spritsail)
 * and the triangular lateen mizzen sail, bound directly to each yard's `pivotGroup`
 * so sails rotate cleanly with yardarm wind bracing.
 */
export class SailGenerator {
  constructor(config, materials, linesEngine, mastAnchors) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.anchors = mastAnchors || {};
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'SailsAssembly';

    const state = this.config.sails.deployment;
    if (state === 'none') return group;

    const sailMat = this.materials.get('sailCanvas');
    const darkMat = this.materials.get('darkTimber');

    // Attach square & lateen sails to their yard pivots
    ['fore', 'main', 'mizzen'].forEach((key) => {
      const mData = this.anchors[key];
      if (!mData || !mData.yards) return;

      mData.yards.forEach((yard) => {
        // Clear any previous sail child on the yard pivot
        for (let i = yard.pivotGroup.children.length - 1; i >= 0; i--) {
          const ch = yard.pivotGroup.children[i];
          if (ch.userData && ch.userData.isSail) {
            yard.pivotGroup.remove(ch);
          }
        }

        if (state === 'furled') {
          const furled = this._createFurledSail(yard.span * 0.88, sailMat, darkMat);
          furled.userData.isSail = true;
          if (yard.isLateen) furled.rotation.y = Math.PI * 0.5;
          yard.pivotGroup.add(furled);
          return;
        }

        const dropScale =
          state === 'half' ? 0.56 : state === 'battle' ? (yard.name.includes('Top') ? 0.85 : 0.42) : 1.0;

        if (yard.isLateen) {
          const lateen = this._createLateenSail(yard.span * 0.85, yard.drop * dropScale, sailMat);
          lateen.userData.isSail = true;
          yard.pivotGroup.add(lateen);
        } else {
          const sq = this._createBillowingSquareSail(
            yard.span * 0.88,
            yard.drop * dropScale,
            this.config.sails.billow,
            sailMat
          );
          sq.userData.isSail = true;
          yard.pivotGroup.add(sq);
        }
      });
    });

    // Bowsprit Spritsail
    if (this.anchors.bowsprit && this.anchors.bowsprit.yardPivotGroup) {
      const bsPivot = this.anchors.bowsprit.yardPivotGroup;
      for (let i = bsPivot.children.length - 1; i >= 0; i--) {
        if (bsPivot.children[i].userData && bsPivot.children[i].userData.isSail) {
          bsPivot.remove(bsPivot.children[i]);
        }
      }
      if (state !== 'furled' && state !== 'battle') {
        const spritSail = this._createBillowingSquareSail(
          this.anchors.bowsprit.yardHalfSpan * 1.75,
          state === 'half' ? 1.8 : 2.9,
          this.config.sails.billow * 0.75,
          sailMat
        );
        spritSail.userData.isSail = true;
        bsPivot.add(spritSail);
      }
    }

    return group;
  }

  _createBillowingSquareSail(width, height, billow, material) {
    const segX = 12;
    const segY = 10;
    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = x / (width * 0.5); // -1..1
      const ny = (y + height * 0.5) / height; // 0 (foot) .. 1 (head)

      // Slight trapezoidal taper toward head
      const taper = 1.0 - ny * 0.08;
      pos.setX(i, x * taper);

      // Billow forward (+Z) peaking at middle
      const curveX = Math.cos(nx * Math.PI * 0.5);
      const curveY = Math.sin(ny * Math.PI);
      const z = curveX * curveY * billow;
      pos.setZ(i, z);
    }

    geo.translate(0, -height * 0.5, 0);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  _createLateenSail(yardLen, drop, material) {
    const shape = new THREE.Shape();
    shape.moveTo(0, yardLen * 0.32);
    shape.lineTo(0, -yardLen * 0.42);
    shape.lineTo(-drop, -yardLen * 0.12);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape, 8);
    geo.rotateY(Math.PI * 0.5);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    return mesh;
  }

  _createFurledSail(width, sailMat, darkMat) {
    const furledGroup = new THREE.Group();
    const roll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, width, 10),
      sailMat
    );
    roll.rotation.z = Math.PI * 0.5;
    roll.position.y = -0.14;
    furledGroup.add(roll);

    // Gaskets / ties
    for (let i = -3; i <= 3; i++) {
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 5, 10), darkMat);
      tie.rotation.y = Math.PI * 0.5;
      tie.position.set((i / 3.5) * (width * 0.45), -0.14, 0);
      furledGroup.add(tie);
    }
    return furledGroup;
  }
}
