import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WorldGenerator } from '../src/world/terrain.js';
import { WorldIntelligence } from '../src/world/world-intelligence.js';
import { buildFreeCityPlan, buildRuinedCastlePlan, isCityGateWallPanelGap } from '../src/world/settlement-layouts.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('free city is a large deterministic multi-district plan with accurate building metadata', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  const intelligence = new WorldIntelligence(generator, spawn);
  const city = intelligence.regionalFreeCity;
  assert.ok(city, 'the starter region should have a suitable chartered city');
  const plan = buildFreeCityPlan(city, generator);
  const repeated = buildFreeCityPlan(city, generator);
  assert.equal(plan, repeated, 'repeated rendering requests should reuse the cached deterministic city plan');
  assert.equal(city.urbanRadius, 510);
  assert.equal(city.buildingCount, plan.buildings.length + plan.landmarks.length);
  assert.ok(plan.buildings.length >= 780, `expected a dense city, got ${plan.buildings.length} homes`);
  assert.equal(plan.landmarks.length, 8);
  assert.equal(plan.gates.length, 4);
  assert.equal(plan.towers.length, 10);
  assert.ok(plan.roads.length >= 100);
  assert.ok(plan.fields.length >= 10 && plan.fields.length <= 14, `expected suitable agricultural plots, got ${plan.fields.length}`);
});

test('abandoned castle plan has two wards, barbican, moat and a character-scale keep', () => {
  const site = { id: 'ruin:test', seed: 0x51a7, x: 1200, z: -850 };
  const plan = buildRuinedCastlePlan(site);
  assert.deepEqual(plan, buildRuinedCastlePlan(site));
  assert.ok(plan.radius >= 230);
  assert.ok(plan.outerWall.length >= 24);
  assert.ok(plan.innerWall.length >= 16);
  assert.ok(plan.barbican.length >= 10);
  assert.ok(plan.towers.length >= 12);
  assert.ok(plan.rubble.length >= 60);
  assert.ok(plan.dryMoatRadius >= 215);
  assert.ok(plan.keep.width >= 55 && plan.keep.depth >= 50 && plan.keep.height >= 45);
  assert.ok(plan.gate.z - site.z > 180);
});

test('new global landform fields produce connected uplands, ravines, cliffs and fertile lowlands', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const maxima = { mountain: 0, ravine: 0, cliff: 0, meadow: 0, field: 0, floodplain: 0 };
  let mountainSamples = 0;
  let ravineSamples = 0;
  let cliffSamples = 0;
  let fieldSamples = 0;
  for (let z = -14000; z <= 14000; z += 700) {
    for (let x = -14000; x <= 14000; x += 700) {
      const sample = generator.sample(x, z);
      const values = {
        mountain: sample.mountainIntensity,
        ravine: sample.ravineIntensity,
        cliff: sample.cliffIntensity,
        meadow: sample.meadowPotential,
        field: sample.fieldSuitability,
        floodplain: sample.floodplain,
      };
      for (const [key, value] of Object.entries(values)) {
        assert.ok(Number.isFinite(value), `${key} must remain finite`);
        maxima[key] = Math.max(maxima[key], value);
      }
      if (sample.mountainIntensity > 0.45) mountainSamples += 1;
      if (sample.ravineIntensity > 0.38) ravineSamples += 1;
      if (sample.cliffIntensity > 0.48) cliffSamples += 1;
      if (sample.fieldSuitability > 0.5 && sample.height > 4) fieldSamples += 1;
    }
  }
  assert.ok(maxima.mountain > 0.8 && mountainSamples > 100);
  assert.ok(maxima.ravine > 0.5 && ravineSamples > 0);
  assert.ok(maxima.cliff > 0.5 && cliffSamples > 0);
  assert.ok(maxima.meadow > 0.8 && fieldSamples > 100);
  assert.ok(maxima.floodplain > 0.3);
});

test('Creative teleport destinations include major settlements, castles, natural terrain and water features', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  const intelligence = new WorldIntelligence(generator, spawn);
  const destinations = intelligence.teleportDestinationsNear(spawn.x, spawn.z, 18000);
  const categories = new Set(destinations.map((destination) => destination.category));
  for (const category of [
    'Free Cities', 'Ports', 'Villages', 'Abandoned Castles',
    'Mountain Overlooks', 'Ravines & Gorges', 'Cliff Faces',
    'Grasslands & Fields', 'River Valleys', 'Waterfalls & Lakes',
  ]) assert.ok(categories.has(category), `missing teleport category: ${category}`);
  assert.ok(destinations.length > 8);
  assert.ok(destinations.every((destination) => Number.isFinite(destination.x) && Number.isFinite(destination.z) && destination.distance <= 18000));
  assert.deepEqual(destinations.map((item) => item.distance), [...destinations].map((item) => item.distance).sort((a, b) => a - b));
});

