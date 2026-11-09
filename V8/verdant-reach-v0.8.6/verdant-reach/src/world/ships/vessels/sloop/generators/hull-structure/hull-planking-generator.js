import { hullSurfacePoint } from "../../architecture/hull-geometry.js";

export function buildHullPlanking(d,ctx){
  const {part,tube,materials}=ctx;
  const strakes=part('hull-strakes');
  const rows=12;
  for(const side of [-1,1]){
    for(let row=0;row<rows;row++){
      const level=0.12+row*0.78/(rows-1),line=[];
      for(let i=0;i<=144;i++){
        const t=0.006+0.988*i/144;
        const point=hullSurfacePoint(d,t,side,level);
        point.y+=0.010;
        line.push(point);
      }
      tube(strakes,line,Math.max(0.009,d.beamUnits*0.0019),row===0?materials.lower:materials.plank,'Loguivy-hull-strake-'+side+'-'+row,150);
    }
  }
}
