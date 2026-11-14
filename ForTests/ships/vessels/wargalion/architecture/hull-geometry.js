import * as THREE from 'three';
import {
  WARGALION_HULL_STATIONS,
  WARGALION_SECTION_PROFILE,
  WARGALION_DECK_LEVELS
} from './blueprint-data.js';

/**
 * Wargalion ship-local geometry:
 * X = athwartships (port -, starboard +), Y = vertical, Z = longitudinal
 * (bow -, stern +). The normalized hull station parameter t runs from stem
 * extremity (0) to sternpost extremity (1).
 *
 * Every source ordinate is labelled as an estimate in blueprint-data.js.
 * These functions are fairing/interpolation, not a claim that the scan has
 * already been calibrated into archival offsets.
 */
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Fritsch-Carlson/PCHIP shape-preserving cubic Hermite interpolation.
 * Unlike independent smoothstep segments, this preserves C1 slope continuity
 * at station knots and does not overshoot monotone offset intervals.
 */
function endpointSlope(h0, h1, delta0, delta1) {
  let slope = ((2 * h0 + h1) * delta0 - h0 * delta1) / (h0 + h1);
  if (Math.sign(slope) !== Math.sign(delta0)) return 0;
  if (Math.sign(delta0) !== Math.sign(delta1) && Math.abs(slope) > 3 * Math.abs(delta0)) {
    slope = 3 * delta0;
  }
  return slope;
}

export function createPchipTable(xs, ys) {
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) {
    throw new TypeError('PCHIP requires equally sized x/y arrays with at least two points.');
  }
  for (let i = 0; i < xs.length; i++) {
    if (!Number.isFinite(xs[i]) || !Number.isFinite(ys[i])) throw new TypeError('PCHIP values must be finite.');
    if (i > 0 && xs[i] <= xs[i - 1]) throw new RangeError('PCHIP x values must be strictly increasing.');
  }

  const count = xs.length;
  const h = new Array(count - 1);
  const delta = new Array(count - 1);
  for (let i = 0; i < count - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    delta[i] = (ys[i + 1] - ys[i]) / h[i];
  }

  const slopes = new Array(count).fill(0);
  if (count === 2) {
    slopes[0] = delta[0];
    slopes[1] = delta[0];
  } else {
    slopes[0] = endpointSlope(h[0], h[1], delta[0], delta[1]);
    slopes[count - 1] = endpointSlope(
      h[count - 2], h[count - 3],
      delta[count - 2], delta[count - 3]
    );
    for (let i = 1; i < count - 1; i++) {
      const before = delta[i - 1];
      const after = delta[i];
      if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) {
        slopes[i] = 0;
      } else {
        const w1 = 2 * h[i] + h[i - 1];
        const w2 = h[i] + 2 * h[i - 1];
        slopes[i] = (w1 + w2) / (w1 / before + w2 / after);
      }
    }
  }
  return Object.freeze({ xs: Object.freeze([...xs]), ys: Object.freeze([...ys]), slopes: Object.freeze(slopes) });
}

