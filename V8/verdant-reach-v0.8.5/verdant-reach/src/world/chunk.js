import * as THREE from 'three';
import { seededRandom, random2, smoothstep } from '../core/random.js';
import { BIOMES } from './biomes.js';

const COLOR_SAND = new THREE.Color(0xb9a67b);
const COLOR_ROCK = new THREE.Color(0x777e78);
const COLOR_SNOW = new THREE.Color(0xe0e3dc);
const COLOR_DEEP = new THREE.Color(0x294b3b);

export function createSharedWorldAssets() {
  const trunkGeometry = new THREE.CylinderGeometry(0.16, 0.27, 4.2, 6);
  const leafGeometry = new THREE.ConeGeometry(2.35, 5.2, 7);
  const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
  const grassGeometry = new THREE.ConeGeometry(0.12, 0.92, 3, 1);
  const flowerGeometry = new THREE.OctahedronGeometry(0.16, 0);
  const cropGeometry = new THREE.BoxGeometry(0.32, 0.42, 0.28);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x594332, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x476f4b, roughness: 0.92, flatShading: true });
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x858c83, roughness: 1, flatShading: true });
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x82984e, roughness: 1, flatShading: true });
  const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xd7bd78, roughness: 0.85, flatShading: true });
  const cropMaterial = new THREE.MeshStandardMaterial({ color: 0x9a9b55, roughness: 0.96, flatShading: true });
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x377487,
    roughness: 0.27,
    metalness: 0.04,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return { trunkGeometry, leafGeometry, rockGeometry, grassGeometry, flowerGeometry, cropGeometry,
    trunkMaterial, leafMaterial, rockMaterial, grassMaterial, flowerMaterial, cropMaterial, waterMaterial };
}

function terrainColor(sample, x, z, seed) {
  const base = new THREE.Color(BIOMES[sample.biome]?.color ?? BIOMES.grassland.color);
  const detail = random2(Math.floor(x * 0.13), Math.floor(z * 0.13), seed) * 0.11 - 0.055;
  base.offsetHSL(0, detail * 0.25, detail);
  if (sample.height < 5.5) {
    base.lerp(COLOR_SAND, 1 - smoothstep(0.6, 5.5, sample.height) * 0.72);
  }
  if (sample.height > 34) base.lerp(COLOR_ROCK, smoothstep(34, 78, sample.height) * 0.7);
  if (sample.height > 60 && sample.temperature < 0.44) base.lerp(COLOR_SNOW, smoothstep(60, 94, sample.height) * 0.9);
  if (sample.slope > 0.9) base.lerp(COLOR_ROCK, smoothstep(0.9, 2.0, sample.slope) * 0.75);
  if ((sample.cliffIntensity ?? 0) > 0.2) base.lerp(COLOR_ROCK, (sample.cliffIntensity ?? 0) * 0.52);
  if ((sample.ravineIntensity ?? 0) > 0.16 && sample.height > 12) base.lerp(COLOR_DEEP, (sample.ravineIntensity ?? 0) * 0.18);
  if ((sample.floodplain ?? 0) > 0.12 && sample.height < 55) base.offsetHSL(0.018, (sample.floodplain ?? 0) * 0.14, (sample.floodplain ?? 0) * 0.045);
  if (sample.biome === 'grassland') base.offsetHSL(0.012, 0.035, (sample.fieldSuitability ?? 0) * 0.035);
  if (sample.biome === 'deepForest' || sample.biome === 'jungle') base.lerp(COLOR_DEEP, 0.12);
  return base;
}

function createMoonleaf(x, y, z, id) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.05, 0.7, 5),
    new THREE.MeshStandardMaterial({ color: 0x6f9b63, roughness: 0.9 }),
  );
  stem.position.y = 0.35;
  group.add(stem);
  const bloom = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.25, 0),
    new THREE.MeshStandardMaterial({ color: 0xe4d48a, emissive: 0x8a7333, emissiveIntensity: 0.45, roughness: 0.4 }),
  );
  bloom.position.y = 0.78;
  group.add(bloom);
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 7, 5),
    new THREE.MeshStandardMaterial({ color: 0x8bb878, roughness: 0.85 }),
  );
  leaf.scale.set(1.35, 0.3, 0.6);
  leaf.position.set(0.18, 0.38, 0);
  group.add(leaf);
  group.position.set(x, y, z);
  group.userData.interactable = { type: 'moonleaf', id, label: 'Gather moonleaf' };
  group.userData.baseY = y;
  return group;
}

