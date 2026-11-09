import { keelY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildKeel(d,ctx){
  const {part,V,materials}=ctx;
  const keel=part('keel'),keelLine=[];
  for(let i=0;i<=96;i++){
    const t=i/96;
    keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,stationZ(d,t,0)));
  }
  ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,'Loguivy-keel-and-deadwood',128);
}
