import * as THREE from 'three';
import { buildFreeCityPlan, buildRuinedCastlePlan, isCityGateWallPanelGap } from './settlement-layouts.js';

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 14),
  cone: new THREE.ConeGeometry(1, 1, 8),
  sphere: new THREE.IcosahedronGeometry(1, 1),
  gable: makeGableGeometry(),
};


function makeGableGeometry() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0, 0.5, 0.5,
    -0.5, -0.5, -0.5, 0, 0.5, -0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0, 0.5, -0.5,
    0, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5, 0, 0.5, 0.5, 0.5, -0.5, 0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0, 0.5, -0.5,
  ];
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const M = {
  stone: new THREE.MeshStandardMaterial({ color: 0x8c887b, roughness: 0.96, flatShading: true }),
  paleStone: new THREE.MeshStandardMaterial({ color: 0xb1a58b, roughness: 0.93, flatShading: true }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x5d625c, roughness: 1, flatShading: true }),
  plaster: [0xc4b69a, 0xb9ad91, 0xd1c2a4, 0xa99d84].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.96 })),
  timber: new THREE.MeshStandardMaterial({ color: 0x76543b, roughness: 0.95 }),
  roof: [0x674b40, 0x765448, 0x56524a, 0x8b6549].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true })),
  slate: new THREE.MeshStandardMaterial({ color: 0x555d5c, roughness: 0.98, flatShading: true }),
  dark: new THREE.MeshStandardMaterial({ color: 0x302d29, roughness: 1 }),
  window: new THREE.MeshStandardMaterial({ color: 0x34443f, roughness: 0.7, emissive: 0x17231e, emissiveIntensity: 0.1 }),
  crop: new THREE.MeshStandardMaterial({ color: 0x8f9954, roughness: 1 }),
  field: new THREE.MeshStandardMaterial({ color: 0x806f48, roughness: 1 }),
  moss: new THREE.MeshStandardMaterial({ color: 0x66775a, roughness: 1 }),
  water: new THREE.MeshStandardMaterial({ color: 0x496e72, roughness: 0.35, transparent: true, opacity: 0.8 }),
};

