import { hashString, random2, clamp } from '../core/random.js';

const RIVER_CELL = 4200;
const SETTLEMENT_CELL = 1760;
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
  constructor(generator, spawn = null) {
    this.generator = generator;
    this.seed = generator.seed;
    this.riverCache = new Map();
    this.settlementCache = new Map();
    this.spawn = spawn ?? generator.findSpawn();
    this.starterSettlement = this._makeStarterSettlement(this.spawn);
  }

  regionIdentity(x, z) {
    const sample = this.generator.sample(x, z);
    const gx = Math.floor(x / 96000);
    const gz = Math.floor(z / 96000);
    const continentIndex = Math.floor(random2(gx, gz, this.seed ^ 0x4c91) * 5) + 1;
    const continent = sample.height < 0 ? 'The Open Sea' : `Landmass ${continentIndex}`;
    return {
      continent,
      region: makeName(this.seed, gx, gz, 0x2a17),
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
    let x = startX;
    let z = startZ;
    let height = source.height;
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [0.70710678, 0.70710678], [-0.70710678, 0.70710678],
      [0.70710678, -0.70710678], [-0.70710678, -0.70710678],
    ];
    let previousX = 0;
    let previousZ = 0;
    for (let step = 0; step < 96; step += 1) {
      const width = 1.45 + step * 0.055;
      path.push({ x, z, y: Math.max(-0.2, height + 0.22), width });
      if (height <= 0.8) break;
      let best = null;
      const stride = 36;
      for (const [dx, dz] of directions) {
        const nx = x + dx * stride;
        const nz = z + dz * stride;
        const nh = this.generator.heightAt(nx, nz);
        const momentumPenalty = (1 - (dx * previousX + dz * previousZ)) * 0.28;
        const jitter = (random2(Math.floor(nx / 24), Math.floor(nz / 24), this.seed ^ step) - 0.5) * 0.03;
        const score = nh + momentumPenalty + jitter;
        if (!best || score < best.score) best = { x: nx, z: nz, height: nh, score, dx, dz };
      }
      // Small rises allow channels to pass shallow local saddles instead of ending at every noise ripple.
      if (!best || best.height > height + 1.7) break;
      x = best.x;
      z = best.z;
      height = best.height;
      previousX = best.dx;
      previousZ = best.dz;
    }
    const result = path.length >= 8 ? { id: `river:${cellX}:${cellZ}`, path, source: { x: startX, z: startZ } } : null;
    this.riverCache.set(key, result);
    return result;
  }

  riversInBounds(minX, minZ, maxX, maxZ) {
    const pad = RIVER_CELL * 1.05;
    const minCellX = Math.floor((minX - pad) / RIVER_CELL);
    const maxCellX = Math.floor((maxX + pad) / RIVER_CELL);
    const minCellZ = Math.floor((minZ - pad) / RIVER_CELL);
    const maxCellZ = Math.floor((maxZ + pad) / RIVER_CELL);
    const rivers = [];
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
    const type = candidate.coastAccess ? 'port' : (candidate.riverAccess ? 'market' : kind);
    const seed = hashString(id);
    const population = type === 'port' ? 34 : type === 'market' ? 27 : 16;
    return {
      id,
      name: makeName(this.seed, Math.floor(x / 90), Math.floor(z / 90), 0x6b31),
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
      seed,
      starter,
      basePopulation: population + Math.floor(random2(seed, 17, this.seed) * 12),
      buildingCount: 5 + Math.floor(random2(seed, 31, this.seed) * 5),
    };
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

  settlementsInBounds(minX, minZ, maxX, maxZ) {
    const minXCell = Math.floor(minX / SETTLEMENT_CELL) - 1;
    const maxXCell = Math.floor(maxX / SETTLEMENT_CELL) + 1;
    const minZCell = Math.floor(minZ / SETTLEMENT_CELL) - 1;
    const maxZCell = Math.floor(maxZ / SETTLEMENT_CELL) + 1;
    const found = new Map();
    const starter = this.starterSettlement;
    if (starter && starter.x >= minX - 1200 && starter.x <= maxX + 1200 && starter.z >= minZ - 1200 && starter.z <= maxZ + 1200) found.set(starter.id, starter);
    for (let cz = minZCell; cz <= maxZCell; cz += 1) {
      for (let cx = minXCell; cx <= maxXCell; cx += 1) {
        const settlement = this._settlementForCell(cx, cz);
        if (settlement && settlement.x >= minX && settlement.x <= maxX && settlement.z >= minZ && settlement.z <= maxZ) found.set(settlement.id, settlement);
      }
    }
    return [...found.values()];
  }

  settlementsNear(x, z, radius = 1800) {
    return this.settlementsInBounds(x - radius, z - radius, x + radius, z + radius);
  }

  roadLinksFor(settlements, maxDistance = 3600) {
    const links = [];
    for (let i = 0; i < settlements.length; i += 1) {
      const a = settlements[i];
      let best = null;
      for (let j = 0; j < settlements.length; j += 1) {
        if (i === j) continue;
        const b = settlements[j];
        if (a.id.localeCompare(b.id) >= 0) continue;
        const d = distance(a, b);
        if (d <= maxDistance && (!best || d < best.distance)) best = { b, distance: d };
      }
      if (best) links.push({ id: `road:${a.id}:${best.b.id}`, a, b: best.b, distance: best.distance });
    }
    return links;
  }
}
