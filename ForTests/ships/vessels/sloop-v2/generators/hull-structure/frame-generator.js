import { hullPoint } from '../../architecture/hull-geometry.js';
export function buildFrames(d,ctx){
 const {part,tube,materials}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){
  const t=.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),points=[],segments=56;
  for(let j=0;j<=segments;j++)points.push(hullPoint(d,t,j/segments*Math.PI*2));
  tube(frame,points,Math.max(.025,d.beamUnits*.0048),materials.trim,'sloop-v2-transverse-frame',segments+8);
 }
}
