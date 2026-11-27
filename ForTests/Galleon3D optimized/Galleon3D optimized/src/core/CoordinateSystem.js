/**
 * Naval coordinate system conventions:
 *  - +Z = Forward (Bow), -Z = Aft (Stern)
 *  - +Y = Up, Y = 0 is the design waterline
 *  - +X = Starboard, -X = Port
 *  - u in [0, 1]: 0 = Stern transom, 1 = Stem/Bow
 *  - v in [0, 1]: 0 = Keel rabbet, 1 = Bulwark rail
 */
export const CoordinateSystem = {
  stationToZ(u, length) {
    return (u - 0.5) * length;
  },

  zToStation(z, length) {
    return z / length + 0.5;
  },

  clamp01(v) {
    return Math.max(0, Math.min(1, v));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },
};