function createWaystone(x, y, z, id) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.5, 0.42, 9),
    new THREE.MeshStandardMaterial({ color: 0x77796d, roughness: 0.98, flatShading: true }),
  );
  base.position.y = 0.2;
  group.add(base);
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.62, 3.3, 7),
    new THREE.MeshStandardMaterial({ color: 0x89948b, roughness: 0.9, flatShading: true }),
  );
  pillar.position.y = 2;
  pillar.rotation.z = 0.06;
  group.add(pillar);
  const cap = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62, 0),
    new THREE.MeshStandardMaterial({ color: 0x9bd8c0, emissive: 0x3eab8a, emissiveIntensity: 1.3, roughness: 0.24 }),
  );
  cap.position.y = 3.9;
  group.add(cap);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.06, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0x88bfa9, emissive: 0x35775e, emissiveIntensity: 0.6, roughness: 0.45 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  group.add(ring);
  group.position.set(x, y, z);
  group.userData.interactable = { type: 'waystone', id, label: 'Attune to waystone' };
  group.userData.cap = cap;
  return group;
}

function addInstance(mesh, dummy, x, y, z, yaw, scaleX, scaleY, scaleZ) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, yaw, 0);
  dummy.scale.set(scaleX, scaleY, scaleZ);
  dummy.updateMatrix();
  mesh.setMatrixAt(mesh.count, dummy.matrix);
  mesh.count += 1;
}

