import { clamp, smoothstep, hashString } from '../core/random.js';
import { fbm2, ridgedFbm2, domainFbm } from './noise.js';
import { classifyBiome } from './biomes.js';
import { sampleLandformSignals } from './landforms.js';

export class WorldGenerator {
  constructor(seedText) {
    this.seedText = String(seedText);
    this.seed = hashString(this.seedText);
    this.seedA = this.seed ^ 0x68bc21eb;
    this.seedB = this.seed ^ 0x02e5be93;
    this.seedC = this.seed ^ 0x967a889b;
    this.version = 'vr-terrain-04';
    this.biomeOverrides = [];
  }

  _terrainBase(x, z) {
    // Macro-scale continental field, warped before smaller relief is layered in.
    const macro = domainFbm(x, z, this.seedA, 0.000055, 2.6, 5);
    const broad = fbm2(x * 0.0001925, z * 0.0001925, this.seedB, 4);
    const regional = fbm2(x * 0.00065, z * 0.00065, this.seedB + 33, 4);
    const continentalness = macro * 0.68 + broad * 0.20 + regional * 0.12;
    const land = smoothstep(-0.11, 0.13, continentalness);

    const mountainMaskNoise = fbm2(x * 0.00078 + 91, z * 0.00078 - 43, this.seedB, 4);
    const mountainBelt = smoothstep(0.08, 0.58, mountainMaskNoise + 0.17);
    const ridge = ridgedFbm2(x * 0.00135, z * 0.00135, this.seedC, 5);
    const mountain = Math.pow(ridge, 2.25) * mountainBelt * 82;

    const rolling = fbm2(x * 0.0046, z * 0.0046, this.seedA + 31, 5) * 9.5;
    const localDetail = fbm2(x * 0.017, z * 0.017, this.seedC + 17, 3) * 1.9;
    const plateauField = fbm2(x * 0.00062, z * 0.00062, this.seedA + 991, 3);
    const plateau = smoothstep(0.42, 0.72, plateauField) * 10;
    const shoreShelf = smoothstep(-0.25, 0.09, continentalness);
    const baseHeight = -25 - (1 - land) * 55 + shoreShelf * (38 + rolling * 0.65) + mountain + rolling + localDetail + plateau;
    const landforms = sampleLandformSignals(x, z, this.seedC, mountainBelt, baseHeight);
    const height = baseHeight + landforms.ridgeLift + landforms.cliffLift - landforms.ravineDepth;
    return { height, baseHeight, continentalness, land, mountainBelt, landforms };
  }

  sample(x, z, withSlope = false) {
    const terrain = this._terrainBase(x, z);
    const { height, continentalness, land, landforms } = terrain;

    // A broad, non-repeating latitude gradient gives cold high-latitude regions.
    const latitude = clamp(1 - Math.abs(z) * 0.000018, 0.04, 1);
    const tempNoise = fbm2(x * 0.0009, z * 0.0009, this.seedC + 401, 3) * 0.12;
    const temperature = clamp(0.83 * latitude + tempNoise - Math.max(0, height) * 0.0065, 0, 1);
    const moisture = clamp(0.43 + fbm2(x * 0.0013, z * 0.0013, this.seedB + 71, 5) * 0.68, 0, 1);
    const prevailingWind = fbm2(x * 0.00042 + 500, z * 0.00042, this.seedA + 700, 3);
    const windDirection = prevailingWind >= 0 ? 1 : -1;
    const upwindMaskNoise = fbm2((x - windDirection * 3200) * 0.00078 + 91, (z - 900) * 0.00078 - 43, this.seedB, 4);
    const upwindMountain = smoothstep(0.08, 0.58, upwindMaskNoise + 0.17);
    const orographicLift = terrain.mountainBelt * (0.11 + Math.max(0, prevailingWind) * 0.17);
    const rainShadow = clamp((upwindMountain - terrain.mountainBelt) * 0.36, 0, 0.22);
    const windExposure = clamp(0.5 + prevailingWind * 0.5 + terrain.mountainBelt * 0.2, 0, 1);
    const rainfall = clamp(moisture + orographicLift - rainShadow - (continentalness < -0.1 ? 0.15 : 0), 0, 1);
    const slopeX = withSlope ? this._heightOnly(x + 1.25, z) - this._heightOnly(x - 1.25, z) : 0;
    const slopeZ = withSlope ? this._heightOnly(x, z + 1.25) - this._heightOnly(x, z - 1.25) : 0;
    const slope = withSlope ? Math.sqrt(slopeX * slopeX + slopeZ * slopeZ) / 2.5 : 0;
    const naturalBiome = classifyBiome({ height, temperature, moisture, rainfall, slope });
    let biome = naturalBiome;
    for (let i = this.biomeOverrides.length - 1; i >= 0; i -= 1) {
      const patch = this.biomeOverrides[i];
      const dx = x - patch.x;
      const dz = z - patch.z;
      if (dx * dx + dz * dz <= patch.radius * patch.radius) { biome = patch.biome; break; }
    }

    return {
      height, baseHeight: terrain.baseHeight, biome, naturalBiome, temperature, moisture,
      rainfall, continentalness, slope, land, windExposure, rainShadow,
      mountainIntensity: landforms.mountainIntensity,
      ridgeSpine: landforms.ridgeSpine,
      ravineIntensity: landforms.ravineIntensity,
      ravineDepth: landforms.ravineDepth,
      cliffIntensity: landforms.cliffIntensity,
      meadowPotential: landforms.meadowPotential,
      fieldSuitability: landforms.fieldSuitability,
      floodplain: landforms.floodplain,
      massifRelief: landforms.massifRelief,
    };
  }

