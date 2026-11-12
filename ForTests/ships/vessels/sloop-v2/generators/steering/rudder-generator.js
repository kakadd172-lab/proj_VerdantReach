import { keelY,deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildRudder(d,ctx){
 const {THREE,part,beam,mesh,materials}=ctx,rudder=part('rudder');
 const pivotZ=stationZ(d,.985,1)+.18,pivotY=deckY(d,.985)-d.deckHeightUnits*.48;
 beam(rudder,V(0,pivotY+.18,pivotZ),V(0,keelY(d,.99)+.12,pivotZ),.075,materials.trim,'sloop-v2-rudder-stock',10);
 const blade=mesh(rudder,new THREE.BoxGeometry(d.beamUnits*.11,d.draftUnits*.72,.16),materials.lower,'sloop-v2-rudder-blade');
 blade.position.set(0,pivotY-d.draftUnits*.30,pivotZ+.09);
 rudder.userData.steeringControl={axis:'y',maxAngle:.55,rotationSign:1};
}
