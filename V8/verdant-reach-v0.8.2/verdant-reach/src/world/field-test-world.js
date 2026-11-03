import { hashString } from '../core/random.js';

export const TEST_WORLD_SEED = 'WAYFARER-TEST-040';
export const TEST_WORLD_NAME = "Wayfarer's Circuit";

function findLandPoint(generator, target, radius = 110, options = {}) {
  const minHeight = options.minHeight ?? 2.6;
  const maxHeight = options.maxHeight ?? 62;
  const maxSlope = options.maxSlope ?? 0.48;
  let best = null;
  const step = 12;
  for (let dz = -radius; dz <= radius; dz += step) {
    for (let dx = -radius; dx <= radius; dx += step) {
      const d = Math.hypot(dx, dz);
      if (d > radius) continue;
      const x = target.x + dx;
      const z = target.z + dz;
      const sample = generator.sample(x, z, true);
      if (sample.height < minHeight || sample.height > maxHeight || sample.slope > maxSlope) continue;
      if (['desert', 'snow', 'tundra', 'alpine', 'ocean'].includes(sample.biome)) continue;
      const score = d + sample.slope * 90 + Math.abs(sample.height - 14) * 0.18;
      if (!best || score < best.score) best = { x, z, sample, score };
    }
  }
  if (best) return best;
  const sample = generator.sample(target.x, target.z, true);
  return { x: target.x, z: target.z, sample, score: Infinity };
}

function findShorePoint(generator, center, radius = 520) {
  let best = null;
  for (let dz = -radius; dz <= radius; dz += 10) {
    for (let dx = -radius; dx <= radius; dx += 10) {
      const d = Math.hypot(dx, dz);
      if (d > radius) continue;
      const x = center.x + dx;
      const z = center.z + dz;
      const sample = generator.sample(x, z, true);
      if (sample.height < -18 || sample.height > 0.4 || sample.continentalness > 0.24) continue;
      const score = d + Math.abs(sample.height) * 1.5 + sample.slope * 12;
      if (!best || score < best.score) best = { x, z, height: sample.height, score };
    }
  }
  return best ?? { x: center.x, z: center.z, height: -0.2 };
}

function makeSettlement(generator, id, name, type, point, options = {}) {
  const sample = generator.sample(point.x, point.z, true);
  const seed = hashString(id);
  const port = type === 'port';
  return {
    id,
    name,
    type,
    x: point.x,
    z: point.z,
    elevation: sample.height,
    biome: sample.biome,
    moisture: sample.moisture,
    riverAccess: Boolean(options.riverAccess),
    coastAccess: port,
    continent: 'The Wayfarer Reach',
    factionId: 'faction:wayfarer-circuit',
    seed,
    starter: false,
    basePopulation: options.population ?? (port ? 32 : type === 'market' ? 26 : 18),
    buildingCount: options.buildings ?? (port ? 8 : type === 'market' ? 7 : 6),
  };
}

