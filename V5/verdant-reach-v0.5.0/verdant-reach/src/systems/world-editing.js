import { BIOMES } from '../world/biomes.js';

export const CREATIVE_ENTITY_TYPES = Object.freeze([
  'rock', 'boulder', 'crystal', 'tree', 'pine-tree', 'ancient-tree', 'tree-grove', 'flower-patch',
  'deer', 'hare', 'wolf', 'bear', 'boar', 'crane', 'villager', 'merchant', 'guard',
  'horse', 'cart', 'rowboat', 'sailing-ship', 'large-ship', 'hut', 'watchtower', 'ruin',
  'bridge', 'campfire', 'treasure-chest', 'well', 'mine', 'village', 'port',
]);

export class WorldEditSystem {
  constructor(saved = null) {
    this.entities = Array.isArray(saved?.entities) ? saved.entities.filter((item) => item && CREATIVE_ENTITY_TYPES.includes(item.kind)).map((item) => ({ ...item })) : [];
    this.biomeOverrides = Array.isArray(saved?.biomeOverrides) ? saved.biomeOverrides.filter((item) => item && BIOMES[item.biome] && Number.isFinite(item.x) && Number.isFinite(item.z) && Number.isFinite(item.radius)).map((item) => ({ ...item })) : [];
    this.settlements = Array.isArray(saved?.settlements) ? saved.settlements.filter((item) => item && Number.isFinite(item.x) && Number.isFinite(item.z)).map((item) => ({ ...item })) : [];
    this.sequence = Math.max(Number(saved?.sequence ?? 0), ...this.entities.map((item) => Number(item.sequence ?? 0)), 0);
    this.nextBiomeId = Math.max(Number(saved?.nextBiomeId ?? 0), ...this.biomeOverrides.map((item) => Number(String(item.id).split(':').at(-1)) || 0), 0);
  }

  summon(kind, x, z, options = {}) {
    if (!CREATIVE_ENTITY_TYPES.includes(kind) || !Number.isFinite(x) || !Number.isFinite(z)) return null;
    const sequence = ++this.sequence;
    const record = {
      id: `creative-entity:${sequence}`,
      sequence,
      kind,
      x,
      z,
      yaw: Number.isFinite(options.yaw) ? options.yaw : 0,
      scale: Math.max(0.35, Math.min(4, Number(options.scale) || 1)),
      createdAt: Number(options.createdAt) || 0,
    };
    this.entities.push(record);
    if (this.entities.length > 320) this.entities.shift();
    return { ...record };
  }

  removeEntity(id) {
    const before = this.entities.length;
    this.entities = this.entities.filter((item) => item.id !== id);
    return this.entities.length !== before;
  }

  removeNearby(x, z, radius = 90) {
    const radiusSq = radius * radius;
    const removedEntities = this.entities.filter((item) => (item.x - x) ** 2 + (item.z - z) ** 2 <= radiusSq);
    const removedSettlements = this.settlements.filter((item) => (item.x - x) ** 2 + (item.z - z) ** 2 <= radiusSq);
    this.entities = this.entities.filter((item) => (item.x - x) ** 2 + (item.z - z) ** 2 > radiusSq);
    this.settlements = this.settlements.filter((item) => (item.x - x) ** 2 + (item.z - z) ** 2 > radiusSq);
    return {
      entities: removedEntities.length,
      settlements: removedSettlements.length,
      settlementIds: removedSettlements.map((item) => item.id),
      entityIds: removedEntities.map((item) => item.id),
    };
  }

  paintBiome(x, z, radius, biome) {
    if (!BIOMES[biome] || !Number.isFinite(x) || !Number.isFinite(z)) return null;
    const record = { id: `biome-paint:${++this.nextBiomeId}`, x, z, radius: Math.max(12, Math.min(520, Number(radius) || 80)), biome };
    this.biomeOverrides.push(record);
    if (this.biomeOverrides.length > 128) this.biomeOverrides.shift();
    return { ...record };
  }

  clearBiome(x, z, radius = 260) {
    const limit = Math.max(12, Number(radius) || 260);
    const before = this.biomeOverrides.length;
    this.biomeOverrides = this.biomeOverrides.filter((item) => Math.hypot(item.x - x, item.z - z) > limit + item.radius);
    return before - this.biomeOverrides.length;
  }

  addSettlement(record) {
    if (!record || !Number.isFinite(record.x) || !Number.isFinite(record.z)) return null;
    const id = record.id || `creative-settlement:${++this.sequence}`;
    const existing = this.settlements.find((item) => item.id === id);
    if (existing) return { ...existing };
    const settlement = { ...record, id };
    this.settlements.push(settlement);
    return { ...settlement };
  }

  getSaveData() {
    return {
      entities: this.entities.map((item) => ({ ...item })),
      biomeOverrides: this.biomeOverrides.map((item) => ({ ...item })),
      settlements: this.settlements.map((item) => ({ ...item })),
      sequence: this.sequence,
      nextBiomeId: this.nextBiomeId,
    };
  }
}