test('resuming a saved world keeps regional landmarks anchored to its original world start', () => {
  const source = read('src/main.js');
  assert.match(source, /new WorldIntelligence\(generator,\s*worldStartPosition\s*\?\?\s*spawn/);
  const generator = new WorldGenerator('PERSISTENT-REALM-ANCHOR');
  const worldStart = generator.findSpawn();
  const firstLoad = new WorldIntelligence(generator, worldStart);
  const distantPlayer = { x: worldStart.x + 42000, z: worldStart.z - 37000 };
  const resumedLoad = new WorldIntelligence(generator, worldStart);
  const incorrectlyReanchoredLoad = new WorldIntelligence(generator, distantPlayer);
  for (const key of ['starterSettlement', 'regionalFreeCity', 'regionalRuin']) {
    assert.equal(resumedLoad[key]?.x, firstLoad[key]?.x, `${key} x should remain stable after resume`);
    assert.equal(resumedLoad[key]?.z, firstLoad[key]?.z, `${key} z should remain stable after resume`);
  }
  assert.notDeepEqual(
    { x: incorrectlyReanchoredLoad.regionalFreeCity?.x, z: incorrectlyReanchoredLoad.regionalFreeCity?.z },
    { x: firstLoad.regionalFreeCity?.x, z: firstLoad.regionalFreeCity?.z },
    'using the saved player position would incorrectly relocate regional landmarks',
  );
});

test('Wayfarer Circuit keeps its fixed tutorial landing and nearby major landmarks', () => {
  const generator = new WorldGenerator('WAYFARER-TEST-040');
  const spawn = generator.findSpawn();
  assert.deepEqual(spawn, { x: -786, z: -251, height: generator.heightAt(-786, -251) });
  const intelligence = new WorldIntelligence(generator, spawn);
  assert.ok(intelligence.regionalFreeCity, 'the tutorial region should retain a nearby free city');
  assert.ok(Math.hypot(intelligence.regionalFreeCity.x - spawn.x, intelligence.regionalFreeCity.z - spawn.z) < 5000);
  assert.ok(intelligence.regionalRuin, 'the tutorial region should retain a nearby abandoned castle');
});

test('large realm and wildland rendering is wired into streamed actors and chunk meshes', () => {
  const actors = read('src/world/world-actors.js');
  const models = read('src/world/settlement-models.js');
  const chunks = read('src/world/chunk.js');
  assert.match(actors, /createFreeCityModel/);
  assert.match(actors, /createRuinedCastleModel/);
  assert.match(models, /buildFreeCityPlan/);
  assert.match(models, /buildRuinedCastlePlan/);
  assert.match(chunks, /outcrops/);
  assert.match(chunks, /fieldSuitability/);
  assert.match(chunks, /floodplain|meadowPotential/);
});

test('Creative teleport dropdown exposes grouped destinations and a real action handler', () => {
  const ui = read('src/ui/interface.js');
  const main = read('src/main.js');
  assert.match(ui, /id="creative-destination"/);
  assert.match(ui, /destinationGroups/);
  assert.match(ui, /data-creative-action="teleport-destination"/);
  assert.match(main, /teleportDestinationsNear\(player\.position\.x, player\.position\.z, 18000\)/);
  assert.match(main, /action === 'teleport-destination'/);
  assert.match(main, /findTeleportArrival\(destination\)/);
});

function orientedFootprintsOverlap(a, b) {
  const axes = (yaw) => {
    const c = Math.cos(yaw ?? 0);
    const s = Math.sin(yaw ?? 0);
    return [[c, -s], [s, c]];
  };
  const aa = axes(a.yaw);
  const bb = axes(b.yaw);
  const ah = [a.width * 0.5, a.depth * 0.5];
  const bh = [b.width * 0.5, b.depth * 0.5];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const axis of [...aa, ...bb]) {
    const center = Math.abs(dx * axis[0] + dz * axis[1]);
    const ra = ah[0] * Math.abs(aa[0][0] * axis[0] + aa[0][1] * axis[1])
      + ah[1] * Math.abs(aa[1][0] * axis[0] + aa[1][1] * axis[1]);
    const rb = bh[0] * Math.abs(bb[0][0] * axis[0] + bb[0][1] * axis[1])
      + bh[1] * Math.abs(bb[1][0] * axis[0] + bb[1][1] * axis[1]);
    if (center >= ra + rb) return false;
  }
  return true;
}

