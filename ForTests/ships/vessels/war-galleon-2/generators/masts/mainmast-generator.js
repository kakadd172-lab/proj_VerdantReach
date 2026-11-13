import { buildMast } from "./mast-frame-generator.js";
export function buildMainmast(d,ctx,mast){if(mast?.id!=="main")throw new Error("war-galleon-2: expected main mast definition");return buildMast(d,ctx,mast);}
