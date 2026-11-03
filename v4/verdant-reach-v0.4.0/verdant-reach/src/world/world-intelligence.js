import { hashString, random2, clamp } from '../core/random.js';

const RIVER_CELL = 4200;
const RIVER_STEP = 96;
const RIVER_MAX_STEPS = 100;
const SETTLEMENT_CELL = 1760;
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
    this.spawn = spawn ?? generator.findSpawn();
    this.scenario = options.scenario ?? null;
    this.starterSettlement = this._makeStarterSettlement(this.spawn);
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
      ? { id: `river:${cellX}:${cellZ}`, path, source: { x: startX, z: startZ }, terminal, lake }
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
    for (const settlement of this.scenario?.settlements ?? []) {
      if (settlement.x >= minX - 80 && settlement.x <= maxX + 80 && settlement.z >= minZ - 80 && settlement.z <= maxZ + 80) found.set(settlement.id, settlement);
    }
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

  _roadCellCost(x, z, cache) {
    const key = `${x}:${z}`;
    if (cache.has(key)) return cache.get(key);
    const height = this.generator.heightAt(x, z);
    if (height <= 1.1) {
      cache.set(key, Infinity);
      return Infinity;
    }
    const step = 42;
    const gx = this.generator.heightAt(x + step, z) - this.generator.heightAt(x - step, z);
    const gz = this.generator.heightAt(x, z + step) - this.generator.heightAt(x, z - step);
    const slope = Math.hypot(gx, gz) / (step * 2);
    const cost = 1 + slope * 5.5 + Math.max(0, height - 48) * 0.018 + (height > 85 ? 2.5 : 0);
    cache.set(key, cost);
    return cost;
  }

  routePathFor(a, b, options = {}) {
    const resolution = options.resolution ?? 84;
    const cacheKey = `${a.id}|${b.id}|${resolution}`;
    if (!this.roadPathCache) this.roadPathCache = new Map();
    if (this.roadPathCache.has(cacheKey)) return this.roadPathCache.get(cacheKey).map((point) => ({ ...point }));

    const toCell = (value) => Math.round(value / resolution);
    const sx = toCell(a.x);
    const sz = toCell(a.z);
    const tx = toCell(b.x);
    const tz = toCell(b.z);
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
    const cellCostCache = new Map();
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
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

    while (open.length && visited < 18000) {
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
        if (!Number.isFinite(terrainCost)) continue;
        const stepLength = dx && dz ? Math.SQRT2 : 1;
        const nextG = current.g + terrainCost * stepLength;
        const nextKey = keyOf(nx, nz);
        if (nextG >= (bestCost.get(nextKey) ?? Infinity)) continue;
        bestCost.set(nextKey, nextG);
        cameFrom.set(nextKey, currentKey);
        push({ x: nx, z: nz, g: nextG, f: nextG + heuristic(nx, nz) * 1.04 });
      }
    }

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
      // Rare steep/ocean barriers get a deterministic direct corridor rather than no road.
      const count = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / resolution));
      cells = Array.from({ length: count + 1 }, (_, i) => ({
        x: Math.round((a.x + (b.x - a.x) * i / count) / resolution),
        z: Math.round((a.z + (b.z - a.z) * i / count) / resolution),
      }));
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
      simplified[0] = { x: a.x, z: a.z };
      simplified[simplified.length - 1] = { x: b.x, z: b.z };
    }

    const path = simplified;
    this.roadPathCache.set(cacheKey, path.map((point) => ({ ...point })));
    if (this.roadPathCache.size > 160) this.roadPathCache.delete(this.roadPathCache.keys().next().value);
    return path;
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
          if (!best || d < best.distance || (d === best.distance && tie < best.tie)) best = { a: from, b: to, distance: d, tie };
        }
      }
      if (!best) break;
      const path = this.routePathFor(best.a, best.b);
      const minX = Math.min(best.a.x, best.b.x) - 80;
      const maxX = Math.max(best.a.x, best.b.x) + 80;
      const minZ = Math.min(best.a.z, best.b.z) - 80;
      const maxZ = Math.max(best.a.z, best.b.z) + 80;
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
      });
      connected.add(best.b.id);
      remaining.delete(best.b.id);
    }
    return links;
  }

}
