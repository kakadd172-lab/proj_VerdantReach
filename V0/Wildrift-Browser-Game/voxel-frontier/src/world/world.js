import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { CHUNK_SIZE, WORLD_HEIGHT, WorldGenerator } from './generator.js';
import { Chunk } from './chunk.js';

const makeKey = (cx, cz) => `${cx},${cz}`;
const makeBlockKey = (x, y, z) => `${x},${y},${z}`;

export class VoxelWorld {
  constructor(scene, seed, options = {}) {
    this.scene = scene;
    this.seed = seed | 0;
    this.generator = new WorldGenerator(this.seed);
    this.renderDistance = options.renderDistance ?? 3;
    this.chunks = new Map();
    this.pending = [];
    this.pendingKeys = new Set();
    this.inflight = new Map();
    this.overrides = new Map();
    this.modsByChunk = new Map();
    this.requestId = 1;
    this.workers = [];
    this.workerCount = Math.min(2, Math.max(1, (navigator.hardwareConcurrency || 4) - 1));
    this.lastCenter = null;
    this.generationMode = 'worker';
    this.disposed = false;

    this.materials = {
      solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide }),
      water: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.68, depthWrite: false, side: THREE.DoubleSide })
    };

    this.initWorkers();
  }

  initWorkers() {
    if (typeof Worker === 'undefined') {
      this.generationMode = 'main-thread';
      return;
    }
    try {
      for (let i = 0; i < this.workerCount; i++) {
        const worker = new Worker(new URL('./chunk-worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = (event) => this.onWorkerMessage(worker, event.data);
        worker.onerror = (event) => {
          console.warn('Chunk worker failed; switching to main-thread generation.', event.message);
          this.generationMode = 'main-thread';
          for (const [id, task] of this.inflight.entries()) {
            if (task.worker === worker) {
              this.inflight.delete(id);
              this.pending.push({ cx: task.cx, cz: task.cz, key: task.key, distance: task.distance });
              this.pendingKeys.add(task.key);
            }
          }
          worker.terminate();
          this.workers = this.workers.filter((item) => item !== worker);
        };
        this.workers.push(worker);
      }
      if (!this.workers.length) this.generationMode = 'main-thread';
    } catch (error) {
      console.warn('Web workers unavailable; using main-thread chunk generation.', error);
      this.generationMode = 'main-thread';
    }
  }

  loadSync(cx, cz) {
    const key = makeKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);
    const { data } = this.generator.generateChunkData(cx, cz);
    const chunk = this.addChunk(cx, cz, data);
    return chunk;
  }

  addChunk(cx, cz, rawData) {
    const key = makeKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);
    const data = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData);
    const modBucket = this.modsByChunk.get(key);
    if (modBucket) {
      for (const [index, id] of modBucket.entries()) data[index] = id;
    }
    const chunk = new Chunk(this, cx, cz, data);
    this.chunks.set(key, chunk);
    this.rebuildNeighbors(cx, cz);
    return chunk;
  }

  rebuildNeighbors(cx, cz) {
    const neighbors = [[cx - 1, cz], [cx + 1, cz], [cx, cz - 1], [cx, cz + 1]];
    for (const [nx, nz] of neighbors) {
      const chunk = this.chunks.get(makeKey(nx, nz));
      if (chunk) chunk.rebuild();
    }
  }

  onWorkerMessage(worker, message) {
    const task = this.inflight.get(message.id);
    if (!task) return;
    this.inflight.delete(message.id);
    if (message.error) {
      console.error('Chunk generation error:', message.error);
      this.generationMode = 'main-thread';
      this.pending.push({ cx: task.cx, cz: task.cz, key: task.key, distance: task.distance });
      this.pendingKeys.add(task.key);
      for (const [id, otherTask] of this.inflight.entries()) {
        if (otherTask.worker === worker) {
          this.inflight.delete(id);
          if (!this.chunks.has(otherTask.key)) {
            this.pending.push({ cx: otherTask.cx, cz: otherTask.cz, key: otherTask.key, distance: otherTask.distance });
            this.pendingKeys.add(otherTask.key);
          }
        }
      }
      this.workers = this.workers.filter((item) => item !== worker);
      worker.terminate();
    } else if (!this.disposed && task.key === makeKey(message.cx, message.cz)) {
      this.addChunk(message.cx, message.cz, new Uint8Array(message.data));
    }
    this.pumpWorkers();
  }

  queueChunk(cx, cz, distance) {
    const key = makeKey(cx, cz);
    if (this.chunks.has(key) || this.pendingKeys.has(key)) return;
    for (const task of this.inflight.values()) if (task.key === key) return;
    this.pending.push({ cx, cz, key, distance });
    this.pendingKeys.add(key);
  }

  pumpWorkers() {
    if (this.disposed) return;
    if (this.generationMode === 'worker' && this.workers.length) {
      const busy = new Set([...this.inflight.values()].map((task) => task.worker));
      for (const worker of this.workers) {
        if (busy.has(worker) || !this.pending.length) continue;
        this.pending.sort((a, b) => a.distance - b.distance);
        const task = this.pending.shift();
        this.pendingKeys.delete(task.key);
        const id = this.requestId++;
        this.inflight.set(id, { ...task, worker });
        worker.postMessage({ id, cx: task.cx, cz: task.cz, seed: this.seed });
        busy.add(worker);
      }
    } else if (this.pending.length) {
      this.pending.sort((a, b) => a.distance - b.distance);
      const task = this.pending.shift();
      this.pendingKeys.delete(task.key);
      if (!this.chunks.has(task.key)) {
        const { data } = this.generator.generateChunkData(task.cx, task.cz);
        this.addChunk(task.cx, task.cz, data);
      }
    }
  }

  update(playerX, playerZ) {
    if (this.disposed) return;
    const centerX = Math.floor(playerX / CHUNK_SIZE);
    const centerZ = Math.floor(playerZ / CHUNK_SIZE);
    const centerKey = makeKey(centerX, centerZ);
    if (centerKey !== this.lastCenter) {
      this.lastCenter = centerKey;
      const desired = new Set();
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance > this.renderDistance + 0.35) continue;
          const cx = centerX + dx, cz = centerZ + dz;
          const key = makeKey(cx, cz);
          desired.add(key);
          this.queueChunk(cx, cz, distance);
        }
      }
      // A one-chunk safety ring prevents visible unload/reload flicker while turning at an edge.
      const unloadRadius = this.renderDistance + 1.7;
      for (const [key, chunk] of this.chunks) {
        const dx = chunk.cx - centerX, dz = chunk.cz - centerZ;
        if (Math.sqrt(dx * dx + dz * dz) > unloadRadius) {
          chunk.dispose();
          this.chunks.delete(key);
        }
      }
      this.pending = this.pending.filter((task) => {
        const dx = task.cx - centerX, dz = task.cz - centerZ;
        const keep = Math.sqrt(dx * dx + dz * dz) <= unloadRadius;
        if (!keep) this.pendingKeys.delete(task.key);
        return keep;
      });
    }
    // Worker mode dispatches every free worker; fallback mode advances one chunk per frame.
    this.pumpWorkers();
  }

  getBlock(x, y, z) {
    if (y < 0) return BLOCK.BEDROCK;
    if (y >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(makeKey(cx, cz));
    if (!chunk) return BLOCK.AIR;
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getLocal(lx, y, lz);
  }

  setBlock(x, y, z, id) {
    if (y < 1 || y >= WORLD_HEIGHT) return false;
    const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
    const key = makeKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return false;
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const index = lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);
    chunk.setLocal(lx, y, lz, id);
    this.overrides.set(makeBlockKey(x, y, z), id);
    if (!this.modsByChunk.has(key)) this.modsByChunk.set(key, new Map());
    this.modsByChunk.get(key).set(index, id);
    chunk.rebuild();
    if (lx === 0) this.chunks.get(makeKey(cx - 1, cz))?.rebuild();
    if (lx === CHUNK_SIZE - 1) this.chunks.get(makeKey(cx + 1, cz))?.rebuild();
    if (lz === 0) this.chunks.get(makeKey(cx, cz - 1))?.rebuild();
    if (lz === CHUNK_SIZE - 1) this.chunks.get(makeKey(cx, cz + 1))?.rebuild();
    return true;
  }

  sampleColumn(x, z) {
    return this.generator.sampleColumn(x, z);
  }

  getOverridesForSave() {
    const result = [];
    for (const [key, id] of this.overrides.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      result.push([x, y, z, id]);
    }
    return result;
  }

  loadOverrides(entries = []) {
    this.overrides.clear();
    this.modsByChunk.clear();
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length < 4) continue;
      const [x, y, z, id] = entry.map(Number);
      if (!Number.isFinite(x + y + z + id) || y < 1 || y >= WORLD_HEIGHT) continue;
      const key = makeBlockKey(x, y, z);
      this.overrides.set(key, id);
      const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
      const chunkKey = makeKey(cx, cz);
      const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const index = lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);
      if (!this.modsByChunk.has(chunkKey)) this.modsByChunk.set(chunkKey, new Map());
      this.modsByChunk.get(chunkKey).set(index, id);
      const chunk = this.chunks.get(chunkKey);
      if (chunk) chunk.setLocal(lx, y, lz, id);
    }
    for (const chunk of this.chunks.values()) if (chunk.dirty) chunk.rebuild();
  }

  get chunkCount() { return this.chunks.size; }

  dispose() {
    this.disposed = true;
    for (const worker of this.workers) worker.terminate();
    this.workers.length = 0;
    for (const chunk of this.chunks.values()) chunk.dispose();
    this.chunks.clear();
    this.pending.length = 0;
    this.pendingKeys.clear();
    this.inflight.clear();
    this.materials.solid.dispose();
    this.materials.water.dispose();
  }
}
