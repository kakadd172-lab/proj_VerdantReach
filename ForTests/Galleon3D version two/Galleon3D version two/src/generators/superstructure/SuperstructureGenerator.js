import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Generates the Elizabethan superstructure per Golden Hind blueprints:
 *  - Stepped transverse bulkheads at Forecastle, Quarterdeck, and Poop
 *  - Ornate raked transom stern with "E R" royal cipher & Tudor medallion
 *  - Side quarter-galleries (balustraded stern projections)
 *  - Companionway ladders connecting waist to quarterdeck & forecastle
 */
export class SuperstructureGenerator {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'SuperstructureAssembly';

    const oakMat = this.materials.get('weatheredOak');
    const darkMat = this.materials.get('darkTimber');
    const goldMat = this.materials.get('goldLeaf');
    const crestMat = this.materials.get('transomCrest');

    // 1. Forecastle aft bulkhead (u = 0.77)
    this._buildBulkhead(group, 0.77, this.lines.getSheerY(0.77), 1.35, oakMat, darkMat);

    // 2. Quarterdeck forward bulkhead (u = 0.43)
    this._buildBulkhead(group, 0.43, this.lines.getSheerY(0.43), 1.18, oakMat, darkMat);

    // 3. Poop deck forward bulkhead (u = 0.18)
    this._buildBulkhead(group, 0.18, this.lines.getSheerY(0.18) + 1.18, 1.14, oakMat, darkMat);

    // 4. Ornate Elizabethan Transom Stern (u = 0.0)
    const sternZ = CoordinateSystem.stationToZ(0.0, this.h.length) - 0.15;
    const sternBaseY = this.lines.getSheerY(0.0);
    const sternTopY = sternBaseY + 2.45;
    const halfW = Math.abs(this.lines.getHullPoint(0.0, 0.75, 1).x);

    const transomGroup = new THREE.Group();
    const transomPanel = new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 1.92, sternTopY - sternBaseY, 0.18),
      crestMat
    );
    transomPanel.position.set(0, (sternBaseY + sternTopY) * 0.5, sternZ);
    transomPanel.rotation.x = 0.14; // characteristic aft rake
    transomPanel.castShadow = true;
    transomGroup.add(transomPanel);

    // Transom taffrail arch
    const taffrail = new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 1.98, 0.18, 0.24),
      goldMat
    );
    taffrail.position.set(0, sternTopY + 0.06, sternZ - 0.18);
    transomGroup.add(taffrail);

    // Quarter-galleries on port & starboard stern quarters
    [-1, 1].forEach((side) => {
      const qU = 0.09;
      const qZ = CoordinateSystem.stationToZ(qU, this.h.length);
      const qX = side * Math.abs(this.lines.getHullPoint(qU, 0.8, 1).x);
      const qY = this.lines.getSheerY(qU) + 1.35;

      const gallery = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 2.35), oakMat);
      gallery.position.set(qX + side * 0.14, qY, qZ);
      gallery.castShadow = true;
      transomGroup.add(gallery);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 2.42), goldMat);
      cap.position.set(qX + side * 0.14, qY + 0.48, qZ);
      transomGroup.add(cap);
    });

    group.add(transomGroup);

    // 5. Companionway ladders in the waist
    this._buildLadder(group, 0.45, this.lines.getSheerY(0.45), 1.18, -0.75, darkMat);
    this._buildLadder(group, 0.75, this.lines.getSheerY(0.75), 1.35, 0.75, darkMat);

    return group;
  }

  _buildBulkhead(parent, u, baseY, height, oakMat, darkMat) {
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const width = Math.abs(this.lines.getHullPoint(u, 0.8, 1).x) * 1.88;

    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.14), oakMat);
    wall.position.set(0, baseY + height * 0.5, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    parent.add(wall);

    // Central doorway arch
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, height * 0.75, 0.18), darkMat);
    door.position.set(0, baseY + height * 0.38, z);
    parent.add(door);
  }

  _buildLadder(parent, u, baseY, height, xOff, darkMat) {
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.55, height * 1.25, 0.12), darkMat);
    ladder.position.set(xOff, baseY + height * 0.5, z);
    ladder.rotation.x = 0.52;
    parent.add(ladder);
  }
}
