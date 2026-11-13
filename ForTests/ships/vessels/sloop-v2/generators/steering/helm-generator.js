import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';

export function buildHelm(d,ctx){
 const {THREE,part,beam,materials}=ctx,helm=part('helm');

 // The plan carries a tiller, not a wheel. Put its stock pivot at the same
 // transom-hung rudder stock point so the shared steering control cannot
 // rotate two components around different centres.
 const pivotY=deckY(d,1)+.045;
 const pivotZ=stationZ(d,1,1)+.18;
 const tiller=part('helm-wheel',helm);
 tiller.position.set(0,pivotY,pivotZ);
 const pivot=new THREE.Group();
 pivot.name='tiller-stock-pivot';
 tiller.add(pivot);

 // Aft tiller handle sweeps forward over the cockpit. The cross grip is a
 // short, straight spar; both pieces rotate together around the rudder stock.
 beam(pivot,V(0,0,0),V(0,0,-.82),.038,materials.trim,'tiller-bar',10);
 beam(pivot,V(-.095,0,-.79),V(.095,0,-.79),.028,materials.trim,'tiller-hand-grip',8);
 beam(pivot,V(0,-.025,-.04),V(0,-.025,.09),.050,materials.brass,'tiller-stock-head',10);

 tiller.userData.steeringControl={axis:'y',ratio:1,rotationSign:1,pivotGroup:pivot};
 tiller.userData.helmType='aft-tiller';
}
