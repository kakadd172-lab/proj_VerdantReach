import * as THREE from 'three';
import { getShipTypeFromCreativeKind } from './ship-designs.js?v=0.8.6';
import { createShip, disposeShipModel } from './ships/index.js?v=0.8.6';

const COLORS = {
  stone: 0x858b84, darkStone: 0x555f59, wood: 0x765538, darkWood: 0x493a2f,
  leaf: 0x4c754b, leafLight: 0x71945a, grass: 0x78924e, sand: 0xbca575,
  crystal: 0x91d8d0, crystalGlow: 0x367e79, cloth: 0xc9b990, skin: 0xc69a76,
  leather: 0x654633, iron: 0x8e9993, fire: 0xffa64f, gold: 0xc6a45f,
};

function mat(color, roughness = 0.88, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

function part(group, geometry, color, position, scale = [1, 1, 1], rotation = [0, 0, 0], extra = {}) {
  const mesh = new THREE.Mesh(geometry, mat(color, extra.roughness ?? 0.88, extra.material ?? {}));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.castShadow = extra.castShadow ?? true;
  mesh.receiveShadow = extra.receiveShadow ?? true;
  group.add(mesh);
  return mesh;
}

function createTree(group, variant = 'tree', offset = [0, 0, 0], scale = 1) {
  const [x, y, z] = offset;
  const pine = variant === 'pine-tree';
  const ancient = variant === 'ancient-tree';
  part(group, new THREE.CylinderGeometry(0.35 * scale, 0.62 * scale, (ancient ? 8 : 5) * scale, 8), COLORS.wood, [x, y + (ancient ? 4 : 2.5) * scale, z]);
  if (pine) {
    for (let i = 0; i < 3; i += 1) part(group, new THREE.ConeGeometry((2.7 - i * 0.55) * scale, 3.6 * scale, 7), i % 2 ? COLORS.leaf : COLORS.leafLight, [x, y + (3 + i * 1.8) * scale, z]);
  } else {
    const canopy = ancient ? 4.4 : 2.75;
    part(group, new THREE.IcosahedronGeometry(canopy * scale, 1), ancient ? 0x496a43 : COLORS.leaf, [x, y + (ancient ? 8 : 6) * scale, z], [1, 0.82, 1]);
    if (ancient) for (let i = 0; i < 4; i += 1) part(group, new THREE.SphereGeometry(2.4 * scale, 8, 6), COLORS.leafLight, [x + Math.cos(i * Math.PI / 2) * 2.5 * scale, y + 7.6 * scale, z + Math.sin(i * Math.PI / 2) * 2.5 * scale]);
  }
}

function createAnimal(group, kind) {
  const color = kind === 'wolf' ? 0x747b78 : kind === 'bear' ? 0x5f4938 : kind === 'boar' ? 0x78614a : kind === 'hare' ? 0x9a8669 : kind === 'crane' ? 0xd7d3c2 : 0x9d8866;
  const legHeight = kind === 'hare' ? 0.55 : kind === 'bear' ? 0.9 : 0.72;
  const bodyLength = kind === 'bear' ? 2.1 : kind === 'deer' ? 1.9 : 1.55;
  part(group, new THREE.SphereGeometry(1, 12, 9), color, [0, 1.0, 0], [0.62, 0.55, bodyLength / 1.6]);
  part(group, new THREE.SphereGeometry(0.42, 10, 8), color, [0, 1.45, bodyLength * 0.48], [0.8, 0.88, 0.9]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(group, new THREE.CylinderGeometry(0.09, 0.12, legHeight, 6), color, [sx * 0.39, legHeight / 2, sz * bodyLength * 0.31]);
  if (kind === 'deer') {
    for (const side of [-1, 1]) {
      part(group, new THREE.CylinderGeometry(0.045, 0.06, 0.78, 5), COLORS.sand, [side * 0.2, 2.05, bodyLength * 0.48], [1, 1, 1], [0, 0, side * -0.22]);
      part(group, new THREE.CylinderGeometry(0.035, 0.045, 0.48, 5), COLORS.sand, [side * 0.43, 2.3, bodyLength * 0.48], [1, 1, 1], [0, 0, side * -0.65]);
    }
  }
  if (kind === 'crane') part(group, new THREE.CylinderGeometry(0.06, 0.08, 1.0, 5), color, [0, 1.6, bodyLength * 0.62], [1, 1, 1], [Math.PI / 3, 0, 0]);
}

function createPerson(group, kind) {
  const robeColor = kind === 'guard' ? 0x556879 : kind === 'merchant' ? 0x8b6745 : 0x58705c;
  part(group, new THREE.CylinderGeometry(0.42, 0.57, 1.5, 8), robeColor, [0, 1.05, 0]);
  part(group, new THREE.SphereGeometry(0.32, 10, 8), COLORS.skin, [0, 2.05, 0]);
  part(group, new THREE.ConeGeometry(0.48, 0.48, 8), kind === 'merchant' ? COLORS.gold : COLORS.cloth, [0, 2.48, 0]);
  for (const side of [-1, 1]) part(group, new THREE.CylinderGeometry(0.12, 0.14, 0.72, 6), COLORS.leather, [side * 0.22, 0.36, 0]);
  if (kind === 'guard') part(group, new THREE.CylinderGeometry(0.055, 0.055, 1.7, 6), COLORS.iron, [0.72, 1.25, 0], [1, 1, 1], [0, 0, -0.12]);
  if (kind === 'merchant') part(group, new THREE.BoxGeometry(0.58, 0.44, 0.48), COLORS.wood, [0.62, 0.95, 0.18]);
}

function createHouse(group, kind = 'hut', offset = [0, 0, 0], scale = 1) {
  const [x, y, z] = offset;
  const width = kind === 'watchtower' ? 3.8 : 5.4;
  const wallColor = kind === 'ruin' ? 0x77786f : kind === 'mine' ? COLORS.darkStone : 0x9b8160;
  part(group, new THREE.BoxGeometry(width, kind === 'watchtower' ? 7.5 : 3.3, width), wallColor, [x, y + (kind === 'watchtower' ? 3.75 : 1.65) * scale, z], [scale, scale, scale]);
  if (kind !== 'ruin' && kind !== 'mine') part(group, new THREE.ConeGeometry(width * 0.83, kind === 'watchtower' ? 2.8 : 2.4, 4), 0x59483e, [x, y + (kind === 'watchtower' ? 8.8 : 4.4) * scale, z], [scale, scale, scale], [0, Math.PI / 4, 0]);
  if (kind === 'ruin') {
    for (const side of [-1, 1]) part(group, new THREE.BoxGeometry(0.65, 4.2, 0.65), COLORS.stone, [x + side * 2.2 * scale, y + 2.1 * scale, z + 2.2 * scale], [scale, scale, scale]);
    part(group, new THREE.BoxGeometry(5.2, 0.65, 0.65), COLORS.stone, [x, y + 4.3 * scale, z + 2.2 * scale], [scale, scale, scale]);
  }
  if (kind === 'mine') part(group, new THREE.BoxGeometry(2.1, 2.25, 0.3), COLORS.darkWood, [x, y + 1.15 * scale, z + width * 0.52], [scale, scale, scale]);
}

export function createCreativeEntity(kind) {
  const historicalShipType = getShipTypeFromCreativeKind(kind);
  if (historicalShipType) {
    const ship = createShip(historicalShipType);
    ship.name = `Creative ${kind}`;
    ship.userData.creativeKind = kind;
    ship.traverse((object) => { if (object.isMesh) object.userData.creativeOwned = true; });
    return ship;
  }
  const group = new THREE.Group();
  group.name = `Creative ${kind}`;
  if (kind === 'rock' || kind === 'boulder') {
    part(group, new THREE.IcosahedronGeometry(kind === 'boulder' ? 2.4 : 1.2, 1), kind === 'boulder' ? 0x747c77 : COLORS.stone, [0, kind === 'boulder' ? 1.4 : 0.75, 0], [1.25, 0.82, 1]);
  } else if (kind === 'crystal') {
    for (let i = 0; i < 5; i += 1) part(group, new THREE.OctahedronGeometry(1.05 - i * 0.12, 0), COLORS.crystal, [Math.sin(i * 1.7) * 0.8, 1.1 + i * 0.34, Math.cos(i * 1.7) * 0.8], [0.65, 1.7, 0.65], [0, i * 0.55, 0], { material: { emissive: COLORS.crystalGlow, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 } });
  } else if (kind === 'tree' || kind === 'pine-tree' || kind === 'ancient-tree') {
    createTree(group, kind);
  } else if (kind === 'tree-grove') {
    for (let i = 0; i < 9; i += 1) createTree(group, i % 3 === 0 ? 'pine-tree' : 'tree', [Math.cos(i * 2.4) * 6, 0, Math.sin(i * 2.4) * 6], 0.72 + (i % 3) * 0.12);
  } else if (kind === 'flower-patch') {
    for (let i = 0; i < 16; i += 1) {
      const x = Math.cos(i * 2.4) * (1.5 + (i % 4));
      const z = Math.sin(i * 2.4) * (1.5 + (i % 4));
      part(group, new THREE.CylinderGeometry(0.035, 0.045, 0.65, 5), COLORS.grass, [x, 0.32, z]);
      part(group, new THREE.SphereGeometry(0.17, 7, 6), [0xe4b978, 0xd99c9b, 0xb9c7df, 0xe2d58d][i % 4], [x, 0.7, z]);
    }
  } else if (['deer', 'hare', 'wolf', 'bear', 'boar', 'crane'].includes(kind)) {
    createAnimal(group, kind);
  } else if (['villager', 'merchant', 'guard'].includes(kind)) {
    createPerson(group, kind);
  } else if (kind === 'horse') {
    createAnimal(group, 'deer');
    group.scale.set(1.15, 1.05, 1.2);
  } else if (kind === 'cart') {
    part(group, new THREE.BoxGeometry(3, 0.55, 3.5), COLORS.wood, [0, 1.0, 0]);
    for (const side of [-1, 1]) part(group, new THREE.CylinderGeometry(0.72, 0.72, 0.22, 12), COLORS.darkWood, [side * 1.62, 0.72, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
    part(group, new THREE.BoxGeometry(0.16, 0.2, 3.2), COLORS.darkWood, [0, 0.58, -2.6]);
  } else if (kind === 'rowboat') {
    part(group, new THREE.BoxGeometry(2.3, 0.6, 7.8), 0x644c38, [0, 0.2, 0]);
    part(group, new THREE.BoxGeometry(2.7, 0.22, 0.35), COLORS.wood, [0, 0.65, 0]);
    for (const side of [-1, 1]) part(group, new THREE.BoxGeometry(0.12, 0.1, 4.8), COLORS.wood, [side * 1.3, 0.9, 0], [1, 1, 1], [0, 0, side * -0.25]);
  } else if (kind === 'sailing-ship' || kind === 'large-ship') {
    throw new Error('Legacy ship aliases should be resolved through the historical fleet catalogue.');
  } else if (['hut', 'watchtower', 'ruin', 'mine'].includes(kind)) {
    createHouse(group, kind);
  } else if (kind === 'bridge') {
    for (let i = -4; i <= 4; i += 1) part(group, new THREE.BoxGeometry(1.7, 0.25, 3.6), COLORS.wood, [i * 1.6, 0.9 + Math.cos(i * 0.22) * 0.18, 0]);
    for (const side of [-1, 1]) part(group, new THREE.BoxGeometry(15, 0.35, 0.25), COLORS.darkWood, [0, 2.0, side * 1.8]);
  } else if (kind === 'campfire') {
    for (let i = 0; i < 4; i += 1) part(group, new THREE.CylinderGeometry(0.13, 0.16, 2.3, 6), COLORS.darkWood, [0, 0.38, 0], [1, 1, 1], [Math.PI / 2, 0, i * Math.PI / 4]);
    part(group, new THREE.ConeGeometry(0.72, 1.8, 7), COLORS.fire, [0, 1.35, 0], [0.72, 1.25, 0.72], [0, 0, 0], { material: { emissive: 0xe66b25, emissiveIntensity: 0.9 } });
  } else if (kind === 'treasure-chest') {
    part(group, new THREE.BoxGeometry(2.2, 1.25, 1.55), COLORS.wood, [0, 0.72, 0]);
    part(group, new THREE.BoxGeometry(2.25, 0.22, 1.6), COLORS.gold, [0, 1.38, 0]);
    part(group, new THREE.BoxGeometry(0.25, 0.42, 0.12), COLORS.gold, [0, 0.85, 0.82]);
  } else if (kind === 'well') {
    part(group, new THREE.CylinderGeometry(1.7, 1.9, 1.1, 10), COLORS.stone, [0, 0.55, 0]);
    part(group, new THREE.CylinderGeometry(1.22, 1.22, 0.12, 12), 0x315b68, [0, 1.12, 0]);
    for (const side of [-1, 1]) part(group, new THREE.BoxGeometry(0.22, 2.7, 0.22), COLORS.wood, [side * 1.55, 2.1, 0]);
    part(group, new THREE.BoxGeometry(3.7, 0.2, 0.25), COLORS.wood, [0, 3.5, 0]);
  }
  group.traverse((object) => {
    if (object.isMesh) object.userData.creativeOwned = true;
  });
  group.userData.creativeKind = kind;
  return group;
}

export function disposeCreativeEntity(group) {
  if (!group) return;
  if (group.userData?.shipType && Array.isArray(group.userData.ownedGeometries)) {
    disposeShipModel(group);
    return;
  }
  group.traverse((object) => {
    if (!object.isMesh || !object.userData.creativeOwned) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material.dispose();
  });
  group.parent?.remove(group);
}
