import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * Compact aft-quarter wheel. It is deliberately separated from the aft locker:
 * the wheel sits on its own low pedestal, with clear deck around the helmsman.
 */
export function buildHelm(d,ctx){
  const {part,beam,materials,V,THREE}=ctx;
  const station=0.91;
  const y=deckY(d,station),z=stationZ(d,station,1);
  const radius=0.34;
  const wheelHeight=0.66;

  const helm=part('helm');
  helm.userData.helmStation=station;
  helm.userData.wheelRadius=radius;

  // Low centre post and two unobtrusive splayed feet; no tall square plinth.
  beam(
    helm,
    V(0,y+0.09,z),
    V(0,y+wheelHeight-0.08,z),
    0.044,
    materials.trim,
    'helm-pedestal-post'
  );
  for(const side of [-1,1]){
    beam(
      helm,
      V(side*0.20,y+0.035,z+0.12),
      V(0,y+wheelHeight-0.13,z),
      0.027,
      materials.trim,
      'helm-pedestal-brace-'+side
    );
  }

  const wheel=part('helm-wheel');
  wheel.userData.helmStation=station;
  wheel.userData.wheelRadius=radius;
  const centerY=y+wheelHeight;
  const ring=ctx.mesh(
    wheel,
    new THREE.TorusGeometry(radius,0.029,10,24),
    materials.trim,
    'helm-wheel-ring'
  );
  ring.position.set(0,centerY,z);

  const hub=ctx.mesh(
    wheel,
    new THREE.CylinderGeometry(0.052,0.052,0.105,12),
    materials.iron,
    'helm-wheel-hub'
  );
  hub.rotation.x=Math.PI/2;
  hub.position.set(0,centerY,z);

  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    beam(
      wheel,
      V(0,centerY,z),
      V(Math.cos(angle)*radius,centerY+Math.sin(angle)*radius,z),
      0.014,
      materials.trim,
      'helm-spoke-'+i
    );
  }
}
