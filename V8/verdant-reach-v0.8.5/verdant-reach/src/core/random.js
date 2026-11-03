export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function hashString(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

export function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 0x1f123bb5) ^ Math.imul(y | 0, 0x5f356495) ^ (seed >>> 0);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return (h ^ (h >>> 15)) >>> 0;
}

export function random2(x, y, seed = 0) {
  return hash2(x, y, seed) / 4294967295;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function chunkSeed(seed, cx, cz, salt = 0) {
  return hash2(cx, cz, (seed ^ salt) >>> 0);
}

export function seededRandom(seed, cx = 0, cz = 0, salt = 0) {
  return mulberry32(chunkSeed(seed, cx, cz, salt));
}

export function formatSeed(seed) {
  return String(seed).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32) || 'EMBERFALL';
}
