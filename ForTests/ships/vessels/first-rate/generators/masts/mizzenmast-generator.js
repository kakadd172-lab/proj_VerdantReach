import { buildMast } from "./mast-frame-generator.js";
export function buildMizzenmast(d,ctx,mast){if(mast?.id!=="mizzen")throw new Error("first-rate: expected mizzen mast definition");return buildMast(d,ctx,mast);}
