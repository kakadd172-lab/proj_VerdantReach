/**
 * Deterministic 2D world collision for upright actors.
 *
 * Static world geometry is represented by circles and oriented boxes. A spatial
 * hash keeps queries local even when the world contains thousands of colliders.
 * Movement uses swept substeps and iterative depenetration, allowing a character
 * to stop at walls and slide along them without tunnelling through thin panels.
 */
const EPSILON = 1e-7;

export function circleCollider(id, x, z, radius, metadata = {}) {
  return { id: String(id), type: 'circle', x: Number(x), z: Number(z), radius: Math.max(0, Number(radius) || 0), ...metadata };
}

export function boxCollider(id, x, z, width, depth, yaw = 0, metadata = {}) {
  return {
    id: String(id), type: 'box', x: Number(x), z: Number(z),
    halfWidth: Math.max(0, Number(width) || 0) * 0.5,
    halfDepth: Math.max(0, Number(depth) || 0) * 0.5,
    yaw: Number(yaw) || 0, ...metadata,
  };
}

function validBody(body) {
  if (!body || (body.type !== 'circle' && body.type !== 'box')) return false;
  if (!Number.isFinite(body.x) || !Number.isFinite(body.z)) return false;
  if (body.type === 'circle') return Number.isFinite(body.radius) && body.radius > 0;
  return Number.isFinite(body.halfWidth) && Number.isFinite(body.halfDepth) && body.halfWidth > 0 && body.halfDepth > 0;
}

function bodyBounds(body) {
  if (body.type === 'circle') return {
    minX: body.x - body.radius, maxX: body.x + body.radius,
    minZ: body.z - body.radius, maxZ: body.z + body.radius,
  };
  const c = Math.cos(body.yaw), s = Math.sin(body.yaw);
  const extentX = Math.abs(c) * body.halfWidth + Math.abs(s) * body.halfDepth;
  const extentZ = Math.abs(s) * body.halfWidth + Math.abs(c) * body.halfDepth;
  return {
    minX: body.x - extentX, maxX: body.x + extentX,
    minZ: body.z - extentZ, maxZ: body.z + extentZ,
  };
}

function cellKey(x, z) { return x + ':' + z; }

function fallbackNormal(id) {
  let hash = 0;
  const value = String(id ?? 'collision');
  for (let i = 0; i < value.length; i += 1) hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  const sign = hash & 1 ? 1 : -1;
  return hash & 2 ? { x: 0, z: sign } : { x: sign, z: 0 };
}

function pushOutOfCircle(x, z, radius, body) {
  const dx = x - body.x, dz = z - body.z;
  let distance = Math.hypot(dx, dz);
  const required = radius + body.radius;
  if (distance >= required - EPSILON) return null;
  const normal = distance > EPSILON ? { x: dx / distance, z: dz / distance } : fallbackNormal(body.id);
  if (distance <= EPSILON) distance = 0;
  const penetration = required - distance + EPSILON;
  return { x: x + normal.x * penetration, z: z + normal.z * penetration, normal, penetration };
}

function pushOutOfBox(x, z, radius, body) {
  const dx = x - body.x, dz = z - body.z;
  const c = Math.cos(body.yaw), s = Math.sin(body.yaw);
  const localX = c * dx - s * dz;
  const localZ = s * dx + c * dz;
  const closestX = Math.max(-body.halfWidth, Math.min(body.halfWidth, localX));
  const closestZ = Math.max(-body.halfDepth, Math.min(body.halfDepth, localZ));
  let normalX = localX - closestX, normalZ = localZ - closestZ;
  let distance = Math.hypot(normalX, normalZ);
  if (distance >= radius - EPSILON) return null;

  if (distance > EPSILON) {
    normalX /= distance; normalZ /= distance;
  } else {
    const faces = [
      { distance: localX + body.halfWidth, x: -1, z: 0 },
      { distance: body.halfWidth - localX, x: 1, z: 0 },
      { distance: localZ + body.halfDepth, x: 0, z: -1 },
      { distance: body.halfDepth - localZ, x: 0, z: 1 },
    ].sort((a, b) => a.distance - b.distance);
    normalX = faces[0].x; normalZ = faces[0].z; distance = -faces[0].distance;
  }
  const penetration = radius - distance + EPSILON;
  const worldNormal = { x: c * normalX + s * normalZ, z: -s * normalX + c * normalZ };
  return {
    x: x + worldNormal.x * penetration,
    z: z + worldNormal.z * penetration,
    normal: worldNormal,
    penetration,
  };
}

export class CollisionWorld {
  constructor(cellSize = 24) {
    this.cellSize = Math.max(4, Number(cellSize) || 24);
    this.bodies = new Map();
    this.owners = new Map();
    this.cells = new Map();
  }

  _cellRange(bounds) {
    return {
      minX: Math.floor(bounds.minX / this.cellSize),
      maxX: Math.floor(bounds.maxX / this.cellSize),
      minZ: Math.floor(bounds.minZ / this.cellSize),
      maxZ: Math.floor(bounds.maxZ / this.cellSize),
    };
  }

