import * as THREE from 'three';

/**
 * Wargalion hull reconstruction.
 *
 * Coordinates: bow -Z, stern +Z, port -X, starboard +X, keel origin.
 * The station table is normalized to length and maximum half-breadth. Its
 * midship section uses a flat floor, a circular futtock arc and a separate
 * inward tumblehome above maximum breadth. Forward and after tail frames
 * narrow and rise progressively rather than using a single sine-breadth law.
 *
 * The San Martín 1580 plan sheet supplies the longitudinal profile and
 * fore/aft section families. Values not dimensioned on that sheet are
 * reconstruction controls, not claimed original offsets.
 */

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * t, max-breadth factor, floor half-breadth ratio, floor height,
 * maximum-breadth height, deck half-breadth ratio.
 */
const STATIONS = Object.freeze([
  [0.000, 0.025, 0.012, 0.105, 0.705, 0.72],
  [0.035, 0.180, 0.075, 0.095, 0.675, 0.79],
  [0.080, 0.355, 0.115, 0.090, 0.645, 0.83],
  [0.150, 0.565, 0.155, 0.082, 0.620, 0.86],
  [0.245, 0.765, 0.185, 0.078, 0.600, 0.885],
  [0.360, 0.915, 0.205, 0.075, 0.585, 0.900],
  [0.500, 1.000, 0.220, 0.075, 0.575, 0.910],
  [0.640, 0.985, 0.215, 0.078, 0.585, 0.910],
  [0.755, 0.905, 0.185, 0.084, 0.610, 0.895],
  [0.855, 0.770, 0.145, 0.093, 0.645, 0.865],
  [0.925, 0.600, 0.105, 0.105, 0.690, 0.825],
  [0.975, 0.430, 0.065, 0.125, 0.735, 0.780],
  [1.000, 0.335, 0.045, 0.145, 0.765, 0.745]
]);

function stationValues(t) {
  const station = clamp(t);
  let index = 1;
  while (index < STATIONS.length - 1 && station > STATIONS[index][0]) index += 1;
  const a = STATIONS[index - 1];
  const b = STATIONS[index];
  const u = smoothstep(a[0], b[0], station);
  return {
    breadthFactor: lerp(a[1], b[1], u),
    floorRatio: lerp(a[2], b[2], u),
    floorHeight: lerp(a[3], b[3], u),
    maxBreadthHeight: lerp(a[4], b[4], u),
    deckRatio: lerp(a[5], b[5], u)
  };
}

/** Public station data used by regression tests and future blueprint tuning. */
export function getWargalionStationProfile(d, t) {
  const profile = stationValues(t);
  return Object.freeze({
    ...profile,
    halfBreadthUnits: d.beamUnits * 0.5 * profile.breadthFactor
  });
}

export function halfBreadth(d, t) {
  return d.beamUnits * 0.5 * stationValues(t).breadthFactor;
}

/**
 * Circular futtock arc from the floor/turn-of-bilge point to maximum breadth.
 * The circle centre lies on the centreline. Above the arc, a separate
 * tumblehome curve returns the section to the narrower upper-deck edge.
 */
export function sectionBreadthRatio(d, t, v) {
  const p = stationValues(t);
  const y = clamp(v);
  const floorX = Math.max(0.008, p.floorRatio);
  const floorY = p.floorHeight;
  const beamY = Math.max(floorY + 0.08, p.maxBreadthHeight);

  if (y <= floorY) {
    return floorX * smoothstep(0, floorY, y);
  }

  if (y <= beamY) {
    const centreY = (
      1 + beamY * beamY - floorX * floorX - floorY * floorY
    ) / (2 * (beamY - floorY));
    const radiusSquared = 1 + Math.pow(beamY - centreY, 2);
    const xSquared = radiusSquared - Math.pow(y - centreY, 2);
    return Math.sqrt(Math.max(floorX * floorX, xSquared));
  }

  const tumble = clamp(d.structure?.tumble ?? 0.13, 0.02, 0.28);
  const deckRatio = clamp(p.deckRatio - (tumble - 0.13) * 0.20, 0.68, 0.95);
  const u = smoothstep(beamY, 1, y);
  const curvedInwardRun = u * u * (2 - u);
  return lerp(1, deckRatio, curvedInwardRun);
}

export function keelY(d, t) {
  const station = clamp(t);
  const midshipRise = Math.pow(Math.max(0, Math.sin(Math.PI * station)), 0.72);
  const bowRise = 0.22 * (1 - smoothstep(0.015, 0.30, station));
  const sternRise = 0.24 * smoothstep(0.72, 0.995, station);
  return -d.draftUnits * (0.62 + 0.075 * midshipRise - bowRise - sternRise);
}

export function deckY(d, t) {
  const station = clamp(t);
  const edge = Math.pow(Math.abs(station - 0.5) * 2, 1.65);
  const sheer = (d.hull.sheer ?? 0.12) * edge;
  const bowLift = (d.hull.bowRise ?? 0.34) * (1 - smoothstep(0.025, 0.48, station));
  const sternLift = (d.hull.sternRise ?? 0.50) * smoothstep(0.62, 0.995, station);
  return d.deckHeightUnits * (1 + sheer + bowLift + sternLift);
}

function raisedDeckEnvelope(t, start, riseStart, fallStart, end) {
  return smoothstep(start, riseStart, t) * (1 - smoothstep(fallStart, end, t));
}

/** Height of the walking surface at a longitudinal station. */
export function deckSurfaceY(d, t) {
  const station = clamp(t);
  const fore = (d.hull.forecastleRise ?? 0) *
    raisedDeckEnvelope(station, 0.035, 0.095, 0.205, 0.275);
  const quarter = (d.hull.quarterdeckRise ?? 0) *
    raisedDeckEnvelope(station, 0.695, 0.775, 0.885, 0.955);
  const poop = (d.hull.poopRise ?? 0) *
    raisedDeckEnvelope(station, 0.865, 0.920, 0.965, 0.997);
  return deckY(d, station) + (fore + quarter + poop) * (4 / 3);
}

/** Point on the outer hull skin, with v=0 at keel and v=1 at the deck edge. */
export function hullPoint(d, t, v, side = 1, inset = 1) {
  const station = clamp(t);
  const section = clamp(v);
  const bottom = keelY(d, station);
  const top = deckY(d, station);
  const y = lerp(bottom, top, section);
  const x = side * halfBreadth(d, station) *
    sectionBreadthRatio(d, station, section) * inset;
  const z = (station - 0.5) * d.hullLengthUnits;
  return V(x, y, z);
}

/** Point on a cambered deck surface; lift is measured in world units. */
export function deckPoint(d, t, u, lift = 0) {
  const station = clamp(t);
  const across = clamp(u, -1, 1);
  const edgeRatio = sectionBreadthRatio(d, station, 1);
  const half = halfBreadth(d, station) * edgeRatio * 0.999;
  const camber = (d.hull.deckCamber ?? 0.08) * d.deckHeightUnits * (1 - across * across);
  return V(
    across * half,
    deckY(d, station) + camber + lift,
    (station - 0.5) * d.hullLengthUnits
  );
}
