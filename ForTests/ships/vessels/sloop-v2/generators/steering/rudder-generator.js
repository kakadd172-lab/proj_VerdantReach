import { keelY,deckY,stationZ,V } from '../../architecture/hull-geometry.js';

export function buildRudder(d,ctx){
 const {THREE,part,mesh,beam,box,materials}=ctx;
 const rudder=part('rudder');

 // The blade is hung outside the aft face of the transom, not buried inside
 // the hull. Its upper edge aligns with the transom cap and its heel extends
 // slightly below the keel, as a practical transom-hung plate rudder should.
 const pivotY=deckY(d,1)+.045;
 const transomTopZ=stationZ(d,1,1);
 const pivotZ=transomTopZ+.18;
 const keel=keelY(d,1);
 const bladeHeight=Math.max(1.0,pivotY-keel+.20);
 const topWidth=Math.max(.36,d.beamUnits*.15);
 const heelWidth=topWidth*.58;

 const pivot=new THREE.Group();
 pivot.name='rudder-stock-pivot';
 pivot.position.set(0,pivotY,pivotZ);
 rudder.add(pivot);

 // Straight-edged tapered plate: broad at the stock, narrower at the heel.
 // This deliberately avoids the old capsule-like quadratic outline.
 const outline=new THREE.Shape();
 outline.moveTo(-topWidth*.5,0);
 outline.lineTo(topWidth*.5,0);
 outline.lineTo(heelWidth*.5,-bladeHeight*.94);
 outline.lineTo(-heelWidth*.5,-bladeHeight);
 outline.closePath();
 const plateGeometry=new THREE.ExtrudeGeometry(outline,{
  depth:.060,bevelEnabled:false,steps:1,curveSegments:1
 });
 plateGeometry.translate(0,0,-.030);
 plateGeometry.computeVertexNormals();
 mesh(pivot,plateGeometry,materials.lower,'outboard-rudder-flat-plate');

 // The stock runs down the blade centreline. It is separate so its thickness
 // and material can be tuned without changing the plate.
 beam(pivot,V(0,.10,0),V(0,-bladeHeight*.98,0),
  .027,materials.trim,'outboard-rudder-stock',12);

 // Two iron straps and pintle barrels show how the plate is carried on the
 // transom. They sit just aft of the blade and remain part of the rudder.
 for(const [index,fraction] of [0.16,.48].entries()){
  const y=-bladeHeight*fraction;
  const strap=box(pivot,topWidth*(.88-.12*fraction),.042,.075,
   materials.iron,'rudder-hinge-strap-'+(index+1));
  strap.position.set(0,y,.045);
  for(const side of [-1,1]){
   beam(pivot,V(side*topWidth*.42,y,.055),V(side*topWidth*.42,y-.10,.055),
    .018,materials.brass,'rudder-pintle-'+(index+1)+'-'+side,8);
  }
 }

 rudder.userData.steeringControl={axis:'y',maxAngle:.55,rotationSign:1,pivotGroup:pivot};
 rudder.userData.rudderType='transom-hung-flat-plate';
 rudder.userData.rudderMount={
  pivot:[0,pivotY,pivotZ],transomTopZ,plateHeight:bladeHeight,
  topWidth,heelWidth,extendsBelowKeel:true
 };
}
