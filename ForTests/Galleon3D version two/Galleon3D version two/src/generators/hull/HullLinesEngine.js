import * as THREE from 'three';
import { CoordinateSystem } from '../../core/CoordinateSystem.js';

/**
 * Parametric naval architecture lines engine calibrated to the Golden Hind (c. 1575)
 * sheer plan, body plan, and half-breadth waterlines:
 *  - Race-built Elizabethan sheer rising gracefully aft to the poop
 *  - Full round bilge amidships with pronounced tumblehome above the main wale
 *  - Sharp entry at the stem and clean run aft to the raked transom sternpost
 */
export class HullLinesEngine {
  constructor(config) {
    this.config = config;
    this.h = config.hull;
  }

  /**
   * Keel bottom Y along station u in [0, 1].
   * Slight rocker rise at the forefoot (u > 0.84) and clean skeg aft.
   */
  getKeelBottomY(u) {
    const baseKeelY = -this.h.draft;
    if (u > 0.84) {
      const t = (u - 0.84) / 0.16;
      return baseKeelY + Math.pow(t, 2.2) * (this.h.draft * 0.92);
    }
    return baseKeelY;
  }

  /**
   * Main weather-deck sheer height Y along station u in [0, 1].
   * Lowest in the waist (u ~ 0.55), rising forward to the forecastle and steeply aft.
   */
  getSheerY(u) {
    const waistY = this.h.depth - this.h.draft; // ~1.65m above waterline
    const aftRise = Math.pow(CoordinateSystem.clamp01((0.55 - u) / 0.55), 1.65) * this.h.sheerAft;
    const fwdRise = Math.pow(CoordinateSystem.clamp01((u - 0.62) / 0.38), 1.55) * this.h.sheerForward;
    return waistY + aftRise + fwdRise;
  }

  /**
   * Bulwark / rail top Y along station u in [0, 1].
   * Reflects the stepped Elizabethan castles: forecastle (u > 0.76), waist,
   * quarterdeck (0.18 < u <= 0.42), and poop (u <= 0.18).
   */
  getBulwarkTopY(u) {
    const sheer = this.getSheerY(u);
    let rail = 0.95;
    if (u <= 0.18) {
      // Poop / stern castle
      const t = CoordinateSystem.smoothstep(0.18, 0.0, u);
      rail = 1.9 + t * 1.15;
    } else if (u <= 0.44) {
      // Quarterdeck / halfdeck
      const t = CoordinateSystem.smoothstep(0.44, 0.2, u);
      rail = 1.05 + t * 0.85;
    } else if (u >= 0.76) {
      // Forecastle
      const t = CoordinateSystem.smoothstep(0.76, 0.92, u);
      rail = 0.95 + t * 0.75;
    }
    return sheer + rail;
  }

  /**
   * Longitudinal half-breadth factor in [0, 1] at station u.
   * Maximum beam sits slightly forward of amidships (u ~ 0.56, classic "cod's head & mackerel tail").
   */
  getLongitudinalHalfBeam(u) {
    const halfMax = this.h.beam * 0.5;
    if (u < 0.56) {
      // Mackerel tail: tapers cleanly toward stern transom (~44% of max beam at transom)
      const t = u / 0.56;
      const run = 0.44 + 0.56 * Math.pow(Math.sin(t * Math.PI * 0.5), 0.78);
      return halfMax * run;
    }
    // Cod's head bow entry: full shoulders tapering sharply to stempost
    const t = (1 - u) / 0.44;
    const entry = Math.pow(Math.sin(t * Math.PI * 0.5), 0.72);
    return halfMax * Math.max(0.02, entry);
  }

  /**
   * Returns 3D point on the hull surface for station u in [0, 1],
   * vertical parameter v in [0, 1] (0 = keel rabbet, 1 = bulwark rail),
   * and side (+1 starboard, -1 port).
   */
  getHullPoint(u, v, side = 1) {
    const z = CoordinateSystem.stationToZ(u, this.h.length);
    const keelRabbetY = this.getKeelBottomY(u) + this.h.keelThickness;
    const topY = this.getBulwarkTopY(u);
    const y = CoordinateSystem.lerp(keelRabbetY, topY, v);

    const maxHalfB = this.getLongitudinalHalfBeam(u);

    // Cross-sectional body-plan shape: round bilge rising to max beam at v ~ 0.52, then tumblehome
    let sectionFactor;
    if (v <= 0.52) {
      const vt = v / 0.52;
      const bilgeExp = CoordinateSystem.lerp(0.62, 0.38, this.h.bilgeFullness);
      sectionFactor = Math.pow(vt, bilgeExp);
      // Hollow deadrise near stern skeg (u < 0.25)
      if (u < 0.25) {
        const sternTighten = (0.25 - u) / 0.25;
        sectionFactor *= CoordinateSystem.lerp(1.0, Math.pow(vt, 0.55), sternTighten * 0.75);
      }
    } else {
      const vt = (v - 0.52) / 0.48;
      // Pronounced Elizabethan tumblehome above the main wale
      const tumble = this.h.tumblehome * (0.65 + 0.35 * (1 - Math.abs(u - 0.45)));
      sectionFactor = 1.0 - tumble * Math.pow(vt, 1.35);
    }

    const x = side * maxHalfB * Math.max(0.015, sectionFactor);
    return new THREE.Vector3(x, y, z);
  }
}
