import { clamp, smoothstep } from '../core/random.js';
import { fbm2, ridgedFbm2 } from './noise.js';

// Continuous, seed-stable landform signals. Every field is evaluated in global
// coordinates, so a chunk boundary never changes the shape of a ridge or ravine.
export function sampleLandformSignals(x, z, seed, mountainBelt, baseHeight = 0) {
  const warpX = fbm2(x * 0.00024, z * 0.00024, seed ^ 0x5a31, 3) * 980;
  const warpZ = fbm2(x * 0.00024 + 47, z * 0.00024 - 83, seed ^ 0x6c17, 3) * 980;
  const spine = ridgedFbm2((x + warpX) * 0.00072, (z + warpZ) * 0.00072, seed ^ 0x41d9, 5);
  const massif = ridgedFbm2((x + warpX * 0.42) * 0.000255, (z + warpZ * 0.42) * 0.000255, seed ^ 0x3a91, 4);
  const mountainIntensity = clamp(mountainBelt * (0.34 + spine * 0.88), 0, 1);
  // Keep regional elevations stable while using the ridge field to articulate
  // connected crests and spurs inside the existing mountain provinces.
  const ridgeLift = spine * spine * mountainBelt * 34;

  // Warped zero-contours create long, branching-looking ravine lines. They are
  // strongest in uplands and mountain belts, and fade out across low plains.
  const ravineWarpX = fbm2(x * 0.00043, z * 0.00043, seed ^ 0x7b21, 3) * 340;
  const ravineWarpZ = fbm2(x * 0.00043 - 23, z * 0.00043 + 71, seed ^ 0x2c49, 3) * 340;
  const ravineField = fbm2((x + ravineWarpX) * 0.00105, (z + ravineWarpZ) * 0.00105, seed ^ 0x17a3, 4);
  const ravineLine = 1 - smoothstep(0.009, 0.061, Math.abs(ravineField));
  const ravineIntensity = clamp(ravineLine * mountainBelt * smoothstep(13, 38, baseHeight), 0, 1);
  const ravineCut = ravineIntensity * (7.5 + mountainBelt * 8.5);

  // A warped escarpment field produces continuous plateau edges and cliff bands.
  // This remains a heightfield (no hidden overhangs), but the transition is sharp
  // enough to create readable rock faces at the current chunk mesh resolution.
  const escarpmentWarp = fbm2(x * 0.00031, z * 0.00031, seed ^ 0x3d51, 3) * 220;
  const escarpmentField = fbm2((x + escarpmentWarp) * 0.00091, (z - escarpmentWarp * 0.7) * 0.00091, seed ^ 0x8e13, 4);
  const plateauStep = smoothstep(0.012, 0.032, escarpmentField) * smoothstep(10, 32, baseHeight) * 13;
  const cliffBand = 1 - smoothstep(0.003, 0.025, Math.abs(escarpmentField - 0.012));
  const cliffIntensity = clamp(cliffBand * smoothstep(7, 25, baseHeight) * (0.38 + mountainBelt * 0.62), 0, 1);
  const cliffLift = plateauStep;

  const floodplain = clamp((1 - smoothstep(0.055, 0.22, Math.abs(ravineField))) * (1 - mountainBelt) * 0.55, 0, 0.55);
  const meadowPotential = clamp((1 - mountainBelt) * (1 - smoothstep(0.30, 0.8, Math.abs(ravineField))) * (1 - cliffIntensity * 0.78) + floodplain * 0.45, 0, 1);
  const fieldSuitability = clamp(meadowPotential * (1 - smoothstep(0.14, 0.4, Math.max(0, baseHeight * 0.008))) * (1 - smoothstep(0.12, 0.32, ravineIntensity)), 0, 1);

  return {
    mountainIntensity,
    ridgeSpine: spine,
    ridgeLift,
    ravineIntensity,
    ravineDepth: ravineCut,
    cliffIntensity,
    cliffLift,
    meadowPotential,
    fieldSuitability,
    floodplain,
    massifRelief: massif,
  };
}
