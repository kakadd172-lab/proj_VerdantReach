import { hashString, random2 } from '../core/random.js';

const freeCityPlanCache = new WeakMap();

function seedOf(record) {
  return Number(record?.seed) >>> 0 || hashString(record?.id ?? record?.name ?? 'verdant-layout');
}

function polygonPoints(cx, cz, count, radius, seed, jitter = 0.12) {
  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2;
    const variation = 1 + (random2(index * 17 + 3, index * 31 - 9, seed) - 0.5) * jitter * 2;
    return { x: cx + Math.cos(angle) * radius * variation, z: cz + Math.sin(angle) * radius * variation, angle };
  });
}

export function isCityGateWallPanelGap(point, gate, halfWidth = 10, radialTolerance = 25) {
  const dx = point.x - gate.x;
  const dz = point.z - gate.z;
  const tangent = dx * Math.cos(gate.angle) - dz * Math.sin(gate.angle);
  return Math.abs(tangent) <= halfWidth && Math.hypot(dx, dz) <= radialTolerance;
}

function obbAxes(yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [[c, -s], [s, c]];
}

function overlapsFootprints(a, b, padding = 0) {
  const axesA = obbAxes(a.yaw ?? 0);
  const axesB = obbAxes(b.yaw ?? 0);
  const halfA = [(a.width + padding * 2) * 0.5, (a.depth + padding * 2) * 0.5];
  const halfB = [(b.width + padding * 2) * 0.5, (b.depth + padding * 2) * 0.5];
  const deltaX = b.x - a.x;
  const deltaZ = b.z - a.z;
  for (const axis of [...axesA, ...axesB]) {
    const centerDistance = Math.abs(deltaX * axis[0] + deltaZ * axis[1]);
    const radiusA = halfA[0] * Math.abs(axesA[0][0] * axis[0] + axesA[0][1] * axis[1])
      + halfA[1] * Math.abs(axesA[1][0] * axis[0] + axesA[1][1] * axis[1]);
    const radiusB = halfB[0] * Math.abs(axesB[0][0] * axis[0] + axesB[0][1] * axis[1])
      + halfB[1] * Math.abs(axesB[1][0] * axis[0] + axesB[1][1] * axis[1]);
    if (centerDistance >= radiusA + radiusB) return false;
  }
  return true;
}

function makeRoadNetwork(x, z, seed, gates) {
  const roads = [];
  // Four primary avenues terminate at the actual gate centres. Four diagonal
  // streets connect the inner market district to the first outer ring without
  // punching through the curtain wall at places where there is no gate.
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2;
    const gate = gates[i];
    roads.push({
      from: { x: x + Math.cos(angle) * 48, z: z + Math.sin(angle) * 48 },
      to: { x: gate.x, z: gate.z },
      width: i % 2 ? 11 : 15,
    });
  }
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    roads.push({
      from: { x: x + Math.cos(angle) * 48, z: z + Math.sin(angle) * 48 },
      to: { x: x + Math.cos(angle) * 326, z: z + Math.sin(angle) * 326 },
      width: 11,
    });
  }
  for (const ringRadius of [160, 330]) {
    const ring = polygonPoints(x, z, 48, ringRadius, seed ^ Math.round(ringRadius * 31), 0.018);
    for (let i = 0; i < ring.length; i += 1) {
      roads.push({ from: ring[i], to: ring[(i + 1) % ring.length], width: ringRadius < 200 ? 8 : 10 });
    }
  }
  return roads;
}

function roadFootprints(roads, originX, originZ) {
  return roads.map((road) => {
    const dx = road.to.x - road.from.x;
    const dz = road.to.z - road.from.z;
    return {
      x: (road.from.x + road.to.x) * 0.5 - originX,
      z: (road.from.z + road.to.z) * 0.5 - originZ,
      width: road.width + 1.2,
      depth: Math.hypot(dx, dz) + 1.2,
      yaw: Math.atan2(dx, dz),
    };
  });
}


function footprintHeightRange(item, generator) {
  let min = Infinity;
  let max = -Infinity;
  const c = Math.cos(item.yaw ?? 0);
  const s = Math.sin(item.yaw ?? 0);
  const samples = [[0, 0],
    [-item.width * 0.5, -item.depth * 0.5],
    [-item.width * 0.5, item.depth * 0.5],
    [item.width * 0.5, -item.depth * 0.5],
    [item.width * 0.5, item.depth * 0.5],
  ];
  for (const [lx, lz] of samples) {
    const px = item.x + c * lx + s * lz;
    const pz = item.z - s * lx + c * lz;
    const height = generator.heightAt(px, pz);
    min = Math.min(min, height);
    max = Math.max(max, height);
  }
  return max - min;
}

