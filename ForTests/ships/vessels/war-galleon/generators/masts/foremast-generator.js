import { buildMast } from './mast-frame-generator.js';
export function buildForemast(d,ctx,mast){if(mast?.id!=='fore')throw new Error('war-galleon: expected fore mast');return buildMast(d,ctx,mast);}
