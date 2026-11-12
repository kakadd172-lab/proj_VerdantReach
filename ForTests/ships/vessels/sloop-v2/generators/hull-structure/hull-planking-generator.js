import { hullSurfacePoint } from '../../architecture/hull-geometry.js';
export function buildHullPlanking(d,ctx){
 const {part,tube,materials}=ctx,strakes=part('hull-strakes'),rows=11;
 for(const side of [-1,1])for(let row=0;row<rows;row++){
  const level=.12+row*.78/(rows-1),points=[];
  for(let i=0;i<=124;i++){const t=.012+.976*i/124,p=hullSurfacePoint(d,t,side,level);p.y+=.011;points.push(p);}
  tube(strakes,points,Math.max(.009,d.beamUnits*.0019),row===0?materials.lower:materials.plank,'sloop-v2-hull-strake-'+side+'-'+row,132);
 }
}