function findFieldSite(targetX, targetZ, angle, generator, centerHeight, width, length) {
  if (!generator) return { x: targetX, z: targetZ };
  let best = null;
  // Search a deterministic 160 m square around the nominal plot. Each candidate
  // must be dry and moderate-slope across all four plot corners, not just at its centre.
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let iz = -4; iz <= 4; iz += 1) {
    for (let ix = -4; ix <= 4; ix += 1) {
      const px = targetX + ix * 20;
      const pz = targetZ + iz * 20;
      const samples = [
        generator.sample(px, pz, true),
        generator.sample(px + c * width * 0.5 + s * length * 0.5, pz - s * width * 0.5 + c * length * 0.5, true),
        generator.sample(px + c * width * 0.5 - s * length * 0.5, pz - s * width * 0.5 - c * length * 0.5, true),
        generator.sample(px - c * width * 0.5 + s * length * 0.5, pz + s * width * 0.5 + c * length * 0.5, true),
        generator.sample(px - c * width * 0.5 - s * length * 0.5, pz + s * width * 0.5 - c * length * 0.5, true),
      ];
      if (samples.some((sample) => sample.height < 3.4 || sample.height > 78 || sample.slope > 0.62 || sample.biome === 'ocean')) continue;
      const suitability = samples.reduce((sum, sample) => sum + (sample.fieldSuitability ?? 0.35), 0) / samples.length;
      const meanSlope = samples.reduce((sum, sample) => sum + sample.slope, 0) / samples.length;
      const heights = samples.map((sample) => sample.height);
      const relief = Math.max(...heights) - Math.min(...heights);
      const score = meanSlope * 2.1 + relief * 0.035 + Math.abs(samples[0].height - centerHeight) * 0.006
        + Math.max(0, 0.26 - suitability) * 1.4 - suitability * 0.12
        - samples.reduce((sum, sample) => sum + (sample.floodplain ?? 0), 0) / samples.length * 0.08;
      if (!best || score < best.score) best = { x: px, z: pz, score };
    }
  }
  return best ?? null;
}

