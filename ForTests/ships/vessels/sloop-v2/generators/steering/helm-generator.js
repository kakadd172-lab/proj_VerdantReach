import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildHelm(d,ctx){
 const {THREE,part,beam,mesh,materials}=ctx,helm=part('helm'),wheel=part('helm-wheel',helm);
 wheel.userData.steeringControl={axis:'z',ratio:4.1,rotationSign:-1};
 const z=stationZ(d,.84,1),y=deckY(d,.84)+.42,radius=Math.max(.34,d.beamUnits*.072);
 const ring=mesh(wheel,new THREE.TorusGeometry(radius,.045,10,48),materials.trim,'helm-wheel-ring');ring.position.set(0,y,z);
 const hub=mesh(wheel,new THREE.CylinderGeometry(.10,.10,.14,16),materials.iron,'helm-wheel-hub');hub.rotation.x=Math.PI/2;hub.position.set(0,y,z);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y,z),V(Math.cos(a)*radius,y+Math.sin(a)*radius,z),.024,materials.trim,'helm-wheel-spoke-'+i,8);}
 const pedestal=part('helm-pedestal',helm);beam(pedestal,V(0,deckY(d,.84)+.04,z),V(0,y-.09,z),.095,materials.trim,'helm-pedestal-post',10);
}
