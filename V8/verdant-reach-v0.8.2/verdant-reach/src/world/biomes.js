import { clamp, smoothstep } from '../core/random.js';

export const BIOMES = {
  ocean: { name: 'Open Sea', color: 0x284f63, foliage: false },
  coast: { name: 'Windward Coast', color: 0xc4b88b, foliage: false },
  grassland: { name: 'Ambergrass Prairie', color: 0x9a9d63, foliage: true },
  forest: { name: 'Elderwood', color: 0x526f4c, foliage: true },
  deepForest: { name: 'Mossveil Forest', color: 0x3c634b, foliage: true },
  jungle: { name: 'Verdant Canopy', color: 0x387254, foliage: true },
  desert: { name: 'Suncleft Expanse', color: 0xb99a65, foliage: false },
  marsh: { name: 'Whisperfen', color: 0x667d63, foliage: true },
  alpine: { name: 'Highstone Range', color: 0x858b83, foliage: false },
  snow: { name: 'Frostmere', color: 0xc9d4d0, foliage: false },
  tundra: { name: 'Pale Tundra', color: 0x9cae9f, foliage: false },
  savanna: { name: 'Sungrass Reach', color: 0xb0a064, foliage: true },
};

export function classifyBiome({ height, temperature, moisture, rainfall, slope = 0 }) {
  if (height < -1.5) return 'ocean';
  if (height < 3.0) return 'coast';
  if (height > 78 || (height > 58 && temperature < 0.36)) return temperature < 0.42 ? 'snow' : 'alpine';
  if (temperature < 0.2) return moisture < 0.25 ? 'tundra' : 'snow';
  if (temperature < 0.36) return moisture > 0.38 ? 'tundra' : 'alpine';
  if (moisture < 0.17 && temperature > 0.48) return 'desert';
  if (moisture < 0.29 && temperature > 0.56) return 'savanna';
  if (rainfall > 0.62 && temperature > 0.67) return 'jungle';
  if (moisture > 0.69 && rainfall > 0.5) return 'marsh';
  if (moisture > 0.57) return 'deepForest';
  if (moisture > 0.39) return 'forest';
  if (slope > 0.65) return 'alpine';
  return 'grassland';
}

export function biomeColor(name) {
  return BIOMES[name]?.color ?? BIOMES.grassland.color;
}

export function biomeBlend({ height, temperature, moisture, rainfall }) {
  const shore = smoothstep(-1.5, 4.5, height);
  const warmth = clamp(temperature, 0, 1);
  const wetness = clamp((moisture + rainfall) * 0.5, 0, 1);
  return { shore, warmth, wetness };
}
