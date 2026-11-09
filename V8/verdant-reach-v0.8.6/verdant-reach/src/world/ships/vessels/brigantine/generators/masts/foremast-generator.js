import { buildMast } from "./mast-frame-generator.js";
export function buildForemast(d,ctx,mast){
 if(mast?.id!=="fore")throw new Error("brigantine: expected fore mast definition");
 return buildMast(d,ctx,mast);
}
