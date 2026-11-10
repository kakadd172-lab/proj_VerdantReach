import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildHullPlanking(d,ctx){const {part,tube,materials}=ctx;
const strakes=part('hull-strakes'),rows=8;
 for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.12+row*.76/Math.max(1,rows-1),line=[];
  for(let i=0;i<=68;i++){const t=.018+.964*i/68,a=Math.acos(2*level-1),q=hullPoint(d,t,side<0?-a:a);q.x=Math.abs(q.x)*side;q.y+=.018;line.push(q);}
  tube(strakes,line,Math.max(.015,d.beamUnits*.0032),row===0?materials.lower:materials.plank,'frigate-strake-'+side+'-'+row,72);
 }
}
