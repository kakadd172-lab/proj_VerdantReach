import { buildMast } from './mast-frame-generator.js';
export function buildMainmast(d,ctx,mast){if(mast?.id!=='main')throw new Error('war-galleon: expected main mast');return buildMast(d,ctx,mast);}