test('free-city houses clear civic landmark footprints, street corridors, and neighbouring buildings', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  const intelligence = new WorldIntelligence(generator, spawn);
  const city = intelligence.regionalFreeCity;
  assert.ok(city);
  assert.ok(intelligence._isCityFootprintBuildable(city.x, city.z));
  const plan = buildFreeCityPlan(city, generator);
  assert.ok(plan.buildings.length >= 780, `collision-free urban blocks retained ${plan.buildings.length} houses`);
  const houses = plan.buildings.map((house) => ({
    ...house, width: house.width + 1.2, depth: house.depth + 1.2,
  }));
  const landmarks = plan.landmarks.map((feature) => ({
    x: feature.x, z: feature.z, width: (feature.collisionWidth ?? feature.width) + 7, depth: (feature.collisionDepth ?? feature.depth) + 7, yaw: feature.yaw,
  }));
  const roads = plan.roads.map((road) => {
    const dx = road.to.x - road.from.x;
    const dz = road.to.z - road.from.z;
    return {
      x: (road.from.x + road.to.x) * 0.5,
      z: (road.from.z + road.to.z) * 0.5,
      width: road.width + 1.2,
      depth: Math.hypot(dx, dz) + 1.2,
      yaw: Math.atan2(dx, dz),
    };
  });
  for (let i = 0; i < houses.length; i += 1) {
    const house = houses[i];
    for (const landmark of landmarks) assert.equal(orientedFootprintsOverlap(house, landmark), false, `${plan.buildings[i].id} overlaps ${landmark}`);
    for (const road of roads) assert.equal(orientedFootprintsOverlap(house, road), false, `${plan.buildings[i].id} overlaps a road`);
    for (let j = 0; j < i; j += 1) assert.equal(orientedFootprintsOverlap(house, houses[j]), false, `${plan.buildings[i].id} overlaps ${plan.buildings[j].id}`);
  }
});

test('free-city streets connect to all gates and keep clear of civic landmarks and wall towers', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator, generator.findSpawn());
  const city = intelligence.regionalFreeCity;
  const plan = buildFreeCityPlan(city, generator);
  assert.equal(plan.roads.length, 104);
  for (let i = 0; i < 4; i += 1) {
    const gate = plan.gates[i];
    assert.ok(Math.hypot(plan.roads[i].to.x - gate.x, plan.roads[i].to.z - gate.z) < 0.01, `${gate.name} needs a connected approach road`);
    assert.ok(Math.min(...plan.towers.map((tower) => Math.hypot(tower.x - gate.x, tower.z - gate.z))) > 50, `${gate.name} must not overlap a wall tower`);
  }
  const roadBoxes = plan.roads.map((road) => {
    const dx = road.to.x - road.from.x;
    const dz = road.to.z - road.from.z;
    return { x: (road.from.x + road.to.x) * 0.5 - city.x, z: (road.from.z + road.to.z) * 0.5 - city.z,
      width: road.width + 1.2, depth: Math.hypot(dx, dz) + 1.2, yaw: Math.atan2(dx, dz) };
  });
  const landmarkBoxes = plan.landmarks.map((item) => ({ x: item.x - city.x, z: item.z - city.z,
    width: item.width + 7, depth: item.depth + 7, yaw: item.yaw }));
  for (const road of roadBoxes) for (const landmark of landmarkBoxes) {
    assert.equal(orientedFootprintsOverlap(road, landmark), false, 'streets must not pass through civic buildings');
  }
  for (let i = 0; i < landmarkBoxes.length; i += 1) for (let j = 0; j < i; j += 1) {
    assert.equal(orientedFootprintsOverlap(landmarkBoxes[i], landmarkBoxes[j]), false, 'major civic buildings must not overlap');
  }
});

