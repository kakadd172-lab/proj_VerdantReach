import { keelY,deckY,rudderStockPosition,V } from '../../architecture/hull-geometry.js';

export function buildRudder(d,ctx){
 const {THREE,part,mesh,beam,box,materials}=ctx;
 const rudder=part('rudder');
 const stock=rudderStockPosition(d);
 const pivotY=stock.y,pivotZ=stock.z;
 const keel=keelY(d,1);
 const bladeHeight=Math.max(1.0,pivotY-keel+.20);
 const topChord=Math.max(.48,d.beamUnits*.22);
 const heelChord=topChord*.62;
 const leadingEdge=.025;
 const trailingTop=leadingEdge+topChord;

 const pivot=new THREE.Group();
 pivot.name='rudder-stock-pivot';
 pivot.position.copy(stock);
 rudder.add(pivot);

 // The rudder's broad face is longitudinal (Y/Z), not transverse (X/Y).
 // Shape coordinates are chord (X) and height (Y); rotating the extrusion
 // maps chord into ship Z and its thickness into ship X.
 const outline=new THREE.Shape();
 outline.moveTo(leadingEdge,-.045);
 outline.lineTo(trailingTop,-.045);
 outline.quadraticCurveTo(trailingTop+.015,-bladeHeight*.48,
  leadingEdge+heelChord,-bladeHeight*.86);
 outline.quadraticCurveTo(leadingEdge+heelChord*.82,-bladeHeight*.97,
  leadingEdge+heelChord*.48,-bladeHeight);
 outline.quadraticCurveTo(leadingEdge+heelChord*.16,-bladeHeight*.985,
  leadingEdge,-bladeHeight*.90);
 outline.quadraticCurveTo(leadingEdge-.018,-bladeHeight*.43,leadingEdge,-.045);
 const thickness=.070;
 const plateGeometry=new THREE.ExtrudeGeometry(outline,{
  depth:thickness,bevelEnabled:true,bevelSegments:2,bevelSize:.012,
  bevelThickness:.008,steps:1,curveSegments:8
 });
 plateGeometry.translate(0,0,-thickness*.5);
 plateGeometry.rotateY(-Math.PI/2);
 plateGeometry.computeVertexNormals();
 mesh(pivot,plateGeometry,materials.lower,'outboard-rudder-foil');

 // The stock is the vertical pintle axis. It sits at the leading edge and
 // rotates with the foil; the separate gudgeons remain fixed to the transom.
 beam(pivot,V(0,.08,0),V(0,-bladeHeight*.92,0),
  .026,materials.trim,'rudder-stock',12);
 const stockCollar=box(pivot,.095,.055,.090,materials.iron,'rudder-stock-head-collar');
 stockCollar.position.set(0,-.015,.012);

 // Reinforcing straps lie on the longitudinal faces of the blade.
 for(const [index,fraction] of [0.20,.61].entries()){
  const y=-bladeHeight*fraction;
  const chord=topChord*(1-.34*fraction);
  const strap=box(pivot,.086,.045,chord*.82,materials.iron,
   'rudder-blade-strap-'+(index+1));
  strap.position.set(0,y,leadingEdge+chord*.46);
  for(const side of [-1,1]){
   const bolt=mesh(pivot,new THREE.SphereGeometry(.018,8,6),materials.brass,
    'rudder-strap-fastener-'+(index+1)+'-'+side);
   bolt.position.set(side*.046,y,leadingEdge+chord*.46);
  }
 }

 rudder.userData.steeringControl={
  axis:'y',maxAngle:.55,rotationSign:1,pivotGroup:pivot
 };
 rudder.userData.rudderType='transom-hung-longitudinal-foil';
 rudder.userData.rudderMount={
  pivot:[stock.x,stock.y,stock.z],
  pivotAxis:'vertical-y',
  leadingEdgeOffset:leadingEdge,
  chordAtHead:topChord,chordAtHeel:heelChord,
  plateHeight:bladeHeight,thickness,
  extendsBelowKeel:true
 };
}
