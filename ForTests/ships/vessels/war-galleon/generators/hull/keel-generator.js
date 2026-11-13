import { keelY, V } from '../../architecture/hull-geometry.js';
export function buildKeel(d,ctx){
  const keel=ctx.part('keel'),line=[];
  for(let i=0;i<=36;i++){const t=i/36;line.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
  ctx.tube(keel,line,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),ctx.materials.trim,'war-galleon-keelson-and-keel',72);
}