  _insert(body) {
    const range = this._cellRange(bodyBounds(body));
    body._cellKeys = [];
    for (let z = range.minZ; z <= range.maxZ; z += 1) {
      for (let x = range.minX; x <= range.maxX; x += 1) {
        const key = cellKey(x, z);
        let cell = this.cells.get(key);
        if (!cell) this.cells.set(key, (cell = new Set()));
        cell.add(body.id);
        body._cellKeys.push(key);
      }
    }
  }

  _remove(body) {
    for (const key of body._cellKeys ?? []) {
      const cell = this.cells.get(key);
      if (!cell) continue;
      cell.delete(body.id);
      if (cell.size === 0) this.cells.delete(key);
    }
  }

  setBodies(ownerId, bodies = []) {
    this.removeBodies(ownerId);
    const owner = String(ownerId);
    const ids = new Set();
    let index = 0;
    for (const input of bodies) {
      if (!validBody(input)) continue;
      const id = owner + ':' + String(input.id ?? index++);
      if (this.bodies.has(id)) continue;
      const body = { ...input, id, owner, sourceId: input.sourceId ?? owner, _cellKeys: [] };
      this.bodies.set(id, body);
      ids.add(id);
      this._insert(body);
    }
    if (ids.size) this.owners.set(owner, ids);
    return ids.size;
  }

  removeBodies(ownerId) {
    const owner = String(ownerId);
    const ids = this.owners.get(owner);
    if (!ids) return 0;
    for (const id of ids) {
      const body = this.bodies.get(id);
      if (!body) continue;
      this._remove(body);
      this.bodies.delete(id);
    }
    this.owners.delete(owner);
    return ids.size;
  }

  clear() { this.bodies.clear(); this.owners.clear(); this.cells.clear(); }
  get size() { return this.bodies.size; }

  _query(minX, minZ, maxX, maxZ) {
    const range = this._cellRange({ minX, minZ, maxX, maxZ });
    const found = new Set();
    for (let z = range.minZ; z <= range.maxZ; z += 1) {
      for (let x = range.minX; x <= range.maxX; x += 1) {
        const cell = this.cells.get(cellKey(x, z));
        if (cell) for (const id of cell) found.add(id);
      }
    }
    return [...found].map(id => this.bodies.get(id)).filter(Boolean);
  }

  queryCircle(x, z, radius) { return this._query(x - radius, z - radius, x + radius, z + radius); }

  isCircleFree(x, z, radius, options = {}) {
    const ignored = new Set(options.ignoreIds ?? []);
    for (const body of this.queryCircle(x, z, radius)) {
      if (ignored.has(body.id) || ignored.has(body.sourceId) || ignored.has(body.owner)) continue;
      const hit = body.type === 'circle' ? pushOutOfCircle(x, z, radius, body) : pushOutOfBox(x, z, radius, body);
      if (hit) return false;
    }
    return true;
  }

  resolveCircle(x, z, radius, options = {}) {
    let resolvedX = Number(x) || 0, resolvedZ = Number(z) || 0;
    const actorRadius = Math.max(0, Number(radius) || 0);
    const ignored = new Set(options.ignoreIds ?? []);
    const maxIterations = Math.max(1, Math.min(16, options.maxIterations ?? 8));
    const contacts = new Map();
    let collided = false;
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      let changed = false;
      for (const body of this.queryCircle(resolvedX, resolvedZ, actorRadius + 0.02)) {
        if (ignored.has(body.id) || ignored.has(body.sourceId) || ignored.has(body.owner)) continue;
        const hit = body.type === 'circle' ? pushOutOfCircle(resolvedX, resolvedZ, actorRadius, body) : pushOutOfBox(resolvedX, resolvedZ, actorRadius, body);
        if (!hit) continue;
        resolvedX = hit.x; resolvedZ = hit.z;
        contacts.set(body.id, { id: body.id, sourceId: body.sourceId, owner: body.owner, normal: hit.normal });
        collided = true; changed = true;
      }
      if (!changed) break;
    }
    return { x: resolvedX, z: resolvedZ, collided, contacts: [...contacts.values()] };
  }

  moveCircle(x, z, deltaX, deltaZ, radius, options = {}) {
    const startX = Number(x) || 0, startZ = Number(z) || 0;
    const dx = Number(deltaX) || 0, dz = Number(deltaZ) || 0;
    const distance = Math.hypot(dx, dz);
    const maxStep = Math.max(0.12, Math.min(0.65, Number(options.maxStep) || 0.36));
    const maxSubsteps = Math.max(1, Math.min(512, options.maxSubsteps ?? 256));
    const steps = Math.max(1, Math.min(maxSubsteps, Math.ceil(distance / maxStep)));
    const stepX = dx / steps, stepZ = dz / steps;
    let currentX = startX, currentZ = startZ, collided = false;
    const contacts = new Map();
    for (let step = 0; step < steps; step += 1) {
      const resolved = this.resolveCircle(currentX + stepX, currentZ + stepZ, radius, options);
      currentX = resolved.x; currentZ = resolved.z;
      if (resolved.collided) collided = true;
      for (const contact of resolved.contacts) contacts.set(contact.id, contact);
    }
    return {
      x: currentX, z: currentZ,
      movedX: currentX - startX, movedZ: currentZ - startZ,
      collided, contacts: [...contacts.values()],
    };
  }
}