export function createFieldTestLayout(generator) {
  const naturalSpawn = generator.findSpawn();
  // The test course begins on a broad, gentle forest shelf beside the lower
  // coast. The offset is deterministic and specific to this fixed test seed.
  const spawnPoint = findLandPoint(generator, { x: naturalSpawn.x - 240, z: naturalSpawn.z - 264 }, 54, { maxSlope: 0.34 });
  const spawn = { x: spawnPoint.x, z: spawnPoint.z };

  const trialsteadPoint = findLandPoint(generator, { x: naturalSpawn.x - 240, z: naturalSpawn.z }, 88, { maxSlope: 0.38 });
  const greenmeadPoint = findLandPoint(generator, { x: naturalSpawn.x + 120, z: naturalSpawn.z + 72 }, 96, { maxSlope: 0.42 });
  const shore = findShorePoint(generator, naturalSpawn, 520);
  const portPoint = findLandPoint(generator, { x: shore.x - 30, z: shore.z - 8 }, 125, { maxSlope: 0.44, minHeight: 1.8 });

  const settlements = [
    makeSettlement(generator, 'test:settlement:trialstead', 'Trialstead', 'village', trialsteadPoint, { population: 24, buildings: 7, riverAccess: true }),
    makeSettlement(generator, 'test:settlement:greenmead', 'Greenmead Market', 'market', greenmeadPoint, { population: 31, buildings: 8, riverAccess: true }),
    makeSettlement(generator, 'test:settlement:tidewatch', 'Tidewatch Port', 'port', portPoint, { population: 36, buildings: 9 }),
  ];

  const roadA = settlements[0];
  const roadB = settlements[1];
  const riverPath = [];
  const riverSteps = 34;
  for (let i = 0; i <= riverSteps; i += 1) {
    const t = i / riverSteps;
    const x = roadA.x + (roadB.x - roadA.x) * t + Math.sin(t * Math.PI * 2) * 26;
    const z = roadA.z + (roadB.z - roadA.z) * t + Math.sin(t * Math.PI) * 38;
    riverPath.push({ x, z, y: generator.heightAt(x, z) + 0.28, width: 4.2 + Math.sin(t * Math.PI) * 2.4 });
  }
  const river = {
    id: 'test:wayfarer-stream',
    path: riverPath,
    source: { x: riverPath[0].x, z: riverPath[0].z },
    terminal: 'test-lake',
    lake: {
      id: 'test:wayfarer-pool',
      x: riverPath.at(-1).x,
      z: riverPath.at(-1).z,
      y: generator.heightAt(riverPath.at(-1).x, riverPath.at(-1).z) + 0.24,
      radius: 24,
    },
  };

  const centerBetween = (a, b, t = 0.5) => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
  const wildlifeTarget = findLandPoint(generator, { x: naturalSpawn.x - 310, z: naturalSpawn.z + 250 }, 150, { maxSlope: 0.44 });
  const combatTarget = findLandPoint(generator, { x: naturalSpawn.x + 280, z: naturalSpawn.z + 250 }, 170, { maxSlope: 0.44 });
  const craftTarget = findLandPoint(generator, { x: greenmeadPoint.x + 24, z: greenmeadPoint.z - 22 }, 40, { maxSlope: 0.5 });
  const weatherTarget = findLandPoint(generator, { x: portPoint.x + 45, z: portPoint.z + 34 }, 42, { maxSlope: 0.5 });
  const roadTarget = centerBetween(roadA, roadB, 0.5);
  const horseTarget = { x: trialsteadPoint.x - 25, z: trialsteadPoint.z - 13 };

  const courseSteps = [
    { id: 'survey', title: 'Survey the Reach', hint: 'Read this region’s biome, elevation and climate.', x: spawn.x, z: spawn.z, trigger: 'visit' },
    { id: 'waystone', title: 'Attune the Waystone', hint: 'Interact with the old waystone to record a discovery.', x: spawn.x + 34, z: spawn.z + 22, trigger: 'interact' },
    { id: 'forage', title: 'Gather Moonleaf', hint: 'Collect a resource and see it enter your inventory.', x: spawn.x + 92, z: spawn.z + 74, trigger: 'interact' },
    { id: 'village', title: 'Meet the Villagers', hint: 'Speak with one of Trialstead’s residents.', x: trialsteadPoint.x, z: trialsteadPoint.z, trigger: 'action' },
    { id: 'trade', title: 'Visit the Market', hint: 'Buy or sell something at Greenmead Market.', x: greenmeadPoint.x + 7, z: greenmeadPoint.z + 5, trigger: 'action' },
    { id: 'craft', title: 'Craft a Trail Ration', hint: 'Use the supplied materials at the crafting panel.', x: craftTarget.x, z: craftTarget.z, trigger: 'action' },
    { id: 'wildlife', title: 'Study the Wildlife', hint: 'Observe or harvest an animal in the habitat clearing.', x: wildlifeTarget.x, z: wildlifeTarget.z, trigger: 'action' },
    { id: 'combat', title: 'Challenge the Test Wisp', hint: 'Defeat the wisp with Space. Your health and stamina are restored on entry.', x: combatTarget.x, z: combatTarget.z, trigger: 'action' },
    { id: 'road', title: 'Cross the Stream Road', hint: 'Reach the road crossing and inspect the bridge and cargo caravan.', x: roadTarget.x, z: roadTarget.z, trigger: 'visit' },
    { id: 'horse', title: 'Ride a Horse or Cart', hint: 'Press R beside a mount at Trialstead.', x: horseTarget.x, z: horseTarget.z, trigger: 'action' },
    { id: 'boat', title: 'Launch the Coastal Skiff', hint: 'Board the skiff at Tidewatch’s shore.', x: shore.x, z: shore.z, trigger: 'action' },
    { id: 'weather', title: 'Read the Weather', hint: 'Inspect the current weather, wind and season.', x: weatherTarget.x, z: weatherTarget.z, trigger: 'interact' },
  ];

  return {
    version: 1,
    spawn,
    settlements,
    river,
    shore,
    wildlife: { x: wildlifeTarget.x, z: wildlifeTarget.z },
    hostile: { x: combatTarget.x, z: combatTarget.z },
    courseSteps,
    settlementIds: {
      village: settlements[0].id,
      market: settlements[1].id,
      port: settlements[2].id,
    },
  };
}
