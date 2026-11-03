import { hash2, random2, clamp } from '../core/random.js';

const HABITAT_CELL = 320;
const SPECIES = {
  deer: { label: 'red deer', diet: 'herbivore', meat: 2, hide: 1, color: 0x9b7250, speed: 2.4 },
  boar: { label: 'wild boar', diet: 'omnivore', meat: 2, hide: 1, color: 0x51483d, speed: 1.8 },
  hare: { label: 'field hare', diet: 'herbivore', meat: 1, hide: 0, color: 0xb39b7a, speed: 3.5 },
  fox: { label: 'red fox', diet: 'omnivore', meat: 1, hide: 1, color: 0xb96e3e, speed: 3.1 },
  wolf: { label: 'grey wolf', diet: 'predator', meat: 1, hide: 1, color: 0x777e7c, speed: 3.4 },
  goat: { label: 'mountain goat', diet: 'herbivore', meat: 2, hide: 1, color: 0xc1c0b4, speed: 2.6 },
  crane: { label: 'marsh crane', diet: 'omnivore', meat: 1, hide: 0, color: 0x8d9990, speed: 2.2 },
};

const HABITATS = {
  grassland: ['deer', 'hare', 'fox'], forest: ['deer', 'boar', 'fox'], deepForest: ['deer', 'boar', 'wolf'],
  jungle: ['boar', 'fox'], marsh: ['boar', 'crane', 'hare'], savanna: ['deer', 'hare', 'fox'],
  alpine: ['goat', 'wolf'], snow: ['goat', 'wolf'], tundra: ['hare', 'wolf'], coast: ['crane', 'fox'],
};

export class EcosystemSystem {
  constructor(seed, generator, saved = null) {
    this.seed = seed >>> 0;
    this.generator = generator;
    this.cells = new Map(Object.entries(saved?.cells ?? {}));
    this.hunted = new Set(saved?.hunted ?? []);
    this.totalHarvested = saved?.totalHarvested ?? 0;
    this.totalPredated = saved?.totalPredated ?? 0;
    this.currentDay = saved?.currentDay ?? 1;
    this.currentSeason = saved?.currentSeason ?? 'spring';
  }

  _cell(cx, cz) {
    const key = `${cx}:${cz}`;
    let state = this.cells.get(key);
    if (state) return state;
    const sample = this.generator.sample((cx + 0.5) * HABITAT_CELL, (cz + 0.5) * HABITAT_CELL);
    const species = HABITATS[sample.biome] ?? [];
    const baseline = sample.height > 1.5 && species.length ? 1 + Math.floor(random2(cx, cz, this.seed ^ 0x71ab) * 3) : 0;
    const wetness = clamp((sample.moisture + sample.rainfall) * 0.5, 0, 1);
    state = {
      id: key,
      biome: sample.biome,
      foodIndex: wetness,
      waterIndex: clamp(sample.rainfall * 0.6 + sample.moisture * 0.4, 0, 1),
      population: baseline,
      carryingCapacity: species.length ? 2 + Math.floor(random2(cx, cz, this.seed ^ 0x5a72) * 4) : 0,
      predatorPressure: species.includes('wolf') ? 0.12 : 0.04,
      lastPredationDay: -1,
      lastSimDay: this.currentDay,
      migration: random2(cx, cz, this.seed ^ 0x1133) * Math.PI * 2,
    };
    this.cells.set(key, state);
    return state;
  }

  animalsNear(x, z, radius = 520) {
    const minX = Math.floor((x - radius) / HABITAT_CELL);
    const maxX = Math.floor((x + radius) / HABITAT_CELL);
    const minZ = Math.floor((z - radius) / HABITAT_CELL);
    const maxZ = Math.floor((z + radius) / HABITAT_CELL);
    const animals = [];
    for (let cz = minZ; cz <= maxZ; cz += 1) {
      for (let cx = minX; cx <= maxX; cx += 1) {
        const cell = this._cell(cx, cz);
        const habitatSpecies = HABITATS[cell.biome] ?? [];
        for (let index = 0; index < cell.population; index += 1) {
          const id = `wildlife:${cx}:${cz}:${index}`;
          if (this.hunted.has(id) || !habitatSpecies.length) continue;
          const seed = hash2(cx * 7 + index, cz * 11 - index, this.seed ^ 0x6a31);
          const species = habitatSpecies[seed % habitatSpecies.length];
          const seasonalDrift = Math.sin(this.currentDay * 0.035 + cell.migration) * 18;
          const px = (cx + 0.15 + random2(cx + index, cz, this.seed ^ 0x125a) * 0.7) * HABITAT_CELL + Math.cos(cell.migration) * seasonalDrift;
          const pz = (cz + 0.15 + random2(cx, cz - index, this.seed ^ 0x615b) * 0.7) * HABITAT_CELL + Math.sin(cell.migration) * seasonalDrift;
          const sample = this.generator.sample(px, pz, true);
          if (sample.height < 1.5 || sample.slope > 1.0) continue;
          if (Math.hypot(px - x, pz - z) > radius + 170) continue;
          animals.push({
            id,
            species,
            label: SPECIES[species].label,
            diet: SPECIES[species].diet,
            x: px,
            z: pz,
            y: sample.height,
            speed: SPECIES[species].speed,
            color: SPECIES[species].color,
            cellId: `${cx}:${cz}`,
            cellX: cx,
            cellZ: cz,
            index,
            phase: random2(seed, index, this.seed) * Math.PI * 2,
          });
        }
      }
    }
    return animals;
  }

