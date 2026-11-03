import { hash2, mulberry32, clamp } from '../core/random.js';

const FIRST_NAMES = ['Ader', 'Alwen', 'Bren', 'Cerys', 'Dain', 'Eira', 'Fenn', 'Hal', 'Iven', 'Lysa', 'Maren', 'Noll', 'Orin', 'Pella', 'Rook', 'Sella', 'Tarin', 'Una', 'Vey', 'Wren'];
const LAST_NAMES = ['Ashford', 'Bramble', 'Cairn', 'Duskwood', 'Fen', 'Greymark', 'Hollow', 'Mere', 'Northfield', 'Oakhand', 'Reed', 'Thorn'];
const PROFESSIONS = ['farmer', 'woodworker', 'trader', 'guard', 'herbalist', 'fisher'];

function makeNPCs(settlement) {
  const random = mulberry32(hash2(settlement.seed, settlement.basePopulation, 0x4e5043));
  const count = Math.max(3, Math.min(7, Math.round(settlement.basePopulation / 7)));
  return Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    let profession = PROFESSIONS[Math.floor(random() * PROFESSIONS.length)];
    if (settlement.type === 'port' && index === 0) profession = 'trader';
    if (settlement.type === 'market' && index === 0) profession = 'trader';
    if (settlement.type === 'port' && index === 1) profession = 'fisher';
    return {
      id: `${settlement.id}:npc:${index}`,
      name: `${first} ${last}`,
      profession,
      age: 19 + Math.floor(random() * 48),
      homeOffset: { x: (random() - 0.5) * 36, z: (random() - 0.5) * 36 },
      routineOffset: { x: (random() - 0.5) * 58, z: (random() - 0.5) * 58 },
      affinity: 0,
      lastTalkDay: -1,
    };
  });
}

function defaultState(settlement, day = 1) {
  const population = settlement.basePopulation;
  return {
    id: settlement.id,
    population,
    food: Math.round(population * 3.4),
    grain: Math.round(population * 1.8),
    wood: 18 + Math.round(population * 0.55),
    stone: 12 + Math.round(population * 0.3),
    wealth: 45 + population * 2,
    stability: 0.78,
    prosperity: 0.52,
    stock: { rations: Math.max(4, Math.round(population / 4)), herbs: 3, timber: 8, fish: settlement.type === 'port' ? 12 : 2 },
    farms: Math.max(2, Math.round(population / 8)),
    workshops: Math.max(1, Math.round(population / 15)),
    lastSimDay: day,
    leader: null,
    npcs: makeNPCs(settlement),
  };
}

export class CivilizationSystem {
  constructor(seed, intelligence, saved = null) {
    this.seed = seed >>> 0;
    this.intelligence = intelligence;
    this.states = new Map(Object.entries(saved?.settlements ?? {}));
    this.relationships = { ...(saved?.relationships ?? {}) };
    this.factionReputation = { ...(saved?.factionReputation ?? {}) };
    this.lastTradeDay = { ...(saved?.lastTradeDay ?? {}) };
    this.knownSettlements = new Map();
    for (const state of this.states.values()) {
      if (!Array.isArray(state.npcs)) state.npcs = [];
    }
  }

  ensureSettlement(settlement, day = 1) {
    this.knownSettlements.set(settlement.id, settlement);
    let state = this.states.get(settlement.id);
    if (!state) {
      state = defaultState(settlement, day);
      this.states.set(settlement.id, state);
    } else {
      const fallback = defaultState(settlement, state.lastSimDay ?? day);
      state = { ...fallback, ...state, stock: { ...fallback.stock, ...(state.stock ?? {}) }, npcs: state.npcs?.length ? state.npcs : fallback.npcs };
      this.states.set(settlement.id, state);
    }
    if (!state.leader) state.leader = state.npcs.find((npc) => npc.profession === 'trader')?.id ?? state.npcs[0]?.id ?? null;
    return state;
  }

  registerSettlements(settlements, day = 1) {
    return settlements.map((settlement) => ({ settlement, state: this.ensureSettlement(settlement, day) }));
  }

  advanceTo(day, season = 'spring') {
    const targetDay = Math.max(1, Math.floor(day));
    for (const state of this.states.values()) {
      const elapsed = Math.max(0, Math.min(365, targetDay - (state.lastSimDay ?? targetDay)));
      if (!elapsed) continue;
      const population = Math.max(1, state.population);
      const farmYield = state.farms * (season === 'winter' ? 0.48 : season === 'summer' ? 1.25 : 0.95);
      const dailyConsumption = population * 0.34;
      const workshopYield = state.workshops * 0.45;
      state.food = clamp(state.food + (farmYield - dailyConsumption) * elapsed, 0, population * 24);
      state.grain = clamp(state.grain + (farmYield * 0.34 - dailyConsumption * 0.12) * elapsed, 0, population * 18);
      state.wood = clamp(state.wood + (0.25 + state.workshops * 0.12 - 0.1) * elapsed, 0, 500);
      state.wealth = clamp(state.wealth + (workshopYield - 0.24) * elapsed, 0, 100000);
      const foodRatio = state.food / Math.max(1, population * 3.4);
      if (foodRatio > 0.68 && state.stability > 0.42 && state.prosperity > 0.35) {
        state.population += Math.min(2, Math.floor(elapsed / 18));
      } else if (foodRatio < 0.12) {
        state.population = Math.max(4, state.population - Math.max(1, Math.ceil(elapsed / 9)));
        state.stability = clamp(state.stability - 0.012 * elapsed, 0.12, 1);
      } else {
        state.stability = clamp(state.stability + 0.002 * elapsed, 0.12, 1);
      }
      state.prosperity = clamp(state.prosperity + (foodRatio > 0.8 ? 0.002 : -0.001) * elapsed, 0.05, 1);
      state.stock.rations = clamp(state.stock.rations + Math.floor(Math.max(0, farmYield - dailyConsumption) * elapsed * 0.18), 0, 999);
      state.lastSimDay = targetDay;
    }
    this._simulateTrade(targetDay);
  }