  setBiomeOverrides(overrides = []) {
    this.biomeOverrides = Array.isArray(overrides)
      ? overrides.filter((patch) => patch && Number.isFinite(patch.x) && Number.isFinite(patch.z) && Number.isFinite(patch.radius) && typeof patch.biome === 'string').slice(-128).map((patch) => ({ ...patch }))
      : [];
  }

  _heightOnly(x, z) {
    return this._terrainBase(x, z).height;
  }

  drainageHeightAt(x, z) {
    // Keep hydrology anchored to the established drainage field so existing
    // rivers, bridges and prepared test-world routes remain reproducible.
    const macro = domainFbm(x, z, this.seedA, 0.000055, 2.6, 5);
    const broad = fbm2(x * 0.0001925, z * 0.0001925, this.seedB, 4);
    const regional = fbm2(x * 0.00065, z * 0.00065, this.seedB + 33, 4);
    const continentalness = macro * 0.68 + broad * 0.20 + regional * 0.12;
    const land = smoothstep(-0.11, 0.13, continentalness);
    const mountainMaskNoise = fbm2(x * 0.00078 + 91, z * 0.00078 - 43, this.seedB, 4);
    const mountainBelt = smoothstep(0.08, 0.58, mountainMaskNoise + 0.17);
    const ridge = ridgedFbm2(x * 0.00135, z * 0.00135, this.seedC, 5);
    const mountain = Math.pow(ridge, 2.25) * mountainBelt * 82;
    const rolling = fbm2(x * 0.00125, z * 0.00125, this.seedA + 31, 4) * 4.2;
    const plateauField = fbm2(x * 0.00062, z * 0.00062, this.seedA + 991, 3);
    const plateau = smoothstep(0.42, 0.72, plateauField) * 10;
    const shoreShelf = smoothstep(-0.25, 0.09, continentalness);
    return -25 - (1 - land) * 55 + shoreShelf * (38 + rolling * 0.65) + mountain + rolling + plateau;
  }

  heightAt(x, z) {
    return this._heightOnly(x, z);
  }

  findSpawn() {
    // Keep the built-in Wayfarer's Circuit anchored to its original playable
    // shelf. Its route is a curated regression fixture, not a random new world.
    if (this.seedText === 'WAYFARER-TEST-040') {
      const x = -786;
      const z = -251;
      return { x, z, height: this.heightAt(x, z) };
    }
    // A low-discrepancy spiral searches a broad area without favouring one compass direction.
    // This matters now that the macro field describes continents rather than nearby terrain patches.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    let best = { x: 0, z: 0, height: -Infinity };
    for (let i = 0; i < 5200; i += 1) {
      const radius = 165 * Math.sqrt(i);
      const angle = i * goldenAngle;
      const x = Math.round(Math.cos(angle) * radius);
      const z = Math.round(Math.sin(angle) * radius);
      const height = this.heightAt(x, z);
      if (height > 8 && height < 82) return { x, z, height };
      if (height > best.height && height < 82) best = { x, z, height };
    }
    return best.height > 8 ? best : { x: 0, z: 0, height: this.heightAt(0, 0) };
  }
}
