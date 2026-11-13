import { buildMast } from './mast-frame-generator.js';
export function buildForemast(d, ctx, mast) {
  if (mast?.id !== 'fore') throw new Error('Wargalion foremast generator received an invalid mast.');
  return buildMast(d, ctx, mast);
}
