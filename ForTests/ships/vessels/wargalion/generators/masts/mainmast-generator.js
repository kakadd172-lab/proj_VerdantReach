import { buildMast } from './mast-frame-generator.js';
export function buildMainmast(d, ctx, mast) {
  if (mast?.id !== 'main') throw new Error('Wargalion mainmast generator received an invalid mast.');
  return buildMast(d, ctx, mast);
}
