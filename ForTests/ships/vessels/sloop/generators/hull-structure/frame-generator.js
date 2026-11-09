import { hullPoint } from "../../architecture/hull-geometry.js";

export function buildFrames(d,ctx){
  const {part,tube,materials}=ctx;
  for(let i=0;i<d.structure.frameCount;i++){
    const t=0.025+0.95*i/Math.max(1,d.structure.frameCount-1);
    const frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
    const pieces=48;
    // A transverse frame follows the outer hull from port gunwale, around the keel,
    // and back to starboard; it does not bridge the open deck.
    for(let j=0;j<=pieces;j++){
      line.push(hullPoint(d,t,Math.PI+(j/pieces)*Math.PI));
    }
    tube(frame,line,Math.max(0.032,d.beamUnits*0.0055),materials.trim,'sloop-frame-rising',pieces);
  }
}
