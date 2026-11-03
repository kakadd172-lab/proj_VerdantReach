import * as THREE from 'three';
import { BLOCK, BLOCK_BY_ID, blockHex } from './blocks.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from './generator.js';

const FACE_DEFS = [
  { d: [1, 0, 0], n: [1, 0, 0], v: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { d: [-1, 0, 0], n: [-1, 0, 0], v: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { d: [0, 1, 0], n: [0, 1, 0], v: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
  { d: [0, -1, 0], n: [0, -1, 0], v: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
  { d: [0, 0, 1], n: [0, 0, 1], v: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] },
  { d: [0, 0, -1], n: [0, 0, -1], v: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }
];

function colorFor(blockId, face, worldX, y, worldZ, biomeInfo) {
  let hex = blockHex(blockId);
  if (blockId === BLOCK.GRASS) {
    if (face.n[1] === 1) hex = biomeInfo?.grassColor ?? '#80ad58';
    else hex = '#806044';
  } else if (blockId === BLOCK.LEAVES) {
    const r = Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233 + y * 37.719));
    hex = r > 0.66 ? '#5d9c58' : (r > 0.33 ? '#4c8b4e' : '#437d49');
  } else if (blockId === BLOCK.STONE) {
    const r = Math.abs(Math.sin(worldX * 0.71 + y * 1.37 + worldZ * 0.31));
    hex = r > 0.72 ? '#939a99' : (r < 0.18 ? '#747d7e' : '#858d8d');
  }
  const color = new THREE.Color(hex);
  const faceShade = face.n[1] > 0 ? 1.08 : (face.n[1] < 0 ? 0.72 : 0.88);
  const variation = 0.94 + (Math.abs(Math.sin(worldX * 3.17 + worldZ * 1.91 + y * 6.31)) * 0.11);
  return color.multiplyScalar(faceShade * variation);
}

function pushQuad(target, points, normal, color) {
  const offset = target.positions.length / 3;
  for (const p of points) {
    target.positions.push(p[0], p[1], p[2]);
    target.normals.push(normal[0], normal[1], normal[2]);
    target.colors.push(color.r, color.g, color.b);
  }
  target.indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
}

function createGeometry(data) {
  if (!data.indices.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
  geometry.setIndex(data.indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export class Chunk {
  constructor(world, cx, cz, data) {
    this.world = world;
    this.cx = cx;
    this.cz = cz;
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    this.group.name = `chunk-${cx}-${cz}`;
    this.world.scene.add(this.group);
    this.solidMesh = null;
    this.waterMesh = null;
    this.dirty = true;
    this.rebuild();
  }

  index(x, y, z) {
    return x + CHUNK_SIZE * (z + CHUNK_SIZE * y);
  }

  getLocal(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return BLOCK.AIR;
    return this.data[this.index(x, y, z)];
  }

  setLocal(x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return false;
    this.data[this.index(x, y, z)] = id;
    this.dirty = true;
    return true;
  }

  neighborBlock(x, y, z) {
    if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) return this.getLocal(x, y, z);
    return this.world.getBlock(this.cx * CHUNK_SIZE + x, y, this.cz * CHUNK_SIZE + z);
  }

  rebuild() {
    if (!this.group) return;
    if (this.solidMesh) {
      this.group.remove(this.solidMesh);
      this.solidMesh.geometry.dispose();
      this.solidMesh = null;
    }
    if (this.waterMesh) {
      this.group.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }

    const solid = { positions: [], normals: [], colors: [], indices: [] };
    const water = { positions: [], normals: [], colors: [], indices: [] };
    const originX = this.cx * CHUNK_SIZE;
    const originZ = this.cz * CHUNK_SIZE;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const id = this.getLocal(x, y, z);
          if (id === BLOCK.AIR) continue;
          const block = BLOCK_BY_ID[id];
          const target = id === BLOCK.WATER ? water : solid;
          const wx = originX + x, wz = originZ + z;
          let biomeInfo = null;
          if (id === BLOCK.GRASS) biomeInfo = this.world.generator.sampleColumn(wx, wz);
          for (const face of FACE_DEFS) {
            const neighborId = this.neighborBlock(x + face.d[0], y + face.d[1], z + face.d[2]);
            if (id === BLOCK.WATER) {
              if (neighborId === BLOCK.WATER) continue;
              if (BLOCK_BY_ID[neighborId]?.solid) continue;
            } else if (BLOCK_BY_ID[neighborId]?.solid) {
              continue;
            }
            const color = colorFor(id, face, wx, y, wz, biomeInfo);
            const points = face.v.map(([vx, vy, vz]) => [x + vx, y + vy, z + vz]);
            pushQuad(target, points, face.n, color);
          }
        }
      }
    }

    const solidGeometry = createGeometry(solid);
    if (solidGeometry) {
      this.solidMesh = new THREE.Mesh(solidGeometry, this.world.materials.solid);
      this.solidMesh.castShadow = false;
      this.solidMesh.receiveShadow = false;
      this.solidMesh.userData.chunk = this;
      this.group.add(this.solidMesh);
    }
    const waterGeometry = createGeometry(water);
    if (waterGeometry) {
      this.waterMesh = new THREE.Mesh(waterGeometry, this.world.materials.water);
      this.waterMesh.renderOrder = 2;
      this.group.add(this.waterMesh);
    }
    this.dirty = false;
  }

  dispose() {
    if (this.solidMesh) this.solidMesh.geometry.dispose();
    if (this.waterMesh) this.waterMesh.geometry.dispose();
    this.world.scene.remove(this.group);
    this.group.clear();
    this.group = null;
    this.data = null;
  }
}
