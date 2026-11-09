import { hullPoint } from "../../architecture/hull-geometry.js";

export function buildFrames(d,ctx){
  const {part,tube,materials}=ctx;
  for(let i=0;i<d.structure.frameCount;i++){
    const t=0.025+0.95*i/Math.max(1,d.structure.frameCount-1);
    const frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
    const pieces=56;
    for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,Math.PI+(j/pieces)*Math.PI));
    tube(frame,line,Math.max(0.025,d.beamUnits*0.0045),materials.trim,'Loguivy-transverse-frame',pieces+8);
  }
}