class InstanceBatches {
  constructor() { this.batches = new Map(); }
  add(geometryKey, materialKey, position, scale, yaw = 0, materialIndex = 0, pitch = 0, roll = 0) {
    const material = Array.isArray(M[materialKey]) ? M[materialKey][materialIndex % M[materialKey].length] : M[materialKey];
    const key = `${geometryKey}:${materialKey}:${Array.isArray(M[materialKey]) ? materialIndex % M[materialKey].length : 0}`;
    if (!this.batches.has(key)) this.batches.set(key, { geometry: G[geometryKey], material, transforms: [] });
    this.batches.get(key).transforms.push({ position, scale, yaw, pitch, roll });
  }
  build(group) {
    const dummy = new THREE.Object3D();
    for (const batch of this.batches.values()) {
      if (!batch.transforms.length) continue;
      const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.transforms.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      batch.transforms.forEach((transform, index) => {
        dummy.position.set(transform.position.x, transform.position.y, transform.position.z);
        dummy.rotation.set(transform.pitch ?? 0, transform.yaw, transform.roll ?? 0);
        dummy.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
  }
}

function footprintGroundRange(item, generator) {
  let min = Infinity;
  let max = -Infinity;
  const c = Math.cos(item.yaw ?? 0);
  const s = Math.sin(item.yaw ?? 0);
  const centerHeight = generator.heightAt(item.x, item.z);
  min = Math.min(min, centerHeight);
  max = Math.max(max, centerHeight);
  for (const [lx, lz] of [
    [-item.width * 0.5, -item.depth * 0.5],
    [-item.width * 0.5, item.depth * 0.5],
    [item.width * 0.5, -item.depth * 0.5],
    [item.width * 0.5, item.depth * 0.5],
  ]) {
    const height = generator.heightAt(item.x + c * lx + s * lz, item.z - s * lx + c * lz);
    min = Math.min(min, height);
    max = Math.max(max, height);
  }
  return { min, max };
}

function addHouse(batches, building, generator) {
  const centerGround = generator.heightAt(building.x, building.z);
  if (!Number.isFinite(centerGround)) return;
  const width = building.width;
  const depth = building.depth;
  const height = building.height;
  const groundRange = footprintGroundRange(building, generator);
  if (!Number.isFinite(groundRange.min) || groundRange.max - groundRange.min > 5.5) return;
  // A low stone plinth bridges small terrain variation without tilting the house.
  const foundationBottom = groundRange.min - 0.08;
  const ground = groundRange.max + 0.22;
  const foundationHeight = Math.max(0.45, ground - foundationBottom);
  batches.add('box', 'stone', { x: building.x, y: foundationBottom + foundationHeight * 0.5, z: building.z }, { x: width + 1.2, y: foundationHeight, z: depth + 1.2 }, building.yaw);
  batches.add('box', 'plaster', { x: building.x, y: ground + height * 0.5, z: building.z }, { x: width, y: height, z: depth }, building.yaw, building.style);
  batches.add('gable', 'roof', { x: building.x, y: ground + height + 2.15, z: building.z }, { x: width * 1.14, y: 4.3, z: depth * 1.14 }, building.yaw, building.style);
  const frontX = building.x + Math.sin(building.yaw) * (depth * 0.5 + 0.08);
  const frontZ = building.z + Math.cos(building.yaw) * (depth * 0.5 + 0.08);
  batches.add('box', 'dark', { x: frontX, y: ground + 1.0, z: frontZ }, { x: 0.95, y: 2, z: 0.18 }, building.yaw);
  for (const side of [-1, 1]) {
    const wx = building.x + Math.sin(building.yaw) * (depth * 0.5 + 0.12) + Math.cos(building.yaw) * side * width * 0.25;
    const wz = building.z + Math.cos(building.yaw) * (depth * 0.5 + 0.12) - Math.sin(building.yaw) * side * width * 0.25;
    batches.add('box', 'window', { x: wx, y: ground + Math.min(height * 0.62, 4.1), z: wz }, { x: 0.72, y: 0.78, z: 0.16 }, building.yaw);
  }
}

function addLargeHall(batches, feature, generator, style = 0) {
  const localPoint = (localX, localZ) => {
    const c = Math.cos(feature.yaw ?? 0);
    const s = Math.sin(feature.yaw ?? 0);
    return {
      x: feature.x + c * localX + s * localZ,
      z: feature.z - s * localX + c * localZ,
    };
  };
  const groundRange = footprintGroundRange(feature, generator);
  const isCathedral = feature.kind === 'cathedral';
  const naveFoundationBottom = groundRange.min - 0.12;
  let ground = groundRange.max + 0.28;
  let transept = null;
  let transeptRange = null;
  if (isCathedral) {
    transept = localPoint(0, -8);
    transeptRange = footprintGroundRange({
      x: transept.x, z: transept.z, yaw: feature.yaw,
      width: feature.depth * 0.66 + 4, depth: feature.width * 0.76 + 4,
    }, generator);
    ground = Math.max(groundRange.max, transeptRange.max) + 0.28;
  }
  const naveFoundationHeight = Math.max(0.55, ground - naveFoundationBottom);
  batches.add('box', 'stone', { x: feature.x, y: naveFoundationBottom + naveFoundationHeight * 0.5, z: feature.z },
    { x: feature.width + 4, y: naveFoundationHeight, z: feature.depth + 4 }, feature.yaw);
  if (isCathedral && transept && transeptRange) {
    const transeptBottom = transeptRange.min - 0.12;
    const transeptFoundationHeight = Math.max(0.55, ground - transeptBottom);
    batches.add('box', 'stone', {
      x: transept.x, y: transeptBottom + transeptFoundationHeight * 0.5, z: transept.z,
    }, {
      x: feature.depth * 0.66 + 8, y: transeptFoundationHeight, z: feature.width * 0.76 + 8,
    }, feature.yaw);
  }
  const height = feature.kind === 'cathedral' ? 28 : feature.kind === 'bell-tower' ? 34 : feature.kind === 'council-hall' ? 18 : 15;
  if (feature.kind === 'bell-tower') {
    batches.add('box', 'paleStone', { x: feature.x, y: ground + height * 0.5, z: feature.z }, { x: 18, y: height, z: 18 }, feature.yaw);
    batches.add('cone', 'slate', { x: feature.x, y: ground + height + 5.2, z: feature.z }, { x: 13, y: 15, z: 13 }, feature.yaw);
    const window = localPoint(0, 3.82);
    batches.add('box', 'window', { x: window.x, y: ground + height * 0.68, z: window.z }, { x: 1.5, y: 3.4, z: 0.18 }, feature.yaw);
    return;
  }
  if (isCathedral) {
    // Latin-cross church plan. The transept, crossing tower and windows rotate
    // with the nave, and the collision footprint encloses the complete cross.
    const naveWidth = feature.width;
    const naveLength = feature.depth;
    batches.add('box', 'paleStone', { x: feature.x, y: ground + height * 0.5, z: feature.z }, { x: naveWidth, y: height, z: naveLength }, feature.yaw);
    batches.add('gable', 'slate', { x: feature.x, y: ground + height + 6, z: feature.z }, { x: naveWidth * 1.12, y: 12, z: naveLength * 1.04 }, feature.yaw);
    batches.add('box', 'paleStone', { x: transept.x, y: ground + 12, z: transept.z }, { x: naveLength * 0.62, y: 21, z: naveWidth * 0.72 }, feature.yaw);
    batches.add('gable', 'roof', { x: transept.x, y: ground + 24, z: transept.z }, { x: naveLength * 0.66, y: 9, z: naveWidth * 0.76 }, feature.yaw);
    const crossing = localPoint(0, -naveLength * 0.28);
    batches.add('cylinder', 'paleStone', { x: crossing.x, y: ground + 32, z: crossing.z }, { x: 16, y: 16, z: 16 }, feature.yaw);
    batches.add('cone', 'slate', { x: crossing.x, y: ground + 44, z: crossing.z }, { x: 11, y: 24, z: 11 }, feature.yaw);
    for (const side of [-1, 1]) {
      const window = localPoint(side * naveWidth * 0.24, naveLength * 0.18);
      batches.add('box', 'dark', { x: window.x, y: ground + 12, z: window.z }, { x: 1.5, y: 4.5, z: 0.25 }, feature.yaw);
    }
    return;
  }
  batches.add('box', 'paleStone', { x: feature.x, y: ground + height * 0.5, z: feature.z }, { x: feature.width, y: height, z: feature.depth }, feature.yaw);
  batches.add('gable', 'roof', { x: feature.x, y: ground + height + 2.4, z: feature.z }, { x: feature.width * 1.08, y: 4.8, z: feature.depth * 1.08 }, feature.yaw, style);
  for (const side of [-1, 1]) {
    const window = localPoint(side * feature.width * 0.27, feature.depth * 0.5 + 0.08);
    batches.add('box', 'window', { x: window.x, y: ground + height * 0.58, z: window.z }, { x: 2.0, y: 2.4, z: 0.2 }, feature.yaw);
  }
}

export function createFreeCityModel(settlement, generator) {
  const plan = buildFreeCityPlan(settlement, generator);
  const group = new THREE.Group();
  group.userData.landmarkType = 'freeCity';
  group.userData.settlementId = settlement.id;
  const batches = new InstanceBatches();
  const cx = settlement.x;
  const cz = settlement.z;

  // Defensive curtain wall, with four defended gatehouses and round flanking towers.
  for (let i = 0; i < plan.wall.length; i += 1) {
    const a = plan.wall[i];
    const b = plan.wall[(i + 1) % plan.wall.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    // Short, locally levelled wall panels follow the real ground profile instead
    // of stretching one long horizontal box across an uneven hillside.
    const panels = Math.max(1, Math.ceil(length / 9));
    for (let panel = 0; panel < panels; panel += 1) {
      const t0 = panel / panels;
      const t1 = (panel + 1) / panels;
      const tm = (t0 + t1) * 0.5;
      const ax = a.x + dx * t0;
      const az = a.z + dz * t0;
      const bx = a.x + dx * t1;
      const bz = a.z + dz * t1;
      const midX = a.x + dx * tm;
      const midZ = a.z + dz * tm;
      if (plan.gates.some((gate) => isCityGateWallPanelGap({ x: midX, z: midZ }, gate))) continue;
      const groundA = generator.heightAt(ax, az);
      const groundB = generator.heightAt(bx, bz);
      const ground = (groundA + groundB) * 0.5;
      const panelLength = length / panels;
      const pitch = -Math.atan2(groundB - groundA, panelLength);
      batches.add('box', 'stone', { x: midX, y: ground + 4.6, z: midZ }, { x: 3.4, y: 9.2, z: panelLength + 0.6 }, yaw, 0, pitch);
    }
    const crenels = Math.max(2, Math.floor(length / 5.4));
    for (let crenel = 0; crenel < crenels; crenel += 1) {
      const t = (crenel + 0.5) / crenels;
      const px = a.x + dx * t;
      const pz = a.z + dz * t;
      if (plan.gates.some((gate) => isCityGateWallPanelGap({ x: px, z: pz }, gate))) continue;
      const ground = generator.heightAt(px, pz);
      batches.add('box', 'paleStone', { x: px, y: ground + 9.85, z: pz }, { x: 1.6, y: 1.05, z: 1.7 }, yaw);
    }
  }
  for (const tower of plan.towers) {
    const ground = generator.heightAt(tower.x, tower.z);
    batches.add('cylinder', 'paleStone', { x: tower.x, y: ground + 7.1, z: tower.z }, { x: 10.5, y: 14.2, z: 10.5 });
    batches.add('cone', 'roof', { x: tower.x, y: ground + 15.8, z: tower.z }, { x: 6.5, y: 4.6, z: 6.5 }, 0, 2);
  }
  for (const gate of plan.gates) {
    const ground = generator.heightAt(gate.x, gate.z);
    const sideX = Math.cos(gate.angle) * 7;
    const sideZ = -Math.sin(gate.angle) * 7;
    for (const side of [-1, 1]) {
      const tx = gate.x + sideX * side;
      const tz = gate.z + sideZ * side;
      batches.add('cylinder', 'stone', { x: tx, y: ground + 5.6, z: tz }, { x: 7.4, y: 11.2, z: 7.4 });
      batches.add('cone', 'slate', { x: tx, y: ground + 13, z: tz }, { x: 5.1, y: 3.6, z: 5.1 });
    }
    batches.add('box', 'stone', { x: gate.x, y: ground + 7.5, z: gate.z }, { x: 18, y: 3, z: 10 }, gate.angle);
    batches.add('box', 'dark', { x: gate.x, y: ground + 3.2, z: gate.z }, { x: 7, y: 6.4, z: 0.55 }, gate.angle);
  }

  // Dense, irregular merchant quarters around a broad civic market.
  for (const building of plan.buildings) addHouse(batches, building, generator);
  for (const landmark of plan.landmarks) addLargeHall(batches, landmark, generator, Math.floor(settlement.seed % 4));

  // Radial streets and the central paved market square.
  for (const road of plan.roads) {
    const dx = road.to.x - road.from.x;
    const dz = road.to.z - road.from.z;
    const length = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const segments = Math.max(1, Math.ceil(length / 13));
    for (let segment = 0; segment < segments; segment += 1) {
      const t0 = segment / segments;
      const t1 = (segment + 1) / segments;
      const tm = (t0 + t1) * 0.5;
      const ax = road.from.x + dx * t0;
      const az = road.from.z + dz * t0;
      const bx = road.from.x + dx * t1;
      const bz = road.from.z + dz * t1;
      const midX = road.from.x + dx * tm;
      const midZ = road.from.z + dz * tm;
      const groundA = generator.heightAt(ax, az);
      const groundB = generator.heightAt(bx, bz);
      const localLength = length / segments;
      const pitch = -Math.atan2(groundB - groundA, localLength);
      batches.add('box', 'field', { x: midX, y: (groundA + groundB) * 0.5 + 0.09, z: midZ }, { x: road.width, y: 0.18, z: localLength + 0.35 }, yaw, 0, pitch);
    }
  }
  batches.add('box', 'paleStone', { x: cx, y: generator.heightAt(cx, cz) + 0.16, z: cz }, { x: 36, y: 0.28, z: 31 }, 0);
  for (let i = 0; i < 9; i += 1) {
    const x = cx - 12 + (i % 3) * 12;
    const z = cz + 16 + Math.floor(i / 3) * 4;
    const ground = generator.heightAt(x, z);
    batches.add('box', 'timber', { x, y: ground + 1.4, z }, { x: 3.8, y: 0.75, z: 2.4 }, 0);
    batches.add('box', 'roof', { x, y: ground + 3.0, z }, { x: 4.8, y: 2.6, z: 3.4 }, 0, i % 4);
  }

  // Outlying strip fields, fallow plots and low stone boundary markers.
  for (const field of plan.fields) {
    const c = Math.cos(field.angle);
    const s = Math.sin(field.angle);
    const segments = Math.max(2, Math.ceil(field.length / 10));
    for (let segment = 0; segment < segments; segment += 1) {
      const t0 = segment / segments;
      const t1 = (segment + 1) / segments;
      const tm = (t0 + t1) * 0.5;
      const alongA = -field.length * 0.5 + field.length * t0;
      const alongB = -field.length * 0.5 + field.length * t1;
      const alongMid = (alongA + alongB) * 0.5;
      const ax = field.x + s * alongA;
      const az = field.z + c * alongA;
      const bx = field.x + s * alongB;
      const bz = field.z + c * alongB;
      const midX = field.x + s * alongMid;
      const midZ = field.z + c * alongMid;
      const groundA = generator.heightAt(ax, az);
      const groundB = generator.heightAt(bx, bz);
      const localLength = field.length / segments;
      const pitch = -Math.atan2(groundB - groundA, localLength);
      batches.add('box', 'field', { x: midX, y: (groundA + groundB) * 0.5 + 0.08, z: midZ }, { x: field.width, y: 0.16, z: localLength + 0.35 }, field.angle, 0, pitch);
      for (let row = -3; row <= 3; row += 1) {
        const rowX = midX + c * row * 3.4;
        const rowZ = midZ - s * row * 3.4;
        const rowGroundA = generator.heightAt(ax + c * row * 3.4, az - s * row * 3.4);
        const rowGroundB = generator.heightAt(bx + c * row * 3.4, bz - s * row * 3.4);
        const cropPitch = -Math.atan2(rowGroundB - rowGroundA, localLength);
        batches.add('box', 'crop', { x: rowX, y: (rowGroundA + rowGroundB) * 0.5 + 0.36, z: rowZ }, { x: 0.55, y: 0.62, z: localLength * 0.82 }, field.angle, 0, cropPitch);
      }
    }
  }
  batches.build(group);
  return group;
}

export function createRuinedCastleModel(site, generator) {
  const plan = buildRuinedCastlePlan(site);
  const group = new THREE.Group();
  group.userData.landmarkType = 'ruinedCastle';
  group.userData.landmarkId = site.id;
  const batches = new InstanceBatches();

  const addTerrainWall = (a, b, width, height, materialKey, maxPanelLength = 8, materialIndex = 0) => {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const panels = Math.max(1, Math.ceil(length / maxPanelLength));
    for (let panel = 0; panel < panels; panel += 1) {
      const t0 = panel / panels;
      const t1 = (panel + 1) / panels;
      const tm = (t0 + t1) * 0.5;
      const ax = a.x + dx * t0;
      const az = a.z + dz * t0;
      const bx = a.x + dx * t1;
      const bz = a.z + dz * t1;
      const midX = a.x + dx * tm;
      const midZ = a.z + dz * tm;
      const groundA = generator.heightAt(ax, az);
      const groundB = generator.heightAt(bx, bz);
      const localLength = length / panels;
      const ground = (groundA + groundB) * 0.5;
      const pitch = -Math.atan2(groundB - groundA, localLength);
      batches.add('box', materialKey, { x: midX, y: ground + height * 0.5, z: midZ }, { x: width, y: height, z: localLength + 0.45 }, yaw, materialIndex, pitch);
    }
  };

  for (let i = 0; i < plan.outerWall.length; i += 1) {
    if (plan.breaches.includes(i)) continue;
    const a = plan.outerWall[i];
    const b = plan.outerWall[(i + 1) % plan.outerWall.length];
    const height = 9.5 + ((site.seed + i * 31) % 9);
    addTerrainWall(a, b, 4.8, height, i % 3 ? 'stone' : 'darkStone', 8);
  }
  for (const point of plan.towers) {
    const ground = generator.heightAt(point.x, point.z);
    const height = 18 + ((site.seed + Math.round(point.angle * 100)) % 15);
    batches.add('cylinder', 'darkStone', { x: point.x, y: ground + height * 0.5, z: point.z }, { x: 18, y: height, z: 18 });
    // Broken tower crowns are open and uneven rather than intact decorative roofs.
    for (let i = 0; i < 5; i += 1) {
      const angle = i * Math.PI * 2 / 5;
      batches.add('box', 'stone', { x: point.x + Math.cos(angle) * 4.2, y: ground + height + (i % 2) * 0.9, z: point.z + Math.sin(angle) * 4.2 }, { x: 1.9, y: 1.7, z: 1.9 });
    }
  }
  for (let i = 0; i < plan.innerWall.length; i += 1) {
    if (i === 1 || i === 5) continue;
    const a = plan.innerWall[i];
    const b = plan.innerWall[(i + 1) % plan.innerWall.length];
    const height = 7 + ((site.seed + i * 17) % 6);
    addTerrainWall(a, b, 2.8, height, 'stone', 8);
  }

  // The moat is assembled from short terrain-following sections, not one flat
  // decorative ring that could float across the castle's uneven hillside.
  const moatSegments = 128;
  for (let i = 0; i < moatSegments; i += 1) {
    const a0 = i / moatSegments * Math.PI * 2;
    const a1 = (i + 1) / moatSegments * Math.PI * 2;
    const am = (a0 + a1) * 0.5;
    const radius = plan.dryMoatRadius;
    const ax = plan.center.x + Math.cos(a0) * radius;
    const az = plan.center.z + Math.sin(a0) * radius;
    const bx = plan.center.x + Math.cos(a1) * radius;
    const bz = plan.center.z + Math.sin(a1) * radius;
    const mx = plan.center.x + Math.cos(am) * radius;
    const mz = plan.center.z + Math.sin(am) * radius;
    const groundA = generator.heightAt(ax, az);
    const groundB = generator.heightAt(bx, bz);
    const localLength = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(bx - ax, bz - az);
    const pitch = -Math.atan2(groundB - groundA, localLength);
    batches.add('box', 'darkStone', { x: mx, y: (groundA + groundB) * 0.5 - 0.12, z: mz }, { x: 13, y: 0.28, z: localLength + 0.4 }, yaw, 0, pitch);
  }

  // Roofless keep: broken curtain facades are built as short terrain-following
  // panels, so the largest structure does not float or cut through the hill.
  const keep = plan.keep;
  const keepWalls = [
    { a: { x: keep.x - keep.width * 0.5, z: keep.z - keep.depth * 0.5 }, b: { x: keep.x + keep.width * 0.5, z: keep.z - keep.depth * 0.5 }, height: keep.height },
    { a: { x: keep.x - keep.width * 0.5, z: keep.z - keep.depth * 0.5 }, b: { x: keep.x - keep.width * 0.5, z: keep.z + keep.depth * 0.5 }, height: keep.height * 0.78 },
    { a: { x: keep.x + keep.width * 0.5, z: keep.z - keep.depth * 0.5 }, b: { x: keep.x + keep.width * 0.5, z: keep.z + keep.depth * 0.5 }, height: keep.height * 0.62 },
    { a: { x: keep.x + 2 - keep.width * 0.31, z: keep.z + keep.depth * 0.5 }, b: { x: keep.x + 2 + keep.width * 0.31, z: keep.z + keep.depth * 0.5 }, height: keep.height * 0.48 },
  ];
  keepWalls.forEach((wall) => {
    addTerrainWall(wall.a, wall.b, 3.0, wall.height, 'darkStone', 7);
    const dx = wall.b.x - wall.a.x;
    const dz = wall.b.z - wall.a.z;
    const yaw = Math.atan2(dx, dz);
    const normalX = Math.sin(yaw) * 1.58;
    const normalZ = Math.cos(yaw) * 1.58;
    for (let slit = 0; slit < 3; slit += 1) {
      const t = (slit + 1) / 4;
      const px = wall.a.x + dx * t;
      const pz = wall.a.z + dz * t;
      const groundA = generator.heightAt(wall.a.x + dx * Math.max(0, t - 0.03), wall.a.z + dz * Math.max(0, t - 0.03));
      const groundB = generator.heightAt(wall.a.x + dx * Math.min(1, t + 0.03), wall.a.z + dz * Math.min(1, t + 0.03));
      const base = (groundA + groundB) * 0.5;
      batches.add('box', 'dark', { x: px + normalX, y: base + wall.height * 0.58, z: pz + normalZ }, { x: 0.55, y: 2.2, z: 0.16 }, yaw);
    }
  });
  const keepGround = generator.heightAt(keep.x, keep.z);
  for (let i = 0; i < 13; i += 1) {
    const x = keep.x - 8 + i * 1.25;
    const z = keep.z - 9;
    const h = 0.8 + ((site.seed + i * 7) % 4) * 0.34;
    batches.add('box', 'stone', { x, y: keepGround + keep.height + h * 0.45, z }, { x: 1.2, y: h, z: 1.4 });
  }
  // Detached barbican outwork protects the gate approach.
  for (let i = 0; i < plan.barbican.length; i += 1) {
    const a = plan.barbican[i];
    const b = plan.barbican[(i + 1) % plan.barbican.length];
    addTerrainWall(a, b, 2.5, 7.6, 'stone', 7);
  }
  const gateGround = generator.heightAt(plan.gate.x, plan.gate.z);
  batches.add('box', 'stone', { x: plan.gate.x, y: gateGround + 5.2, z: plan.gate.z }, { x: 14, y: 10.4, z: 10 }, plan.gate.angle);
  batches.add('box', 'dark', { x: plan.gate.x, y: gateGround + 3.2, z: plan.gate.z + 4.8 }, { x: 5.2, y: 6.4, z: 0.3 }, plan.gate.angle);
  const wellGround = generator.heightAt(plan.courtyardWell.x, plan.courtyardWell.z);
  batches.add('cylinder', 'stone', { x: plan.courtyardWell.x, y: wellGround + 0.55, z: plan.courtyardWell.z }, { x: 2.8, y: 1.1, z: 2.8 });
  batches.add('cylinder', 'water', { x: plan.courtyardWell.x, y: wellGround + 0.76, z: plan.courtyardWell.z }, { x: 1.65, y: 0.08, z: 1.65 });

  for (const stone of plan.rubble) {
    const y = generator.heightAt(stone.x, stone.z);
    batches.add('sphere', 'darkStone', { x: stone.x, y: y + stone.scale * 0.38, z: stone.z }, { x: stone.scale * 1.2, y: stone.scale * 0.7, z: stone.scale }, stone.scale * 0.24);
    if (stone.scale > 2.1) batches.add('box', 'stone', { x: stone.x + 1.1, y: y + 0.3, z: stone.z - 0.7 }, { x: stone.scale * 1.4, y: 0.7, z: 1.1 }, stone.scale * 0.1);
  }
  batches.build(group);
  return group;
}
