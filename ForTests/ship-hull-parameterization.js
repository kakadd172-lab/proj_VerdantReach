/**
 * Parametric hull mathematics for the Verdant Reach vessel generator.
 *
 * The hull is described in separable naval-architecture regions:
 *   1. longitudinal plan: forebody, parallel midbody and aftbody;
 *   2. midship section: keel flat, bilge/chine, flare and tumblehome;
 *   3. vertical profile: bow and stern keel rocker plus deck sheer;
 *   4. stem and stern closing curves, with station-dependent section morph.
 *
 * The implementation is original JavaScript. Its design vocabulary was
 * informed by public parametric-hull research, including C_ShipGen
 * (MIT-licensed research code) and the Janibert hull generator
 * (GPL-3.0 reference inspected; no code copied or translated).
 */

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, Number(value) || 0));
const clamp01 = (value) => clamp(value, 0, 1);

export function cubicBezierScalar(p0, p1, p2, p3, t) {
  const u = clamp01(t);
  const inverse = 1 - u;
  return inverse ** 3 * p0
    + 3 * inverse ** 2 * u * p1
    + 3 * inverse * u ** 2 * p2
    + u ** 3 * p3;
}

function smoothstep(edge0, edge1, value) {
  if (edge1 <= edge0) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Returns the fraction of maximum half-beam at a longitudinal station.
 * Piecewise cubic Bezier curves meet at the maximum-beam shoulder with a
 * horizontal tangent, avoiding the abrupt derivative change of a raw power
 * taper. The forebody and aftbody remain independently controllable.
 */
export function getLongitudinalHalfBeamRatio(design, profile, station) {
  const t = clamp01(station);
  const shoulder = clamp(profile?.beamStation ?? 0.5, 0.35, 0.68);
  const foreTip = clamp(profile?.foreTip ?? 0, 0, 0.16);
  const aftTip = clamp(profile?.aftTip ?? 0, 0, 0.24);
  const forebody = clamp(profile?.forebody ?? 1, 0.45, 1.65);
  const aftbody = clamp(profile?.aftbody ?? 1, 0.45, 1.65);
  const entry = clamp(design?.hull?.entry ?? 0.65, 0.25, 1.1);
  const sternWidth = clamp(design?.hull?.sternWidth ?? aftTip, 0.02, 0.65);

  if (t <= shoulder) {
    const u = t / shoulder;
    const firstHandle = clamp(
      0.19 + (1 - forebody) * 0.10 + (0.7 - entry) * 0.06,
      0.10,
      0.40,
    );
    const control1 = foreTip + (1 - foreTip) * firstHandle;
    return clamp01(cubicBezierScalar(foreTip, control1, 1, 1, u));
  }

  const u = (t - shoulder) / (1 - shoulder);
  const aftHandle = clamp(
    0.24 + (aftbody - 0.9) * 0.10 + (0.32 - sternWidth) * 0.06,
    0.13,
    0.42,
  );
  const control2 = aftTip + (1 - aftTip) * aftHandle;
  return clamp01(cubicBezierScalar(1, 1, control2, aftTip, u));
}

/**
 * Returns the normalized half-breadth of a vertical midship section.
 * The lower curve describes bottom flatness and bilge fullness; the upper
 * curve describes flare and tumblehome. The top breadth is allowed to be
 * narrower than the maximum moulded breadth for strongly-tumbled-in hulls.
 */
export function getCrossSectionHalfBreadthRatio(design, profile, vertical) {
  const v = clamp01(vertical);
  const bottomFlat = clamp(profile?.bottomFlat ?? 0.2, 0.05, 0.7);
  const bilge = clamp(profile?.bilge ?? 0.12, 0.02, 0.5);
  const flare = clamp(profile?.flare ?? 0.08, 0, 0.35);
  const tumble = clamp(
    (profile?.tumble ?? 0) * 0.85 + (design?.hull?.tumblehome ?? 0) * 0.15,
    0,
    0.45,
  );
  const fullness = clamp(design?.hull?.fullness ?? 0.68, 0.35, 1.1);

  const keelBreadth = clamp(0.055 + bottomFlat * 0.23, 0.06, 0.24);
  const chineHeight = clamp(0.255 + bilge * 0.29, 0.26, 0.43);
  const chineBreadth = clamp(
    0.51 + bottomFlat * 0.20 + bilge * 0.20 + (fullness - 0.68) * 0.08,
    0.52,
    0.86,
  );
  const deckBreadth = clamp(1 + flare * 0.25 - tumble * 0.82, 0.72, 1);

  if (v <= chineHeight) {
    const u = v / chineHeight;
    const delta = chineBreadth - keelBreadth;
    return clamp(
      cubicBezierScalar(
        keelBreadth,
        keelBreadth + delta * 0.26,
        chineBreadth - delta * 0.07,
        chineBreadth,
        u,
      ),
      Math.min(keelBreadth, chineBreadth),
      Math.max(keelBreadth, chineBreadth),
    );
  }

  const u = (v - chineHeight) / (1 - chineHeight);
  const upperDelta = deckBreadth - chineBreadth;
  const flareHandle = clamp(flare * 0.55, 0, 0.16);
  const control1 = chineBreadth + upperDelta * (0.28 + flareHandle);
  const control2 = deckBreadth - upperDelta * (0.09 + tumble * 0.12);
  return clamp(
    cubicBezierScalar(chineBreadth, control1, control2, deckBreadth, u),
    Math.min(chineBreadth, deckBreadth),
    Math.max(chineBreadth, deckBreadth),
  );
}

/**
 * Finer V-sections in the entrance, full midship body, and a family-specific
 * tuck or U-section in the run. This is what makes a fluyt stop looking like
 * a scaled galleon.
 */
export function getStationSectionProfile(design, profile, station) {
  const t = clamp01(station);
  const shoulder = clamp(profile?.beamStation ?? 0.5, 0.35, 0.68);
  const bow = 1 - smoothstep(0, shoulder * 0.85, t);
  const stern = smoothstep(shoulder + (1 - shoulder) * 0.15, 1, t);
  const sternType = design?.hull?.stern ?? 'counter';
  const roundTuck = ['round', 'double-ended'].includes(sternType) ? 0.72 : (sternType === 'transom' ? 0.22 : 0.4);
  const vEntry = clamp(profile?.entryVee ?? 0.55, 0.15, 0.95);

  return {
    ...profile,
    bottomFlat: clamp((profile?.bottomFlat ?? 0.2) * (1 - bow * vEntry * 0.78) * (1 - stern * roundTuck * 0.35), 0.05, 0.7),
    bilge: clamp((profile?.bilge ?? 0.12) * (1 - bow * 0.35) * (1 + stern * (sternType === 'round' ? 0.18 : -0.08)), 0.02, 0.5),
    flare: clamp((profile?.flare ?? 0.08) + bow * 0.07 - stern * 0.03, 0, 0.35),
    tumble: clamp((profile?.tumble ?? 0) * (1 - bow * 0.45) * (1 + stern * 0.12), 0, 0.45),
  };
}

/**
 * The keel line rises independently toward the bow and stern. The broad
 * midbody remains the lowest region, while entry and transom proportions
 * control how quickly the rocker begins.
 */
export function getKeelLineHeight(design, profile, station) {
  const t = clamp01(station);
  const keelDepth = clamp(design?.hull?.keelDepth ?? 0.08, 0.005, 0.3);
  const entry = clamp(design?.hull?.entry ?? 0.65, 0.25, 1.1);
  const sternWidth = clamp(design?.hull?.sternWidth ?? 0.3, 0.02, 0.65);
  const deckHeight = Math.max(0.1, Number(design?.deckHeightUnits) || 0.1);
  const junk = design?.id === 'junk';
  const rockerGain = junk ? 2.15 : 1;

  const bowZone = clamp(0.14 + (1 - entry) * 0.1, 0.12, 0.26);
  const sternZone = clamp(0.14 + (1 - sternWidth) * 0.05, 0.13, 0.22);
  const bowRocker = keelDepth * deckHeight * (junk ? 2.4 : (1.15 + (1 - entry) * 0.28)) * rockerGain;
  const sternRocker = keelDepth * deckHeight * (junk ? 2.1 : 1.05) * rockerGain;
  const bowFactor = 1 - smoothstep(0, bowZone, t);
  const sternFactor = smoothstep(1 - sternZone, 1, t);

  return -design.draftUnits + bowRocker * bowFactor + sternRocker * sternFactor;
}

export function getStemProfile(design, profile, heightFraction, deckHeight) {
  const s = clamp01(heightFraction);
  const keelY = getKeelLineHeight(design, profile, 0);
  const top = Math.max(keelY + 0.05, Number(deckHeight) || design.deckHeightUnits);
  const rake = clamp(profile?.stemRake ?? 0.035, 0, 0.14);
  const cutwater = clamp(profile?.cutwater ?? 0.35, 0.05, 0.9);
  const length = design.hullLengthUnits;
  const y = keelY + s * (top - keelY);
  const forefoot = Math.pow(s, 0.55 + cutwater * 0.5);
  const z = -length * 0.5 - length * rake * forefoot;
  return { x: 0, y, z };
}

export function getSternProfile(design, profile, heightFraction, deckHeight) {
  const s = clamp01(heightFraction);
  const keelY = getKeelLineHeight(design, profile, 1);
  const top = Math.max(keelY + 0.05, Number(deckHeight) || design.deckHeightUnits);
  const rake = clamp(profile?.sternRake ?? 0.02, -0.04, 0.12);
  const overhang = clamp(profile?.counterOverhang ?? 0.04, 0, 0.16);
  const length = design.hullLengthUnits;
  const sternType = design?.hull?.stern ?? 'counter';
  const y = keelY + s * (top - keelY);
  let extension = 0;
  if (sternType === 'double-ended') extension = -length * rake * Math.pow(s, 0.7);
  else if (sternType === 'round') extension = length * overhang * Math.pow(s, 1.15);
  else if (sternType === 'transom') extension = length * (overhang * 0.35 + rake * Math.pow(s, 1.4));
  else extension = length * overhang * Math.pow(s, 1.25);
  const z = length * 0.5 + extension;
  return { x: 0, y, z };
}

/**
 * Open moulded hull point. section=0 is the keel, section=1 is the sheer.
 * side is +1 starboard / -1 port. The deck is not enclosed.
 */
export function getOpenHullPoint(design, profile, station, section, side, deckHeight) {
  const t = clamp01(station);
  const s = clamp01(section);
  const sgn = side < 0 ? -1 : 1;
  const morphed = getStationSectionProfile(design, profile, t);
  const halfBeam = (design.beamUnits * 0.5) * getLongitudinalHalfBeamRatio(design, profile, t);
  const breadth = getCrossSectionHalfBreadthRatio(design, morphed, s);
  const keelY = getKeelLineHeight(design, profile, t);
  const top = Math.max(keelY + 0.05, Number(deckHeight) || design.deckHeightUnits);
  const y = keelY + s * (top - keelY);
  let z = (t - 0.5) * design.hullLengthUnits;
  const stemBlend = 1 - smoothstep(0, 0.07, t);
  const sternBlend = smoothstep(0.93, 1, t);
  if (stemBlend > 0) {
    const stem = getStemProfile(design, profile, s, top);
    z = lerp(z, stem.z, stemBlend);
  }
  if (sternBlend > 0) {
    const stern = getSternProfile(design, profile, s, top);
    z = lerp(z, stern.z, sternBlend);
  }
  let x = sgn * halfBeam * breadth;
  if (stemBlend > 0) x *= lerp(1, 0.04 + (profile?.foreTip ?? 0), stemBlend * (1 - s * 0.15));
  return { x, y, z };
}

export function getParametricHullPoint(design, profile, station, angle, deckHeight) {
  const tau = ((Number(angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const side = tau > Math.PI ? -1 : 1;
  const folded = tau > Math.PI ? Math.PI * 2 - tau : tau;
  const section = 1 - folded / Math.PI;
  return getOpenHullPoint(design, profile, station, section, side, deckHeight);
}
