import { deckY, V } from '../../architecture/hull-geometry.js';
export function buildRudder(d,ctx){
  const rudder=ctx.part('rudder');
  rudder.position.set(0,0,d.hullLengthUnits*.472+d.rudderDetails.pivotOffset);
  const width=d.beamUnits*d.rudderDetails.breadthFactor,height=d.draftUnits*d.rudderDetails.depthFactor;
  const blade=ctx.box(rudder,width,height,.24,ctx.materials.trim,'broad-tapered-rudder-blade');
  blade.position.set(0,-d.draftUnits*d.rudderDetails.yFactor,0);
  ctx.beam(rudder,V(0,-d.draftUnits*.42,-.02),V(0,deckY(d,.97)+.20,0),Math.max(.045,d.beamUnits*.013),ctx.materials.trim,'rudder-stock',10);
  rudder.userData.steeringControl={axis:'y',maxAngle:.62,rotationSign:1};
}
