const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Survival-only needs. Time is real simulation seconds, not frame count. */
export class WorldNeedsSystem {
  constructor(saved = null) {
    this.hunger = clamp(Number(saved?.hunger ?? 100), 0, 100);
    this.thirst = clamp(Number(saved?.thirst ?? 100), 0, 100);
    this.elapsed = Math.max(0, Number(saved?.elapsed ?? 0));
    this.damageClock = Math.max(0, Number(saved?.damageClock ?? 0));
  }

  update(delta, rpg, weather = null, running = false) {
    const step = clamp(Number(delta) || 0, 0, 0.1);
    if (!rpg) return { hunger: this.hunger, thirst: this.thirst, damaged: 0 };
    this.elapsed += step;
    const heat = weather?.type === 'heat' ? 1 : weather?.temperature > 0.78 ? 0.35 : 0;
    this.hunger = clamp(this.hunger - step * 0.0105, 0, 100);
    this.thirst = clamp(this.thirst - step * (0.016 + heat * 0.006 + (running ? 0.002 : 0)), 0, 100);
    let damaged = 0;
    if (this.hunger <= 0 || this.thirst <= 0) {
      this.damageClock += step;
      if (this.damageClock >= 6) {
        const pulses = Math.floor(this.damageClock / 6);
        this.damageClock -= pulses * 6;
        damaged = pulses * ((this.thirst <= 0 ? 1.15 : 0) + (this.hunger <= 0 ? 0.65 : 0));
        rpg.health = Math.max(1, rpg.health - damaged);
      }
    } else this.damageClock = Math.max(0, this.damageClock - step * 2);
    return { hunger: this.hunger, thirst: this.thirst, damaged };
  }

  eat(rpg, item = 'rations') {
    const food = {
      rations: { restore: 38, label: 'travel ration' },
      gameMeat: { restore: 27, label: 'game meat' },
      fish: { restore: 30, label: 'fish' },
    }[item];
    if (!food || !rpg || (rpg.inventory[item] ?? 0) < 1) {
      return { ok: false, message: 'You do not have that food in your pack.' };
    }
    rpg.inventory[item] -= 1;
    this.hunger = clamp(this.hunger + food.restore, 0, 100);
    return { ok: true, message: `Ate ${food.label}. Hunger restored.` };
  }

  drink(rpg, amount = 42) {
    if (!rpg || (rpg.inventory.freshWater ?? 0) < 1) {
      return { ok: false, message: 'You have no fresh water in your pack.' };
    }
    rpg.inventory.freshWater -= 1;
    this.thirst = clamp(this.thirst + amount, 0, 100);
    return { ok: true, message: 'Drank fresh water. Thirst restored.' };
  }

  drinkFromSource(amount = 28) {
    this.thirst = clamp(this.thirst + amount, 0, 100);
    return { ok: true, message: 'You gathered a little fresh water.' };
  }

  refill() {
    this.hunger = 100;
    this.thirst = 100;
    this.damageClock = 0;
  }

  getSaveData() {
    return { hunger: this.hunger, thirst: this.thirst, elapsed: this.elapsed, damageClock: this.damageClock };
  }
}
