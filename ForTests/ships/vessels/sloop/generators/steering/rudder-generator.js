import { deckY, keelY, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * Transom-hung rudder. The blade, stock and hinge straps follow the transom's
 * gentle rake, keeping a visible but even clearance behind the stern face.
 */
export function buildRudder(d,ctx){
  const {part,beam,mesh,materials,THREE,V}=ctx;
  const rudder=part('rudder');
  const deck=deckY(d,1),keel=keelY(d,1);
  const upperY=deck-0.28;
  const lowerY=keel-0.40;
  const bladeHeight=upperY-lowerY;
  const topWidth=d.beamUnits*0.135;
  const bottomWidth=topWidth*0.76;
  const thickness=Math.max(0.14,d.beamUnits*0.024);
  const clearance=0.14;

  rudder.position.set(0,upperY,0);

  const profile=new THREE.Shape();
  profile.moveTo(-topWidth*0.50,0);
  profile.lineTo(topWidth*0.50,0);
  profile.lineTo(bottomWidth*0.50,-bladeHeight*0.72);
  profile.quadraticCurveTo(bottomWidth*0.48,-bladeHeight*0.91,0,-bladeHeight);
  profile.quadraticCurveTo(-bottomWidth*0.48,-bladeHeight*0.91,-bottomWidth*0.50,-bladeHeight*0.72);
  profile.lineTo(-topWidth*0.50,0);
  profile.closePath();

  const bladeGeometry=new THREE.ExtrudeGeometry(profile,{
    depth:thickness,
    steps:1,
    curveSegments:10,
    bevelEnabled:true,
    bevelSegments:2,
    bevelSize:0.025,
    bevelThickness:0.022
  });

  const transomZAt=(localY)=>{
    const globalY=upperY+localY;
    const fraction=Math.max(0,Math.min(1,(globalY-keel)/Math.max(0.001,deck-keel)));
    const level=Math.pow(fraction,1/0.92);
    return stationZ(d,1,level)+clearance;
  };

  const bladePosition=bladeGeometry.getAttribute('position');
  for(let i=0;i<bladePosition.count;i++){
    const originalZ=bladePosition.getZ(i);
    bladePosition.setZ(i,transomZAt(bladePosition.getY(i))+(originalZ-thickness*0.5));
  }
  bladeGeometry.computeVertexNormals();
  mesh(rudder,bladeGeometry,materials.trim,'sloop-profiled-rudder-blade');

  // Stock follows the centreline of the transom-hung blade.
  const onTransom=(point)=>V(point.x,point.y,transomZAt(point.y));
  beam(
    rudder,
    onTransom(V(0,0.35,0)),
    onTransom(V(0,-bladeHeight*0.97,0)),
    Math.max(0.052,d.beamUnits*0.012),
    materials.trim,
    'sloop-rudder-stock'
  );

  // Iron gudgeon straps cross the blade, with the pintles at the aft edge.
  for(const [index,fraction] of [0.22,0.63].entries()){
    const y=-bladeHeight*fraction;
    const span=topWidth*(0.49-0.06*fraction);
    beam(
      rudder,
      onTransom(V(-span,y,0)),
      onTransom(V(span,y,0)),
      0.026,
      materials.iron,
      'sloop-rudder-gudgeon-strap-'+(index+1)
    );
    beam(
      rudder,
      onTransom(V(span*0.91,y-0.10,0)),
      onTransom(V(span*0.91,y+0.10,0)),
      0.035,
      materials.iron,
      'sloop-rudder-pintle-'+(index+1)
    );
  }

  // Tiller head projects forward into the after deck, away from the blade.
  beam(
    rudder,
    onTransom(V(0,0.18,-0.02)),
    onTransom(V(0,0.32,-0.42)),
    0.048,
    materials.trim,
    'sloop-rudder-tiller-head'
  );
}
