import { hullPoint, V } from '../../architecture/hull-geometry.js';
export function buildHullPlanking(d,ctx){
  const strakes=ctx.part('hull-strakes'),rows=11;
  for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.08+row*.82/(rows-1),angle=Math.acos(2*level-1),line=[];for(let i=0;i<=84;i++){const t=.012+.976*i/84,p=hullPoint(d,t,side<0?-angle:angle);line.push(V(Math.abs(p.x)*side,p.y+.014,p.z));}ctx.tube(strakes,line,Math.max(.014,d.beamUnits*.0027),row===0?ctx.materials.lower:ctx.materials.plank,'war-galleon-hull-strake-'+side+'-'+row,88);}
}
