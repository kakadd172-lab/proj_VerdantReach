import { buildMast } from "./mast-frame-generator.js";
export function buildSinglemast(d,ctx,mast){if(mast?.id!=="single")throw new Error("pinnace: expected single mast definition");return buildMast(d,ctx,mast);}
