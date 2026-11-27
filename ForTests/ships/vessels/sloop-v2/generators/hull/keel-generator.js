import { keelY,V } from '../../architecture/hull-geometry.js';
export function buildKeel(d,ctx){
 const {part,tube,materials}=ctx,keel=part('keel'),line=[];
 for(let i=0;i<=56;i++){const t=i/56;line.push(V(0,keelY(d,t)-d.beamUnits*.018,(t-.5)*d.hullLengthUnits));}
 tube(keel,line,Math.max(.075,d.beamUnits*.016),materials.lower,'sloop-v2-rockered-keel',72);
}
