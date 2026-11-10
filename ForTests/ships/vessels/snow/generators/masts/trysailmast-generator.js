import { buildMast } from "./mast-frame-generator.js";
export function buildTrysailmast(d,ctx,mast){if(mast?.id!=="trysail")throw new Error("snow: expected trysail mast definition");return buildMast(d,ctx,mast);}
