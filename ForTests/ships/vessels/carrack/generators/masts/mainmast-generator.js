import { buildMast } from "./mast-frame-generator.js";
export function buildMainmast(d,ctx,mast){
 if(mast?.id!=="main")throw new Error("carrack: expected main mast definition");
 return buildMast(d,ctx,mast);
}
