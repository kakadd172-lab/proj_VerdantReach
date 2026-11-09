import { deckY, keelY, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * A proper transom-hung rudder: shaped timber blade, vertical stock and
 * visible iron gudgeon straps. The blade sits just aft of the transom instead
 * of being buried inside the stern planking.
 */
export function buildRudder(d,ctx){
  const {part,beam,mesh,materials,THREE,V}=ctx;
  const rudder=part('rudder');
  const upperY=deckY(d,1)-0.28;
  const lowerY=keelY(d,1)-0.40;
  const bladeHeight=upperY-lowerY;
  const topWidth=d.beamUnits*0.135;
  const bottomWidth=topWidth*0.76;
  const thickness=Math.max(0.14,d.beamUnits*0.024);
  const transomMidZ=stationZ(d,1,0.58)+0.115;

  rudder.position.set(0,upperY,transomMidZ);

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
  bladeGeometry.translate(0,0,-thickness*0.5);
  bladeGeometry.computeVertexNormals();
  mesh(rudder,bladeGeometry,materials.trim,'sloop-profiled-rudder-blade');

  // Stock follows the forward edge of the blade and projects above the deck.
  beam(
    rudder,
    V(0,0.35,-0.035),
    V(0,-bladeHeight*0.97,-0.035),
    Math.max(0.052,d.beamUnits*0.012),
    materials.trim,
    'sloop-rudder-stock'
  );

  // Two iron straps make the hinge connection to the transom readable.
  for(const [index,fraction] of [0.22,0.63].entries()){
    const y=-bladeHeight*fraction;
    const span=topWidth*(0.49-0.06*fraction);
    beam(
      rudder,
      V(-span,y,thickness*0.58),
      V(span,y,thickness*0.58),
      0.026,
      materials.iron,
      'sloop-rudder-gudgeon-strap-'+(index+1)
    );
    beam(
      rudder,
      V(span*0.91,y-0.10,thickness*0.58),
      V(span*0.91,y+0.10,thickness*0.58),
      0.035,
      materials.iron,
      'sloop-rudder-pintle-'+(index+1)
    );
  }

  // Short tiller head above the blade, inside the after deck.
  beam(
    rudder,
    V(0,0.18,-0.02),
    V(0,0.32,-0.42),
    0.048,
    materials.trim,
    'sloop-rudder-tiller-head'
  );
}
