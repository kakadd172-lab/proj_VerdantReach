import { hash2, random2, clamp } from '../core/random.js';

const COMBAT_CELL = 1180;
const HOSTILE_BIOMES = new Set(['forest', 'deepForest', 'jungle', 'marsh', 'alpine', 'tundra']);

export class CombatSystem {
  constructor(seed, generator, intelligence, saved = null) {
    this.seed = seed >>> 0;
    this.generator = generator;
    this.intelligence = intelligence;
    this.defeated = new Set(saved?.defeated ?? []);
    this.health = { ...(saved?.health ?? {}) };
    this.cellCache = new Map();
    this.lastStrikeAt = -Infinity;
    this.lastContactAt = new Map();
    this.lastDamageAt = -Infinity;
  }

  _hostileForCell(cx, cz) {
    const key = `${cx}:${cz}`;
    let base = this.cellCache.get(key);
    if (base === undefined) {
      const roll = random2(cx, cz, this.seed ^ 0x6d2b);
      if (roll > 0.2) {
        base = null;
      } else {
        const x = (cx + 0.18 + random2(cx + 11, cz, this.seed ^ 0x913) * 0.64) * COMBAT_CELL;
        const z = (cz + 0.18 + random2(cx, cz - 17, this.seed ^ 0x1f7) * 0.64) * COMBAT_CELL;
        const sample = this.generator.sample(x, z, true);
        if (sample.height < 3 || sample.slope > 0.48 || !HOSTILE_BIOMES.has(sample.biome)) {
          base = null;
        } else if (this.intelligence.settlementsNear(x, z, 260).length) {
          base = null;
        } else {
          const id = `warden:${cx}:${cz}`;
          const kind = sample.biome === 'alpine' || sample.biome === 'tundra' ? 'stone-wisp' : 'thorn-wisp';
          const maxHealth = 42 + (hash2(cx, cz, this.seed ^ 0x713) % 19);
          base = {
            id, kind,
            name: kind === 'stone-wisp' ? 'Stone wisp' : 'Thorn wisp',
            x, z, y: sample.height,
            maxHealth,
            speed: kind === 'stone-wisp' ? 1.05 : 1.3,
            phase: random2(cx + 31, cz - 7, this.seed ^ 0x5ab) * Math.PI * 2,
            biome: sample.biome,
          };
        }
      }
      this.cellCache.set(key, base);
    }
    if (!base || this.defeated.has(base.id)) return null;
    const health = clamp(this.health[base.id] ?? base.maxHealth, 0, base.maxHealth);
    if (health <= 0) {
      this.defeated.add(base.id);
      return null;
    }
    return { ...base, health };
  }

  hostilesNear(x, z, radius = 720) {
    const minX = Math.floor((x - radius) / COMBAT_CELL);
    const maxX = Math.floor((x + radius) / COMBAT_CELL);
    const minZ = Math.floor((z - radius) / COMBAT_CELL);
    const maxZ = Math.floor((z + radius) / COMBAT_CELL);
    const result = [];
    for (let cz = minZ; cz <= maxZ; cz += 1) {
      for (let cx = minX; cx <= maxX; cx += 1) {
        const hostile = this._hostileForCell(cx, cz);
        if (hostile && Math.hypot(hostile.x - x, hostile.z - z) <= radius + 220) result.push(hostile);
      }
    }
    return result;
  }

  strike(hostileId, rpg, worldSeconds = 0) {
    if (!rpg) return { ok: false, message: 'You cannot act right now.' };
    if (worldSeconds - this.lastStrikeAt < 0.48) return { ok: false, message: 'Recover your stance.' };
    if (rpg.stamina < 9) return { ok: false, message: 'You need more stamina.' };
    if (this.defeated.has(hostileId)) return { ok: false, message: 'That wisp has already faded.' };
    const match = /^warden:(-?\d+):(-?\d+)$/.exec(hostileId);
    if (!match) return { ok: false, message: 'That target is no longer here.' };
    const cx = Number(match[1]);
    const cz = Number(match[2]);
    const x = (cx + 0.18 + random2(cx + 11, cz, this.seed ^ 0x913) * 0.64) * COMBAT_CELL;
    const z = (cz + 0.18 + random2(cx, cz - 17, this.seed ^ 0x1f7) * 0.64) * COMBAT_CELL;
    const sample = this.generator.sample(x, z, true);
    if (random2(cx, cz, this.seed ^ 0x6d2b) > 0.2 || sample.height < 3 || sample.slope > 0.48 || !HOSTILE_BIOMES.has(sample.biome)) return { ok: false, message: 'The trail has gone cold.' };
    if (this.intelligence.settlementsNear(x, z, 260).length) return { ok: false, message: 'The wisp is outside its roaming grounds.' };
    const maxHealth = 42 + (hash2(cx, cz, this.seed ^ 0x713) % 19);
    const currentHealth = clamp(this.health[hostileId] ?? maxHealth, 0, maxHealth);
    if (this.defeated.has(hostileId) || currentHealth <= 0) return { ok: false, message: 'That wisp has already faded.' };

    const weaponBonus = rpg.equipment?.weapon === 'ancient-focus' ? 7 : rpg.equipment?.weapon === 'wayfarer-staff' ? 3 : 0;
    const damage = 9 + (rpg.skills?.combat ?? 1) * 3 + weaponBonus;
    rpg.stamina = Math.max(0, rpg.stamina - 9);
    this.lastStrikeAt = worldSeconds;
    const nextHealth = Math.max(0, currentHealth - damage);
    this.health[hostileId] = nextHealth;
    if (nextHealth <= 0) {
      this.defeated.add(hostileId);
      rpg.addXp(34);
      rpg.addItem('wispDust', 1);
      rpg.awardSkill('combat', 14);
      return { ok: true, defeated: true, damage, message: 'The wisp disperses into harmless motes. You gather a little echo dust.' };
    }
    rpg.awardSkill('combat', 4);
    return { ok: true, defeated: false, damage, health: nextHealth, maxHealth, message: `The wisp recoils. ${Math.ceil(nextHealth)} strength remains.` };
  }

  contact(hostileId, rpg, worldSeconds = 0) {
    if (!rpg || this.defeated.has(hostileId)) return { hit: false };
    const last = this.lastContactAt.get(hostileId) ?? -Infinity;
    if (worldSeconds - last < 1.35) return { hit: false };
    this.lastContactAt.set(hostileId, worldSeconds);
    const armorReduction = rpg.equipment?.armor === 'warden-mail' ? 0.28 : 0;
    const damage = Math.max(2, Math.round(6 * (1 - armorReduction)));
    rpg.health = Math.max(1, rpg.health - damage);
    this.lastDamageAt = worldSeconds;
    return { hit: true, damage, health: rpg.health };
  }

  recover(delta, rpg, worldSeconds = 0, inDanger = false) {
    if (!rpg || inDanger || worldSeconds - this.lastDamageAt < 6) return;
    rpg.health = Math.min(rpg.maxHealth, rpg.health + delta * 2.1);
  }

  getSaveData() {
    return { defeated: [...this.defeated], health: { ...this.health } };
  }
}
