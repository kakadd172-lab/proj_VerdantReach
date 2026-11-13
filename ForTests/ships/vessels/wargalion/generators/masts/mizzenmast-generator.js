import { buildMast } from './mast-frame-generator.js';
export function buildMizzenmast(d, ctx, mast) {
  if (mast?.id !== 'mizzen') throw new Error('Wargalion mizzenmast generator received an invalid mast.');
  return buildMast(d, ctx, mast);
}
