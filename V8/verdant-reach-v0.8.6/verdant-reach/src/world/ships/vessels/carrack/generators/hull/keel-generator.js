import { keelY, V } from "../../architecture/hull-geometry.js";
export function buildKeel(d,ctx){
 const {part,V,materials}=ctx;
 const keel=part('keel'),keelLine=[];for(let i=0;i<=26;i++){const t=i/26;keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
 ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,d.keelDetails.label,64);
}
