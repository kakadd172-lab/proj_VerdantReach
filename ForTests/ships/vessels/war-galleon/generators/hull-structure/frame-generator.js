import { hullPoint } from '../../architecture/hull-geometry.js';
export function buildFrames(d,ctx){
  const structure=ctx.part('hull-frames');
  for(let i=0;i<d.structure.frameCount;i++){const t=.018+.964*i/Math.max(1,d.structure.frameCount-1),frame=ctx.part('frame-'+String(i+1).padStart(2,'0'),structure),line=[];for(let j=0;j<=52;j++)line.push(hullPoint(d,t,j/52*Math.PI*2));ctx.tube(frame,line,Math.max(.035,d.beamUnits*.0058),ctx.materials.trim,'war-galleon-rising-frame',72);}
}
