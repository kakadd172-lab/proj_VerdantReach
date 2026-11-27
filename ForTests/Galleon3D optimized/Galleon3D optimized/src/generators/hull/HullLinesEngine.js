import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

export class HullLinesEngine {
  constructor(config) { this.h = config.hull; }
  getKeelBottomY(u) {
    const base = -this.h.draft;
    return u > 0.80 ? base + Math.pow((u - 0.80) / 0.20, 2.0) * (this.h.draft * 0.94) : base;
  }
  getSheerY(u) {
    const waistY = this.h.depth - this.h.draft;
    const aft = Math.pow(CoordinateSystem.clamp01((0.58 - u) / 0.58), 1.25) * this.h.sheerAft;
    const fwd = Math.pow(CoordinateSystem.clamp01((u - 0.65) / 0.35), 1.35) * this.h.sheerForward;
    return waistY + aft + fwd;
  }
  getBulwarkTopY(u) {
    // Smooth, unbroken main hull gunwale (wales & trim stay 100% smooth!)
    return this.getSheerY(u) + 0.92;
  }
  getForecastleDeckY(u) {
    // Level forecastle deck (very slight 0.08m camber-rise forward, matching wooden model reference)
    const base = this.getSheerY(0.77) + 1.54;
    return base + CoordinateSystem.clamp01((u - 0.77) / 0.19) * 0.08;
  }
  getBeakheadMetrics() {
    const fcFrontU = 0.935;
    const p72 = this.getHullPoint(fcFrontU, 0.72, 1);
    const p86 = this.getHullPoint(fcFrontU, 0.86, 1);
    const p100 = this.getHullPoint(fcFrontU, 1.00, 1);
    const bowPt0 = this.getHullPoint(1.0, 0.0, 0);
    const bowStem = this.getHullPoint(1.0, 0.72, 0);
    const bkLen = this.h.bowOverhang * 0.74;
    const baseY = p72.y;
    const tipZ = bowStem.z + bkLen;
    const tipY = p100.y + 0.14;
    return { fcFrontU, fcFrontZ: p86.z, p72, p86, p100, bowPt0, bowStem, bkLen, baseY, tipZ, tipY };
  }
  getQuarterDeckY(u) {
    // Level quarterdeck clearing the aft hull sheer cleanly
    const base = this.getSheerY(0.22) + 1.32;
    return base + CoordinateSystem.clamp01((0.43 - u) / 0.25) * 0.15;
  }
  getPoopDeckY(u) {
    // Natural aft-sloping Poop Deck rising smoothly with the stern sheer
    return this.getSheerY(u) + 2.95;
  }
  getCastleWallX(u, y, side = 1) {
    // Continues the exact hull tumblehome slope seamlessly upward from getBulwarkTopY(u)
    const pMid = this.getHullPoint(u, 0.80, 1);
    const pTop = this.getHullPoint(u, 1.00, 1);
    const dy = Math.max(0.01, pTop.y - pMid.y);
    const slope = (pTop.x - pMid.x) / dy; // negative (inward tumblehome)
    const extraY = Math.max(0, y - pTop.y);
    return side * Math.max(0.55, pTop.x + slope * 0.52 * extraY);
  }
  getLongitudinalHalfBeam(u) {
    const halfMax = this.h.beam * 0.5;
    if (u < 0.56) {
      const t = u / 0.56;
      return halfMax * (0.44 + 0.56 * Math.pow(Math.sin(t * Math.PI * 0.5), 0.78));
    }
    const t = (1 - u) / 0.44;
    return halfMax * Math.max(0.02, Math.pow(Math.sin(t * Math.PI * 0.5), 0.72));
  }
  getSternZOffset(u, v) {
    if (u >= 0.16) return 0;
    const uWeight = CoordinateSystem.smoothstep(0.16, 0.0, u);
    // 1. Flat backward-tilted transom above sharp crease (v >= 0.66)
    // 2. Sharp inward crease at v = 0.66, then smooth concave counter curve down to raked sternpost/keel (v < 0.66)
    let dz;
    if (v >= 0.66) {
      const vt = (v - 0.66) / 0.34;
      dz = CoordinateSystem.lerp(0.35, -0.50, vt);
    } else {
      const t = (0.66 - v) / 0.66; // 0 at crease, 1 at keel
      dz = 0.35 + 2.05 * Math.pow(t, 0.52);
    }
    return dz * uWeight;
  }
  getBowZOffset(u, v) {
    if (u <= 0.82) return 0;
    const uWeight = CoordinateSystem.smoothstep(0.82, 1.0, u);
    // Curve forward from keel up to beakhead level (v=0.72), then rise vertically straight up to the forecastle rail
    const vc = Math.min(v, 0.72);
    return 2.20 * Math.pow(vc, 1.25) * uWeight;
  }
  getHullPoint(u, v, side = 1) {
    const z = CoordinateSystem.stationToZ(u, this.h.length) + this.getSternZOffset(u, v) + this.getBowZOffset(u, v);
    const keelRabbet = this.getKeelBottomY(u) + this.h.keelThickness;
    const y = CoordinateSystem.lerp(keelRabbet, this.getBulwarkTopY(u), v);
    const maxHB = this.getLongitudinalHalfBeam(u);
    let sf;
    if (v <= 0.52) {
      const vt = v / 0.52;
      sf = Math.pow(vt, CoordinateSystem.lerp(0.62, 0.38, this.h.bilgeFullness));
      if (u < 0.25) sf *= CoordinateSystem.lerp(1.0, Math.pow(vt, 0.55), ((0.25 - u) / 0.25) * 0.75);
    } else {
      const vt = (v - 0.52) / 0.48;
      const tumble = this.h.tumblehome * (0.65 + 0.35 * (1 - Math.abs(u - 0.45)));
      sf = 1.0 - tumble * Math.pow(vt, 1.35);
    }
    return new THREE.Vector3(side * maxHB * Math.max(0.015, sf), y, z);
  }
}
