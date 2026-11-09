import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildHelm(d,ctx){
  const {part,beam,materials,V}=ctx;
  const helm=part('helm'),wheel=part('helm-wheel');
  const y=deckY(d,0.83),z=stationZ(d,0.83,1);
  beam(helm,V(0,y+0.18,z),V(0,y+0.9,z),0.06,materials.trim,'helm-post');
  const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(0.42,0.043,8,20),materials.trim,'helm-wheel-ring');
  ring.position.set(0,y+1.02,z);
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    beam(wheel,V(0,y+1.02,z),V(Math.cos(angle)*0.42,y+1.02+Math.sin(angle)*0.42,z),0.02,materials.trim,'helm-spoke');
  }
}
