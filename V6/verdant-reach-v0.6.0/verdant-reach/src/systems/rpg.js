export class RPGSystem {
  constructor(saved = null) {
    this.maxHealth = saved?.maxHealth ?? 100;
    this.maxStamina = saved?.maxStamina ?? 100;
    this.health = saved?.health ?? this.maxHealth;
    this.stamina = saved?.stamina ?? this.maxStamina;
    this.level = saved?.level ?? 1;
    this.xp = saved?.xp ?? 0;
    this.skillPoints = saved?.skillPoints ?? 0;
    this.skills = {
      foraging: saved?.skills?.foraging ?? 1,
      tracking: saved?.skills?.tracking ?? 1,
      endurance: saved?.skills?.endurance ?? 1,
      commerce: saved?.skills?.commerce ?? 1,
      navigation: saved?.skills?.navigation ?? 1,
      combat: saved?.skills?.combat ?? 1,
    };
    this.skillProgress = { ...(saved?.skillProgress ?? {}) };
    this.attributes = {
      vitality: saved?.attributes?.vitality ?? 1,
      agility: saved?.attributes?.agility ?? 1,
      insight: saved?.attributes?.insight ?? 1,
    };
    this.equipment = {
      weapon: saved?.equipment?.weapon ?? 'wayfarer-staff',
      armor: saved?.equipment?.armor ?? 'travel-cloak',
      tool: saved?.equipment?.tool ?? 'gathering-knife',
    };
    this.inventory = {
      moonleaf: saved?.inventory?.moonleaf ?? 0,
      echoGlass: saved?.inventory?.echoGlass ?? 0,
      silverPetal: saved?.inventory?.silverPetal ?? 0,
      rations: saved?.inventory?.rations ?? 0,
      gameMeat: saved?.inventory?.gameMeat ?? 0,
      hides: saved?.inventory?.hides ?? 0,
      timber: saved?.inventory?.timber ?? 0,
      stone: saved?.inventory?.stone ?? 0,
      fish: saved?.inventory?.fish ?? 0,
      freshWater: saved?.inventory?.freshWater ?? 0,
      wispDust: saved?.inventory?.wispDust ?? 0,
    };
    this.discoveredWaystones = new Set(saved?.discoveredWaystones ?? []);
    this.questIndex = saved?.questIndex ?? 0;
    this.questProgress = saved?.questProgress ?? 0;
    this.questComplete = saved?.questComplete ?? false;
    this.factionReputation = { ...(saved?.factionReputation ?? {}) };
  }

  get nextXp() {
    return 100 + (this.level - 1) * 75;
  }

  get currentQuest() {
    if (this.questIndex === 0) {
      return {
        id: 'greenward-errand', title: 'Greenward Errand',
        description: 'A travelling herbalist needs five sprigs of moonleaf. They grow where the old woods meet open ground.',
        objective: 'Gather moonleaf', target: 5, progress: this.inventory.moonleaf,
        reward: '90 XP · 20 silver petals',
      };
    }
    if (this.questIndex === 1) {
      return {
        id: 'echoes-on-the-road', title: 'Echoes on the Road',
        description: 'An old waystone hums beneath the moss. Find one and attune to its quiet memory.',
        objective: 'Discover a waystone', target: 1,
        progress: this.discoveredWaystones.size > 0 ? 1 : 0,
        reward: '120 XP · 1 echo glass',
      };
    }
    return {
      id: 'open-horizon', title: 'The Open Horizon',
      description: 'The Reach has more stories than any one traveller can gather. There is no fixed road now; follow the landscape and make your own map.',
      objective: 'Free exploration', target: 1, progress: 1,
      reward: 'Open-ended journey', openEnded: true,
    };
  }

  addItem(item, amount = 1) {
    if (!(item in this.inventory) || !Number.isFinite(amount)) return false;
    this.inventory[item] = Math.max(0, this.inventory[item] + Math.floor(amount));
    return true;
  }

  hasItems(cost) {
    return Object.entries(cost).every(([item, amount]) => (this.inventory[item] ?? 0) >= amount);
  }

  consumeItems(cost) {
    if (!this.hasItems(cost)) return false;
    for (const [item, amount] of Object.entries(cost)) this.inventory[item] -= amount;
    return true;
  }

  craft(recipe) {
    const recipes = {
      'trail-ration': { cost: { gameMeat: 1, moonleaf: 1 }, output: { rations: 2 }, label: 'two trail rations' },
      'field-charm': { cost: { echoGlass: 1, moonleaf: 2 }, output: { silverPetal: 5 }, label: 'a field charm' },
    };
    const definition = recipes[recipe];
    if (!definition) return { ok: false, message: 'Unknown recipe.' };
    if (!this.consumeItems(definition.cost)) return { ok: false, message: 'You do not have the required materials.' };
    for (const [item, amount] of Object.entries(definition.output)) this.addItem(item, amount);
    this.awardSkill('foraging', 8);
    return { ok: true, message: `Crafted ${definition.label}.` };
  }

  equip(slot, item) {
    if (!['weapon', 'armor', 'tool'].includes(slot) || typeof item !== 'string') return false;
    this.equipment[slot] = item;
    return true;
  }

  awardSkill(skill, amount = 1) {
    if (!(skill in this.skills) || !Number.isFinite(amount) || amount <= 0) return false;
    const total = (this.skillProgress[skill] ?? 0) + amount;
    const threshold = this.skills[skill] * 40;
    if (total >= threshold && this.skills[skill] < 10) {
      this.skills[skill] += 1;
      this.skillProgress[skill] = total - threshold;
    } else {
      this.skillProgress[skill] = this.skills[skill] >= 10 ? 0 : total;
    }
    return true;
  }

  spendSkillPoint(skill) {
    if (!(skill in this.skills)) return { ok: false, message: 'That skill does not exist.' };
    if (this.skillPoints < 1) return { ok: false, message: 'You do not have an unspent skill point.' };
    if (this.skills[skill] >= 10) return { ok: false, message: 'That skill has reached its current training limit.' };
    this.skillPoints -= 1;
    this.skills[skill] += 1;
    this.skillProgress[skill] = 0;
    return { ok: true, message: `${skill[0].toUpperCase()}${skill.slice(1)} increased to ${this.skills[skill]}.` };
  }

  addMoonleaf(amount = 1) {
    this.addItem('moonleaf', amount);
    this.awardSkill('foraging', 5);
    return this.advanceQuests();
  }

  attuneWaystone(id) {
    if (this.discoveredWaystones.has(id)) return { first: false, completed: [] };
    this.discoveredWaystones.add(id);
    this.awardSkill('navigation', 12);
    const progression = this.advanceQuests();
    return { first: true, completed: progression.completed };
  }

  advanceQuests() {
    const completed = [];
    while (true) {
      if (this.questIndex === 0 && this.inventory.moonleaf >= 5) {
        this.addXp(90);
        this.inventory.silverPetal += 20;
        completed.push({ title: 'Greenward Errand', unlocked: 'Echoes on the Road' });
        this.questIndex = 1;
        continue;
      }
      if (this.questIndex === 1 && this.discoveredWaystones.size > 0) {
        this.addXp(120);
        this.inventory.echoGlass += 1;
        completed.push({ title: 'Echoes on the Road', unlocked: 'The Open Horizon' });
        this.questIndex = 2;
        continue;
      }
      break;
    }
    return { completed };
  }

  addXp(amount) {
    this.xp += amount;
    let leveled = 0;
    while (this.xp >= this.nextXp) {
      this.xp -= this.nextXp;
      this.level += 1;
      this.skillPoints += 1;
      this.maxHealth += 8;
      this.maxStamina += 5;
      this.health = this.maxHealth;
      this.stamina = this.maxStamina;
      leveled += 1;
    }
    return leveled;
  }

  getSaveData() {
    return {
      health: this.health, stamina: this.stamina, level: this.level, xp: this.xp,
      skillPoints: this.skillPoints, skills: { ...this.skills }, skillProgress: { ...this.skillProgress },
      attributes: { ...this.attributes }, equipment: { ...this.equipment },
      inventory: { ...this.inventory }, discoveredWaystones: [...this.discoveredWaystones],
      questIndex: this.questIndex, questProgress: this.questProgress, questComplete: this.questComplete,
      maxHealth: this.maxHealth, maxStamina: this.maxStamina, factionReputation: { ...this.factionReputation },
    };
  }
}
