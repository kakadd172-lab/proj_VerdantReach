import { hashString, random2, clamp } from '../core/random.js';
import { buildFreeCityPlan } from './settlement-layouts.js';

const RIVER_CELL = 4200;
const RIVER_STEP = 96;
const RIVER_MAX_STEPS = 100;
const SETTLEMENT_CELL = 1760;
const CITY_CELL = 68000;
const RUIN_CELL = 32000;
const CONTINENT_CELL = 280000;
const NAME_A = ['Ash', 'Briar', 'Dawn', 'Elder', 'Fern', 'Glen', 'Hearth', 'Ivory', 'Juniper', 'Lark', 'Moss', 'Oak', 'Raven', 'Silver', 'Thorn', 'Willow'];
const NAME_B = ['barrow', 'brook', 'cross', 'fall', 'field', 'ford', 'haven', 'mere', 'rest', 'run', 'watch', 'wick', 'wood', 'stead', 'reach', 'bridge'];

function makeName(seed, x, z, salt = 0) {
  const a = Math.floor(random2(x, z, seed ^ salt) * NAME_A.length);
  const b = Math.floor(random2(x + 19, z - 7, seed ^ salt ^ 0x71d2) * NAME_B.length);
  return `${NAME_A[a]}${NAME_B[b]}`;
}

