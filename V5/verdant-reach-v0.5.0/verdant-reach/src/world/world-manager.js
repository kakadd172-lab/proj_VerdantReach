import { createChunk } from './chunk.js';

export class WorldManager {
  constructor(scene, generator, sharedAssets, options = {}) {
    this.scene = scene;
    this.generator = generator;
    this.sharedAssets = sharedAssets;
    this.chunkSize = options.chunkSize ?? 88;
    this.resolution = options.resolution ?? 44;
    this.radius = options.radius ?? 3;
    this.chunks = new Map();
    this.pending = new Map();
    this.lastCenter = null;
    this.interactables = [];
    this.renderOriginX = 0;
    this.renderOriginZ = 0;
    this.onChunkLoaded = options.onChunkLoaded ?? (() => {});
  }

  _key(cx, cz) {
    return `${cx}:${cz}`;
  }

  setRenderOrigin(x, z) {
    this.renderOriginX = Math.floor(x / this.chunkSize) * this.chunkSize;
    this.renderOriginZ = Math.floor(z / this.chunkSize) * this.chunkSize;
    for (const chunk of this.chunks.values()) {
      chunk.group.position.set(-this.renderOriginX, 0, -this.renderOriginZ);
    }
    return { x: this.renderOriginX, z: this.renderOriginZ };
  }

  rebaseIfNeeded(playerX, playerZ) {
    const dx = playerX - this.renderOriginX;
    const dz = playerZ - this.renderOriginZ;
    if (Math.abs(dx) <= this.chunkSize * 4 && Math.abs(dz) <= this.chunkSize * 4) return null;
    const oldX = this.renderOriginX;
    const oldZ = this.renderOriginZ;
    this.setRenderOrigin(playerX, playerZ);
    return { x: this.renderOriginX - oldX, z: this.renderOriginZ - oldZ };
  }

  update(playerX, playerZ) {
    const centerX = Math.floor(playerX / this.chunkSize);
    const centerZ = Math.floor(playerZ / this.chunkSize);
    if (this.lastCenter && this.lastCenter.x === centerX && this.lastCenter.z === centerZ) return;
    this.lastCenter = { x: centerX, z: centerZ };
    const wanted = new Set();
    const queue = [];
    for (let dz = -this.radius; dz <= this.radius; dz += 1) {
      for (let dx = -this.radius; dx <= this.radius; dx += 1) {
        const cx = centerX + dx;
        const cz = centerZ + dz;
        const key = this._key(cx, cz);
        wanted.add(key);
        if (!this.chunks.has(key) && !this.pending.has(key)) {
          queue.push({ cx, cz, key, distance: dx * dx + dz * dz });
        }
      }
    }
    queue.sort((a, b) => a.distance - b.distance);
    for (const item of queue) this.pending.set(item.key, item);

    for (const [key, chunk] of this.chunks) {
      if (!wanted.has(key)) {
        chunk.dispose();
        this.chunks.delete(key);
        this._rebuildInteractables();
      }
    }

    if (this.pending.size > 0) {
      const keep = [...this.pending.values()].sort((a, b) => {
        const da = (a.cx - centerX) ** 2 + (a.cz - centerZ) ** 2;
        const db = (b.cx - centerX) ** 2 + (b.cz - centerZ) ** 2;
        return da - db;
      });
      this.pending = new Map(keep.filter((item) => wanted.has(item.key)).map((item) => [item.key, item]));
    }
  }

  processQueue(maxChunks = 1) {
    let made = 0;
    const items = [...this.pending.values()];
    for (const item of items) {
      if (made >= maxChunks) break;
      this.pending.delete(item.key);
      if (this.chunks.has(item.key)) continue;
      const chunk = createChunk(this.generator, item.cx, item.cz, {
        scene: this.scene,
        size: this.chunkSize,
        resolution: this.resolution,
        shared: this.sharedAssets,
      });
      chunk.group.position.set(-this.renderOriginX, 0, -this.renderOriginZ);
      this.chunks.set(item.key, chunk);
      this.onChunkLoaded(chunk);
      made += 1;
    }
    if (made) this._rebuildInteractables();
    return made;
  }

  invalidateAll() {
    for (const chunk of this.chunks.values()) chunk.dispose();
    this.chunks.clear();
    this.pending.clear();
    this.interactables = [];
    this.lastCenter = null;
  }

  _rebuildInteractables() {
    this.interactables = [];
    for (const chunk of this.chunks.values()) this.interactables.push(...chunk.interactables);
  }

  nearestInteractable(x, z, maxDistance = 5.2) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const object of this.interactables) {
      if (object.userData.collected || object.userData.discovered) continue;
      const dx = object.position.x - x;
      const dz = object.position.z - z;
      const distance = dx * dx + dz * dz;
      if (distance < best) {
        best = distance;
        nearest = object;
      }
    }
    return nearest ? { object: nearest, distance: Math.sqrt(best) } : null;
  }

  findInteractableById(id) {
    return this.interactables.find((item) => item.userData.interactable?.id === id) ?? null;
  }

  dispose() {
    for (const chunk of this.chunks.values()) chunk.dispose();
    this.chunks.clear();
    this.pending.clear();
    this.interactables = [];
    this.lastCenter = null;
  }
}
