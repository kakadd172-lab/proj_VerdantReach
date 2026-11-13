import { deckY, V } from '../../architecture/hull-geometry.js';
export function buildHelm(d,ctx){
  const helm=ctx.part('helm'),wheel=ctx.part('helm-wheel'),y=deckY(d,.84)+.16,z=d.hullLengthUnits*.325;
  ctx.beam(helm,V(0,y,z),V(0,y+.84,z),.065,ctx.materials.trim,'helm-pedestal');
  const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.48,.042,9,24),ctx.materials.trim,'helm-wheel-ring');
  ring.position.set(0,y+.98,z);
  for(let i=0;i<10;i++){const a=i*Math.PI*2/10;ctx.beam(wheel,V(0,y+.98,z),V(Math.cos(a)*.48,y+.98+Math.sin(a)*.48,z),.020,ctx.materials.trim,'helm-wheel-spoke');}
  const hub=ctx.mesh(wheel,new ctx.THREE.CylinderGeometry(.075,.075,.11,12),ctx.materials.brass,'helm-wheel-hub');
  hub.rotation.x=Math.PI/2;hub.position.set(0,y+.98,z);
  wheel.userData.steeringControl={axis:'z',ratio:4.5,rotationSign:1};
}