function distanceToSegment(px, pz, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSq = dx * dx + dz * dz || 1;
  const t = clamp(((px - a.x) * dx + (pz - a.z) * dz) / lengthSq, 0, 1);
  const x = a.x + dx * t;
  const z = a.z + dz * t;
  return Math.hypot(px - x, pz - z);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export class WorldIntelligence {
  constructor(generator, spawn = null, options = {}) {
    this.generator = generator;
    this.seed = generator.seed;
    this.riverCache = new Map();
    this.settlementCache = new Map();
    this.cityCache = new Map();
    this.ruinCache = new Map();
    this.spawn = spawn ?? generator.findSpawn();
    this.scenario = options.scenario ?? null;
    this.customSettlements = new Map();
    this.starterSettlement = this._makeStarterSettlement(this.spawn);
    this.regionalFreeCity = this._makeRegionalFreeCity();
    this.regionalRuin = this._makeRegionalRuin();
    for (const record of options.customSettlements ?? []) this.addCustomSettlement(record);
  }

  _continentAnchor(x, z) {
    const cellX = Math.floor(x / CONTINENT_CELL);
    const cellZ = Math.floor(z / CONTINENT_CELL);
    let best = null;
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const gx = cellX + dx;
        const gz = cellZ + dz;
        const anchor = {
          x: (gx + 0.16 + random2(gx, gz, this.seed ^ 0x4c91) * 0.68) * CONTINENT_CELL,
          z: (gz + 0.16 + random2(gx + 19, gz - 11, this.seed ^ 0x4c91) * 0.68) * CONTINENT_CELL,
          gx,
          gz,
        };
        const d = (anchor.x - x) ** 2 + (anchor.z - z) ** 2;
        if (!best || d < best.distance) best = { ...anchor, distance: d };
      }
    }
    return best;
  }

  regionIdentity(x, z) {
    const sample = this.generator.sample(x, z);
    const regionX = Math.floor(x / 96000);
    const regionZ = Math.floor(z / 96000);
    const anchor = this._continentAnchor(x, z);
    const continent = sample.height < 0 ? 'The Open Sea' : `The ${makeName(this.seed, anchor.gx, anchor.gz, 0x4c91)} Expanse`;
    return {
      continent,
      continentId: sample.height < 0 ? 'ocean' : `continent:${anchor.gx}:${anchor.gz}`,
      region: makeName(this.seed, regionX, regionZ, 0x2a17),
      elevation: sample.height,
      biome: sample.biome,
    };
  }

  _riverPath(cellX, cellZ) {
    const key = `${cellX}:${cellZ}`;
    if (this.riverCache.has(key)) return this.riverCache.get(key);
    const chance = random2(cellX, cellZ, this.seed ^ 0x51a7);
    if (chance > 0.46) {
      this.riverCache.set(key, null);
      return null;
    }

    const startX = (cellX + 0.18 + random2(cellX + 37, cellZ, this.seed ^ 0x10f3) * 0.64) * RIVER_CELL;
    const startZ = (cellZ + 0.18 + random2(cellX, cellZ - 61, this.seed ^ 0x7e31) * 0.64) * RIVER_CELL;
    const source = this.generator.sample(startX, startZ, true);
    if (source.height < 12 || source.height > 92 || source.rainfall < 0.39 || ['desert', 'snow', 'tundra'].includes(source.biome)) {
      this.riverCache.set(key, null);
      return null;
    }

    const path = [];
    const waterfalls = [];
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [0.70710678, 0.70710678], [-0.70710678, 0.70710678],
      [0.70710678, -0.70710678], [-0.70710678, -0.70710678],
    ];
    let x = startX;
    let z = startZ;
    let height = this.generator.drainageHeightAt(startX, startZ);
    let previousX = 0;
    let previousZ = 0;
    let stagnantSteps = 0;
    let terminal = 'inland';
    let lake = null;
    const visitedChannels = new Set();

    // The complete channel is derived from its global source cell. Adjacent chunk
    // requests therefore receive the same downstream trace and can share channels.
    for (let step = 0; step < RIVER_MAX_STEPS; step += 1) {
      const width = 1.5 + step * 0.035;
      const surfaceHeight = this.generator.heightAt(x, z);
      path.push({ x, z, y: Math.max(-0.2, surfaceHeight + 0.24), width });
      if (height <= 0.8) {
        terminal = 'ocean';
        break;
      }

      let best = null;
      const stride = RIVER_STEP;
      for (const [dx, dz] of directions) {
        const nx = x + dx * stride;
        const nz = z + dz * stride;
        const visitKey = `${Math.round(nx / 72)}:${Math.round(nz / 72)}`;
        if (visitedChannels.has(visitKey)) continue;
        const nh = this.generator.drainageHeightAt(nx, nz);
        const farHeight = this.generator.drainageHeightAt(x + dx * 1600, z + dz * 1600);
        const alignment = previousX || previousZ ? dx * previousX + dz * previousZ : 0;
        const momentumPenalty = (1 - alignment) * 0.34;
        const regionalPull = (farHeight - height) * 0.52;
        const jitter = (random2(Math.floor(nx / 32), Math.floor(nz / 32), this.seed ^ (step * 131 + cellX * 17 + cellZ)) - 0.5) * 0.045;
        const score = nh + regionalPull + momentumPenalty + jitter;
        if (!best || score < best.score) best = { x: nx, z: nz, height: nh, score, dx, dz, farHeight };
      }
      if (!best || best.height > height + 5.5) break;

      const descent = height - best.height;
      const nextSurface = this.generator.heightAt(best.x, best.z);
      const visibleDrop = surfaceHeight - nextSurface;
      if (visibleDrop >= 4.5 && surfaceHeight > 3.5) {
        waterfalls.push({
          x: (x + best.x) * 0.5, z: (z + best.z) * 0.5,
          topY: surfaceHeight + 0.12, bottomY: Math.max(0.05, nextSurface + 0.2),
          width: Math.max(2.8, width * 1.3), flowX: best.x - x, flowZ: best.z - z,
          drop: visibleDrop,
        });
      }
      stagnantSteps = descent < 0.08 ? stagnantSteps + 1 : 0;
      if (stagnantSteps >= 3 && height > 2.5 && height < 34) {
        const ring = [];
        for (let i = 0; i < 12; i += 1) {
          const angle = i * Math.PI * 2 / 12;
          ring.push(this.generator.drainageHeightAt(x + Math.cos(angle) * 240, z + Math.sin(angle) * 240));
        }
        const rim = ring.reduce((sum, value) => sum + value, 0) / ring.length;
        if (rim - height > 1.15) {
          lake = {
            x, z,
            y: height + Math.min(0.9, (rim - height) * 0.12),
            radius: clamp(22 + (rim - height) * 12, 22, 76),
            id: `lake:${cellX}:${cellZ}`,
          };
          terminal = 'lake';
          break;
        }
      }

      visitedChannels.add(`${Math.round(x / 72)}:${Math.round(z / 72)}`);
      x = best.x;
      z = best.z;
      height = best.height;
      previousX = best.dx;
      previousZ = best.dz;
    }

    const result = path.length >= 8
      ? { id: `river:${cellX}:${cellZ}`, path, source: { x: startX, z: startZ }, terminal, lake, waterfalls }
      : null;
    this.riverCache.set(key, result);
    return result;
  }

  riversInBounds(minX, minZ, maxX, maxZ) {
    // Scan every possible source cell whose bounded channel trace could cross this
    // region. This prevents a river generated several chunks upstream from vanishing
    // at a chunk boundary.
    const pad = RIVER_MAX_STEPS * RIVER_STEP + 160;
    const minCellX = Math.floor((minX - pad) / RIVER_CELL);
    const maxCellX = Math.floor((maxX + pad) / RIVER_CELL);
    const minCellZ = Math.floor((minZ - pad) / RIVER_CELL);
    const maxCellZ = Math.floor((maxZ + pad) / RIVER_CELL);
    const rivers = [];
    if (this.scenario?.river) {
      const river = this.scenario.river;
      const points = river.path ?? [];
      const intersects = points.some((point) => point.x >= minX - 40 && point.x <= maxX + 40 && point.z >= minZ - 40 && point.z <= maxZ + 40);
      const lake = river.lake;
      const lakeIntersects = lake && lake.x + lake.radius >= minX && lake.x - lake.radius <= maxX
        && lake.z + lake.radius >= minZ && lake.z - lake.radius <= maxZ;
      if (intersects || lakeIntersects) rivers.push(river);
    }
    for (let cz = minCellZ; cz <= maxCellZ; cz += 1) {
      for (let cx = minCellX; cx <= maxCellX; cx += 1) {
        const river = this._riverPath(cx, cz);
        if (!river) continue;
        let intersects = false;
        for (const point of river.path) {
          if (point.x >= minX - 30 && point.x <= maxX + 30 && point.z >= minZ - 30 && point.z <= maxZ + 30) {
            intersects = true;
            break;
          }
        }
        if (!intersects && river.lake) {
          const lake = river.lake;
          intersects = lake.x + lake.radius >= minX && lake.x - lake.radius <= maxX
            && lake.z + lake.radius >= minZ && lake.z - lake.radius <= maxZ;
        }
        if (intersects) rivers.push(river);
      }
    }
    return rivers;
  }

  riverDistanceAt(x, z, searchRadius = 900) {
    const rivers = this.riversInBounds(x - searchRadius, z - searchRadius, x + searchRadius, z + searchRadius);
    let nearest = Infinity;
    for (const river of rivers) {
      for (let i = 1; i < river.path.length; i += 1) {
        nearest = Math.min(nearest, distanceToSegment(x, z, river.path[i - 1], river.path[i]));
      }
      if (river.lake) {
        const lakeEdgeDistance = Math.max(0, distance({ x, z }, river.lake) - river.lake.radius);
        nearest = Math.min(nearest, lakeEdgeDistance);
      }
    }
    return nearest;
  }

  _scoreSettlementPoint(x, z) {
    const sample = this.generator.sample(x, z, true);
    if (sample.height < 3.5 || sample.height > 58 || sample.slope > 0.36) return null;
    if (['desert', 'snow', 'tundra', 'alpine', 'ocean'].includes(sample.biome)) return null;
    const riverDistance = this.riverDistanceAt(x, z, 420);
    const coastAccess = sample.height < 8 && sample.continentalness < 0.1;
    const riverAccess = riverDistance < 260;
    let score = 1.1 - sample.slope * 1.7;
    score += clamp(1 - Math.abs(sample.moisture - 0.56) * 1.7, 0, 1) * 0.34;
    score += sample.height < 32 ? 0.2 : 0;
    score += riverAccess ? 0.42 : 0;
    score += coastAccess ? 0.32 : 0;
    if (sample.biome === 'grassland' || sample.biome === 'forest') score += 0.12;
    return { x, z, sample, score, riverDistance, coastAccess, riverAccess };
  }

  _makeSettlement(id, x, z, kind = 'village', starter = false) {
    const candidate = this._scoreSettlementPoint(x, z);
    if (!candidate) return null;
    const type = kind === 'freeCity' ? 'freeCity' : candidate.coastAccess ? 'port' : (candidate.riverAccess ? 'market' : kind);
    const seed = hashString(id);
    const population = type === 'freeCity' ? 520 : type === 'port' ? 34 : type === 'market' ? 27 : 16;
    const rawName = makeName(this.seed, Math.floor(x / 90), Math.floor(z / 90), 0x6b31);
    const settlement = {
      id,
      name: type === 'freeCity' ? `Free City of ${rawName}` : rawName,
      type,
      x,
      z,
      elevation: candidate.sample.height,
      biome: candidate.sample.biome,
      moisture: candidate.sample.moisture,
      riverAccess: candidate.riverAccess,
      coastAccess: candidate.coastAccess,
      continent: this.regionIdentity(x, z).continent,
      factionId: `faction:${Math.floor(random2(Math.floor(x / 5000), Math.floor(z / 5000), this.seed ^ 0x991) * 4)}`,
      government: type === 'freeCity' ? 'chartered-council' : null,
      chartered: type === 'freeCity',
      seed,
      starter,
      basePopulation: type === 'freeCity'
        ? 4200 + Math.floor(random2(seed, 17, this.seed) * 7800)
        : population + Math.floor(random2(seed, 17, this.seed) * 12),
      buildingCount: type === 'freeCity'
        ? 0
        : 5 + Math.floor(random2(seed, 31, this.seed) * 5),
      urbanRadius: type === 'freeCity' ? 510 : 0,
    };
    // Keep the population/economy metadata aligned with the actual procedural
    // plan. This is generated without constructing any Three.js meshes.
    if (type === 'freeCity') {
      const plan = buildFreeCityPlan(settlement, this.generator);
      settlement.buildingCount = plan.buildings.length + plan.landmarks.length;
    }
    return settlement;
  }

  _isCityFootprintBuildable(x, z, cityId = 'free-city:regional-charter') {
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    const acceptSample = (sample) => {
      if (sample.height < 0.05 || sample.height > 56 || sample.slope > 0.92) return false;
      minHeight = Math.min(minHeight, sample.height);
      maxHeight = Math.max(maxHeight, sample.height);
      return true;
    };
    // Probe the inner wards and the approach to the curtain wall.
    for (const radius of [365, 482]) {
      for (let i = 0; i < 24; i += 1) {
        const angle = i * Math.PI * 2 / 24;
        if (!acceptSample(this.generator.sample(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius, true))) return false;
      }
    }
    // Large civic buildings need their own nearly level foundations. Check the
    // corners of their actual footprints rather than relying on the city centre.
    const landmarks = [
      [-225, -90, 100, 154, Math.PI - Math.atan2(90, 225)], [230, -100, 58, 42, 0.08],
      [230, 100, 64, 48, -0.12], [0, 2, 48, 38, 0],
      [-55, -190, 21, 21, 0], [390, 70, 52, 32, Math.PI / 2],
      [-390, 70, 40, 30, -0.2], [390, -70, 44, 30, 0.1],
    ];
    for (const [offsetX, offsetZ, width, depth, yaw] of landmarks) {
      const c = Math.cos(yaw);
      const s = Math.sin(yaw);
      const centerSample = this.generator.sample(x + offsetX, z + offsetZ, true);
      if (centerSample.height < 0.05 || centerSample.height > 70 || centerSample.slope > 0.92) return false;
      const heights = [centerSample.height];
      for (const [lx, lz] of [
        [-width * 0.5, -depth * 0.5], [-width * 0.5, depth * 0.5],
        [width * 0.5, -depth * 0.5], [width * 0.5, depth * 0.5],
      ]) {
        const px = x + offsetX + c * lx + s * lz;
        const pz = z + offsetZ - s * lx + c * lz;
        const sample = this.generator.sample(px, pz, true);
        if (sample.height < 0.05 || sample.height > 70) return false;
        heights.push(sample.height);
      }
      if (Math.max(...heights) - Math.min(...heights) > 12) return false;
    }
    // Match the actual seeded 40-point city wall polygon exactly. Sampling a
    // coarser circle allowed a narrow tidal/sea-level notch to slip between probes.
    const wallSeed = hashString(cityId) ^ 0x4a17;
    const wallPoints = Array.from({ length: 40 }, (_, i) => {
      const angle = i / 40 * Math.PI * 2;
      const variation = 1 + (random2(i * 17 + 3, i * 31 - 9, wallSeed) - 0.5) * 0.14;
      const radius = 510 * variation;
      return { x: x + Math.cos(angle) * radius, z: z + Math.sin(angle) * radius };
    });
    for (let i = 0; i < wallPoints.length; i += 1) {
      const a = wallPoints[i];
      const b = wallPoints[(i + 1) % wallPoints.length];
      // The renderer builds roughly nine-metre wall panels; sample each panel
      // interval so a wet or excessively steep notch between polygon vertices
      // cannot make a panel float or disappear below the terrain.
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        if (!acceptSample(this.generator.sample(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, true))) return false;
      }
    }
    return maxHeight - minHeight < 46;
  }

  _castleFootprintStats(x, z, ruinId = 'ruin:regional-watch') {
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let maxSlope = 0;
    const accept = (px, pz) => {
      const sample = this.generator.sample(px, pz, true);
      if (sample.height < 8 || sample.height > 128) return false;
      minHeight = Math.min(minHeight, sample.height);
      maxHeight = Math.max(maxHeight, sample.height);
      maxSlope = Math.max(maxSlope, sample.slope);
      return true;
    };
    const seed = hashString(ruinId);
    const keepX = x - 14;
    const keepZ = z - 12;
    // Sample the keep's actual foundation footprint, not only its centre.
    for (const tx of [-1, 0, 1]) for (const tz of [-1, 0, 1]) {
      if (!accept(keepX + tx * 29, keepZ + tz * 27)) return null;
    }
    // Exact seeded outer curtain and inner ward vertices.
    for (const [count, radius, jitter, salt] of [[24, 205, 0.13, 0x5c11], [16, 116, 0.09, 0x2f71]]) {
      for (let i = 0; i < count; i += 1) {
        const angle = i / count * Math.PI * 2;
        const variation = 1 + (random2(i * 17 + 3, i * 31 - 9, seed ^ salt) - 0.5) * jitter * 2;
        if (!accept(x + Math.cos(angle) * radius * variation, z + Math.sin(angle) * radius * variation)) return null;
      }
    }
    // Barbican outwork and its approach.
    for (let i = 0; i < 10; i += 1) {
      const angle = i / 10 * Math.PI * 2;
      const variation = 1 + (random2(i * 17 + 3, i * 31 - 9, seed ^ 0x6b31) - 0.5) * 0.16;
      if (!accept(x + Math.cos(angle) * 34 * variation, z + 196 + Math.sin(angle) * 34 * variation)) return null;
    }
    // Sample the moat around the full perimeter, including terrain between wall vertices.
    for (let i = 0; i < 48; i += 1) {
      const angle = i / 48 * Math.PI * 2;
      if (!accept(x + Math.cos(angle) * 222, z + Math.sin(angle) * 222)) return null;
    }
    const relief = maxHeight - minHeight;
    if (relief > 55 || maxSlope > 1.5) return null;
    return { minHeight, maxHeight, relief, maxSlope };
  }

  _bestMajorSiteAround(center, minRadius, maxRadius, kind) {
    const candidates = [];
    const seedSalt = kind === 'freeCity' ? 0x7c31 : 0x9d17;
    const radialStep = kind === 'freeCity' ? 560 : 620;
    const spokes = 16;
    for (let radius = minRadius; radius <= maxRadius; radius += radialStep) {
      for (let i = 0; i < spokes; i += 1) {
        const angle = i * Math.PI * 2 / spokes + random2(Math.floor(radius / radialStep), i, this.seed ^ seedSalt) * 0.13;
        const x = center.x + Math.cos(angle) * radius;
        const z = center.z + Math.sin(angle) * radius;
        const sample = this.generator.sample(x, z, true);
        if (kind === 'freeCity') {
          if (sample.height < 4.5 || sample.height > 49 || sample.slope > 0.2) continue;
          if (['desert', 'snow', 'tundra', 'alpine', 'ocean'].includes(sample.biome)) continue;
          const score = 1.4 - sample.slope * 2.4 + (sample.biome === 'grassland' ? 0.34 : 0)
            + (sample.moisture > 0.32 && sample.moisture < 0.82 ? 0.18 : 0)
            + Math.max(0, 1 - Math.abs(sample.height - 18) / 24) * 0.15;
          candidates.push({ x, z, score });
        } else {
          if (sample.height < 18 || sample.height > 112 || sample.slope < 0.07 || sample.slope > 0.95) continue;
          const footprint = this._castleFootprintStats(x, z, 'ruin:regional-watch');
          if (!footprint) continue;
          const score = 0.5 + Math.min(0.6, sample.height / 130) + Math.max(0, 0.32 - Math.abs(sample.slope - 0.34))
            + (sample.cliffIntensity ?? 0) * 0.22 + (sample.biome === 'alpine' ? 0.12 : 0)
            - footprint.relief * 0.012 - footprint.maxSlope * 0.045;
          candidates.push({ x, z, score, sample, footprint });
        }
      }
      if (kind === 'ruinedCastle' && candidates.length > 18) break;
    }
    candidates.sort((a, b) => b.score - a.score);
    for (const candidate of candidates) {
      if (kind === 'ruinedCastle' && candidate.sample) return candidate;
      if (!this._isCityFootprintBuildable(candidate.x, candidate.z)) continue;
      const point = this._scoreSettlementPoint(candidate.x, candidate.z);
      if (point) return { ...point, score: candidate.score + (point.riverAccess ? 0.22 : 0) };
    }
    return null;
  }

  _makeRegionalFreeCity() {
    // Prefer the original close-in ring so prepared worlds and good starter
    // locations keep their established landmark placement. Only widen the
    // search when that area has no suitable plateau for the full city footprint.
    const nearbySite = this._bestMajorSiteAround(this.spawn, 1650, 5200, 'freeCity');
    const fallbackSite = nearbySite ?? this._bestMajorSiteAround(this.spawn, 5570, 11000, 'freeCity');
    if (!fallbackSite) return null;
    return this._makeSettlement('free-city:regional-charter', fallbackSite.x, fallbackSite.z, 'freeCity');
  }

  _makeRegionalRuin() {
    const site = this._bestMajorSiteAround(this.spawn, 3800, 8200, 'ruinedCastle');
    if (!site) return null;
    return this._makeRuinRecord('ruin:regional-watch', site.x, site.z, site.sample);
  }

  _makeRuinRecord(id, x, z, sample = this.generator.sample(x, z, true)) {
    const seed = hashString(id);
    const name = `${makeName(this.seed, Math.floor(x / 120), Math.floor(z / 120), 0x8e31)} Keep`;
    return {
      id, type: 'ruinedCastle', name, x, z, elevation: sample.height,
      seed, condition: 0.28 + random2(seed, 77, this.seed) * 0.34,
      ageYears: 180 + Math.floor(random2(seed, 91, this.seed) * 720),
      footprintRadius: 238,
      region: this.regionIdentity(x, z).region,
    };
  }

  _cityForCell(cx, cz) {
    const key = `${cx}:${cz}`;
    if (this.cityCache.has(key)) return this.cityCache.get(key);
    if (random2(cx, cz, this.seed ^ 0x7c31) > 0.2) {
      this.cityCache.set(key, null);
      return null;
    }
    const center = { x: (cx + 0.5) * CITY_CELL, z: (cz + 0.5) * CITY_CELL };
    if (this.regionalFreeCity && distance(center, this.regionalFreeCity) < 28000) {
      this.cityCache.set(key, null);
      return null;
    }
    const candidates = [];
    // Deterministic low-discrepancy candidate set keeps city placement inexpensive
    // while still searching a broad, cell-contained buildable plateau.
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 36; i += 1) {
      const radius = Math.sqrt((i + 0.5) / 36) * CITY_CELL * 0.43;
      const angle = i * golden + random2(cx + i, cz - i, this.seed ^ 0x7c31) * 0.12;
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius;
      const sample = this.generator.sample(x, z, true);
      if (sample.height < 4.5 || sample.height > 49 || sample.slope > 0.2) continue;
      if (['desert', 'snow', 'tundra', 'alpine', 'ocean'].includes(sample.biome)) continue;
      const score = 1.2 - sample.slope * 2.5
        + (sample.biome === 'grassland' ? 0.3 : 0)
        + (sample.rainfall > 0.32 && sample.rainfall < 0.84 ? 0.16 : 0)
        + Math.max(0, 1 - Math.abs(sample.height - 17) / 24) * 0.12;
      candidates.push({ x, z, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    let site = null;
    for (const candidate of candidates) {
      if (!this._isCityFootprintBuildable(candidate.x, candidate.z, `free-city:${cx}:${cz}`)) continue;
      site = this._scoreSettlementPoint(candidate.x, candidate.z);
      if (site) break;
    }
    const city = site ? this._makeSettlement(`free-city:${cx}:${cz}`, site.x, site.z, 'freeCity') : null;
    this.cityCache.set(key, city);
    return city;
  }

  _ruinForCell(cx, cz) {
    const key = `${cx}:${cz}`;
    if (this.ruinCache.has(key)) return this.ruinCache.get(key);
    if (random2(cx, cz, this.seed ^ 0x9d17) > 0.58) {
      this.ruinCache.set(key, null);
      return null;
    }
    const baseX = (cx + 0.5) * RUIN_CELL;
    const baseZ = (cz + 0.5) * RUIN_CELL;
    let best = null;
    for (let i = 0; i < 18; i += 1) {
      const x = baseX + (random2(cx * 31 + i, cz * 11 - i, this.seed ^ 0x321) - 0.5) * RUIN_CELL * 0.86;
      const z = baseZ + (random2(cx * 13 - i, cz * 29 + i, this.seed ^ 0x654) - 0.5) * RUIN_CELL * 0.86;
      const sample = this.generator.sample(x, z, true);
      if (sample.height < 18 || sample.height > 112 || sample.slope < 0.08 || sample.slope > 0.95) continue;
      const footprint = this._castleFootprintStats(x, z, `ruin:${cx}:${cz}`);
      if (!footprint) continue;
      const score = Math.min(1, sample.height / 90) + Math.max(0, 0.34 - Math.abs(sample.slope - 0.34))
        + (sample.cliffIntensity ?? 0) * 0.22 - footprint.relief * 0.012 - footprint.maxSlope * 0.045;
      if (!best || score > best.score) best = { x, z, score, sample, footprint };
    }
    const ruin = best ? this._makeRuinRecord(`ruin:${cx}:${cz}`, best.x, best.z, best.sample) : null;
    this.ruinCache.set(key, ruin);
    return ruin;
  }

  ruinsInBounds(minX, minZ, maxX, maxZ) {
    const minXCell = Math.floor(minX / RUIN_CELL) - 1;
    const maxXCell = Math.floor(maxX / RUIN_CELL) + 1;
    const minZCell = Math.floor(minZ / RUIN_CELL) - 1;
    const maxZCell = Math.floor(maxZ / RUIN_CELL) + 1;
    const found = new Map();
    if (this.regionalRuin && this.regionalRuin.x >= minX - 100 && this.regionalRuin.x <= maxX + 100 && this.regionalRuin.z >= minZ - 100 && this.regionalRuin.z <= maxZ + 100) found.set(this.regionalRuin.id, this.regionalRuin);
    for (let cz = minZCell; cz <= maxZCell; cz += 1) for (let cx = minXCell; cx <= maxXCell; cx += 1) {
      const ruin = this._ruinForCell(cx, cz);
      if (ruin && ruin.x >= minX && ruin.x <= maxX && ruin.z >= minZ && ruin.z <= maxZ) found.set(ruin.id, ruin);
    }
    return [...found.values()];
  }

  ruinsNear(x, z, radius = 2200) {
    return this.ruinsInBounds(x - radius, z - radius, x + radius, z + radius);
  }

  teleportDestinationsNear(x, z, radius = 30000) {
    const settlements = this.settlementsNear(x, z, radius).map((site) => ({
      id: site.id, name: site.name, type: site.type, x: site.x, z: site.z,
      distance: distance({ x, z }, site),
      category: site.type === 'freeCity' ? 'Free Cities' : site.type === 'port' ? 'Ports' : site.type === 'market' ? 'Markets' : 'Villages',
    })).filter((site) => site.distance <= radius);
    const ruins = this.ruinsInBounds(x - radius, z - radius, x + radius, z + radius).map((site) => ({
      id: site.id, name: site.name, type: 'ruinedCastle', x: site.x, z: site.z,
      distance: distance({ x, z }, site), category: 'Abandoned Castles',
    })).filter((site) => site.distance <= radius);
    const natural = new Map();
    const naturalKinds = [
      { key: 'mountain', label: 'Mountain Overlooks', test: (s) => s.height > 50 && s.mountainIntensity > 0.45 },
      { key: 'ravine', label: 'Ravines & Gorges', test: (s) => s.ravineIntensity > 0.38 && s.height > 16 },
      { key: 'cliff', label: 'Cliff Faces', test: (s) => s.cliffIntensity > 0.48 && s.height > 12 },
      { key: 'grassland', label: 'Grasslands & Fields', test: (s) => s.biome === 'grassland' && s.slope < 0.2 && s.height > 4 },
    ];
    const step = Math.max(1800, Math.min(3200, radius / 9));
    for (let oz = -radius; oz <= radius; oz += step) for (let ox = -radius; ox <= radius; ox += step) {
      if (Math.hypot(ox, oz) > radius) continue;
      const sx = x + ox;
      const sz = z + oz;
      const sample = this.generator.sample(sx, sz, true);
      if (sample.height < 3.2) continue;
      for (const kind of naturalKinds) {
        const candidateDistance = Math.hypot(ox, oz);
        const previous = natural.get(kind.key);
        if (!kind.test(sample) || (previous && previous.distance <= candidateDistance)) continue;
        natural.set(kind.key, {
          id: `landform:${kind.key}:${Math.round(sx / 44)}:${Math.round(sz / 44)}`,
          name: kind.key === 'mountain' ? 'Highstone Overlook' : kind.key === 'ravine' ? 'Raven Gorge' : kind.key === 'cliff' ? 'The Broken Escarpment' : 'Ambergrass Fields',
          type: kind.key, category: kind.label, x: sx, z: sz, distance: candidateDistance,
        });
      }
    }

    // Add real hydrology landmarks to the Creative travel list. Only the nearest
    // representative of each feature class is shown to keep the selector useful.
    let nearestRiver = null;
    let nearestWaterfall = null;
    let nearestLake = null;
    for (const river of this.riversInBounds(x - radius, z - radius, x + radius, z + radius)) {
      for (let i = 0; i < river.path.length; i += 7) {
        const point = river.path[i];
        const d = distance({ x, z }, point);
        if (d <= radius && (!nearestRiver || d < nearestRiver.distance)) {
          nearestRiver = { id: `landform:river:${river.id}`, name: 'Winding River Reach', type: 'riverbank', category: 'River Valleys', x: point.x, z: point.z, distance: d };
        }
      }
      for (const fall of river.waterfalls ?? []) {
        const d = distance({ x, z }, fall);
        if (d <= radius && (!nearestWaterfall || d < nearestWaterfall.distance)) {
          nearestWaterfall = { id: `landform:waterfall:${river.id}:${Math.round(fall.x)}:${Math.round(fall.z)}`, name: 'The Falling Veil', type: 'waterfall', category: 'Waterfalls & Lakes', x: fall.x, z: fall.z, distance: d };
        }
      }
      if (river.lake) {
        const d = distance({ x, z }, river.lake);
        if (d <= radius && (!nearestLake || d < nearestLake.distance)) {
          nearestLake = { id: `landform:lake:${river.id}`, name: 'Stillwater Lake', type: 'lake', category: 'Waterfalls & Lakes', x: river.lake.x, z: river.lake.z, distance: d };
        }
      }
    }
    const waterDestinations = [nearestRiver, nearestWaterfall, nearestLake].filter(Boolean);
    return [...settlements, ...ruins, ...natural.values(), ...waterDestinations].sort((a, b) => a.distance - b.distance).slice(0, 72);
  }

  _makeStarterSettlement(spawn) {
    let best = null;
    for (let radius = 180; radius <= 390; radius += 70) {
      for (let i = 0; i < 16; i += 1) {
        const angle = i * Math.PI * 2 / 16 + random2(1, 2, this.seed) * 0.2;
        const x = spawn.x + Math.cos(angle) * radius;
        const z = spawn.z + Math.sin(angle) * radius;
        const point = this._scoreSettlementPoint(x, z);
        if (point && (!best || point.score > best.score)) best = point;
      }
      if (best && best.score > 1.45) break;
    }
    const point = best ?? { x: spawn.x, z: spawn.z, sample: this.generator.sample(spawn.x, spawn.z), riverAccess: false, coastAccess: false };
    const settlement = this._makeSettlement('settlement:hearth-start', point.x, point.z, 'village', true);
    if (settlement) return settlement;
    const sample = this.generator.sample(spawn.x, spawn.z);
    return {
      id: 'settlement:hearth-start',
      name: 'Hearthstead', type: 'village', x: spawn.x, z: spawn.z,
      elevation: sample.height, biome: sample.biome, moisture: sample.moisture,
      riverAccess: false, coastAccess: false, continent: this.regionIdentity(spawn.x, spawn.z).continent,
      factionId: 'faction:hearth', seed: this.seed, starter: true,
      basePopulation: 18, buildingCount: 6,
    };
  }

  _settlementForCell(cx, cz) {
    const key = `${cx}:${cz}`;
    if (this.settlementCache.has(key)) return this.settlementCache.get(key);
    const chance = random2(cx, cz, this.seed ^ 0x43d7);
    if (chance > 0.23) {
      this.settlementCache.set(key, null);
      return null;
    }
    const baseX = (cx + 0.5) * SETTLEMENT_CELL;
    const baseZ = (cz + 0.5) * SETTLEMENT_CELL;
    let best = null;
    for (let iz = -2; iz <= 2; iz += 1) {
      for (let ix = -2; ix <= 2; ix += 1) {
        const jitterX = random2(cx * 7 + ix, cz * 11 + iz, this.seed ^ 0x1234) * 120 - 60;
        const jitterZ = random2(cx * 13 + ix, cz * 5 + iz, this.seed ^ 0x9912) * 120 - 60;
        const x = baseX + ix * 155 + jitterX;
        const z = baseZ + iz * 155 + jitterZ;
        const point = this._scoreSettlementPoint(x, z);
        if (point && (!best || point.score > best.score)) best = point;
      }
    }
    const result = best ? this._makeSettlement(`settlement:${cx}:${cz}`, best.x, best.z) : null;
    this.settlementCache.set(key, result);
    return result;
  }

  addCustomSettlement(record = {}) {
    const id = String(record.id ?? `creative-settlement:${Math.round(record.x)}:${Math.round(record.z)}`);
    if (this.customSettlements.has(id)) return this.customSettlements.get(id);
    const originX = Number(record.x);
    const originZ = Number(record.z);
    if (!Number.isFinite(originX) || !Number.isFinite(originZ)) return null;
    const wantsPort = record.kind === 'port';
    let point = null;
    // Pre-filter candidates with the inexpensive terrain/climate sampler first.
    // riverDistanceAt performs a wider deterministic channel lookup and should
    // only run once for the selected settlement site, not for every search point.
    for (let radius = 0; radius <= 360 && !point; radius += 18) {
      const attempts = radius === 0 ? 1 : 24;
      let bestAtRadius = null;
      for (let i = 0; i < attempts; i += 1) {
        const angle = i * Math.PI * 2 / attempts;
        const x = originX + Math.cos(angle) * radius;
        const z = originZ + Math.sin(angle) * radius;
        const sample = this.generator.sample(x, z, true);
        if (sample.height < 3.5 || sample.height > 58 || sample.slope > 0.36) continue;
        if (['desert', 'snow', 'tundra', 'alpine', 'ocean'].includes(sample.biome)) continue;
        const coastAccess = sample.height < 8 && sample.continentalness < 0.1;
        if (wantsPort && !coastAccess) continue;
        let score = 1.1 - sample.slope * 1.7;
        score += clamp(1 - Math.abs(sample.moisture - 0.56) * 1.7, 0, 1) * 0.34;
        score += sample.height < 32 ? 0.2 : 0;
        score += coastAccess ? 0.32 : 0;
        if (sample.biome === 'grassland' || sample.biome === 'forest') score += 0.12;
        if (!bestAtRadius || score > bestAtRadius.score) bestAtRadius = { x, z, score };
      }
      if (bestAtRadius) point = this._scoreSettlementPoint(bestAtRadius.x, bestAtRadius.z);
    }
    if (!point) return null;
    const settlement = this._makeSettlement(id, point.x, point.z, wantsPort ? 'port' : 'village');
    if (!settlement) return null;
    settlement.name = String(record.name ?? settlement.name).slice(0, 42);
    settlement.type = wantsPort ? 'port' : (record.kind === 'market' ? 'market' : 'village');
    settlement.factionId = String(record.factionId ?? 'faction:wayfarer-builders');
    settlement.starter = false;
    if (wantsPort) settlement.coastAccess = true;
    settlement.basePopulation = Math.max(12, Math.min(72, Number(record.basePopulation) || 24));
    settlement.buildingCount = Math.max(5, Math.min(18, Number(record.buildingCount) || 8));
    this.customSettlements.set(id, settlement);
    return settlement;
  }

  removeCustomSettlement(id) {
    return this.customSettlements.delete(String(id));
  }

  getCustomSettlements() {
    return [...this.customSettlements.values()].map((settlement) => ({ ...settlement }));
  }

  settlementsInBounds(minX, minZ, maxX, maxZ) {
    const minXCell = Math.floor(minX / SETTLEMENT_CELL) - 1;
    const maxXCell = Math.floor(maxX / SETTLEMENT_CELL) + 1;
    const minZCell = Math.floor(minZ / SETTLEMENT_CELL) - 1;
    const maxZCell = Math.floor(maxZ / SETTLEMENT_CELL) + 1;
    const found = new Map();
    const starter = this.starterSettlement;
    if (starter && starter.x >= minX - 1200 && starter.x <= maxX + 1200 && starter.z >= minZ - 1200 && starter.z <= maxZ + 1200) found.set(starter.id, starter);
    for (const settlement of this.customSettlements.values()) {
      if (settlement.x >= minX - 80 && settlement.x <= maxX + 80 && settlement.z >= minZ - 80 && settlement.z <= maxZ + 80) found.set(settlement.id, settlement);
    }
    for (const settlement of this.scenario?.settlements ?? []) {
      if (settlement.x >= minX - 80 && settlement.x <= maxX + 80 && settlement.z >= minZ - 80 && settlement.z <= maxZ + 80) found.set(settlement.id, settlement);
    }
    for (let cz = minZCell; cz <= maxZCell; cz += 1) {
      for (let cx = minXCell; cx <= maxXCell; cx += 1) {
        const settlement = this._settlementForCell(cx, cz);
        if (settlement && settlement.x >= minX && settlement.x <= maxX && settlement.z >= minZ && settlement.z <= maxZ) found.set(settlement.id, settlement);
      }
    }
    const minCityX = Math.floor(minX / CITY_CELL) - 1;
    const maxCityX = Math.floor(maxX / CITY_CELL) + 1;
    const minCityZ = Math.floor(minZ / CITY_CELL) - 1;
    const maxCityZ = Math.floor(maxZ / CITY_CELL) + 1;
    if (this.regionalFreeCity && this.regionalFreeCity.x >= minX - 1200 && this.regionalFreeCity.x <= maxX + 1200 && this.regionalFreeCity.z >= minZ - 1200 && this.regionalFreeCity.z <= maxZ + 1200) found.set(this.regionalFreeCity.id, this.regionalFreeCity);
    for (let cz = minCityZ; cz <= maxCityZ; cz += 1) {
      for (let cx = minCityX; cx <= maxCityX; cx += 1) {
        const city = this._cityForCell(cx, cz);
        if (city && city.x >= minX && city.x <= maxX && city.z >= minZ && city.z <= maxZ) found.set(city.id, city);
      }
    }
    return [...found.values()];
  }

  settlementsNear(x, z, radius = 1800) {
    return this.settlementsInBounds(x - radius, z - radius, x + radius, z + radius);
  }

  _roadCellCost(x, z, cache) {
    const key = `${x}:${z}`;
    if (cache.has(key)) return cache.get(key);
    const sample = this.generator.sample(x, z);
    const height = sample.height;
    if (!Number.isFinite(height) || height <= 1.1 || sample.biome === 'ocean') {
      cache.set(key, Infinity);
      return Infinity;
    }
    const step = 28;
    const gx = this.generator.heightAt(x + step, z) - this.generator.heightAt(x - step, z);
    const gz = this.generator.heightAt(x, z + step) - this.generator.heightAt(x, z - step);
    const slope = Math.hypot(gx, gz) / (step * 2);
    // Very steep cells are expensive, not automatically forbidden: the A* search
    // may still need a short hillside approach when the settlement itself is steep.
    const reliefPenalty = Math.max(0, slope - 0.09);
    const cost = 1 + slope * 7.5 + reliefPenalty * reliefPenalty * 52
      + Math.max(0, height - 48) * 0.024 + (height > 85 ? 2.8 : 0)
      + (sample.cliffIntensity ?? 0) * 6.5 + (sample.ravineIntensity ?? 0) * 4.2
      + (sample.mountainIntensity ?? 0) * (sample.ridgeSpine ?? 0) * 2.4
      + (sample.biome === 'marsh' ? 3.2 : 0) + (sample.biome === 'swamp' ? 4.5 : 0)
      + (sample.floodplain ?? 0) * 1.8;
    cache.set(key, cost);
    return cost;
  }

  _roadSegmentIsBuildable(a, b, maxGrade = 0.30) {
    const length = distance(a, b);
    if (length < 0.01) return true;
    const count = Math.max(1, Math.ceil(length / 12));
    let previousHeight = this.generator.heightAt(a.x, a.z);
    for (let i = 1; i <= count; i += 1) {
      const t = i / count;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      const height = this.generator.heightAt(x, z);
      const grade = Math.abs(height - previousHeight) / (length / count);
      if (!Number.isFinite(height) || height <= 1.1 || grade > maxGrade) return false;
      const sample = this.generator.sample(x, z);
      if ((sample.cliffIntensity ?? 0) > 0.94) return false;
      previousHeight = height;
    }
    return true;
  }

  _smoothRoadPath(path, iterations = 2) {
    if (path.length < 3) return path;
    let candidate = path.map((point) => ({ x: point.x, z: point.z }));
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const next = [candidate[0]];
      for (let i = 0; i < candidate.length - 1; i += 1) {
        const a = candidate[i];
        const b = candidate[i + 1];
        next.push(
          { x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 },
          { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 },
        );
      }
      next.push(candidate.at(-1));
      candidate = next;
    }
    for (let i = 1; i < candidate.length; i += 1) {
      if (!this._roadSegmentIsBuildable(candidate[i - 1], candidate[i])) return path;
    }
    candidate[0] = { x: path[0].x, z: path[0].z };
    candidate[candidate.length - 1] = { x: path.at(-1).x, z: path.at(-1).z };
    return candidate;
  }

  routePathFor(a, b, options = {}) {
    const resolution = options.resolution ?? 84;
    const cacheKey = `road-v2|${a.id}|${b.id}|${resolution}`;
    if (!this.roadPathCache) this.roadPathCache = new Map();
    if (!options.debug && this.roadPathCache.has(cacheKey)) return this.roadPathCache.get(cacheKey).map((point) => ({ ...point }));

    const toCell = (value) => Math.round(value / resolution);
    const cellCostCache = new Map();
    const findDryEndpointCell = (baseX, baseZ) => {
      // A settlement can sit close to a shoreline or steep plot edge. Snap the
      // grid node to the nearest traversable cell, then connect back to the exact
      // settlement/gate coordinate with a short terrain-checked approach.
      for (let radius = 0; radius <= 4; radius += 1) {
        let best = null;
        for (let dx = -radius; dx <= radius; dx += 1) {
          for (let dz = -radius; dz <= radius; dz += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
            const x = baseX + dx;
            const z = baseZ + dz;
            const cost = this._roadCellCost(x * resolution, z * resolution, cellCostCache);
            if (!Number.isFinite(cost)) continue;
            const score = dx * dx + dz * dz + cost * 0.0005;
            if (!best || score < best.score) best = { x, z, score };
          }
        }
        if (best) return best;
      }
      return null;
    };
    const startCell = findDryEndpointCell(toCell(a.x), toCell(a.z));
    const targetCell = findDryEndpointCell(toCell(b.x), toCell(b.z));
    if (!startCell || !targetCell) {
      if (options.debug) console.log('ROAD_DEBUG_ENDPOINT_SNAP', a.id, b.id, startCell, targetCell, a, b);
      this.roadPathCache.set(cacheKey, []);
      return [];
    }
    const sx = startCell.x;
    const sz = startCell.z;
    const tx = targetCell.x;
    const tz = targetCell.z;
    const margin = Math.max(10, Math.ceil(Math.hypot(tx - sx, tz - sz) * 0.32));
    const minX = Math.min(sx, tx) - margin;
    const maxX = Math.max(sx, tx) + margin;
    const minZ = Math.min(sz, tz) - margin;
    const maxZ = Math.max(sz, tz) + margin;
    const keyOf = (x, z) => `${x}:${z}`;
    const heuristic = (x, z) => Math.hypot(tx - x, tz - z);
    const open = [{ x: sx, z: sz, g: 0, f: heuristic(sx, sz) }];
    const cameFrom = new Map();
    const bestCost = new Map([[keyOf(sx, sz), 0]]);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const blockedDiagonal = (x, z, dx, dz) => {
      if (!dx || !dz) return false;
      return !Number.isFinite(this._roadCellCost((x + dx) * resolution, z * resolution, cellCostCache))
        && !Number.isFinite(this._roadCellCost(x * resolution, (z + dz) * resolution, cellCostCache));
    };
    let visited = 0;
    let found = false;

    // Small binary heap keeps this search predictable without introducing another dependency.
    const push = (item) => {
      let index = open.length;
      open.push(item);
      while (index > 0) {
        const parent = (index - 1) >> 1;
        if (open[parent].f <= item.f) break;
        open[index] = open[parent];
        index = parent;
      }
      open[index] = item;
    };
    const pop = () => {
      const first = open[0];
      const last = open.pop();
      if (open.length) {
        let index = 0;
        while (true) {
          const left = index * 2 + 1;
          const right = left + 1;
          if (left >= open.length) break;
          const child = right < open.length && open[right].f < open[left].f ? right : left;
          if (open[child].f >= last.f) break;
          open[index] = open[child];
          index = child;
        }
        open[index] = last;
      }
      return first;
    };

    while (open.length && visited < 90000) {
      const current = pop();
      const currentKey = keyOf(current.x, current.z);
      if (current.g > (bestCost.get(currentKey) ?? Infinity) + 1e-6) continue;
      if (current.x === tx && current.z === tz) {
        found = true;
        break;
      }
      visited += 1;
      for (const [dx, dz] of directions) {
        const nx = current.x + dx;
        const nz = current.z + dz;
        if (nx < minX || nx > maxX || nz < minZ || nz > maxZ) continue;
        const wx = nx * resolution;
        const wz = nz * resolution;
        const terrainCost = this._roadCellCost(wx, wz, cellCostCache);
        if (!Number.isFinite(terrainCost) || blockedDiagonal(current.x, current.z, dx, dz)) continue;
        const stepLength = dx && dz ? Math.SQRT2 : 1;
        const currentHeight = this.generator.heightAt(current.x * resolution, current.z * resolution);
        const nextHeight = this.generator.heightAt(wx, wz);
        const grade = Math.abs(nextHeight - currentHeight) / (resolution * stepLength);
        if (!Number.isFinite(grade) || grade > 2.2) continue;
        const gradePenalty = grade * 16 + Math.max(0, grade - 0.08) ** 2 * 120;
        const nextG = current.g + (terrainCost + gradePenalty) * stepLength;
        const nextKey = keyOf(nx, nz);
        if (nextG >= (bestCost.get(nextKey) ?? Infinity)) continue;
        bestCost.set(nextKey, nextG);
        cameFrom.set(nextKey, currentKey);
        push({ x: nx, z: nz, g: nextG, f: nextG + heuristic(nx, nz) * 1.04 });
      }
    }

    if (options.debug) console.log('ROAD_DEBUG_SEARCH', a.id, b.id, resolution, visited, found, open.length, startCell, targetCell);
    let cells = [];
    if (found) {
      let key = keyOf(tx, tz);
      cells.push({ x: tx, z: tz });
      while (key !== keyOf(sx, sz)) {
        key = cameFrom.get(key);
        if (!key) break;
        const [x, z] = key.split(':').map(Number);
        cells.push({ x, z });
      }
      cells.reverse();
    } else {
      // Do not invent a straight road through cliffs, ravines or open water.
      const emptyPath = [];
      this.roadPathCache.set(cacheKey, emptyPath);
      return emptyPath;
    }

    // Remove collinear grid points; the rendered road then follows the route cleanly.
    const simplified = [];
    for (let i = 0; i < cells.length; i += 1) {
      if (i > 0 && i < cells.length - 1) {
        const p = cells[i - 1];
        const c = cells[i];
        const n = cells[i + 1];
        const cross = (c.x - p.x) * (n.z - c.z) - (c.z - p.z) * (n.x - c.x);
        if (Math.abs(cross) < 1e-6) continue;
      }
      simplified.push({ x: cells[i].x * resolution, z: cells[i].z * resolution });
    }
    if (simplified.length) {
      const snappedStart = { x: sx * resolution, z: sz * resolution };
      const snappedEnd = { x: tx * resolution, z: tz * resolution };
      if (!this._roadSegmentIsBuildable(a, snappedStart, 2.8)
        || !this._roadSegmentIsBuildable(snappedEnd, b, 2.8)) {
        if (options.debug) console.log('ROAD_DEBUG_CONNECTOR', a, snappedStart, snappedEnd, b);
        this.roadPathCache.set(cacheKey, []);
        return [];
      }
      simplified[0] = { x: a.x, z: a.z };
      simplified[simplified.length - 1] = { x: b.x, z: b.z };
    }

    const path = this._smoothRoadPath(simplified);
    this.roadPathCache.set(cacheKey, path.map((point) => ({ ...point })));
    if (this.roadPathCache.size > 160) this.roadPathCache.delete(this.roadPathCache.keys().next().value);
    return path;
  }

  _roadEndpointFor(settlement, other) {
    if (settlement.type !== 'freeCity') return { routeNode: settlement, gate: null };
    const plan = buildFreeCityPlan(settlement, this.generator);
    const dx = other.x - settlement.x;
    const dz = other.z - settlement.z;
    const length = Math.hypot(dx, dz) || 1;
    const direction = { x: dx / length, z: dz / length };
    let gate = plan.gates[0];
    let bestAlignment = -Infinity;
    for (const candidate of plan.gates) {
      const gx = candidate.x - settlement.x;
      const gz = candidate.z - settlement.z;
      const gateLength = Math.hypot(gx, gz) || 1;
      const alignment = (gx / gateLength) * direction.x + (gz / gateLength) * direction.z;
      if (alignment > bestAlignment) {
        bestAlignment = alignment;
        gate = candidate;
      }
    }
    const radialX = gate.x - settlement.x;
    const radialZ = gate.z - settlement.z;
    const radialLength = Math.hypot(radialX, radialZ) || 1;
    const outward = { x: radialX / radialLength, z: radialZ / radialLength };
    // The city plan's internal avenue ends at the gate centre. Place the regional
    // A* endpoint beyond the curtain wall so the external road cannot terminate
    // at the city centre or appear to punch through an ungated wall section.
    const outsideDistance = 38;
    const routeNode = {
      id: `road-gate:${settlement.id}:${gate.name}`,
      x: gate.x + outward.x * outsideDistance,
      z: gate.z + outward.z * outsideDistance,
    };
    return {
      routeNode,
      gate: { x: gate.x, z: gate.z, name: gate.name },
      outward,
    };
  }

  roadLinksFor(settlements, maxDistance = 3600) {
    const nodes = [...settlements].sort((a, b) => a.id.localeCompare(b.id));
    if (nodes.length < 2) return [];
    const root = nodes.map((node) => ({
      node,
      averageDistance: nodes.reduce((sum, other) => sum + distance(node, other), 0) / Math.max(1, nodes.length - 1),
    })).sort((a, b) => a.averageDistance - b.averageDistance || a.node.id.localeCompare(b.node.id))[0].node;
    const connected = new Set([root.id]);
    const links = [];
    const blockedPairs = new Set();
    const remaining = new Map(nodes.filter((node) => node.id !== root.id).map((node) => [node.id, node]));

    // A deterministic Prim-style network joins each reachable settlement to the
    // existing road graph, avoiding duplicate nearest-neighbour links and loops.
    while (remaining.size) {
      let best = null;
      for (const from of nodes) {
        if (!connected.has(from.id)) continue;
        for (const to of remaining.values()) {
          const d = distance(from, to);
          if (d > maxDistance) continue;
          const tie = `${from.id}|${to.id}`;
          if (blockedPairs.has(tie)) continue;
          if (!best || d < best.distance || (d === best.distance && tie < best.tie)) best = { a: from, b: to, distance: d, tie };
        }
      }
      if (!best) break;
      const endpointA = this._roadEndpointFor(best.a, best.b);
      const endpointB = this._roadEndpointFor(best.b, best.a);
      const path = this.routePathFor(endpointA.routeNode, endpointB.routeNode);
      if (path.length < 2) {
        blockedPairs.add(best.tie);
        continue;
      }
      if (endpointA.gate) path.unshift({ x: endpointA.gate.x, z: endpointA.gate.z });
      if (endpointB.gate) path.push({ x: endpointB.gate.x, z: endpointB.gate.z });
      const minX = Math.min(...path.map((point) => point.x)) - 80;
      const maxX = Math.max(...path.map((point) => point.x)) + 80;
      const minZ = Math.min(...path.map((point) => point.z)) - 80;
      const maxZ = Math.max(...path.map((point) => point.z)) + 80;
      const crossingRivers = this.riversInBounds(minX, minZ, maxX, maxZ);
      for (const point of path) {
        point.bridge = crossingRivers.some((river) => {
          for (let i = 1; i < river.path.length; i += 1) {
            if (distanceToSegment(point.x, point.z, river.path[i - 1], river.path[i]) < river.path[i].width * 0.5 + 7) return true;
          }
          return false;
        });
      }
      let routeDistance = 0;
      for (let i = 1; i < path.length; i += 1) routeDistance += distance(path[i - 1], path[i]);
      links.push({
        id: `road:${best.a.id}:${best.b.id}`,
        a: best.a,
        b: best.b,
        distance: best.distance,
        routeDistance,
        path,
        terrainAware: true,
        gateA: endpointA.gate?.name ?? null,
        gateB: endpointB.gate?.name ?? null,
      });
      connected.add(best.b.id);
      remaining.delete(best.b.id);
    }
    return links;
  }

}
