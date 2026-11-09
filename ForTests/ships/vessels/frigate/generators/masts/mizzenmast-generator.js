import { buildMast } from "./mast-frame-generator.js";
export function buildMizzenmast(d,ctx,mast){if(mast?.id!=="mizzen")throw new Error("frigate: expected mizzen mast definition");return buildMast(d,ctx,mast);}
