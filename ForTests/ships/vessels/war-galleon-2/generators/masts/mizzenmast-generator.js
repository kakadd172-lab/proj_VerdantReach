import { buildMast } from "./mast-frame-generator.js";
export function buildMizzenmast(d,ctx,mast){if(mast?.id!=="mizzen")throw new Error("war-galleon-2: expected mizzen mast definition");return buildMast(d,ctx,mast);}
