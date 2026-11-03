import { BLOCK } from './blocks.js';
import { fbm2, fbm3, random01 } from './noise.js';
import { climateAt, classifyBiome, biomeAppearance, getBiomeLabel } from './biomes.js';
import { sampleTerrainFields, shapeTerrainHeight } from './terrain.js';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 80;
export const SEA_LEVEL = 29;

export class WorldGenerator {
  constructor(seed) {
    this.seed = seed | 0;
  }

  sampleColumn(x, z) {
    const s = this.seed;
    const fields = sampleTerrainFields(x, z, s);
    const { warpX, warpZ, mountainMask, baseHeight, river, lake } = fields;
    const height = shapeTerrainHeight(fields);
    const { temperature, humidity } = climateAt(warpX, warpZ, height, s);
    const biome = classifyBiome({ x, z, seed: s, height, temperature, humidity, mountainMask, river });
    const appearance = biomeAppearance(biome);

    let waterLevel = 29;
    if (river > 0.5) waterLevel = Math.max(29, Math.round(baseHeight - 3.5));
    if (lake > 0.5) waterLevel = Math.max(waterLevel, Math.round(height + 1));

    return {
      height: Math.floor(height), baseHeight,
      waterLevel: Math.min(WORLD_HEIGHT - 2, waterLevel),
      river, lake, temperature, humidity, biome,
      biomeLabel: appearance.biomeLabel,
      grassColor: appearance.grassColor
    };
  }

  getSurfaceBlock(column) {
    if (column.biome === 'desert' || column.biome === 'beach' || column.biome === 'ocean') return BLOCK.SAND;
    if (column.biome === 'swamp') return BLOCK.MUD;
    if (column.biome === 'snowyForest' || column.biome === 'snowyMountains' || column.height > 69) return BLOCK.SNOW;
    if (column.river > 0.68 && column.height < column.baseHeight - 4) return BLOCK.GRAVEL;
    return BLOCK.GRASS;
  }

