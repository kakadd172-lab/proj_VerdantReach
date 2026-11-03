const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function pushHeap(heap, node) {
  let i = heap.length;
  heap.push(node);
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p].f <= node.f) break;
    heap[i] = heap[p];
    i = p;
  }
  heap[i] = node;
}

function popHeap(heap) {
  const first = heap[0];
  const last = heap.pop();
  if (heap.length && last) {
    let i = 0;
    while (true) {
      const left = i * 2 + 1;
      const right = left + 1;
      if (left >= heap.length) break;
      const child = right < heap.length && heap[right].f < heap[left].f ? right : left;
      if (heap[child].f >= last.f) break;
      heap[i] = heap[child];
      i = child;
    }
    heap[i] = last;
  }
  return first;
}

/** Lightweight port-to-port shipping with a bounded water-only A* route. */
export class MaritimeSystem {
  constructor(generator, saved = null) {
    this.generator = generator;
    this.routes = new Map((saved?.routes ?? []).map((route) => [route.id, { ...route, path: route.path?.map((point) => ({ ...point })) ?? [] }]));
    this.voyages = Array.isArray(saved?.voyages) ? saved.voyages.map((voyage) => ({ ...voyage, cargo: { ...(voyage.cargo ?? {}) }, path: voyage.path?.map((point) => ({ ...point })) ?? [] })) : [];
    this.lastRouteDay = { ...(saved?.lastRouteDay ?? {}) };
    this.lastKnownPortSignature = '';
  }

  _waterAccess(settlement) {
    if (Number.isFinite(settlement.waterX) && Number.isFinite(settlement.waterZ)) {
      return { x: settlement.waterX, z: settlement.waterZ };
    }
    let best = null;
    for (let radius = 12; radius <= 300; radius += 12) {
      for (let i = 0; i < 24; i += 1) {
        const angle = i * Math.PI * 2 / 24;
        const x = settlement.x + Math.cos(angle) * radius;
        const z = settlement.z + Math.sin(angle) * radius;
        const height = this.generator.heightAt(x, z);
        if (height <= 1.2) {
          best = { x, z };
          break;
        }
      }
      if (best) break;
    }
    return best;
  }

  _waterRoute(from, to) {
    const step = Math.hypot(to.x - from.x, to.z - from.z) > 12000 ? 260 : 180;
    const sx = Math.round(from.x / step);
    const sz = Math.round(from.z / step);
    const tx = Math.round(to.x / step);
    const tz = Math.round(to.z / step);
    const margin = 12;
    const minX = Math.min(sx, tx) - margin;
    const maxX = Math.max(sx, tx) + margin;
    const minZ = Math.min(sz, tz) - margin;
    const maxZ = Math.max(sz, tz) + margin;
    if ((maxX - minX + 1) * (maxZ - minZ + 1) > 90000) return null;
    const keyOf = (x, z) => `${x}:${z}`;
    const heuristic = (x, z) => Math.hypot(tx - x, tz - z);
    const startKey = keyOf(sx, sz);
    const open = [];
    const best = new Map([[startKey, 0]]);
    const came = new Map();
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    pushHeap(open, { x: sx, z: sz, g: 0, f: heuristic(sx, sz) });
    let visited = 0;
    let found = false;
    while (open.length && visited < 26000) {
      const current = popHeap(open);
      const currentKey = keyOf(current.x, current.z);
      if (current.g > (best.get(currentKey) ?? Infinity) + 1e-6) continue;
      if (Math.hypot(current.x - tx, current.z - tz) <= 1) {
        found = true;
        break;
      }
      visited += 1;
      for (const [dx, dz] of directions) {
        const nx = current.x + dx;
        const nz = current.z + dz;
        if (nx < minX || nx > maxX || nz < minZ || nz > maxZ) continue;
        const height = this.generator.heightAt(nx * step, nz * step);
        if (height > 1.7) continue;
        const move = dx && dz ? Math.SQRT2 : 1;
        const shallowPenalty = height > -1 ? 0.24 : 0;
        const ng = current.g + move * (1 + shallowPenalty);
        const nextKey = keyOf(nx, nz);
        if (ng >= (best.get(nextKey) ?? Infinity)) continue;
        best.set(nextKey, ng);
        came.set(nextKey, currentKey);
        pushHeap(open, { x: nx, z: nz, g: ng, f: ng + heuristic(nx, nz) });
      }
    }
    if (!found) return null;
    const endKey = keyOf(tx, tz);
    const reversed = [{ x: tx * step, z: tz * step }];
    let key = endKey;
    while (key !== startKey && reversed.length < 2000) {
      const previous = came.get(key);
      if (!previous) break;
      const [x, z] = previous.split(':').map(Number);
      reversed.push({ x: x * step, z: z * step });
      key = previous;
    }
    reversed.reverse();
    const path = [from, ...reversed, to];
    let distance = 0;
    for (let i = 1; i < path.length; i += 1) distance += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
    return { path, distance };
  }

