import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

export class DeckGenerator {
  constructor(c, m, l) { this.config = c; this.h = c.hull; this.materials = m; this.lines = l; }
  generate() {
    const g = new THREE.Group(); g.name = 'DecksAssembly';
    const deckMat = this.materials.get('deckPlank'), darkMat = this.materials.get('darkTimber');
    const fcEnd = this.lines.getBeakheadMetrics().fcFrontU;
    g.add(this._deck(0.02, fcEnd - 0.012, 24, (u) => this.lines.getSheerY(u), 0.78, deckMat));
    g.add(this._deck(0.77, fcEnd, 8, (u) => this.lines.getForecastleDeckY(u) + 0.135, 0.92, deckMat, 0.0));
    g.add(this._deck(0.18, 0.43, 10, (u) => this.lines.getQuarterDeckY(u) + 0.135, 0.88, deckMat, 0.0));
    g.add(this._deck(0.0, 0.18, 8, (u) => this.lines.getPoopDeckY(u) + 0.135, 0.82, deckMat, 0.0));
    this._grating(g, 0.72, this.lines.getSheerY(0.72) + 0.09, 1.15, 1.05, darkMat);
    this._grating(g, 0.35, this.lines.getQuarterDeckY(0.35) + 0.145, 1.2, 1.3, darkMat);
    this._grating(g, 0.82, this.lines.getForecastleDeckY(0.82) + 0.145, 1.0, 1.0, darkMat);
    return g;
  }
  _deck(u0, u1, uSegs, yFn, vSample, mat, camberOverride = null) {
    const xSegs = 6, pos = [], uvs = [], idx = [];
    const camber = camberOverride !== null ? camberOverride : this.config.decks.camber;
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = CoordinateSystem.lerp(u0, u1, iu / uSegs);
      const by = yFn(u), z = CoordinateSystem.stationToZ(u, this.h.length) + (u > 0.82 ? this.lines.getBowZOffset(u, vSample) : 0);
      const hw = (vSample >= 0.80 ? Math.abs(this.lines.getCastleWallX(u, by, 1)) * 1.005 : Math.abs(this.lines.getHullPoint(u, vSample, 1).x) * 0.98);
      for (let ix = 0; ix <= xSegs; ix++) {
        const xt = (ix / xSegs) * 2 - 1;
        pos.push(xt * hw, by + (1 - xt * xt) * camber, z);
        uvs.push(xt * 2, u * 6);
      }
    }
    const row = xSegs + 1;
    for (let iu = 0; iu < uSegs; iu++) for (let ix = 0; ix < xSegs; ix++) {
      const a = iu * row + ix, b = (iu + 1) * row + ix, c = (iu + 1) * row + ix + 1, d = iu * row + ix + 1;
      idx.push(a, c, b, a, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
  }
  _grating(parent, u, y, w, l, mat) {
    const gg = new THREE.Group();
    // Raised hatch coaming frame + full cross-hatched lattice seated cleanly above deck camber
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, l), mat);
    gg.add(base);
    // Outer coaming rim
    const rimT = 0.07;
    const fRim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, rimT), mat); fRim.position.set(0, 0.02, l * 0.5 - rimT * 0.5); gg.add(fRim);
    const bRim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, rimT), mat); bRim.position.set(0, 0.02, -l * 0.5 + rimT * 0.5); gg.add(bRim);
    const lRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, 0.12, l), mat); lRim.position.set(-w * 0.5 + rimT * 0.5, 0.02, 0); gg.add(lRim);
    const rRim = new THREE.Mesh(new THREE.BoxGeometry(rimT, 0.12, l), mat); rRim.position.set(w * 0.5 - rimT * 0.5, 0.02, 0); gg.add(rRim);
    // Longitudinal & transverse lattice bars
    for (let i = 0; i < 6; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, l * 0.88), mat);
      bar.position.set(CoordinateSystem.lerp(-w * 0.38, w * 0.38, i / 5), 0.055, 0); gg.add(bar);
    }
    for (let j = 0; j < 6; j++) {
      const cbar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.045, 0.04), mat);
      cbar.position.set(0, 0.06, CoordinateSystem.lerp(-l * 0.38, l * 0.38, j / 5)); gg.add(cbar);
    }
    gg.position.set(0, y + this.config.decks.camber, CoordinateSystem.stationToZ(u, this.h.length));
    parent.add(gg);
  }
}