  generateChunkData(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const columns = new Array(CHUNK_SIZE * CHUNK_SIZE);
    const originX = cx * CHUNK_SIZE;
    const originZ = cz * CHUNK_SIZE;
    const idx = (x, y, z) => x + CHUNK_SIZE * (z + CHUNK_SIZE * y);

    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const wx = originX + x, wz = originZ + z;
        const column = this.sampleColumn(wx, wz);
        columns[x + z * CHUNK_SIZE] = column;
        const surface = this.getSurfaceBlock(column);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let id = BLOCK.AIR;
          if (y === 0) {
            id = BLOCK.BEDROCK;
          } else if (y <= column.height) {
            if (y === column.height) {
              id = surface;
            } else if (y >= column.height - 3) {
              id = surface === BLOCK.SAND ? BLOCK.SAND : (surface === BLOCK.MUD ? BLOCK.MUD : BLOCK.DIRT);
            } else {
              let carved = false;
              if (y > 4 && y < column.height - 4) {
                const chamberA = fbm3(wx * 0.027, y * 0.034, wz * 0.027, this.seed + 1201, 3);
                const chamberB = fbm3(wx * 0.052, y * 0.047, wz * 0.052, this.seed + 1301, 2);
                const tunnel = fbm3(wx * 0.018, y * 0.039, wz * 0.018, this.seed + 1409, 3);
                carved = (chamberA > 0.34 && chamberB > -0.08) || (Math.abs(tunnel) < 0.055 && y < 52);
              }
              if (carved) {
                id = y < 17 && random01(wx, y, wz, this.seed + 1451) > 0.42 ? BLOCK.WATER : BLOCK.AIR;
              } else {
                id = BLOCK.STONE;
                const oreNoise = fbm3(wx * 0.105, y * 0.12, wz * 0.105, this.seed + 1601, 2);
                const oreRoll = random01(Math.floor(wx / 3), Math.floor(y / 3), Math.floor(wz / 3), this.seed + 1709);
                if (y < 19 && oreNoise > 0.43 && oreRoll > 0.62) id = BLOCK.DIAMOND;
                else if (y < 32 && oreNoise > 0.39 && oreRoll > 0.57) id = BLOCK.GOLD;
                else if (y < 49 && oreNoise > 0.31 && oreRoll > 0.51) id = BLOCK.IRON;
                else if (y < 66 && oreNoise > 0.25 && oreRoll > 0.43) id = BLOCK.COAL;
              }
            }
          } else if (y <= column.waterLevel && column.height < column.waterLevel) {
            id = BLOCK.WATER;
          }
          data[idx(x, y, z)] = id;
        }
      }
    }

    this.addVegetation(data, cx, cz, columns);
    return { data, columns };
  }

  addVegetation(data, cx, cz, columns) {
    const originX = cx * CHUNK_SIZE;
    const originZ = cz * CHUNK_SIZE;
    const idx = (x, y, z) => x + CHUNK_SIZE * (z + CHUNK_SIZE * y);
    const put = (wx, y, wz, id) => {
      if (y < 1 || y >= WORLD_HEIGHT) return;
      const lx = wx - originX, lz = wz - originZ;
      if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return;
      const at = idx(lx, y, lz);
      if (data[at] === BLOCK.AIR || data[at] === BLOCK.WATER || id === BLOCK.LOG) data[at] = id;
    };

    // The two-block halo makes trees crossing a chunk edge deterministic and seamless.
    for (let wz = originZ - 3; wz < originZ + CHUNK_SIZE + 3; wz++) {
      for (let wx = originX - 3; wx < originX + CHUNK_SIZE + 3; wx++) {
        const col = this.sampleColumn(wx, wz);
        const groundY = col.height;
        if (groundY <= SEA_LEVEL || groundY >= WORLD_HEIGHT - 9) continue;
        const roll = random01(wx, 0, wz, this.seed + 1901);
        const shape = random01(wx, 0, wz, this.seed + 1997);
        const surface = this.getSurfaceBlock(col);

        if (col.biome === 'desert') {
          if (surface === BLOCK.SAND && roll > 0.972) {
            const h = 2 + Math.floor(shape * 3);
            for (let y = 1; y <= h; y++) put(wx, groundY + y, wz, BLOCK.CACTUS);
          }
          continue;
        }

        if (col.biome === 'swamp' && roll > 0.976) {
          put(wx, groundY + 1, wz, BLOCK.MUSHROOM);
          continue;
        }

        if (col.biome === 'flowerField' || col.biome === 'plains') {
          const threshold = col.biome === 'flowerField' ? 0.74 : 0.965;
          if (roll > threshold) {
            put(wx, groundY + 1, wz, BLOCK.FLOWER);
            continue;
          }
        }

        // Low shrubs, stone clusters and occasional fallen timber break up the ground cover.
        if (surface === BLOCK.GRASS && ['forest', 'denseForest', 'jungle', 'swamp'].includes(col.biome) && roll > 0.825 && roll < 0.862) {
          put(wx, groundY + 1, wz, BLOCK.LEAVES);
          if (shape > 0.45) put(wx + (shape > 0.72 ? 1 : -1), groundY + 1, wz, BLOCK.LEAVES);
          continue;
        }
        if (['mountains', 'savanna', 'plains'].includes(col.biome) && roll > 0.86 && roll < 0.885) {
          put(wx, groundY + 1, wz, BLOCK.COBBLE);
          if (shape > 0.55) put(wx + 1, groundY + 1, wz, BLOCK.GRAVEL);
          continue;
        }
        if (['forest', 'denseForest'].includes(col.biome) && roll > 0.885 && roll < 0.895) {
          const dir = shape > 0.5 ? 1 : -1;
          put(wx, groundY + 1, wz, BLOCK.LOG);
          put(wx + dir, groundY + 1, wz, BLOCK.LOG);
          put(wx + 2 * dir, groundY + 1, wz, BLOCK.LOG);
          continue;
        }

        let chance = 0;
        if (col.biome === 'denseForest') chance = 0.89;
        else if (col.biome === 'forest') chance = 0.925;
        else if (col.biome === 'jungle') chance = 0.885;
        else if (col.biome === 'snowyForest') chance = 0.93;
        else if (col.biome === 'mountains') chance = 0.982;
        else if (col.biome === 'savanna') chance = 0.979;
        else if (col.biome === 'plains') chance = 0.992;
        else if (col.biome === 'flowerField') chance = 0.988;
        if (roll < chance || (surface !== BLOCK.GRASS && surface !== BLOCK.SNOW)) continue;

        if (col.biome === 'savanna') {
          const trunk = 4;
          for (let y = 1; y <= trunk; y++) put(wx, groundY + y, wz, BLOCK.LOG);
          for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) <= 3) put(wx + dx, groundY + trunk, wz + dz, BLOCK.LEAVES);
          }
          const branchDir = shape > 0.5 ? 1 : -1;
          put(wx + branchDir, groundY + 3, wz, BLOCK.LOG);
          put(wx + 2 * branchDir, groundY + 4, wz, BLOCK.LOG);
        } else if (col.biome === 'snowyForest' || (col.biome === 'mountains' && col.temperature < 0.42)) {
          const trunk = 5 + Math.floor(shape * 3);
          for (let y = 1; y <= trunk; y++) put(wx, groundY + y, wz, BLOCK.LOG);
          for (let layer = 0; layer < 4; layer++) {
            const radius = 2 - Math.floor(layer / 2);
            const cy = groundY + trunk - layer - 1;
            for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
              if (Math.abs(dx) + Math.abs(dz) <= radius * 2 - 1) put(wx + dx, cy, wz + dz, BLOCK.LEAVES);
            }
          }
          put(wx, groundY + trunk + 1, wz, BLOCK.LEAVES);
        } else {
          const jungle = col.biome === 'jungle';
          const trunk = jungle ? 6 + Math.floor(shape * 3) : 4 + Math.floor(shape * 2);
          for (let y = 1; y <= trunk; y++) put(wx, groundY + y, wz, BLOCK.LOG);
          const radius = jungle ? 3 : 2;
          const centerY = groundY + trunk;
          for (let dy = -1; dy <= 1; dy++) {
            const r = dy === 0 ? radius : radius - 1;
            for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
              if (dx * dx + dz * dz <= r * r + 1) put(wx + dx, centerY + dy, wz + dz, BLOCK.LEAVES);
            }
          }
          put(wx, centerY + 1, wz, BLOCK.LEAVES);
        }
      }
    }
  }
}

export { getBiomeLabel };