export function buildFreeCityPlan(settlement, generator = null) {
  const seed = seedOf(settlement);
  const x = settlement.x;
  const z = settlement.z;
  const cacheKey = `${x}|${z}|${seed}`;
  if (settlement && typeof settlement === 'object') {
    const cached = freeCityPlanCache.get(settlement);
    if (cached?.generator === generator && cached.key === cacheKey) return cached.plan;
  }
  // A chartered city is a regional capital: a defended urban core, several
  // wards, civic precincts, market streets and a broad agricultural hinterland.
  const radius = 510;
  const wall = polygonPoints(x, z, 40, radius, seed ^ 0x4a17, 0.07);
  const gateVertexIndices = [0, 10, 20, 30];
  const gates = gateVertexIndices.map((vertexIndex, index) => {
    const wallPoint = wall[vertexIndex];
    const dx = wallPoint.x - x;
    const dz = wallPoint.z - z;
    const length = Math.hypot(dx, dz) || 1;
    const angle = index * Math.PI / 2;
    return {
      x: wallPoint.x - dx / length * 7,
      z: wallPoint.z - dz / length * 7,
      angle: angle + Math.PI / 2,
      name: ['East Gate', 'South Gate', 'West Gate', 'North Gate'][index],
    };
  });
  // Keep the ten wall towers evenly distributed between, rather than on, gates.
  const towers = wall.filter((_, index) => index % 4 === 1).map((point, index) => ({ ...point, id: `wall-tower-${index}` }));

  const landmarks = [
    { id: 'cathedral', kind: 'cathedral', x: x - 225, z: z - 90, yaw: Math.PI - Math.atan2(90, 225), width: 58, depth: 142, collisionWidth: 100, collisionDepth: 154 },
    { id: 'guildhall', kind: 'guildhall', x: x + 230, z: z - 100, yaw: 0.08, width: 58, depth: 42 },
    { id: 'council-hall', kind: 'council-hall', x: x + 230, z: z + 100, yaw: -0.12, width: 64, depth: 48 },
    { id: 'market-hall', kind: 'market-hall', x, z: z + 2, yaw: 0, width: 48, depth: 38 },
    { id: 'bell-tower', kind: 'bell-tower', x: x - 55, z: z - 190, yaw: 0, width: 21, depth: 21 },
    { id: 'river-exchange', kind: 'warehouse', x: x + 390, z: z + 70, yaw: Math.PI / 2, width: 52, depth: 32 },
    { id: 'mint-house', kind: 'guildhall', x: x - 390, z: z + 70, yaw: -0.2, width: 40, depth: 30 },
    { id: 'arsenal', kind: 'warehouse', x: x + 390, z: z - 70, yaw: 0.1, width: 44, depth: 30 },
  ];

  const roads = makeRoadNetwork(x, z, seed, gates);
  const roadBoxes = roadFootprints(roads, x, z);
  const landmarkBoxes = landmarks.map((item) => ({
    x: item.x - x, z: item.z - z, width: (item.collisionWidth ?? item.width) + 7, depth: (item.collisionDepth ?? item.depth) + 7, yaw: item.yaw,
  }));

  // Dense but collision-aware urban blocks. Every accepted footprint clears the
  // civic landmarks and street corridors, and buildings do not overlap each other.
  const buildings = [];
  const occupied = [];
  let index = 0;
  for (let gz = -21; gz <= 21; gz += 1) {
    for (let gx = -21; gx <= 21; gx += 1) {
      const jitterX = (random2(gx + 51, gz - 7, seed) - 0.5) * 7.2;
      const jitterZ = (random2(gx - 19, gz + 63, seed) - 0.5) * 7.2;
      const bx = gx * 22 + jitterX;
      const bz = gz * 22 + jitterZ;
      const radial = Math.hypot(bx, bz);
      if (radial > 448 || radial < 58) continue;
      const roll = random2(gx * 7 + 101, gz * 13 - 43, seed);
      const kind = roll > 0.972 ? 'merchant-hall' : roll > 0.925 ? 'inn' : roll > 0.865 ? 'workshop' : roll > 0.79 ? 'warehouse' : 'townhouse';
      const building = {
        id: `house-${index}`, kind,
        x: x + bx, z: z + bz,
        width: kind === 'merchant-hall' ? 20 : kind === 'warehouse' ? 18 : 10.5 + roll * 4.2,
        depth: kind === 'warehouse' ? 18 : kind === 'merchant-hall' ? 16 : 9.5 + (1 - roll) * 4.2,
        height: kind === 'merchant-hall' ? 18 : kind === 'warehouse' ? 12 : 8 + roll * 6,
        yaw: Math.round(random2(gx, gz, seed ^ 0x8f13) * 3) * Math.PI / 2,
        style: Math.floor(random2(gx + 93, gz - 121, seed) * 4),
      };
      if (generator && footprintHeightRange(building, generator) > 5.5) continue;
      const footprint = { ...building, x: bx, z: bz, width: building.width + 1.2, depth: building.depth + 1.2 };
      if (landmarkBoxes.some((landmark) => overlapsFootprints(footprint, landmark, 0))) continue;
      if (roadBoxes.some((road) => overlapsFootprints(footprint, road, 0))) continue;
      if (occupied.some((other) => overlapsFootprints(footprint, other, 0))) continue;
      occupied.push(footprint);
      buildings.push(building);
      index += 1;
    }
  }

  const centerHeight = generator?.heightAt(x, z) ?? settlement.elevation ?? 16;
  const fields = [];
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2 + 0.13;
    const distance = 660 + random2(i, 99, seed) * 185;
    const targetX = x + Math.cos(angle) * distance;
    const targetZ = z + Math.sin(angle) * distance;
    const length = 120 + random2(i, 101, seed) * 90;
    const width = 48 + random2(i, 103, seed) * 36;
    const site = findFieldSite(targetX, targetZ, angle, generator, centerHeight, width, length);
    if (!site) continue;
    fields.push({ x: site.x, z: site.z, angle, length, width });
  }
  const plan = { center: { x, z }, radius, wall, towers, gates, buildings, landmarks, roads, fields };
  if (settlement && typeof settlement === 'object') freeCityPlanCache.set(settlement, { generator, key: cacheKey, plan });
  return plan;
}

export function buildRuinedCastlePlan(site) {
  const seed = seedOf(site);
  const x = site.x;
  const z = site.z;
  // A substantial hilltop stronghold with outer bailey, inner ward, dry moat,
  // gate barbican and a high keep. Dimensions are world metres.
  const outerWall = polygonPoints(x, z, 24, 205, seed ^ 0x5c11, 0.13);
  const innerWall = polygonPoints(x, z, 16, 116, seed ^ 0x2f71, 0.09);
  const barbican = polygonPoints(x, z + 196, 10, 34, seed ^ 0x6b31, 0.08);
  const towers = outerWall.filter((_, index) => index % 2 === 0).map((point, index) => ({ ...point, id: `ruin-tower-${index}` }));
  const breaches = [3, 9, 15, 21].map((value) => (value + (seed % 3)) % outerWall.length);
  const rubble = [];
  for (let i = 0; i < 64; i += 1) {
    const angle = random2(i, 23, seed) * Math.PI * 2;
    const radius = 62 + random2(i, 41, seed) * 106;
    rubble.push({ x: x + Math.cos(angle) * radius, z: z + Math.sin(angle) * radius, scale: 0.8 + random2(i, 53, seed) * 3.1 });
  }
  return {
    center: { x, z }, radius: 238,
    outerWall, innerWall, barbican, towers, breaches, rubble,
    dryMoatRadius: 222,
    keep: { x: x - 14, z: z - 12, width: 58, depth: 54, height: 48 },
    gate: { x: x + 8, z: z + 196, angle: Math.PI },
    courtyardWell: { x: x + 38, z: z + 26 },
  };
}
