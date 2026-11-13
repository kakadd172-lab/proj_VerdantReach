import { buildMast } from "./mast-frame-generator.js";
export function buildForemast(d,ctx,mast){if(mast?.id!=="fore")throw new Error("galleon: expected fore mast definition");return buildMast(d,ctx,mast);}
