import { fbm2 } from './noise.js';

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Global-coordinate height field: domain warp + continentalness + ridges + erosion.
export function sampleTerrainFields(x, z, seed) {
  const warpX = x + fbm2(x * 0.00115, z * 0.00115, seed + 11, 3) * 82;
  const warpZ = z + fbm2(x * 0.00115, z * 0.00115, seed + 29, 3) * 82;
  const continental = fbm2(warpX * 0.00135, warpZ * 0.00135, seed + 101, 4);
  const mountainSignal = fbm2(warpX * 0.0021, warpZ * 0.0021, seed + 211, 3);
  const ridges = 1 - Math.abs(fbm2(warpX * 0.0041, warpZ * 0.0041, seed + 307, 4));
  const erosion = fbm2(warpX * 0.0065, warpZ * 0.0065, seed + 401, 3);
  const detail = fbm2(warpX * 0.022, warpZ * 0.022, seed + 503, 3);
  const mountainMask = smoothstep(-0.12, 0.48, continental) * smoothstep(-0.25, 0.42, mountainSignal);
  const mountainHeight = Math.pow(Math.max(0, ridges - 0.28), 1.45) * 67 * mountainMask;
  const baseHeight = 32 + continental * 22 + mountainHeight + erosion * 5.5 + detail * 2.25;
  const riverNoise = Math.abs(fbm2(warpX * 0.0052, warpZ * 0.0052, seed + 601, 4));
  const river = 1 - smoothstep(0.012, 0.048, riverNoise);
  const lakeSignal = fbm2(warpX * 0.0031, warpZ * 0.0031, seed + 719, 3);
  const lake = smoothstep(0.49, 0.61, lakeSignal) * (1 - smoothstep(0.70, 0.82, lakeSignal));
  return { warpX, warpZ, continental, mountainMask, baseHeight, river, lake };
}

export function shapeTerrainHeight(fields) {
  return Math.max(3, Math.min(75, fields.baseHeight - fields.river * 8.5 - fields.lake * 5.5));
}