  _simulateTrade(day) {
    for (const [id, state] of this.states) {
      const lastDay = this.lastTradeDay[id] ?? state.lastSimDay - 1;
      if (day <= lastDay) continue;
      const base = this.knownSettlements.get(id);
      if (!base) continue;
      const neighbors = this.intelligence.settlementsNear(base.x, base.z, 3300)
        .filter((candidate) => candidate.id !== id && this.states.has(candidate.id));
      for (const neighbor of neighbors) {
        const other = this.states.get(neighbor.id);
        const key = [id, neighbor.id].sort().join('|');
        const offset = (hash2(this.seed, day, hash2(base.seed, neighbor.seed, 0x5452)) % 1000) / 1000;
        if (offset > 0.42) continue;
        if (state.stock.rations > other.stock.rations + 3 && other.wealth > 2) {
          state.stock.rations -= 1;
          other.stock.rations += 1;
          other.wealth -= 1;
          state.wealth += 1;
        }
        this.lastTradeDay[key] = day;
      }
      this.lastTradeDay[id] = day;
    }
  }

  talkTo(npcId, day = 1) {
    for (const state of this.states.values()) {
      const npc = state.npcs.find((person) => person.id === npcId);
      if (!npc) continue;
      const currentDay = Math.floor(day);
      const previous = npc.lastTalkDay ?? -1;
      if (previous === currentDay) return { npc, repeated: true, relation: this.relationships[npcId] ?? npc.affinity ?? 0 };
      npc.lastTalkDay = currentDay;
      this.relationships[npcId] = clamp((this.relationships[npcId] ?? npc.affinity ?? 0) + 1, -100, 100);
      return { npc, repeated: false, relation: this.relationships[npcId] };
    }
    return null;
  }

  trade(settlementId, action, rpg) {
    const state = this.states.get(settlementId);
    if (!state || !rpg) return { ok: false, message: 'No market is available here.' };
    if (action === 'buy-ration') {
      const cost = Math.max(3, 5 - Math.floor(((rpg.skills?.commerce ?? 1) - 1) / 3));
      if (rpg.inventory.silverPetal < cost) return { ok: false, message: `You need ${cost} silver petals.` };
      if (state.stock.rations < 1) return { ok: false, message: 'This market has no travel rations in stock.' };
      rpg.inventory.silverPetal -= cost;
      rpg.inventory.rations = (rpg.inventory.rations ?? 0) + 1;
      state.stock.rations -= 1;
      state.wealth += cost;
      return { ok: true, message: 'A travel ration was added to your pack.' };
    }
    if (action === 'sell-moonleaf') {
      if (rpg.inventory.moonleaf < 1) return { ok: false, message: 'You have no moonleaf to sell.' };
      const price = 3 + Math.floor(((rpg.skills?.commerce ?? 1) - 1) / 3);
      if (state.wealth < price) return { ok: false, message: 'This market cannot afford that purchase today.' };
      rpg.inventory.moonleaf -= 1;
      rpg.inventory.silverPetal += price;
      state.stock.herbs += 1;
      state.wealth -= price;
      rpg.awardSkill?.('commerce', 3);
      return { ok: true, message: `Moonleaf sold for ${price} silver petals.` };
    }
    if (action === 'sell-meat') {
      if ((rpg.inventory.gameMeat ?? 0) < 1) return { ok: false, message: 'You have no game meat to sell.' };
      const price = 4 + Math.floor(((rpg.skills?.commerce ?? 1) - 1) / 3);
      if (state.wealth < price) return { ok: false, message: 'This market cannot afford that purchase today.' };
      rpg.inventory.gameMeat -= 1;
      rpg.inventory.silverPetal += price;
      state.wealth -= price;
      rpg.awardSkill?.('commerce', 3);
      return { ok: true, message: `Game meat sold for ${price} silver petals.` };
    }
    return { ok: false, message: 'That trade is not available.' };
  }

  getSettlementState(id) {
    return this.states.get(id) ?? null;
  }

  getSaveData() {
    return {
      settlements: Object.fromEntries([...this.states.entries()].map(([id, state]) => [id, structuredCloneSafe(state)])),
      relationships: { ...this.relationships },
      factionReputation: { ...this.factionReputation },
      lastTradeDay: { ...this.lastTradeDay },
    };
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
