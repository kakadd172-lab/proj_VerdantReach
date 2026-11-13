import * as THREE from 'three';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (a, b, value) => {
  const t = clamp01((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function deckY(design, station) {
  const t = clamp01(station);
  const edge = Math.pow(Math.abs(t - 0.5) * 2, 1.32);
  const rise = t < 0.5 ? design.hull.bowRise : design.hull.sternRise;
  return design.deckHeightUnits
    + design.hull.sheer * design.deckHeightUnits * edge
    + rise * design.deckHeightUnits * Math.pow(edge, 1.14) * design.structure.sheer;
}

export function keelY(design, station) {
  const t = clamp01(station);
  const mid = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.76);
  return -design.draftUnits * 0.49 - design.hull.keelDepth * design.draftUnits * mid;
}

/** Fuller midbody with a finer entrance and a broad, buoyant transom run. */
export function halfBreadth(design, station) {
  const t = clamp01(station);
  const sine = Math.max(0, Math.sin(Math.PI * t));
  const midbody = Math.pow(sine, 0.58);
  const bowEntry = 0.66 + 0.34 * smooth(0.04, 0.42, t);
  const sternRun = 0.82 + 0.18 * smooth(0.56, 0.98, t);
  const shoulder = 0.96 + 0.055 * Math.sin(Math.PI * t * 0.92);
  return design.beamUnits * 0.5 * midbody * bowEntry * sternRun * shoulder;
}

export function hullPoint(design, station, angle) {
  const t = clamp01(station);
  const vertical = (Math.sin(angle) + 1) * 0.5;
  const deck = deckY(design, t);
  const keel = keelY(design, t);
  const bottomFullness = 0.74 + 0.26 * Math.sqrt(Math.max(0, vertical));
  const upper = Math.max(0, (vertical - 0.52) / 0.48);
  const tumblehome = 1 - design.hull.tumblehome * Math.pow(upper, 1.22);
  const flare = 1 + design.structure.flare * Math.max(0, vertical - 0.32);
  return V(
    Math.cos(angle) * halfBreadth(design, t) * bottomFullness * tumblehome * flare,
    keel + (deck - keel) * vertical,
    (t - 0.5) * design.hullLengthUnits
  );
}