test('regional trade roads connect free cities through their generated gates, not their centres', () => {
  for (const seed of ['EMBERFALL', 'WILLOW', 'WAYFARER-TEST-040', 'ASHEN-COAST', 'COLDCOAST']) {
    const generator = new WorldGenerator(seed);
    const intelligence = new WorldIntelligence(generator, generator.findSpawn());
    const city = intelligence.regionalFreeCity;
    assert.ok(city, `${seed} should have a regional free city for gate-road validation`);
    const target = { id: 'audit:trade-destination', name: 'Trade Destination', type: 'village', x: city.x + 1800, z: city.z + 120 };
    const link = intelligence.roadLinksFor([city, target], 3600)[0];
    assert.ok(link, `${seed} should connect the city to a nearby settlement`);
    const cityIsStart = link.a.id === city.id;
    const gateEndpoint = cityIsStart ? link.path[0] : link.path.at(-1);
    const outerEndpoint = cityIsStart ? link.path[1] : link.path.at(-2);
    const plan = buildFreeCityPlan(city, generator);
    const nearestGate = plan.gates.reduce((best, gate) => {
      const d = Math.hypot(gate.x - gateEndpoint.x, gate.z - gateEndpoint.z);
      return !best || d < best.distance ? { gate, distance: d } : best;
    }, null);
    assert.ok(nearestGate.distance < 0.01, `${seed} regional road should terminate at an actual gate centre`);
    const targetDirectionLength = Math.hypot(target.x - city.x, target.z - city.z);
    const expectedGate = plan.gates.reduce((best, gate) => {
      const gx = (gate.x - city.x) / Math.hypot(gate.x - city.x, gate.z - city.z);
      const gz = (gate.z - city.z) / Math.hypot(gate.x - city.x, gate.z - city.z);
      const alignment = gx * (target.x - city.x) / targetDirectionLength + gz * (target.z - city.z) / targetDirectionLength;
      return !best || alignment > best.alignment ? { gate, alignment } : best;
    }, null);
    assert.equal(nearestGate.gate.name, expectedGate.gate.name, `${seed} route should use the gate facing its destination`);
    assert.ok(Math.hypot(gateEndpoint.x - city.x, gateEndpoint.z - city.z) > 480, `${seed} road must not terminate at the city centre`);
    const radialX = gateEndpoint.x - city.x;
    const radialZ = gateEndpoint.z - city.z;
    const outwardDot = (outerEndpoint.x - gateEndpoint.x) * radialX + (outerEndpoint.z - gateEndpoint.z) * radialZ;
    assert.ok(outwardDot > 0, `${seed} external route must leave through the outside of its gate`);
    assert.equal(cityIsStart ? link.gateA : link.gateB, nearestGate.gate.name);
  }
});

test('regional roads can connect two free cities gate to gate', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator, generator.findSpawn());
  const firstCity = intelligence.regionalFreeCity;
  assert.ok(firstCity);
  const secondCity = {
    id: 'audit:second-free-city', name: 'Far Borough', type: 'freeCity',
    x: firstCity.x + 2450, z: firstCity.z + 360, urbanRadius: 510,
  };
  const link = intelligence.roadLinksFor([firstCity, secondCity], 3600)[0];
  assert.ok(link);
  assert.ok(link.gateA && link.gateB, 'both ends of a city-to-city route must use a gate');
  const endpointBySettlement = new Map([
    [link.a.id, link.path[0]],
    [link.b.id, link.path.at(-1)],
  ]);
  const firstPlan = buildFreeCityPlan(firstCity, generator);
  const secondPlan = buildFreeCityPlan(secondCity, generator);
  const firstEndpoint = endpointBySettlement.get(firstCity.id);
  const secondEndpoint = endpointBySettlement.get(secondCity.id);
  assert.ok(firstEndpoint && secondEndpoint);
  assert.ok(firstPlan.gates.some((gate) => Math.hypot(gate.x - firstEndpoint.x, gate.z - firstEndpoint.z) < 0.01));
  assert.ok(secondPlan.gates.some((gate) => Math.hypot(gate.x - secondEndpoint.x, gate.z - secondEndpoint.z) < 0.01));
});

test('city wall openings are gate-sized instead of removing whole polygon edges', () => {
  const plan = buildFreeCityPlan({ id: 'free-city:gate-test', seed: 91, x: 0, z: 0 });
  for (const gate of plan.gates) {
    const tx = Math.cos(gate.angle);
    const tz = -Math.sin(gate.angle);
    assert.equal(isCityGateWallPanelGap({ x: gate.x + tx * 8, z: gate.z + tz * 8 }, gate), true);
    assert.equal(isCityGateWallPanelGap({ x: gate.x + tx * 14, z: gate.z + tz * 14 }, gate), false);
  }
});

