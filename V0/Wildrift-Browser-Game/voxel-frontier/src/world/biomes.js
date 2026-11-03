import { random01, clamp01, fbm2 } from './noise.js';

export const BIOME_LABELS = Object.freeze({
  ocean: 'Ocean', beach: 'Beach', plains: 'Plains', forest: 'Forest', denseForest: 'Dense forest',
  jungle: 'Jungle', desert: 'Desert', savanna: 'Savanna', snowyForest: 'Snowy forest',
  snowyMountains: 'Snowy mountains', swamp: 'Swamp', flowerField: 'Flower fields', mountains: 'Highlands'
});

export const BIOME_GRASS = Object.freeze({
  plains: '#80ad58', forest: '#649b4d', denseForest: '#4d8048', jungle: '#4f9b55',
  savanna: '#a2a34e', snowyForest: '#91a97e', snowyMountains: '#a3b9b0',
  swamp: '#677c4c', flowerField: '#8fba61', mountains: '#8b9c75'
});

export function climateAt(warpX, warpZ, height, seed) {
  const temperature = clamp01(0.53 + fbm2(warpX * 0.0018, warpZ * 0.0018, seed + 809, 3) * 0.35 - Math.max(0, height - 38) * 0.012);
  const humidity = clamp01(0.5 + fbm2(warpX * 0.0022, warpZ * 0.0022, seed + 907, 4) * 0.46);
  return { temperature, humidity };
}


export function classifyBiome({ x, z, seed, height, temperature, humidity, mountainMask, river }) {
  let biome = 'plains';
  if (height < 28) biome = 'ocean';
  else if (height < 31 && (river < 0.35 || height < 29)) biome = 'beach';
  else if (height > 60 && temperature < 0.38) biome = 'snowyMountains';
  else if (height > 59 && mountainMask > 0.25) biome = 'mountains';
  else if (temperature < 0.25) biome = 'snowyForest';
  else if (temperature > 0.68 && humidity < 0.28) biome = 'desert';
  else if (humidity > 0.76 && height < 39) biome = 'swamp';
  else if (temperature > 0.61 && humidity > 0.68) biome = 'jungle';
  else if (humidity < 0.34 && temperature > 0.48) biome = 'savanna';
  else if (humidity > 0.63 && temperature > 0.32) biome = 'denseForest';
  else if (humidity > 0.48 && temperature > 0.35 && random01(Math.floor(x / 24), 0, Math.floor(z / 24), seed + 1009) > 0.77) biome = 'flowerField';
  else if (humidity > 0.48) biome = 'forest';
  return biome;
}

export function biomeAppearance(biome) {
  return { biomeLabel: BIOME_LABELS[biome] ?? 'Wildlands', grassColor: BIOME_GRASS[biome] ?? BIOME_GRASS.plains };
}

export function getBiomeLabel(biome) {
  return BIOME_LABELS[biome] ?? 'Wildlands';
}
