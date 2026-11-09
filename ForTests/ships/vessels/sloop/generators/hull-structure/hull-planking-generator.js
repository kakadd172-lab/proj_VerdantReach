import { hullSurfacePoint } from "../../architecture/hull-geometry.js";

export function buildHullPlanking(d,ctx){
  const {part,tube,materials}=ctx;
  const strakes=part('hull-strakes'),rows=9;
  for(const side of [-1,1]){
    for(let row=0;row<rows;row++){
      const level=0.14+row*0.72/Math.max(1,rows-1),line=[];
      for(let i=0;i<=84;i++){
        const t=0.012+0.976*i/84;
        const point=hullSurfacePoint(d,t,side,level);
        point.y+=0.014;
        line.push(point);
      }
      tube(strakes,line,Math.max(0.013,d.beamUnits*0.0028),row===0?materials.lower:materials.plank,'sloop-strake-'+side+'-'+row,88);
    }
  }
}
