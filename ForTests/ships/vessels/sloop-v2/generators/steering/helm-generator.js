import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildHelm(d,ctx){
 const {THREE,part,beam,materials}=ctx,helm=part('helm');
 // The plan uses a tiller, not a helm wheel. Its pivot is vertical and the
 // component retains the historic helm-wheel key for the shared steering API.
 const station=.94,z=stationZ(d,station,1)+.10,y=deckY(d,station)+.12;
 const tiller=part('helm-wheel',helm);tiller.position.set(0,y,z);
 const pivot=new THREE.Group();pivot.name='tiller-stock-pivot';tiller.add(pivot);
 beam(pivot,V(0,0,0),V(0,0,-.82),.038,materials.trim,'tiller-bar',10);
 beam(pivot,V(-.085,0,-.79),V(.085,0,-.79),.027,materials.trim,'tiller-hand-grip',8);
 beam(pivot,V(0,-.02,-.06),V(0,-.02,.06),.055,materials.brass,'tiller-stock-head',10);
 // The tiller and rudder share the vertical Y steering axis in this model.
 tiller.userData.steeringControl={axis:'y',ratio:1,rotationSign:1,pivotGroup:pivot};
 tiller.userData.helmType='aft-tiller';
}
