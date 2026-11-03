import { hash2, mulberry32, random2, clamp } from '../core/random.js';

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
    if (settlement.type === 'freeCity') profession = ['trader', 'guard', 'woodworker', 'farmer', 'herbalist', 'trader', 'guard'][index % 7];
    if (settlement.type === 'port' && index === 0) profession = 'trader';
    if (settlement.type === 'market' && index === 0) profession = 'trader';
    if (settlement.type === 'port' && index === 1) profession = 'fisher';
    return {
      id: `${settlement.id}:npc:${index}`,
      name: `${first} ${last}`,
      profession,
      age: 19 + Math.floor(random() * 48),
      homeOffset: { x: (random() - 0.5) * (settlement.type === 'freeCity' ? 540 : 36), z: (random() - 0.5) * (settlement.type === 'freeCity' ? 540 : 36) },
      routineOffset: { x: (random() - 0.5) * (settlement.type === 'freeCity' ? 680 : 58), z: (random() - 0.5) * (settlement.type === 'freeCity' ? 680 : 58) },
      affinity: 0,
      lastTalkDay: -1,
      homeSettlementId: settlement.id,
      mood: 0.5,
      scheduleSeed: hash2(settlement.seed, index, 0x534348),
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
    farms: Math.max(2, Math.round(population * (settlement.type === 'freeCity' ? 0.34 : 1 / 8))),
    workshops: Math.max(1, Math.round(population / 15)),
    lastSimDay: day,
    leader: null,
    lastMigrationDay: day,
    migrationsIn: 0,
    migrationsOut: 0,
    production: { farms: 0, workshops: 0, fishing: 0 },
    npcs: makeNPCs(settlement),
  };
}

// Save data from earlier releases may contain distant settlements that are not
// registered by the currently loaded region. Those records still participate
// in coarse simulation, so normalize them on load rather than relying on
// ensureSettlement() (which only runs for nearby settlements).
function normalizeSavedSettlementState(id, savedState) {
  if (!savedState || typeof savedState !== 'object' || Array.isArray(savedState)) return null;

  const source = savedState;
  const readNumber = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
  const population = Math.max(1, Math.round(readNumber(source.population, 12)));
  const rawStock = source.stock && typeof source.stock === 'object' && !Array.isArray(source.stock) ? source.stock : {};
  const rawProduction = source.production && typeof source.production === 'object' && !Array.isArray(source.production) ? source.production : {};

  return {
    ...source,
    id: source.id ?? id,
    population,
    food: readNumber(source.food, Math.round(population * 3.4)),
    grain: readNumber(source.grain, Math.round(population * 1.8)),
    wood: readNumber(source.wood, 18 + Math.round(population * 0.55)),
    stone: readNumber(source.stone, 12 + Math.round(population * 0.3)),
    wealth: readNumber(source.wealth, 45 + population * 2),
    stability: readNumber(source.stability, 0.78),
    prosperity: readNumber(source.prosperity, 0.52),
    stock: {
      rations: readNumber(rawStock.rations, Math.max(4, Math.round(population / 4))),
      herbs: readNumber(rawStock.herbs, 3),
      timber: readNumber(rawStock.timber, 8),
      fish: readNumber(rawStock.fish, 2),
    },
    farms: Math.max(0, readNumber(source.farms, Math.max(2, Math.round(population / 8)))),
    workshops: Math.max(0, readNumber(source.workshops, Math.max(1, Math.round(population / 15)))),
    lastSimDay: Math.max(1, readNumber(source.lastSimDay, 1)),
    leader: source.leader ?? null,
    lastMigrationDay: Math.max(1, readNumber(source.lastMigrationDay, 1)),
    migrationsIn: Math.max(0, readNumber(source.migrationsIn, 0)),
    migrationsOut: Math.max(0, readNumber(source.migrationsOut, 0)),
    production: {
      farms: readNumber(rawProduction.farms, 0),
      workshops: readNumber(rawProduction.workshops, 0),
      fishing: readNumber(rawProduction.fishing, 0),
    },
    npcs: Array.isArray(source.npcs) ? source.npcs.filter((npc) => npc && typeof npc === 'object') : [],
  };
}