  advanceTo(day, season = 'spring') {
    const targetDay = Math.max(1, Math.floor(day));
    this.currentSeason = season;
    for (const state of this.cells.values()) {
      const elapsed = Math.max(0, Math.min(365, targetDay - (state.lastSimDay ?? targetDay)));
      if (!elapsed) continue;
      const seasonalGrowth = season === 'spring' || season === 'summer' ? 1.18 : season === 'winter' ? 0.38 : 0.78;
      const foodSupport = state.foodIndex * 1.12 + state.waterIndex * 0.22;
      const predatorLoss = state.predatorPressure * 0.88;
      const density = state.population / Math.max(1, state.carryingCapacity ?? 4);
      const growth = (foodSupport - 0.55 - predatorLoss) * (1 - density) * seasonalGrowth;
      state.population = clamp(state.population + Math.round(growth * elapsed * 0.14), 0, state.carryingCapacity ?? 5);
      if (state.population >= 3) state.predatorPressure = clamp(state.predatorPressure + 0.0035 * elapsed, 0.015, 0.34);
      else state.predatorPressure = clamp(state.predatorPressure - 0.004 * elapsed, 0.015, 0.34);
      // Seasonal migration shifts each habitat's preferred range without changing cell identity.
      const seasonPhase = season === 'spring' ? 0 : season === 'summer' ? 1.57 : season === 'autumn' ? Math.PI : 4.71;
      state.migration = (state.migration + Math.sin(seasonPhase + state.waterIndex * 2) * 0.025 * elapsed) % (Math.PI * 2);
      state.lastSimDay = targetDay;
    }
    this.currentDay = targetDay;
  }

  predate(animalId) {
    const match = /^wildlife:(-?\d+):(-?\d+):(\d+)$/.exec(animalId);
    if (!match || this.hunted.has(animalId)) return false;
    const cx = Number(match[1]);
    const cz = Number(match[2]);
    const index = Number(match[3]);
    const cell = this._cell(cx, cz);
    if (cell.population <= 0 || index >= cell.population) return false;
    const speciesList = HABITATS[cell.biome] ?? [];
    const species = speciesList[hash2(cx * 7 + index, cz * 11 - index, this.seed ^ 0x6a31) % Math.max(1, speciesList.length)];
    if (!species || SPECIES[species].diet === 'predator') return false;
    if (cell.lastPredationDay === this.currentDay) return false;
    this.hunted.add(animalId);
    cell.population = Math.max(0, cell.population - 1);
    cell.predatorPressure = clamp(cell.predatorPressure + 0.035, 0.015, 0.34);
    cell.lastPredationDay = this.currentDay;
    this.totalPredated += 1;
    return true;
  }

  harvest(animalId) {
    const match = /^wildlife:(-?\d+):(-?\d+):(\d+)$/.exec(animalId);
    if (!match || this.hunted.has(animalId)) return null;
    const [, cxText, czText] = match;
    const cx = Number(cxText);
    const cz = Number(czText);
    const index = Number(match[3]);
    const cell = this._cell(cx, cz);
    if (cell.population <= 0 || index >= cell.population) return null;
    const habitatSpecies = HABITATS[cell.biome] ?? [];
    const seed = hash2(cx * 7 + index, cz * 11 - index, this.seed ^ 0x6a31);
    const species = habitatSpecies[seed % Math.max(1, habitatSpecies.length)];
    const reward = SPECIES[species] ?? SPECIES.hare;
    this.hunted.add(animalId);
    cell.population = Math.max(0, cell.population - 1);
    this.totalHarvested += 1;
    return { species, label: reward.label, gameMeat: reward.meat, hide: reward.hide, xp: 12 };
  }

  getPopulationSummary(x, z, radius = 900) {
    const animals = this.animalsNear(x, z, radius);
    const counts = {};
    for (const animal of animals) counts[animal.species] = (counts[animal.species] ?? 0) + 1;
    return { total: animals.length, species: counts, harvested: this.totalHarvested };
  }

  getSaveData() {
    return {
      cells: Object.fromEntries([...this.cells.entries()].map(([id, state]) => [id, { ...state }])),
      hunted: [...this.hunted],
      totalHarvested: this.totalHarvested,
      totalPredated: this.totalPredated,
      currentDay: this.currentDay,
      currentSeason: this.currentSeason,
    };
  }
}

export const WILDLIFE_SPECIES = SPECIES;
