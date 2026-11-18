import * as THREE from 'three';
import {
  WARGALION_V2_HULL_STATIONS,
  WARGALION_V2_SECTION,
  WARGALION_V2_DECKS
} from './blueprint-data.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function endpointSlope(h0, h1, delta0, delta1) {
  let slope = ((2 * h0 + h1) * delta0 - h0 * delta1) / (h0 + h1);
  if (Math.sign(slope) !== Math.sign(delta0)) return 0;
  if (Math.sign(delta0) !== Math.sign(delta1) && Math.abs(slope) > 3 * Math.abs(delta0)) {
    slope = 3 * delta0;
  }
  return slope;
}

/**
 * Fritsch-Carlson/PCHIP shape-preserving cubic Hermite interpolation.
 * It preserves monotone station-offset intervals without the overshoot that
 * can make a ship's sheer or breadth profile visibly ripple between stations.
 */
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
      h[count - 2], h[count - 3], delta[count - 2], delta[count - 3]
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
  return Object.freeze({
    xs: Object.freeze([...xs]),
    ys: Object.freeze([...ys]),
    slopes: Object.freeze(slopes)
  });
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
  return (2 * t3 - 3 * t2 + 1) * ys[index]
    + (t3 - 2 * t2 + t) * h * slopes[index]
    + (-2 * t3 + 3 * t2) * ys[index + 1]
    + (t3 - t2) * h * slopes[index + 1];
}

const stationAxis = WARGALION_V2_HULL_STATIONS.map(item => item.station);
const stationTables = Object.freeze(Object.fromEntries(
  ['halfBreadth', 'floorRatio', 'floorHeight', 'maxBreadthHeight', 'deckRatio', 'keelDepthRatio', 'sheerRiseRatio']
    .map(key => [key, createPchipTable(stationAxis, WARGALION_V2_HULL_STATIONS.map(item => item[key]))])
));

const sectionTableCache = new Map();
function stationValues(t) {
  const station = clamp(t);
  const values = {};
  for (const [key, table] of Object.entries(stationTables)) values[key] = interpolatePchip(table, station);
  return values;
}
function sectionTablesAt(t) {
  const station = clamp(t);
  const key = Math.round(station * 100000);
  const cached = sectionTableCache.get(key);
  if (cached) return cached;
  const p = stationValues(station);
  const axis = [0, WARGALION_V2_SECTION.floorBand, WARGALION_V2_SECTION.bilgeEnd, 1];
  const tables = Object.freeze({
    height: createPchipTable(axis, [0, p.floorHeight, p.maxBreadthHeight, 1]),
    breadth: createPchipTable(axis, [0, p.floorRatio, 1, p.deckRatio])
  });
  if (sectionTableCache.size > 700) sectionTableCache.clear();
  sectionTableCache.set(key, tables);
  return tables;
}

export function getWargalionV2StationProfile(d, t) {
  const values = stationValues(t);
  return Object.freeze({
    ...values,
    floorBand: WARGALION_V2_SECTION.floorBand,
    bilgeEnd: WARGALION_V2_SECTION.bilgeEnd,
    halfBreadthUnits: d.beamUnits * 0.5 * values.halfBreadth,
    sourceState: 'visual-estimate'
  });
}

export function halfBreadth(d, t) {
  return d.beamUnits * 0.5 * stationValues(t).halfBreadth;
}
export function sectionHeightFraction(t, v) {
  return interpolatePchip(sectionTablesAt(t).height, clamp(v));
}
export function sectionBreadthRatio(t, v) {
  return interpolatePchip(sectionTablesAt(t).breadth, clamp(v));
}
export function keelY(d, t) {
  return -d.draftUnits * stationValues(t).keelDepthRatio;
}
export function deckY(d, t) {
  return d.deckHeightUnits * (1 + stationValues(t).sheerRiseRatio);
}

export function hullLongitudinalZ(d, t, v = 1) {
  const station = clamp(t);
  const heightFraction = sectionHeightFraction(station, v);
  const bowRake = (d.hull.bowRake ?? 0.038) * d.hullLengthUnits
    * (1 - smoothstep(0, 0.19, station));
  const sternRake = (d.hull.sternRake ?? 0.034) * d.hullLengthUnits
    * smoothstep(0.82, 1, station);
  return (station - 0.5) * d.hullLengthUnits
    - bowRake * heightFraction
    + sternRake * heightFraction;
}