export class CivilizationSystem {
  constructor(seed, intelligence, saved = null) {
    this.seed = seed >>> 0;
    this.intelligence = intelligence;
    const savedSettlements = saved?.settlements && typeof saved.settlements === 'object' && !Array.isArray(saved.settlements)
      ? Object.entries(saved.settlements)
      : [];
    this.states = new Map();
    for (const [id, savedState] of savedSettlements) {
      const normalized = normalizeSavedSettlementState(id, savedState);
      if (normalized) this.states.set(id, normalized);
    }
    this.relationships = { ...(saved?.relationships ?? {}) };
    this.factionReputation = { ...(saved?.factionReputation ?? {}) };
    this.lastTradeDay = { ...(saved?.lastTradeDay ?? {}) };
    this.tradeConvoys = Array.isArray(saved?.tradeConvoys) ? saved.tradeConvoys.map((convoy) => ({ ...convoy, cargo: { ...(convoy.cargo ?? {}) } })) : [];
    this.migrationLog = Array.isArray(saved?.migrationLog) ? saved.migrationLog.slice(-80) : [];
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
      state = { ...fallback, ...state, stock: { ...fallback.stock, ...(state.stock ?? {}) }, production: { ...fallback.production, ...(state.production ?? {}) }, npcs: state.npcs?.length ? state.npcs : fallback.npcs };
      this.states.set(settlement.id, state);
    }
    for (const npc of state.npcs) {
      npc.homeSettlementId ??= settlement.id;
      npc.mood ??= 0.5;
      npc.scheduleSeed ??= hash2(settlement.seed, state.npcs.indexOf(npc), 0x534348);
      npc.homeOffset ??= { x: 0, z: 0 };
      npc.routineOffset ??= { x: 12, z: -8 };
    }
    if (!state.leader) state.leader = state.npcs.find((npc) => npc.profession === 'trader')?.id ?? state.npcs[0]?.id ?? null;
    return state;
  }

  registerSettlements(settlements, day = 1) {
    return settlements.map((settlement) => ({ settlement, state: this.ensureSettlement(settlement, day) }));
  }

  removeSettlement(id) {
    const key = String(id);
    const state = this.states.get(key);
    if (!state) return false;
    for (const npc of state.npcs ?? []) delete this.relationships[npc.id];
    this.states.delete(key);
    this.knownSettlements.delete(key);
    this.tradeConvoys = this.tradeConvoys.filter((convoy) => convoy.fromId !== key && convoy.toId !== key);
    return true;
  }

  advanceTo(day, season = 'spring') {
    const targetDay = Math.max(1, Math.floor(day));
    for (const state of this.states.values()) {
      // Keep this boundary defensive as well: states can be introduced by
      // future migration code or older saves after construction.
      state.stock ??= { rations: 0, herbs: 0, timber: 0, fish: 0 };
      state.production ??= { farms: 0, workshops: 0, fishing: 0 };
      state.production.farms ??= 0;
      state.production.workshops ??= 0;
      state.production.fishing ??= 0;
      const elapsed = Math.max(0, Math.min(365, targetDay - (state.lastSimDay ?? targetDay)));
      if (!elapsed) continue;
      const population = Math.max(1, state.population);
      const farmYield = state.farms * (season === 'winter' ? 0.42 : season === 'summer' ? 1.28 : season === 'autumn' ? 0.82 : 1.02);
      const fishingYield = (state.stock.fish > 0 ? 0.58 : 0.12) * (season === 'winter' ? 0.65 : 1);
      const dailyConsumption = population * 0.31;
      const workshopYield = state.workshops * 0.46;
      const foodChange = farmYield + fishingYield - dailyConsumption;
      state.food = clamp(state.food + foodChange * elapsed, 0, population * 24);
      state.grain = clamp(state.grain + (farmYield * 0.38 - dailyConsumption * 0.1) * elapsed, 0, population * 18);
      state.wood = clamp(state.wood + (0.18 + state.workshops * 0.13 - 0.1) * elapsed, 0, 500);
      state.wealth = clamp(state.wealth + (workshopYield - 0.24) * elapsed, 0, 100000);
      state.stock.rations = clamp(state.stock.rations + Math.floor(Math.max(0, foodChange) * elapsed * 0.16), 0, 999);
      state.stock.fish = clamp(state.stock.fish + Math.floor((fishingYield - (state.population * 0.025)) * elapsed), 0, 999);
      state.stock.timber = clamp(state.stock.timber + Math.floor(Math.max(0, state.workshops * 0.16 - 0.08) * elapsed), 0, 999);
      state.production.farms = farmYield;
      state.production.workshops = workshopYield;
      state.production.fishing = fishingYield;
      const foodRatio = state.food / Math.max(1, population * 3.4);
      if (foodRatio > 0.68 && state.stability > 0.42 && state.prosperity > 0.35) {
        state.population += Math.min(2, Math.floor(elapsed / 18));
      } else if (foodRatio < 0.12) {
        state.population = Math.max(4, state.population - Math.max(1, Math.ceil(elapsed / 9)));
        state.stability = clamp(state.stability - 0.012 * elapsed, 0.12, 1);
      } else {
        state.stability = clamp(state.stability + 0.002 * elapsed, 0.12, 1);
      }
      state.prosperity = clamp(state.prosperity + (foodRatio > 0.8 ? 0.002 : foodRatio < 0.2 ? -0.004 : -0.0004) * elapsed, 0.05, 1);
      state.lastSimDay = targetDay;
    }
    this._simulateMigration(targetDay);
    this._simulateTrade(targetDay);
  }

  seedTestConvoy(fromId, toId, roadId, day = 1) {
    if (!fromId || !toId || !roadId || fromId === toId) return null;
    const existing = this.tradeConvoys.find((convoy) => convoy.id === 'field-test:starter-convoy');
    if (existing) return existing;
    const origin = this.states.get(fromId);
    const destination = this.states.get(toId);
    if (!origin || !destination) return null;
    const resource = 'timber';
    const quantity = Math.min(4, Math.max(1, Math.floor(origin.stock?.timber ?? 0)));
    const payment = quantity * 5;
    origin.stock.timber = Math.max(0, (origin.stock.timber ?? 0) - quantity);
    destination.wealth = Math.max(0, destination.wealth - payment);
    const convoy = {
      id: 'field-test:starter-convoy', roadId, fromId, toId,
      cargo: { resource, quantity }, payment,
      departureDay: Math.max(1, Math.floor(day)),
      arrivalDay: Math.max(1, Math.floor(day)) + 4,
      status: 'enroute', testScenario: true,
    };
    this.tradeConvoys.push(convoy);
    return convoy;
  }

  _simulateMigration(day) {
    if (day % 7 !== 0) return;
    for (const [id, state] of this.states) {
      if (day - (state.lastMigrationDay ?? 0) < 14) continue;
      const base = this.knownSettlements.get(id);
      if (!base) continue;
      const foodRatio = state.food / Math.max(1, state.population * 3.4);
      if (foodRatio > 0.24 && state.stability > 0.3) continue;
      const destinations = this.intelligence.settlementsNear(base.x, base.z, 3300)
        .filter((candidate) => candidate.id !== id && this.states.has(candidate.id))
        .map((candidate) => ({ settlement: candidate, state: this.states.get(candidate.id) }))
        .filter((candidate) => {
          const residents = Math.max(1, candidate.state.population);
          const foodPerResident = candidate.state.food / residents;
          // Large cities need substantial absolute reserves; a 10k-food reserve
          // is still a viable destination even when the city has thousands of residents.
          return (foodPerResident > 2.1 || candidate.state.food > 4200) && candidate.state.stability > 0.48;
        })
        .sort((a, b) => Math.hypot(a.settlement.x - base.x, a.settlement.z - base.z) - Math.hypot(b.settlement.x - base.x, b.settlement.z - base.z));
      const destination = destinations[0];
      const migrantIndex = state.npcs.findIndex((npc) => npc.id !== state.leader);
      if (!destination || migrantIndex < 0 || state.population <= 5) continue;
      const [migrant] = state.npcs.splice(migrantIndex, 1);
      const target = destination.state;
      migrant.homeSettlementId = destination.settlement.id;
      migrant.homeOffset = {
        x: (random2(hash2(this.seed, day, 0x4d4947), migrant.scheduleSeed, this.seed) - 0.5) * 34,
        z: (random2(migrant.scheduleSeed, day, this.seed ^ 0x719) - 0.5) * 34,
      };
      migrant.routineOffset = {
        x: migrant.homeOffset.x * 1.6 + 8,
        z: migrant.homeOffset.z * 1.6 - 6,
      };
      migrant.lastMigrationDay = day;
      target.npcs.push(migrant);
      state.population = Math.max(4, state.population - 1);
      target.population += 1;
      state.lastMigrationDay = day;
      target.lastMigrationDay = day;
      state.migrationsOut = (state.migrationsOut ?? 0) + 1;
      target.migrationsIn = (target.migrationsIn ?? 0) + 1;
      this.migrationLog.push({ day, npcId: migrant.id, from: id, to: destination.settlement.id });
      if (this.migrationLog.length > 80) this.migrationLog.shift();
    }
  }

  _simulateTrade(day) {
    // Deliver shipments that completed their journey while their regions were unloaded.
    for (const convoy of this.tradeConvoys) {
      if (convoy.status !== 'enroute' || convoy.arrivalDay > day) continue;
      const destination = this.states.get(convoy.toId);
      if (!destination) continue;
      const resource = convoy.cargo.resource;
      const amount = Math.max(0, Math.floor(convoy.cargo.quantity));
      if (resource === 'rations' || resource === 'fish' || resource === 'herbs' || resource === 'timber') {
        destination.stock[resource] = clamp((destination.stock[resource] ?? 0) + amount, 0, 999);
      }
      const origin = this.states.get(convoy.fromId);
      if (origin) origin.wealth = clamp(origin.wealth + convoy.payment, 0, 100000);
      convoy.status = 'delivered';
      convoy.deliveredDay = day;
    }
    this.tradeConvoys = this.tradeConvoys.filter((convoy) => convoy.status === 'enroute' || day - (convoy.deliveredDay ?? day) <= 5);

    const known = [...this.knownSettlements.values()];
    if (known.length < 2) return;
    const links = this.intelligence.roadLinksFor(known, 4400);
    for (const link of links) {
      const lastDay = this.lastTradeDay[link.id] ?? -10;
      if (day - lastDay < 3) continue;
      if (this.tradeConvoys.some((convoy) => convoy.roadId === link.id && convoy.status === 'enroute')) continue;
      const aState = this.states.get(link.a.id);
      const bState = this.states.get(link.b.id);
      if (!aState || !bState) continue;

      const options = [
        { resource: 'rations', stock: 'rations', a: aState.stock.rations ?? 0, b: bState.stock.rations ?? 0, price: 4 },
        { resource: 'fish', stock: 'fish', a: aState.stock.fish ?? 0, b: bState.stock.fish ?? 0, price: 3 },
        { resource: 'herbs', stock: 'herbs', a: aState.stock.herbs ?? 0, b: bState.stock.herbs ?? 0, price: 3 },
        { resource: 'timber', stock: 'timber', a: aState.stock.timber ?? 0, b: bState.stock.timber ?? 0, price: 5 },
      ];
      let selected = null;
      for (const option of options) {
        const candidates = [
          { fromId: link.a.id, toId: link.b.id, source: aState, target: bState, surplus: option.a - option.b },
          { fromId: link.b.id, toId: link.a.id, source: bState, target: aState, surplus: option.b - option.a },
        ].sort((a, b) => b.surplus - a.surplus);
        const candidate = candidates[0];
        if (candidate.surplus > 3 && candidate.source.stock[option.stock] >= 3) {
          const quantity = Math.min(3, Math.floor(candidate.surplus - 2));
          const payment = quantity * option.price;
          if (candidate.target.wealth >= payment) {
            selected = { ...candidate, resource: option.resource, stock: option.stock, quantity, payment };
            break;
          }
        }
      }
      if (!selected) continue;
      selected.source.stock[selected.stock] -= selected.quantity;
      selected.target.wealth = Math.max(0, selected.target.wealth - selected.payment);
      const duration = Math.max(1, Math.ceil((link.routeDistance || link.distance) / 2600));
      const convoy = {
        id: `convoy:${link.id}:${day}`,
        roadId: link.id,
        fromId: selected.fromId,
        toId: selected.toId,
        cargo: { resource: selected.resource, quantity: selected.quantity },
        payment: selected.payment,
        departureDay: day,
        arrivalDay: day + duration,
        status: 'enroute',
      };
      this.tradeConvoys.push(convoy);
      this.lastTradeDay[link.id] = day;
    }
  }

  scheduleForNpc(npc, settlement, hour, day = 1) {
    const h = ((hour % 24) + 24) % 24;
    const home = npc.homeOffset ?? { x: 0, z: 0 };
    const routine = npc.routineOffset ?? { x: 0, z: 0 };
    const market = { x: 7 + routine.x * 0.18, z: 5 + routine.z * 0.18 };
    const fields = { x: routine.x * 1.25 - 20, z: routine.z * 1.25 + 18 };
    const workshop = { x: routine.x * 0.5 + 19, z: routine.z * 0.5 - 14 };
    const shore = { x: routine.x * 0.35 - 18, z: routine.z * 0.35 - 25 };
    let target = { x: home.x, z: home.z };
    let activity = 'resting';
    if (npc.profession === 'guard') {
      const patrol = h >= 20 || h < 5 ? 28 : 19;
      const angle = (h / 24) * Math.PI * 2 + (npc.scheduleSeed ?? 0) * 0.00001;
      target = { x: Math.cos(angle) * patrol, z: Math.sin(angle) * patrol };
      activity = 'patrolling';
    } else if (h >= 6 && h < 11) {
      if (npc.profession === 'farmer') { target = fields; activity = 'working the fields'; }
      else if (npc.profession === 'fisher') { target = shore; activity = 'fishing'; }
      else if (npc.profession === 'trader') { target = market; activity = 'opening the market'; }
      else { target = workshop; activity = npc.profession === 'herbalist' ? 'gathering herbs' : 'working'; }
    } else if (h >= 11 && h < 18) {
      if (npc.profession === 'farmer') { target = fields; activity = 'tending crops'; }
      else if (npc.profession === 'fisher') { target = shore; activity = 'mending nets'; }
      else if (npc.profession === 'trader' || day % 7 === 6) { target = market; activity = 'trading'; }
      else { target = workshop; activity = 'at work'; }
    } else if (h >= 18 && h < 21) {
      target = { x: home.x * 0.45, z: home.z * 0.45 };
      activity = 'at the commons';
    }
    return { x: settlement.x + target.x, z: settlement.z + target.z, activity };
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
      tradeConvoys: this.tradeConvoys.map((convoy) => ({ ...convoy, cargo: { ...convoy.cargo } })),
      migrationLog: this.migrationLog.slice(-80),
    };
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
