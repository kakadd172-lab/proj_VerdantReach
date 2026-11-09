import { buildMast } from "./mast-frame-generator.js";
export function buildMainmast(d,ctx,mast){if(mast?.id!=="main")throw new Error("snow: expected main mast definition");return buildMast(d,ctx,mast);}
