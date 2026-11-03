const UINT_SCALE = 1 / 4294967295;

export function hash32(x, y, z, seed = 1) {
  let h = (seed | 0) ^ Math.imul(x | 0, 0x9e3779b1) ^ Math.imul(y | 0, 0x85ebca77) ^ Math.imul(z | 0, 0xc2b2ae3d);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

export function random01(x, y = 0, z = 0, seed = 1) {
  return hash32(x, y, z, seed) * UINT_SCALE;
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function smooth(t) { return t * t * (3 - 2 * t); }
export function clamp01(v) { return Math.max(0, Math.min(1, v)); }

export function valueNoise2(x, z, seed = 1) {
  const x0 = Math.floor(x), z0 = Math.floor(z);
  const tx = smooth(x - x0), tz = smooth(z - z0);
  const a = random01(x0, 0, z0, seed) * 2 - 1;
  const b = random01(x0 + 1, 0, z0, seed) * 2 - 1;
  const c = random01(x0, 0, z0 + 1, seed) * 2 - 1;
  const d = random01(x0 + 1, 0, z0 + 1, seed) * 2 - 1;
  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

export function fbm2(x, z, seed = 1, octaves = 4, lacunarity = 2, persistence = 0.5) {
  let sum = 0, amplitude = 0.5, frequency = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2(x * frequency, z * frequency, seed + i * 1013) * amplitude;
    norm += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return norm ? sum / norm : 0;
}

export function valueNoise3(x, y, z, seed = 1) {
  const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
  const tx = smooth(x - x0), ty = smooth(y - y0), tz = smooth(z - z0);
  const c000 = random01(x0, y0, z0, seed) * 2 - 1;
  const c100 = random01(x0 + 1, y0, z0, seed) * 2 - 1;
  const c010 = random01(x0, y0 + 1, z0, seed) * 2 - 1;
  const c110 = random01(x0 + 1, y0 + 1, z0, seed) * 2 - 1;
  const c001 = random01(x0, y0, z0 + 1, seed) * 2 - 1;
  const c101 = random01(x0 + 1, y0, z0 + 1, seed) * 2 - 1;
  const c011 = random01(x0, y0 + 1, z0 + 1, seed) * 2 - 1;
  const c111 = random01(x0 + 1, y0 + 1, z0 + 1, seed) * 2 - 1;
  const x00 = lerp(c000, c100, tx), x10 = lerp(c010, c110, tx);
  const x01 = lerp(c001, c101, tx), x11 = lerp(c011, c111, tx);
  return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz);
}

export function fbm3(x, y, z, seed = 1, octaves = 3, lacunarity = 2, persistence = 0.5) {
  let sum = 0, amplitude = 0.5, frequency = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 1877) * amplitude;
    norm += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return norm ? sum / norm : 0;
}

export function seedFromString(value) {
  const text = String(value ?? '').trim() || 'wildrift';
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

export function randomSeedString() {
  const a = Math.floor(Math.random() * 0xffffffff).toString(36).toUpperCase();
  const b = Math.floor(Math.random() * 0xffff).toString(36).toUpperCase();
  return `${a}-${b}`;
}
