export class RPGSystem {
  constructor(saved = null) {
    this.maxHealth = saved?.maxHealth ?? 100;
    this.maxStamina = saved?.maxStamina ?? 100;
    this.health = saved?.health ?? this.maxHealth;
    this.stamina = saved?.stamina ?? this.maxStamina;
    this.level = saved?.level ?? 1;
    this.xp = saved?.xp ?? 0;
    this.inventory = {
      moonleaf: saved?.inventory?.moonleaf ?? 0,
      echoGlass: saved?.inventory?.echoGlass ?? 0,
      silverPetal: saved?.inventory?.silverPetal ?? 0,
    };
    this.discoveredWaystones = new Set(saved?.discoveredWaystones ?? []);
    this.questIndex = saved?.questIndex ?? 0;
    this.questProgress = saved?.questProgress ?? 0;
    this.questComplete = saved?.questComplete ?? false;
  }

  get nextXp() {
    return 100 + (this.level - 1) * 75;
  }

  get currentQuest() {
    if (this.questIndex === 0) {
      return {
        id: 'greenward-errand',
        title: 'Greenward Errand',
        description: 'A travelling herbalist needs five sprigs of moonleaf. They grow where the old woods meet open ground.',
        objective: 'Gather moonleaf',
        target: 5,
        progress: this.inventory.moonleaf,
        reward: '90 XP · 20 silver petals',
      };
    }
    if (this.questIndex === 1) {
      return {
        id: 'echoes-on-the-road',
        title: 'Echoes on the Road',
        description: 'An old waystone hums beneath the moss. Find one and attune to its quiet memory.',
        objective: 'Discover a waystone',
        target: 1,
        progress: this.discoveredWaystones.size > 0 ? 1 : 0,
        reward: '120 XP · 1 echo glass',
      };
    }
    return {
      id: 'open-horizon',
      title: 'The Open Horizon',
      description: 'The Reach has more stories than any one traveller can gather. There is no fixed road now; follow the landscape and make your own map.',
      objective: 'Free exploration',
      target: 1,
      progress: 1,
      reward: 'Open-ended journey',
      openEnded: true,
    };
  }

  addMoonleaf() {
    this.inventory.moonleaf += 1;
    return this.advanceQuests();
  }

  attuneWaystone(id) {
    if (this.discoveredWaystones.has(id)) return { first: false, completed: [] };
    this.discoveredWaystones.add(id);
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
      health: this.health,
      stamina: this.stamina,
      level: this.level,
      xp: this.xp,
      inventory: { ...this.inventory },
      discoveredWaystones: [...this.discoveredWaystones],
      questIndex: this.questIndex,
      questProgress: this.questProgress,
      questComplete: this.questComplete,
      maxHealth: this.maxHealth,
      maxStamina: this.maxStamina,
    };
  }
}
