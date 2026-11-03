/**
 * Ship-specific structural blueprints for the v0.8.3 procedural fleet.
 * Values are dimensionless profile controls, not claims of measured offsets.
 * Hull dimensions remain in ship-designs.js; these profiles define how each
 * vessel's individual lines plan is approximated by the geometry builder.
 */
const blueprints = {
  sloop:      { frameCount: 18, maxBeamStation: 0.47, forebody: 0.82, aftbody: 0.96, bowTip: 0.012, sternTip: 0.055, sternExponent: 1.18, bottomFlat: 0.28, bilge: 0.15, flare: 0.08, tumble: 0.035, sheer: 1.08, rigging: { lowerMastRatio: 0.68, shroudPairs: 2, ratlineCount: 7, yardSpread: 0.96, sailArea: 0.98 } },
  schooner:   { frameCount: 22, maxBeamStation: 0.49, forebody: 0.76, aftbody: 0.90, bowTip: 0.008, sternTip: 0.075, sternExponent: 1.05, bottomFlat: 0.22, bilge: 0.12, flare: 0.10, tumble: 0.06, sheer: 0.96, rigging: { lowerMastRatio: 0.64, shroudPairs: 2, ratlineCount: 8, yardSpread: 0.92, sailArea: 1.02 } },
  brigantine: { frameCount: 26, maxBeamStation: 0.49, forebody: 0.96, aftbody: 1.02, bowTip: 0.006, sternTip: 0.09, sternExponent: 1.0, bottomFlat: 0.34, bilge: 0.20, flare: 0.07, tumble: 0.10, sheer: 1.02, rigging: { lowerMastRatio: 0.66, shroudPairs: 3, ratlineCount: 9, yardSpread: 1.02, sailArea: 1.0 } },
  brig:       { frameCount: 28, maxBeamStation: 0.50, forebody: 1.02, aftbody: 1.06, bowTip: 0.004, sternTip: 0.105, sternExponent: 0.92, bottomFlat: 0.38, bilge: 0.23, flare: 0.06, tumble: 0.11, sheer: 1.0, rigging: { lowerMastRatio: 0.65, shroudPairs: 3, ratlineCount: 10, yardSpread: 1.05, sailArea: 1.04 } },
  snow:       { frameCount: 24, maxBeamStation: 0.48, forebody: 0.94, aftbody: 1.10, bowTip: 0.006, sternTip: 0.07, sternExponent: 1.12, bottomFlat: 0.31, bilge: 0.18, flare: 0.08, tumble: 0.09, sheer: 1.04, rigging: { lowerMastRatio: 0.66, shroudPairs: 3, ratlineCount: 9, yardSpread: 0.98, sailArea: 0.97 } },
  cutter:     { frameCount: 17, maxBeamStation: 0.46, forebody: 0.72, aftbody: 0.98, bowTip: 0.004, sternTip: 0.045, sternExponent: 1.24, bottomFlat: 0.18, bilge: 0.10, flare: 0.13, tumble: 0.025, sheer: 1.12, rigging: { lowerMastRatio: 0.63, shroudPairs: 2, ratlineCount: 7, yardSpread: 0.94, sailArea: 1.08 } },
  frigate:    { frameCount: 30, maxBeamStation: 0.51, forebody: 1.18, aftbody: 1.18, bowTip: 0.002, sternTip: 0.08, sternExponent: 1.14, bottomFlat: 0.24, bilge: 0.12, flare: 0.04, tumble: 0.19, sheer: 0.88, rigging: { lowerMastRatio: 0.67, shroudPairs: 4, ratlineCount: 11, yardSpread: 1.08, sailArea: 1.08 } },
  barque:     { frameCount: 27, maxBeamStation: 0.48, forebody: 0.92, aftbody: 1.02, bowTip: 0.006, sternTip: 0.10, sternExponent: 0.98, bottomFlat: 0.36, bilge: 0.24, flare: 0.07, tumble: 0.08, sheer: 0.98, rigging: { lowerMastRatio: 0.66, shroudPairs: 3, ratlineCount: 10, yardSpread: 1.02, sailArea: 1.03 } },
  caravel:    { frameCount: 22, maxBeamStation: 0.46, forebody: 0.84, aftbody: 1.16, bowTip: 0.004, sternTip: 0.035, sternExponent: 1.38, bottomFlat: 0.17, bilge: 0.11, flare: 0.16, tumble: 0.08, sheer: 1.22, rigging: { lowerMastRatio: 0.61, shroudPairs: 2, ratlineCount: 7, yardSpread: 0.91, sailArea: 0.94 } },
  carrack:    { frameCount: 29, maxBeamStation: 0.48, forebody: 0.78, aftbody: 0.82, bowTip: 0.008, sternTip: 0.17, sternExponent: 0.72, bottomFlat: 0.48, bilge: 0.31, flare: 0.14, tumble: 0.08, sheer: 1.34, rigging: { lowerMastRatio: 0.62, shroudPairs: 3, ratlineCount: 9, yardSpread: 1.12, sailArea: 1.05 } },
  galleon:    { frameCount: 30, maxBeamStation: 0.47, forebody: 0.88, aftbody: 0.94, bowTip: 0.004, sternTip: 0.14, sternExponent: 0.78, bottomFlat: 0.41, bilge: 0.26, flare: 0.11, tumble: 0.12, sheer: 1.22, rigging: { lowerMastRatio: 0.64, shroudPairs: 2, ratlineCount: 8, yardSpread: 1.04, sailArea: 0.98 } },
  fluyt:      { frameCount: 27, maxBeamStation: 0.50, forebody: 0.70, aftbody: 0.78, bowTip: 0.012, sternTip: 0.08, sternExponent: 1.08, bottomFlat: 0.54, bilge: 0.38, flare: 0.03, tumble: 0.28, sheer: 0.82, rigging: { lowerMastRatio: 0.66, shroudPairs: 2, ratlineCount: 8, yardSpread: 0.94, sailArea: 0.92 } },
  xebec:     { frameCount: 24, maxBeamStation: 0.49, forebody: 1.34, aftbody: 1.22, bowTip: 0.001, sternTip: 0.025, sternExponent: 1.44, bottomFlat: 0.12, bilge: 0.06, flare: 0.04, tumble: 0.0, sheer: 0.76, rigging: { lowerMastRatio: 0.58, shroudPairs: 2, ratlineCount: 6, yardSpread: 1.14, sailArea: 1.12 } },
  pinnace:   { frameCount: 12, maxBeamStation: 0.50, forebody: 0.88, aftbody: 0.88, bowTip: 0.002, sternTip: 0.004, sternExponent: 1.55, bottomFlat: 0.20, bilge: 0.08, flare: 0.06, tumble: 0.04, sheer: 0.9, rigging: { lowerMastRatio: 0.6, shroudPairs: 1, ratlineCount: 4, yardSpread: 0.72, sailArea: 0.68 } },
};
for (const value of Object.values(blueprints)) Object.freeze(value.rigging), Object.freeze(value);
export const SHIP_STRUCTURE_BLUEPRINTS = Object.freeze(blueprints);
export function getShipStructureBlueprint(id) {
  return SHIP_STRUCTURE_BLUEPRINTS[String(id ?? '').replace(/^ship-/, '')] ?? null;
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function getHullHalfBeam(design, station) {
  const p = getShipStructureBlueprint(design?.id);
  if (!p) return design.beamUnits * 0.5;
  const t = clamp01(station);
  const centre = p.maxBeamStation;
  const fore = Math.pow(clamp01(t / centre), p.forebody);
  const aftT = clamp01((1 - t) / (1 - centre));
  const aft = p.sternTip + (1 - p.sternTip) * Math.pow(aftT, p.aftbody);
  const longitudinal = t < centre ? fore : aft;
  return design.beamUnits * 0.5 * longitudinal;
}
export function getHullSectionWidth(design, vertical) {
  const p = getShipStructureBlueprint(design?.id);
  if (!p) return 1;
  const v = clamp01(vertical);
  const bottom = 1 - p.bottomFlat * (1 - smooth(0.02, 0.34, v));
  const bilge = 1 + p.bilge * Math.exp(-Math.pow((v - 0.31) / 0.22, 2));
  const flare = 1 + p.flare * Math.pow(v, 2.4);
  const tumble = 1 - p.tumble * Math.pow(clamp01((v - 0.61) / 0.39), 1.35);
  return bottom * bilge * flare * tumble;
}
