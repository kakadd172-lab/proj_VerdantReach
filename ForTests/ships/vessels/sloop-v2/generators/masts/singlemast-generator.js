import { buildMast } from './mast-frame-generator.js';

/** Sloop V2's vessel-specific single gaff-mast assembly. */
export function buildSingleMast(design,context,mast){
  return buildMast(design,context,mast);
}
