import * as THREE from 'three';

export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * The visual hull is cut at an earlier aft station.
 * The bow and midship stations stay where they are; only the aft half is
 * shortened. The old hull section at the cut becomes the new transom.
 */
export function hullShapeStation(d,t) {
  const station=clamp01(t);
  const cutStation=Math.max(0.5,Math.min(1,d.hull.sternCutStation??1));
  if(station<=0.5)return station;
  return 0.5+(cutStation-0.5)*((station-0.5)/0.5);
}

function sectionBreadth(d, v) {
  const level = clamp01(v);
  // Full but rounded bilges, tapering naturally into the lower hull.
  const lowerRound = Math.pow(Math.sin(level * Math.PI * 0.5), 0.76);
  const bilgeFullness = 1.0 + 0.06 * Math.sin(Math.PI * level);
  const tuckStart = clamp01((level - 0.72) / 0.28);
  const tuck = 1 - (d.hull.tumblehome ?? 0) * Math.pow(tuckStart, 1.2);
  return lowerRound * bilgeFullness * tuck;
}

export function deckY(d, t) {
  const station=hullShapeStation(d,t);
  const edge = Math.pow(Math.abs(station - 0.5) * 2, 1.35);
  const rise = station < 0.5 ? d.hull.bowRise : d.hull.sternRise;
  return d.deckHeightUnits
    + d.hull.sheer * d.deckHeightUnits * edge
    + rise * d.deckHeightUnits * Math.pow(edge, 1.12) * d.structure.sheer;
}

export function keelY(d, t) {
  const station=hullShapeStation(d,t);
  const mid = Math.pow(Math.max(0, Math.sin(Math.PI * station)), 0.72);
  return -d.draftUnits * 0.48 - d.hull.keelDepth * d.draftUnits * mid;
}

export function halfBreadth(d,t){
  const station=hullShapeStation(d,t);
  const beamStation = Math.min(0.62, Math.max(0.38, d.structure.beamStation ?? 0.49));
  let taper;
  if (station <= beamStation) {
    const progress = station / beamStation;
    const sine = Math.sin(progress * Math.PI * 0.5);
    const exponent = 1.05 + Math.max(0, 1 - (d.structure.forebody ?? 0.76)) * 0.85;
    taper = Math.pow(Math.max(0, sine), exponent);
  } else {
    const progress = (1 - station) / (1 - beamStation);
    const sine = Math.sin(progress * Math.PI * 0.5);
    const exponent = 1.0 + Math.max(0, 1 - (d.structure.aftbody ?? 1.02)) * 0.55;
    taper = Math.pow(Math.max(0, sine), exponent);
  }

  const shoulder = 1 + 0.028 * Math.sin(Math.PI * station);
  return d.beamUnits * 0.5 * taper * shoulder;
}

export function stationZ(d, t, v=1) {
  const station = clamp01(t);
  const shapeStation = hullShapeStation(d,t);
  const level = clamp01(v);
  const bowRake = (d.hull.stemRake ?? 0.18)
    * d.beamUnits
    * Math.pow(1 - shapeStation, 4)
    * Math.pow(level, 0.92);
  // A single exponent keeps the aft cut on one gently raked plane.
  const sternRake = (d.hull.sternRake ?? 0.035)
    * d.beamUnits
    * Math.pow(shapeStation, 5)
    * Math.pow(level, 0.92);
  return (station - 0.5) * d.hullLengthUnits - bowRake + sternRake;
}

/** Point on one side of the hull, from the keel centreline to the gunwale. */
export function hullSurfacePoint(d, t, side, v) {
  const level = clamp01(v);
  const y = keelY(d, t) + (deckY(d, t) - keelY(d, t)) * Math.pow(level, 0.92);
  const x = side * halfBreadth(d, t) * sectionBreadth(d, level);
  return V(x, y, stationZ(d, t, level));
}

/**
 * Closed loft section: a narrow deck cap across the top and a rounded U-shaped
 * hull beneath it. The final section is the actual cut station, not an added
 * or re-flared extension.
 */
export function hullPoint(d, t, a) {
  const angle = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (angle <= Math.PI) {
    const across = angle / Math.PI;
    const x = (1 - 2 * across) * halfBreadth(d, t) * sectionBreadth(d, 1);
    return V(x, deckY(d, t) - 0.025, stationZ(d, t, 1));
  }

  const lowerAngle = angle - Math.PI;
  const cosine = Math.cos(lowerAngle);
  const side = cosine >= 0 ? -1 : 1;
  return hullSurfacePoint(d, t, side, Math.abs(cosine));
}