export function createChunk(generator, cx, cz, options) {
  const { scene, size, resolution, shared } = options;
  const originX = cx * size;
  const originZ = cz * size;
  const vertices = [];
  const normals = [];
  const colors = [];
  const indices = [];
  const step = size / resolution;
  const treeTrunks = new THREE.InstancedMesh(shared.trunkGeometry, shared.trunkMaterial, 100);
  const treeLeaves = new THREE.InstancedMesh(shared.leafGeometry, shared.leafMaterial, 100);
  const rocks = new THREE.InstancedMesh(shared.rockGeometry, shared.rockMaterial, 60);
  const outcrops = new THREE.InstancedMesh(shared.rockGeometry, shared.rockMaterial, 84);
  const grass = new THREE.InstancedMesh(shared.grassGeometry, shared.grassMaterial, 520);
  const flowers = new THREE.InstancedMesh(shared.flowerGeometry, shared.flowerMaterial, 72);
  const crops = new THREE.InstancedMesh(shared.cropGeometry, shared.cropMaterial, 360);
  treeTrunks.count = 0;
  treeLeaves.count = 0;
  rocks.count = 0;
  outcrops.count = 0;
  grass.count = 0;
  flowers.count = 0;
  crops.count = 0;
  treeTrunks.castShadow = true;
  treeLeaves.castShadow = true;
  rocks.castShadow = true;
  outcrops.castShadow = true;
  grass.castShadow = false;
  flowers.castShadow = false;
  crops.castShadow = false;
  treeTrunks.receiveShadow = true;
  treeLeaves.receiveShadow = true;
  const interactables = [];
  const seed = generator.seed;
  const samples = new Array((resolution + 1) * (resolution + 1));

  for (let iz = 0; iz <= resolution; iz += 1) {
    for (let ix = 0; ix <= resolution; ix += 1) {
      const lx = ix * step;
      const lz = iz * step;
      const wx = originX + lx;
      const wz = originZ + lz;
      const sample = generator.sample(wx, wz);
      samples[iz * (resolution + 1) + ix] = sample;
      vertices.push(lx, sample.height, lz);
    }
  }

  // Sample normals from the global height field so adjacent chunks agree at their shared edges.
  const normalOffset = 1.4;
  for (let iz = 0; iz <= resolution; iz += 1) {
    for (let ix = 0; ix <= resolution; ix += 1) {
      const wx = originX + ix * step;
      const wz = originZ + iz * step;
      const left = generator.heightAt(wx - normalOffset, wz);
      const right = generator.heightAt(wx + normalOffset, wz);
      const down = generator.heightAt(wx, wz - normalOffset);
      const up = generator.heightAt(wx, wz + normalOffset);
      const slopeX = (right - left) / (normalOffset * 2);
      const slopeZ = (up - down) / (normalOffset * 2);
      const sample = samples[iz * (resolution + 1) + ix];
      sample.slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
      const normal = new THREE.Vector3(left - right, normalOffset * 2, down - up).normalize();
      normals.push(normal.x, normal.y, normal.z);
      const color = terrainColor(sample, wx, wz, seed);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let iz = 0; iz < resolution; iz += 1) {
    for (let ix = 0; ix < resolution; ix += 1) {
      const a = iz * (resolution + 1) + ix;
      const b = a + 1;
      const c = a + resolution + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const terrainGeometry = new THREE.BufferGeometry();
  terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  terrainGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrainGeometry.setIndex(indices);
  terrainGeometry.computeBoundingSphere();
  const terrainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, metalness: 0.0, flatShading: false });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.position.set(originX, 0, originZ);
  terrain.receiveShadow = true;
  terrain.userData.chunkKey = `${cx}:${cz}`;

  const waterGeometry = new THREE.PlaneGeometry(size, size, 20, 20);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeometry, shared.waterMaterial);
  water.position.set(originX + size / 2, -0.13, originZ + size / 2);
  water.frustumCulled = true;
  water.renderOrder = 1;

  const rng = seededRandom(seed, cx, cz, 0x51a7);
  const dummy2 = new THREE.Object3D();
  const treeAttempts = 92;
  for (let i = 0; i < treeAttempts; i += 1) {
    const x = rng() * size;
    const z = rng() * size;
    const sample = generator.sample(originX + x, originZ + z, true);
    if (sample.height < 3.7 || sample.height > 70 || sample.slope > 1.05) continue;
    let chance = 0;
    if (sample.biome === 'deepForest') chance = 0.72;
    else if (sample.biome === 'forest') chance = 0.56;
    else if (sample.biome === 'jungle') chance = 0.77;
    else if (sample.biome === 'marsh') chance = 0.2;
    else if (sample.biome === 'grassland') chance = 0.065;
    else if (sample.biome === 'savanna') chance = 0.095;
    if (rng() > chance) continue;
    const scale = 0.72 + rng() * 0.75;
    const yaw = rng() * Math.PI * 2;
    addInstance(treeTrunks, dummy2, x, sample.height + 2.05 * scale, z, yaw, scale, scale, scale);
    addInstance(treeLeaves, dummy2, x, sample.height + 4.75 * scale, z, yaw, scale, scale * (0.92 + rng() * 0.26), scale);
  }

  for (let i = 0; i < 25; i += 1) {
    const x = rng() * size;
    const z = rng() * size;
    const sample = generator.sample(originX + x, originZ + z, true);
    if (sample.height < 2.5 || sample.slope > 1.4 || rng() > 0.28) continue;
    const scale = 0.35 + rng() * 0.95;
    addInstance(rocks, dummy2, x, sample.height + scale * 0.48, z, rng() * Math.PI * 2, scale * 1.2, scale * 0.8, scale);
  }
  // Instanced meadow grasses and flowers bring visual detail to plains without
  // adding hundreds of individual draw calls. Every placement uses chunk-local
  // seeded randomness and the same global biome/slope fields as the terrain.
  // Larger outcrops are concentrated along cliff bands, ravine shoulders and
  // high mountain flanks. They break up long smooth slopes without adding draw calls.
  for (let i = 0; i < 84; i += 1) {
    const x = rng() * size;
    const z = rng() * size;
    const sample = generator.sample(originX + x, originZ + z, true);
    const cliff = sample.cliffIntensity ?? 0;
    const ravine = sample.ravineIntensity ?? 0;
    const mountain = sample.mountainIntensity ?? 0;
    const exposed = cliff * 0.56 + ravine * 0.18 + mountain * 0.38 + Math.max(0, sample.slope - 0.35) * 0.22;
    if (sample.height < 5 || sample.height > 150 || exposed < 0.3 || rng() > Math.min(0.82, exposed * 0.68)) continue;
    if (outcrops.count >= outcrops.instanceMatrix.count) break;
    const scale = 1.1 + rng() * 3.4;
    const yaw = rng() * Math.PI * 2;
    addInstance(outcrops, dummy2, x, sample.height + scale * 0.42, z, yaw, scale * (0.85 + rng() * 0.7), scale * (0.62 + rng() * 0.42), scale * (0.9 + rng() * 0.6));
  }

  for (let i = 0; i < 260; i += 1) {
    const x = rng() * size;
    const z = rng() * size;
    const sample = generator.sample(originX + x, originZ + z, true);
    if (sample.height < 2.8 || sample.height > 54 || sample.slope > 0.28) continue;
    let chance = 0;
    if (sample.biome === 'grassland') chance = 0.78 * (0.35 + (sample.fieldSuitability ?? 0) * 0.65);
    else if (sample.biome === 'savanna') chance = 0.46;
    else if (sample.biome === 'marsh') chance = 0.22;
    else if (sample.biome === 'forest') chance = 0.11;
    if (rng() > chance || grass.count >= grass.instanceMatrix.count) continue;
    const scale = 0.55 + rng() * 1.15;
    const yaw = rng() * Math.PI * 2;
    addInstance(grass, dummy2, x, sample.height + 0.37 * scale, z, yaw, scale, scale, scale);
    if (flowers.count < flowers.instanceMatrix.count && sample.moisture > 0.38 && rng() < 0.075) {
      const flowerScale = 0.6 + rng() * 0.65;
      addInstance(flowers, dummy2, x + (rng() - 0.5) * 0.8, sample.height + 0.72 * flowerScale, z + (rng() - 0.5) * 0.8, yaw, flowerScale, flowerScale, flowerScale);
    }
  }

  // Small crop plots appear only on level, fertile grassland. They are sparse
  // in the wild and become denser around the large procedural city farmlands.
  for (let patch = 0; patch < 9; patch += 1) {
    const centerX = 8 + rng() * (size - 16);
    const centerZ = 8 + rng() * (size - 16);
    const center = generator.sample(originX + centerX, originZ + centerZ, true);
    if (center.biome !== 'grassland' || center.fieldSuitability < 0.62 || center.slope > 0.14) continue;
    const yaw = rng() * Math.PI * 2;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const sideX = forwardZ;
    const sideZ = -forwardX;
    for (let row = -2; row <= 2; row += 1) {
      for (let plant = 0; plant < 12; plant += 1) {
        if (crops.count >= crops.instanceMatrix.count) break;
        const along = (plant - 5.5) * 1.15;
        const across = row * 1.55;
        const x = centerX + forwardX * along + sideX * across;
        const z = centerZ + forwardZ * along + sideZ * across;
        if (x < 1 || x > size - 1 || z < 1 || z > size - 1) continue;
        const sample = generator.sample(originX + x, originZ + z);
        const plantScale = 0.55 + rng() * 0.45;
        addInstance(crops, dummy2, x, sample.height + 0.22 * plantScale, z, yaw, plantScale, plantScale, plantScale);
      }
    }
  }
  treeTrunks.instanceMatrix.needsUpdate = true;
  treeLeaves.instanceMatrix.needsUpdate = true;
  rocks.instanceMatrix.needsUpdate = true;
  outcrops.instanceMatrix.needsUpdate = true;
  grass.instanceMatrix.needsUpdate = true;
  flowers.instanceMatrix.needsUpdate = true;
  crops.instanceMatrix.needsUpdate = true;
  treeTrunks.computeBoundingSphere();
  treeLeaves.computeBoundingSphere();
  rocks.computeBoundingSphere();
  outcrops.computeBoundingSphere();
  grass.computeBoundingSphere();
  flowers.computeBoundingSphere();
  crops.computeBoundingSphere();
  treeTrunks.position.set(originX, 0, originZ);
  treeLeaves.position.set(originX, 0, originZ);
  rocks.position.set(originX, 0, originZ);
  outcrops.position.set(originX, 0, originZ);
  grass.position.set(originX, 0, originZ);
  flowers.position.set(originX, 0, originZ);
  crops.position.set(originX, 0, originZ);

  // Collectibles and old waystones are generated from chunk coordinates, never load order.
  const itemCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < itemCount; i += 1) {
    const x = 5 + rng() * (size - 10);
    const z = 5 + rng() * (size - 10);
    const sample = generator.sample(originX + x, originZ + z, true);
    if (sample.height < 4 || sample.height > 66 || sample.slope > 0.9) continue;
    if (!['forest', 'deepForest', 'jungle', 'grassland', 'marsh'].includes(sample.biome)) continue;
    const id = `leaf:${cx}:${cz}:${i}`;
    const pickup = createMoonleaf(originX + x, sample.height, originZ + z, id);
    pickup.userData.chunkKey = `${cx}:${cz}`;
    interactables.push(pickup);
  }

  if (rng() < 0.085) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = size * (0.2 + rng() * 0.6);
      const z = size * (0.2 + rng() * 0.6);
      const sample = generator.sample(originX + x, originZ + z, true);
      if (sample.height < 9 || sample.slope > 0.45) continue;
      const id = `stone:${cx}:${cz}`;
      const stone = createWaystone(originX + x, sample.height, originZ + z, id);
      stone.userData.chunkKey = `${cx}:${cz}`;
      interactables.push(stone);
      break;
    }
  }

  const group = new THREE.Group();
  group.add(terrain, water, treeTrunks, treeLeaves, rocks, outcrops, grass, flowers, crops);
  for (const item of interactables) group.add(item);
  group.userData.chunkKey = `${cx}:${cz}`;
  group.userData.centerX = originX + size / 2;
  group.userData.centerZ = originZ + size / 2;
  scene.add(group);

  return {
    key: `${cx}:${cz}`,
    cx,
    cz,
    group,
    terrain,
    water,
    interactables,
    createdAt: performance.now(),
    dispose() {
      scene.remove(group);
      terrainGeometry.dispose();
      waterGeometry.dispose();
      terrainMaterial.dispose();
      for (const item of interactables) {
        item.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
            else object.material.dispose();
          }
        });
      }
    },
  };
}
