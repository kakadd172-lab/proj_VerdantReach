import * as THREE from 'three';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const SECTION = Object.freeze([
  [0.00, 0.055], [0.055, 0.34], [0.16, 0.65], [0.31, 0.88],
  [0.48, 1.00], [0.63, 0.995], [0.76, 0.965], [0.88, 0.91], [1.00, 0.82]
]);

function sectionBreadth(v) {
  for (let i = 1; i < SECTION.length; i++) {
    const [b, value] = SECTION[i];
    if (v <= b) {
      const [a, previous] = SECTION[i - 1];
      const t = smooth(a, b, v);
      return previous + (value - previous) * t;
    }
  }
  return SECTION[SECTION.length - 1][1];
}

export function deckY(d, t) {
  const edge = Math.pow(Math.abs(t - 0.5) * 2, 1.28);
  const bowLift = d.hull.bowRise * Math.pow(Math.max(0, 1 - t / 0.34), 1.5);
  const sternLift = d.hull.sternRise * Math.pow(Math.max(0, (t - 0.66) / 0.34), 1.35);
  const sheer = d.hull.sheer * d.freeboard * Math.pow(edge, 1.25);
  return d.deckHeightUnits + (bowLift + sternLift + sheer) * (4 / 3);
}

export function keelY(d, t) {
  const rise = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.78);
  const rocker = 0.11 * Math.pow(Math.abs(t - 0.53) * 2, 1.7);
  return -d.draftUnits * (0.48 + d.hull.keelDepth * rise) + d.draftUnits * rocker;
}

export function halfBreadth(d, t) {
  const body = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.62);
  const sternTuck = 1 - 0.17 * smooth(0.70, 0.99, t);
  const forwardEntry = 0.94 + 0.06 * smooth(0.10, 0.58, t);
  const transom = 0.34 * smooth(0.90, 1.00, t);
  const fineBow = 0.018 * smooth(0.00, 0.085, t);
  return d.beamUnits * 0.5 * Math.max(0.012, body * sternTuck * forwardEntry + transom + fineBow);
}

export function hullPoint(d, t, v, side = 1, inset = 1) {
  const station = clamp(t), height = clamp(v);
  const lowerFlare = 1 + d.structure.flare * Math.pow(Math.max(0, 0.42 - height) / 0.42, 1.25);
  const upperTumble = 1 - d.structure.tumble * Math.pow(Math.max(0, (height - 0.62) / 0.38), 1.35);
  const x = side * halfBreadth(d, station) * sectionBreadth(height) * lowerFlare * upperTumble * inset;
  const bottom = keelY(d, station);
  const top = deckY(d, station);
  const y = bottom + (top - bottom) * height;
  const z = (station - 0.5) * d.hullLengthUnits;
  return V(x, y, z);
}

export function deckPoint(d, t, u, lift = 0) {
  const half = halfBreadth(d, t) * 0.91;
  const camber = d.hull.deckCamber * d.deckHeightUnits * (1 - u * u);
  return V(u * half, deckY(d, t) + camber + lift, (t - 0.5) * d.hullLengthUnits);
}
