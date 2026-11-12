import { keelY,deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildRudder(d,ctx){
 const {THREE,part,beam,mesh,materials}=ctx,rudder=part('rudder');
 const pivotZ=stationZ(d,.985,1)+.12,pivotY=deckY(d,.985)-.12;
 const pivot=new THREE.Group();pivot.name='rudder-stock-pivot';
 pivot.position.set(0,pivotY,pivotZ);rudder.add(pivot);
 beam(pivot,V(0,.15,0),V(0,keelY(d,.99)+.16-pivotY,0),
  .045,materials.trim,'outboard-rudder-stock',12);
 const height=Math.max(.54,d.draftUnits*.66),width=Math.max(.22,d.beamUnits*.105);
 const profile=new THREE.Shape();
 profile.moveTo(-width*.19,height*.50);
 profile.quadraticCurveTo(width*.12,height*.34,width*.50,height*.06);
 profile.quadraticCurveTo(width*.58,-height*.28,width*.18,-height*.50);
 profile.quadraticCurveTo(-width*.22,-height*.43,-width*.30,-height*.10);
 profile.closePath();
 const geometry=new THREE.ExtrudeGeometry(profile,{depth:.085,bevelEnabled:true,
  bevelSegments:2,bevelSize:.018,bevelThickness:.018,curveSegments:12});
 geometry.translate(0,-height*.40,.035);geometry.computeVertexNormals();
 mesh(pivot,geometry,materials.lower,'outboard-rudder-blade');
 rudder.userData.steeringControl={axis:'y',maxAngle:.55,rotationSign:1,pivotGroup:pivot};
 rudder.userData.rudderType='outboard';
}