/** Authoritative point evaluator for the single port/starboard hull surface. */
export function hullPointAcross(d, t, v, across) {
  const station = clamp(t);
  const section = clamp(v);
  const acrossValue = clamp(across, -1, 1);
  const bottom = keelY(d, station);
  const top = deckY(d, station);
  const heightFraction = sectionHeightFraction(station, section);
  const y = lerp(bottom, top, heightFraction);
  const x = acrossValue * halfBreadth(d, station) * sectionBreadthRatio(station, section);
  const z = hullLongitudinalZ(d, station, section);
  return V(x, y, z);
}
export function hullPoint(d, t, v, side = 1) {
  return hullPointAcross(d, t, v, side < 0 ? -1 : 1);
}

/**
 * Raised deck level datums. These do not deform the hull shell: deck platforms
 * sit on the main deck and the hull's sheer remains one continuous curve.
 */
export function deckLevelY(d, t, level = 'main') {
  const station = clamp(t);
  const forecastle = WARGALION_V2_DECKS.forecastle;
  const quarterdeck = WARGALION_V2_DECKS.quarterdeck;
  const forecastleLift = forecastle.rise * smoothstep(forecastle.start, forecastle.riseStart, station)
    * (1 - smoothstep(forecastle.fallStart, forecastle.end, station));
  const quarterdeckLift = quarterdeck.rise * smoothstep(quarterdeck.start, quarterdeck.riseStart, station)
    * (1 - smoothstep(quarterdeck.fallStart, quarterdeck.end, station));
  if (level === 'forecastle') return deckY(d, station) + forecastleLift;
  if (level === 'quarterdeck') return deckY(d, station) + quarterdeckLift;
  return deckY(d, station);
}

export function deckPoint(d, t, across, level = 'main') {
  const station = clamp(t);
  const u = clamp(across, -1, 1);
  const widthScale = level === 'forecastle'
    ? WARGALION_V2_DECKS.forecastle.widthScale
    : level === 'quarterdeck'
      ? WARGALION_V2_DECKS.quarterdeck.widthScale
      : 1;
  const half = halfBreadth(d, station) * sectionBreadthRatio(station, 1) * widthScale;
  const camber = d.hull.deckCamber * d.deckHeightUnits * (1 - u * u);
  return V(u * half, deckLevelY(d, station, level) + camber,
    hullLongitudinalZ(d, station, 1));
}

export function sampleStationCurve(d, t, side = 1, steps = 40) {
  return Array.from({ length: steps + 1 }, (_, i) =>
    hullPoint(d, t, i / steps, side));
}

/** Intersects the same surface with a horizontal waterline plane. */
export function sampleWaterlineCurve(d, y, side = 1, stationSteps = 100) {
  const result = [];
  for (let i = 0; i <= stationSteps; i++) {
    const t = i / stationSteps;
    let low = 0, high = 1;
    const lowY = hullPoint(d, t, low, side).y;
    const highY = hullPoint(d, t, high, side).y;
    if (y < lowY || y > highY) continue;
    for (let n = 0; n < 28; n++) {
      const mid = (low + high) * 0.5;
      if (hullPoint(d, t, mid, side).y < y) low = mid;
      else high = mid;
    }
    result.push(hullPoint(d, t, (low + high) * 0.5, side));
  }
  return result;
}

/**
 * A buttock is a longitudinal curve in a fixed vertical plane. The lower and
 * upper branches are returned independently because that plane can cross a
 * tumblehome section twice.
 */
export function sampleButtockCurve(d, xOffset, side = 1, branch = 'lower', stationSteps = 100) {
  const result = [];
  const start = branch === 'upper' ? WARGALION_V2_SECTION.bilgeEnd : 0;
  const end = branch === 'upper' ? 1 : WARGALION_V2_SECTION.bilgeEnd;
  const target = Math.abs(xOffset);
  for (let i = 0; i <= stationSteps; i++) {
    const t = i / stationSteps;
    if (target > halfBreadth(d, t) * 1.000001) continue;
    let low = start, high = end;
    const lowX = halfBreadth(d, t) * sectionBreadthRatio(t, low);
    const highX = halfBreadth(d, t) * sectionBreadthRatio(t, high);
    if (target < Math.min(lowX, highX) - 1e-6 || target > Math.max(lowX, highX) + 1e-6) continue;
    for (let n = 0; n < 28; n++) {
      const mid = (low + high) * 0.5;
      const x = halfBreadth(d, t) * sectionBreadthRatio(t, mid);
      if ((branch === 'lower' && x < target) || (branch === 'upper' && x > target)) low = mid;
      else high = mid;
    }
    result.push(hullPoint(d, t, (low + high) * 0.5, side));
  }
  return result;
}