  registerPorts(settlements) {
    const ports = (settlements ?? []).filter((settlement) => settlement.coastAccess || settlement.type === 'port').slice(0, 14);
    const signature = ports.map((port) => port.id).sort().join('|');
    if (signature === this.lastKnownPortSignature) return [...this.routes.values()];
    this.lastKnownPortSignature = signature;
    for (let i = 0; i < ports.length; i += 1) {
      for (let j = i + 1; j < ports.length; j += 1) {
        const a = ports[i];
        const b = ports[j];
        if (Math.hypot(a.x - b.x, a.z - b.z) > 24000) continue;
        const id = `sea-route:${[a.id, b.id].sort().join('|')}`;
        if (this.routes.has(id)) continue;
        const waterA = this._waterAccess(a);
        const waterB = this._waterAccess(b);
        if (!waterA || !waterB) continue;
        const route = this._waterRoute(waterA, waterB);
        if (!route || route.path.length < 3) continue;
        this.routes.set(id, { id, fromId: a.id, toId: b.id, path: route.path, distance: route.distance });
      }
    }
    return [...this.routes.values()];
  }

  removePort(id) {
    const key = String(id);
    const removedRouteIds = [];
    for (const [routeId, route] of this.routes) {
      if (route.fromId !== key && route.toId !== key) continue;
      this.routes.delete(routeId);
      delete this.lastRouteDay[routeId];
      removedRouteIds.push(routeId);
    }
    const before = this.voyages.length;
    this.voyages = this.voyages.filter((voyage) => voyage.fromId !== key && voyage.toId !== key);
    return { routes: removedRouteIds.length, voyages: before - this.voyages.length };
  }

  _dispatch(route, day, states) {
    if (this.voyages.some((voyage) => voyage.routeId === route.id && voyage.status === 'enroute')) return null;
    const last = this.lastRouteDay[route.id] ?? -20;
    if (day - last < 5) return null;
    const a = states.get(route.fromId);
    const b = states.get(route.toId);
    if (!a || !b) return null;
    const goods = ['rations', 'fish', 'herbs', 'timber'];
    let selection = null;
    for (const item of goods) {
      const av = Number(a.stock?.[item] ?? 0);
      const bv = Number(b.stock?.[item] ?? 0);
      const [origin, destination, surplus] = av >= bv ? [a, b, av - bv] : [b, a, bv - av];
      if (surplus < 4) continue;
      const quantity = Math.min(5, Math.floor(surplus - 1));
      const price = quantity * ({ rations: 4, fish: 3, herbs: 3, timber: 5 }[item]);
      if (origin.stock[item] < quantity || destination.wealth < price) continue;
      selection = { item, quantity, price, origin, destination, fromId: origin.id, toId: destination.id };
      break;
    }
    if (!selection) return null;
    selection.origin.stock[selection.item] -= selection.quantity;
    selection.destination.wealth -= selection.price;
    const duration = Math.max(0.75, route.distance / 5200);
    const voyage = {
      id: `voyage:${route.id}:${Math.floor(day)}`,
      routeId: route.id,
      fromId: selection.fromId,
      toId: selection.toId,
      cargo: { resource: selection.item, quantity: selection.quantity },
      payment: selection.price,
      path: route.path.map((point) => ({ ...point })),
      distance: route.distance,
      departureDay: day,
      arrivalDay: day + duration,
      status: 'enroute',
    };
    this.voyages.push(voyage);
    this.lastRouteDay[route.id] = day;
    return voyage;
  }

  advanceTo(absoluteDay, civilization) {
    const day = Math.max(1, Number(absoluteDay) || 1);
    const states = civilization?.states;
    if (!states) return;
    for (const voyage of this.voyages) {
      if (voyage.status !== 'enroute' || voyage.arrivalDay > day) continue;
      const destination = states.get(voyage.toId);
      const origin = states.get(voyage.fromId);
      if (destination) destination.stock[voyage.cargo.resource] = clamp((destination.stock[voyage.cargo.resource] ?? 0) + voyage.cargo.quantity, 0, 999);
      if (origin) origin.wealth = clamp(origin.wealth + voyage.payment, 0, 100000);
      voyage.status = 'delivered';
      voyage.deliveredDay = day;
    }
    this.voyages = this.voyages.filter((voyage) => voyage.status === 'enroute' || day - (voyage.deliveredDay ?? day) <= 5);
    for (const route of this.routes.values()) this._dispatch(route, day, states);
  }

  getSaveData() {
    return {
      routes: [...this.routes.values()].map((route) => ({ ...route, path: route.path.map((point) => ({ ...point })) })),
      voyages: this.voyages.map((voyage) => ({ ...voyage, cargo: { ...voyage.cargo }, path: voyage.path.map((point) => ({ ...point })) })),
      lastRouteDay: { ...this.lastRouteDay },
    };
  }
}
