import { lerp } from '../core/random.js';
import { hash2 } from '../core/random.js';

const GRADIENTS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.70710678, 0.70710678], [-0.70710678, 0.70710678],
  [0.70710678, -0.70710678], [-0.70710678, -0.70710678],
];

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function gradientDot(ix, iz, x, z, seed) {
  const gradient = GRADIENTS[hash2(ix, iz, seed) & 7];
  return gradient[0] * (x - ix) + gradient[1] * (z - iz);
}

export function perlin2(x, z, seed = 0) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const u = fade(x - ix);
  const v = fade(z - iz);
  const n00 = gradientDot(ix, iz, x, z, seed);
  const n10 = gradientDot(ix + 1, iz, x, z, seed);
  const n01 = gradientDot(ix, iz + 1, x, z, seed);
  const n11 = gradientDot(ix + 1, iz + 1, x, z, seed);
  return (lerp(lerp(n00, n10, u), lerp(n01, n11, u), v) * 1.41421356);
}

export function fbm2(x, z, seed = 0, octaves = 5, lacunarity = 2.03, persistence = 0.5) {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    total += perlin2(x * frequency, z * frequency, (seed + i * 1013) >>> 0) * amplitude;
    norm += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return total / norm;
}

export function ridgedFbm2(x, z, seed = 0, octaves = 5) {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    const n = 1 - Math.abs(perlin2(x * frequency, z * frequency, (seed + i * 1999) >>> 0));
    total += n * n * amplitude;
    norm += amplitude;
    amplitude *= 0.52;
    frequency *= 2.08;
  }
  return total / norm;
}

export function warp2(x, z, seed, strength = 1) {
  const wx = fbm2(x + 17.1, z - 8.3, seed + 71, 3) * strength;
  const wz = fbm2(x - 5.7, z + 29.4, seed + 193, 3) * strength;
  return [x + wx, z + wz];
}

export function domainFbm(x, z, seed, frequency, strength = 1, octaves = 5) {
  const [wx, wz] = warp2(x * frequency, z * frequency, seed, strength);
  return fbm2(wx, wz, seed + 409, octaves);
}