test('city farms are relocated to dry, gently sloping ground and its wall ring stays above sea level', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  const intelligence = new WorldIntelligence(generator, spawn);
  const city = intelligence.regionalFreeCity;
  assert.ok(city, 'EMBERFALL should retain a regional free city');
  const plan = buildFreeCityPlan(city, generator);
  assert.ok(plan.fields.length >= 10, `expected usable fields, got ${plan.fields.length}`);
  for (const field of plan.fields) {
    const sample = generator.sample(field.x, field.z, true);
    assert.ok(sample.height > 3.4, `field was placed below the dry-ground threshold: ${sample.height}`);
    assert.ok(sample.slope <= 0.62, `field slope is too steep: ${sample.slope}`);
  }
  for (let i = 0; i < plan.fields.length; i += 1) {
    const field = plan.fields[i];
    const footprint = { x: field.x - city.x, z: field.z - city.z, width: field.width, depth: field.length, yaw: field.angle };
    for (let j = 0; j < i; j += 1) {
      const other = plan.fields[j];
      assert.equal(orientedFootprintsOverlap(footprint, { x: other.x - city.x, z: other.z - city.z, width: other.width, depth: other.length, yaw: other.angle }), false, 'farm plots must not overlap');
    }
  }
  for (const point of plan.wall) assert.ok(generator.heightAt(point.x, point.z) > 0.05, 'wall panels must not be placed below sea level');
});

test('regional ruined castles are selected for the full fortress footprint and publish the correct radius', () => {
  for (const seed of ['EMBERFALL', 'WILLOW', 'WAYFARER-TEST-040', 'COLDCOAST']) {
    const generator = new WorldGenerator(seed);
    const intelligence = new WorldIntelligence(generator, generator.findSpawn());
    const ruin = intelligence.regionalRuin;
    assert.ok(ruin, `${seed} should have a regional ruin`);
    assert.equal(ruin.footprintRadius, 238);
    const stats = intelligence._castleFootprintStats(ruin.x, ruin.z, ruin.id);
    assert.ok(stats, `${seed} castle footprint should fit land and relief limits`);
    assert.ok(stats.relief <= 55);
    assert.ok(stats.maxSlope <= 1.5);
  }
});

test('Creative teleport returns the nearest representative natural landmark of each type', () => {
  const generator = new WorldGenerator('TELEPORT-AUDIT');
  const intelligence = new WorldIntelligence(generator, generator.findSpawn());
  intelligence.settlementsNear = () => [];
  intelligence.ruinsInBounds = () => [];
  intelligence.riversInBounds = () => [];
  const special = new Map([
    ['0:-18000', { height: 90, slope: 0.1, biome: 'alpine', mountainIntensity: 0.8, ravineIntensity: 0, cliffIntensity: 0, fieldSuitability: 0.1 }],
    ['-8000:-16000', { height: 42, slope: 0.1, biome: 'forest', mountainIntensity: 0, ravineIntensity: 0.8, cliffIntensity: 0, fieldSuitability: 0.1 }],
    ['-6000:-16000', { height: 38, slope: 0.1, biome: 'forest', mountainIntensity: 0, ravineIntensity: 0, cliffIntensity: 0.8, fieldSuitability: 0.1 }],
    ['-4000:-16000', { height: 8, slope: 0.05, biome: 'grassland', mountainIntensity: 0, ravineIntensity: 0, cliffIntensity: 0, fieldSuitability: 0.9 }],
    ['0:-2000', { height: 85, slope: 0.1, biome: 'alpine', mountainIntensity: 0.9, ravineIntensity: 0, cliffIntensity: 0, fieldSuitability: 0.1 }],
  ]);
  generator.sample = (x, z) => special.get(`${Math.round(x)}:${Math.round(z)}`) ?? {
    height: 42, slope: 0.1, biome: 'forest', mountainIntensity: 0,
    ravineIntensity: 0, cliffIntensity: 0, fieldSuitability: 0.1,
  };
  const destinations = intelligence.teleportDestinationsNear(0, 0, 18000);
  const mountain = destinations.find((item) => item.category === 'Mountain Overlooks');
  assert.ok(mountain);
  assert.equal(mountain.distance, 2000, 'the nearest mountain sample must win even if a farther sample was discovered first');
  assert.equal(mountain.x, 0);
  assert.equal(mountain.z, -2000);
});

