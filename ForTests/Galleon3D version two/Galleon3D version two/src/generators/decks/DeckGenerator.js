import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Generates cambered planked decks matching the Golden Hind blueprints:
 *  - Deck 1 / Waist (main weather deck)
 *  - Forecastle deck (Backdeck) with forward grating
 *  - Quarterdeck (Halfdeck) & Poop deck (Deck 3)
 *  - Central waist gratings (Gräting) & bulwark cap rails
 */
export class DeckGenerator {
  constructor(config, materials, linesEngine) {
    this.config = config;
    this.materials = materials;
    this.lines = linesEngine;
    this.h = config.hull;
  }

  generate() {
    const group = new THREE.Group();
    group.name = 'DecksAssembly';

    const deckMat = this.materials.get('deckPlank');
    const darkMat = this.materials.get('darkTimber');

    // Main weather deck (u: 0.02 -> 0.96)
    group.add(this._buildCamberedDeck(0.02, 0.96, 28, (u) => this.lines.getSheerY(u), 0.78, deckMat));

    // Forecastle deck (Backdeck, u: 0.77 -> 0.97)
    group.add(
      this._buildCamberedDeck(
        0.77,
        0.97,
        10,
        (u) => this.lines.getSheerY(u) + 1.35,
        0.92,
        deckMat
      )
    );

    // Quarterdeck (u: 0.18 -> 0.43)
    group.add(
      this._buildCamberedDeck(
        0.18,
        0.43,
        12,
        (u) => this.lines.getSheerY(u) + 1.18,
        0.84,
        deckMat
      )
    );

    // Poop deck (Deck 3, u: 0.0 -> 0.18)
    group.add(
      this._buildCamberedDeck(
        0.0,
        0.18,
        10,
        (u) => this.lines.getSheerY(u) + 2.32,
        0.76,
        deckMat
      )
    );

    // Waist & Forecastle Wooden Gratings (Gräting)
    this._buildGrating(group, 0.62, this.lines.getSheerY(0.62) + 0.09, 1.5, 1.8, darkMat);
    this._buildGrating(group, 0.36, this.lines.getSheerY(0.36) + 1.24, 1.2, 1.4, darkMat);
    this._buildGrating(group, 0.86, this.lines.getSheerY(0.86) + 1.41, 1.1, 1.1, darkMat);

    return group;
  }

  _buildCamberedDeck(uStart, uEnd, uSegs, yFn, vSample, material) {
    const xSegs = 8;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = CoordinateSystem.lerp(uStart, uEnd, iu / uSegs);
      const halfW = Math.abs(this.lines.getHullPoint(u, vSample, 1).x) * 0.96;
      const baseY = yFn(u);
      const z = CoordinateSystem.stationToZ(u, this.h.length);

      for (let ix = 0; ix <= xSegs; ix++) {
        const xt = (ix / xSegs) * 2 - 1; // -1..1
        const x = xt * halfW;
        const camber = (1 - xt * xt) * this.config.decks.camber;
        positions.push(x, baseY + camber, z);
        uvs.push(xt * 2, u * 6);
      }
    }

    const row = xSegs + 1;
    for (let iu = 0; iu < uSegs; iu++) {
      for (let ix = 0; ix < xSegs; ix++) {
        const a = iu * row + ix;
        const b = (iu + 1) * row + ix;
        const c = (iu + 1) * row + (ix + 1);
        const d = iu * row + (ix + 1);
        indices.push(a, c, b, a, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  }

  _buildGrating(parent, u, y, width, length, darkMat) {
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const gGroup = new THREE.Group();

    const frame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), darkMat);
    gGroup.add(frame);

    const bars = 6;
    for (let i = 0; i < bars; i++) {
      const bx = CoordinateSystem.lerp(-width * 0.42, width * 0.42, i / (bars - 1));
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, length * 0.9), darkMat);
      bar.position.x = bx;
      gGroup.add(bar);
    }

    gGroup.position.set(0, y, z);
    parent.add(gGroup);
  }
}
