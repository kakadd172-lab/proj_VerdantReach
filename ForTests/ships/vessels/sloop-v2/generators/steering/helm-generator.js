import { rudderStockPosition,V } from '../../architecture/hull-geometry.js';

export function buildHelm(d,ctx){
 const {part,beam,materials}=ctx,helm=part('helm');
 // The tiller and rudder share one explicit stock point. The handle sweeps
 // forward over the cockpit, while the tiller pivot follows rudder steering.
 const stock=rudderStockPosition(d);
 const tiller=part('helm-wheel',helm);
 tiller.position.copy(stock);
 const pivot=new ctx.THREE.Group();
 pivot.name='tiller-stock-pivot';
 tiller.add(pivot);

 beam(pivot,V(0,0,0),V(0,0,-.82),.038,materials.trim,'tiller-bar',10);
 beam(pivot,V(-.095,0,-.79),V(.095,0,-.79),.028,materials.trim,'tiller-hand-grip',8);
 beam(pivot,V(0,-.025,-.04),V(0,-.025,.09),.050,materials.brass,'tiller-stock-head',10);

 tiller.userData.steeringControl={axis:'y',ratio:1,rotationSign:1,pivotGroup:pivot};
 tiller.userData.helmType='aft-tiller';
}