test('teleport destination search returns a waterfall and a lake independently', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const spawn = generator.findSpawn();
  const intelligence = new WorldIntelligence(generator, spawn);
  intelligence.riversInBounds = () => [{
    id: 'test-waterway',
    path: [{ x: spawn.x + 90, z: spawn.z + 40 }],
    waterfalls: [{ x: spawn.x + 125, z: spawn.z + 40 }],
    lake: { x: spawn.x + 250, z: spawn.z + 40 },
  }];
  const destinations = intelligence.teleportDestinationsNear(spawn.x, spawn.z, 900);
  assert.ok(destinations.some((item) => item.type === 'waterfall'));
  assert.ok(destinations.some((item) => item.type === 'lake'));
});

test('large city roads, farms, castle walls and moat are built from terrain-conforming panels', () => {
  const models = read('src/world/settlement-models.js');
  assert.match(models, /buildDrapedRoadData/);
  assert.match(models, /maxSpacing: 4/);
  assert.match(models, /Math\.ceil\(field\.length \/ 10\)/);
  assert.match(models, /addTerrainWall/);
  assert.match(models, /keepWalls\.forEach/);
  assert.match(models, /moatSegments = 128/);
  assert.match(models, /transform\.pitch/);
});

test('the rendered wall segmentation leaves exactly one narrow passage at each of the four gates', () => {
  const generator = new WorldGenerator('EMBERFALL');
  const intelligence = new WorldIntelligence(generator, generator.findSpawn());
  const city = intelligence.regionalFreeCity;
  const plan = buildFreeCityPlan(city, generator);
  const skippedPanelsByGate = plan.gates.map(() => []);
  for (let i = 0; i < plan.wall.length; i += 1) {
    const a = plan.wall[i];
    const b = plan.wall[(i + 1) % plan.wall.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const panels = Math.max(1, Math.ceil(length / 9));
    for (let panel = 0; panel < panels; panel += 1) {
      const t = (panel + 0.5) / panels;
      const midpoint = { x: a.x + dx * t, z: a.z + dz * t };
      plan.gates.forEach((gate, gateIndex) => {
        if (isCityGateWallPanelGap(midpoint, gate)) skippedPanelsByGate[gateIndex].push(midpoint);
      });
    }
  }
  for (let gateIndex = 0; gateIndex < plan.gates.length; gateIndex += 1) {
    const gate = plan.gates[gateIndex];
    const skipped = skippedPanelsByGate[gateIndex];
    assert.equal(skipped.length, 2, `${gate.name} should leave two short wall panels open, not an entire polygon edge`);
    assert.ok(skipped.every((point) => Math.hypot(point.x - gate.x, point.z - gate.z) <= 9.5), `${gate.name} opening should stay close to the gate centre`);
  }
});

test('representative procedural seeds retain accurate free-city building and field metadata', () => {
  const seeds = ['EMBERFALL', 'WILLOW', 'WAYFARER-TEST-040', 'ASHEN-COAST', 'NORTHSTAR', 'RIVER-KINGDOM', 'ALDERMERE', 'SILVERFEN', 'COLDCOAST'];
  for (const seed of seeds) {
    const generator = new WorldGenerator(seed);
    const intelligence = new WorldIntelligence(generator, generator.findSpawn());
    const city = intelligence.regionalFreeCity;
    assert.ok(city, `${seed} should have a suitable nearby regional free city`);
    const plan = buildFreeCityPlan(city, generator);
    assert.ok(plan.buildings.length >= 780 && plan.buildings.length <= 1000, `${seed} generated ${plan.buildings.length} residential buildings`);
    assert.equal(city.buildingCount, plan.buildings.length + plan.landmarks.length);
    assert.ok(plan.fields.length >= 10 && plan.fields.length <= 14, `${seed} generated ${plan.fields.length} usable agricultural plots`);
  }
});

test('Three.js runtime uses current Timer and shadow-map APIs without deprecated Clock warnings', () => {
  const source = read('src/main.js');
  assert.match(source, /renderer\.shadowMap\.type\s*=\s*THREE\.PCFShadowMap/);
  assert.match(source, /const clock\s*=\s*new THREE\.Timer\(\)/);
  assert.match(source, /clock\.connect\(document\)/);
  assert.match(source, /function animate\(timestamp\)[\s\S]*?clock\.update\(timestamp\)[\s\S]*?clock\.getDelta\(\)/);
  assert.doesNotMatch(source, /THREE\.Clock|THREE\.PCFSoftShadowMap/);
});
