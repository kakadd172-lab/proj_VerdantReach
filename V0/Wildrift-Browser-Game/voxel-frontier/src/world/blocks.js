export const BLOCK = Object.freeze({
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, GRAVEL: 5, SNOW: 6,
  LOG: 7, LEAVES: 8, WATER: 9, COAL: 10, IRON: 11, GOLD: 12,
  DIAMOND: 13, BEDROCK: 14, PLANKS: 15, FLOWER: 16, CACTUS: 17,
  MUSHROOM: 18, MUD: 19, CLAY: 20, COBBLE: 21
});

export const BLOCKS = [
  { id: 0, key: 'air', name: 'Air', color: '#000000', solid: false, transparent: true, mineable: false },
  { id: 1, key: 'grass', name: 'Grass', color: '#79a94f', solid: true, mineable: true },
  { id: 2, key: 'dirt', name: 'Dirt', color: '#8b6546', solid: true, mineable: true },
  { id: 3, key: 'stone', name: 'Stone', color: '#858b8b', solid: true, mineable: true },
  { id: 4, key: 'sand', name: 'Sand', color: '#d6c184', solid: true, mineable: true },
  { id: 5, key: 'gravel', name: 'Gravel', color: '#9b9b91', solid: true, mineable: true },
  { id: 6, key: 'snow', name: 'Snow', color: '#e2eff0', solid: true, mineable: true },
  { id: 7, key: 'log', name: 'Wood', color: '#8a5c36', solid: true, mineable: true },
  { id: 8, key: 'leaves', name: 'Leaves', color: '#4c8c54', solid: true, mineable: true },
  { id: 9, key: 'water', name: 'Water', color: '#4fabb5', solid: false, transparent: true, mineable: false },
  { id: 10, key: 'coal', name: 'Coal ore', color: '#4b5054', solid: true, mineable: true },
  { id: 11, key: 'iron', name: 'Iron ore', color: '#b18a6c', solid: true, mineable: true },
  { id: 12, key: 'gold', name: 'Gold ore', color: '#d6ad43', solid: true, mineable: true },
  { id: 13, key: 'diamond', name: 'Diamond ore', color: '#52c8c3', solid: true, mineable: true },
  { id: 14, key: 'bedrock', name: 'Bedrock', color: '#343b3e', solid: true, mineable: false },
  { id: 15, key: 'planks', name: 'Planks', color: '#b58b59', solid: true, mineable: true },
  { id: 16, key: 'flower', name: 'Flower', color: '#e7a0b0', solid: true, mineable: true },
  { id: 17, key: 'cactus', name: 'Cactus', color: '#4d9b66', solid: true, mineable: true },
  { id: 18, key: 'mushroom', name: 'Mushroom', color: '#c66f50', solid: true, mineable: true },
  { id: 19, key: 'mud', name: 'Mud', color: '#6c6850', solid: true, mineable: true },
  { id: 20, key: 'clay', name: 'Clay', color: '#879fa1', solid: true, mineable: true },
  { id: 21, key: 'cobble', name: 'Cobblestone', color: '#707879', solid: true, mineable: true }
];

export const BLOCK_BY_ID = BLOCKS.reduce((map, block) => {
  map[block.id] = block;
  return map;
}, {});

export const HOTBAR_DEFAULT = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.LOG, BLOCK.LEAVES, BLOCK.PLANKS, BLOCK.COBBLE, BLOCK.FLOWER];
export const INVENTORY_BLOCKS = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.GRAVEL, BLOCK.SNOW, BLOCK.LOG, BLOCK.LEAVES, BLOCK.PLANKS, BLOCK.COBBLE, BLOCK.COAL, BLOCK.IRON, BLOCK.GOLD, BLOCK.DIAMOND, BLOCK.FLOWER, BLOCK.CACTUS, BLOCK.MUSHROOM, BLOCK.MUD, BLOCK.CLAY];

export function isSolid(id) {
  return Boolean(BLOCK_BY_ID[id]?.solid);
}

export function blockHex(id) {
  return BLOCK_BY_ID[id]?.color ?? '#ff00ff';
}