export function interpolatePchip(table, value) {
  const { xs, ys, slopes } = table;
  const x = clamp(value, xs[0], xs[xs.length - 1]);
  let index = 0;
  while (index < xs.length - 2 && x > xs[index + 1]) index += 1;

  const h = xs[index + 1] - xs[index];
  const t = (x - xs[index]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * ys[index] + h10 * h * slopes[index]
    + h01 * ys[index + 1] + h11 * h * slopes[index + 1];
}

const stationAxis = WARGALION_HULL_STATIONS.map(item => item.station);
const stationTables = Object.freeze(Object.fromEntries(
  ['halfBreadth', 'floorRatio', 'floorHeight', 'maxBreadthHeight', 'deckRatio', 'keelDepthRatio', 'sheerRiseRatio']
    .map(key => [key, createPchipTable(stationAxis, WARGALION_HULL_STATIONS.map(item => item[key]))])
));

const FLOOR_BAND = WARGALION_SECTION_PROFILE.floorBand;
const BILGE_END = WARGALION_SECTION_PROFILE.bilgeEnd;
const SECTION_AXIS = Object.freeze([0, FLOOR_BAND, BILGE_END, 1]);

function stationValues(t) {
  const station = clamp(t);
  return {
    breadthFactor: interpolatePchip(stationTables.halfBreadth, station),
    floorRatio: interpolatePchip(stationTables.floorRatio, station),
    floorHeight: interpolatePchip(stationTables.floorHeight, station),
    maxBreadthHeight: interpolatePchip(stationTables.maxBreadthHeight, station),
    deckRatio: interpolatePchip(stationTables.deckRatio, station),
    keelDepthRatio: interpolatePchip(stationTables.keelDepthRatio, station),
    sheerRiseRatio: interpolatePchip(stationTables.sheerRiseRatio, station)
  };
}

/** Public station data used by the hull tests, orthographic reviews and blueprint overlay. */
export function getWargalionStationProfile(d, t) {
  const profile = stationValues(t);
  return Object.freeze({
    ...profile,
    floorBand: FLOOR_BAND,
    bilgeEnd: BILGE_END,
    halfBreadthUnits: d.beamUnits * 0.5 * profile.breadthFactor,
    sourceState: 'visual-estimate'
  });
}

export function halfBreadth(d, t) {
  return d.beamUnits * 0.5 * stationValues(t).breadthFactor;
}

const sectionTableCache = new Map();

function sectionTablesAt(t) {
  const station = clamp(t);
  const key = Math.round(station * 1000000);
  const cached = sectionTableCache.get(key);
  if (cached) return cached;
  const p = stationValues(station);
  const tables = Object.freeze({
    height: createPchipTable(SECTION_AXIS, [p.floorHeight, p.floorHeight, p.maxBreadthHeight, 1]),
    breadth: createPchipTable(SECTION_AXIS, [0, p.floorRatio, 1, p.deckRatio])
  });
  if (sectionTableCache.size > 512) sectionTableCache.clear();
  sectionTableCache.set(key, tables);
  return tables;
}

/** Vertical coordinate along the section path, from keel centre to deck edge. */
export function sectionHeightFraction(t, profileV) {
  return interpolatePchip(sectionTablesAt(t).height, clamp(profileV));
}

/** Half-breadth ratio along the section path, including flat floor and tumblehome. */
export function sectionBreadthRatio(d, t, profileV) {
  return interpolatePchip(sectionTablesAt(t).breadth, clamp(profileV));
}

/**
 * Longitudinal Z coordinate of a point on an end station.
 * Stem and sternpost rake are controlled separately and fade to zero before
 * the middle body. The same function is used by hull skins, end closures and
 * deck edges so those seams remain coincident.
 */
export function hullLongitudinalZ(d, t, profileV = 1) {
  const station = clamp(t);
  const sectionHeight = sectionHeightFraction(station, profileV);
  const bowRake = (d.hull.bowRake ?? 0.012) * d.hullLengthUnits
    * (1 - smoothstep(0.0, 0.18, station));
  const sternRake = (d.hull.sternRake ?? 0.010) * d.hullLengthUnits
    * smoothstep(0.82, 1.0, station);
  return (station - 0.5) * d.hullLengthUnits
    + (bowRake + sternRake) * sectionHeight;
}

export function keelY(d, t) {
  return -d.draftUnits * stationValues(t).keelDepthRatio;
}

/** Main deck edge/shear curve. Raised deck levels are applied by deckSurfaceY(). */
export function deckY(d, t) {
  return d.deckHeightUnits * (1 + stationValues(t).sheerRiseRatio);
}

function raisedDeckEnvelope(t, start, riseStart, fallStart, end) {
  return smoothstep(start, riseStart, t) * (1 - smoothstep(fallStart, end, t));
}

/** Walking-surface datum at the given station. */
export function deckSurfaceY(d, t) {
  const station = clamp(t);
  const levels = WARGALION_DECK_LEVELS;
  const fore = (d.hull.forecastleRise ?? levels.forecastle.rise) *
    raisedDeckEnvelope(station, levels.forecastle.start, levels.forecastle.riseStart,
      levels.forecastle.fallStart, levels.forecastle.end);
  const quarter = (d.hull.quarterdeckRise ?? levels.quarterdeck.rise) *
    raisedDeckEnvelope(station, levels.quarterdeck.start, levels.quarterdeck.riseStart,
      levels.quarterdeck.fallStart, levels.quarterdeck.end);
  const poop = (d.hull.poopRise ?? levels.poop.rise) *
    raisedDeckEnvelope(station, levels.poop.start, levels.poop.riseStart,
      levels.poop.fallStart, levels.poop.end);
  return deckY(d, station) + (fore + quarter + poop) * (4 / 3);
}

/** Point on the faired hull skin. v=0 at keel centre, v=1 at deck edge. */
export function hullPoint(d, t, v, side = 1, inset = 1) {
  const station = clamp(t);
  const section = clamp(v);
  const bottom = keelY(d, station);
  const top = deckSurfaceY(d, station);
  const heightFraction = sectionHeightFraction(station, section);
  const y = lerp(bottom, top, heightFraction);
  const x = side * halfBreadth(d, station) *
    sectionBreadthRatio(d, station, section) * inset;
  const z = hullLongitudinalZ(d, station, section);
  return V(x, y, z);
}

/** Circular-arc deck camber with zero rise at both deck edges. */
function deckCamberAt(d, halfBreadthUnits, normalizedAcross) {
  const rise = Math.max(0, (d.hull.deckCamber ?? WARGALION_DECK_LEVELS.main.camberRatio) * d.deckHeightUnits);
  if (rise < 1e-6 || halfBreadthUnits < 1e-6) return 0;
  const radius = (halfBreadthUnits * halfBreadthUnits + rise * rise) / (2 * rise);
  const x = clamp(normalizedAcross, -1, 1) * halfBreadthUnits;
  return Math.sqrt(Math.max(0, radius * radius - x * x))
    - Math.sqrt(Math.max(0, radius * radius - halfBreadthUnits * halfBreadthUnits));
}

/** Point on the cambered deck surface; lift lets raised deck modules share the same edge. */
export function deckPoint(d, t, u, lift = 0) {
  const station = clamp(t);
  const across = clamp(u, -1, 1);
  const half = halfBreadth(d, station) * sectionBreadthRatio(d, station, 1) * 0.999;
  const camber = deckCamberAt(d, half, across);
  return V(
    across * half,
    deckY(d, station) + camber + lift,
    hullLongitudinalZ(d, station, 1)
  );
}
