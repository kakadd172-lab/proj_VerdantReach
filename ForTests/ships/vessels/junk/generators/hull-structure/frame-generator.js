import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildFrames(d,ctx){
const {part,tube,materials,V}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){const t=0.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
  const pieces=44;for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,j/pieces*Math.PI*2));tube(frame,line,Math.max(.035,d.beamUnits*.006),materials.trim,'junk-frame-rising',pieces);
 }
}
