import { deckY,keelY,hullPoint } from '../../architecture/hull-geometry.js';
export function buildFrames(d,ctx){
 const {part,tube,materials}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){
  const t=.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),points=[],segments=56;
  const midHeight=(deckY(d,t)+keelY(d,t))*.5;
  for(let j=0;j<=segments;j++){
   const point=hullPoint(d,t,j/segments*Math.PI*2);
   // Frames are internal structure. Inset them from the external planking so
   // they do not render as exposed transverse ribs on the finished hull.
   point.x*=.94;
   point.y=midHeight+(point.y-midHeight)*.94;
   points.push(point);
  }
  frame.userData.structuralPlacement='inside-hull';
  tube(frame,points,Math.max(.025,d.beamUnits*.0048),materials.trim,'sloop-v2-transverse-frame',segments+8);
 }
}
