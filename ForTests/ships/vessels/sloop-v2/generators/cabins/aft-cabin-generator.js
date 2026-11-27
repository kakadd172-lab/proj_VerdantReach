import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildAftCabin(d,ctx){
 const {THREE,part,mesh,box,beam,materials}=ctx,tier=d.sternTiers?.[0];if(!tier)return;
 const cabin=part('stern-tier-1'),width=d.beamUnits*tier.w,depth=d.hullLengthUnits*tier.d,height=tier.h*(4/3);
 const baseY=deckY(d,.58)+.045,aftZ=stationZ(d,.65,1),shape=new THREE.Shape();
 shape.moveTo(0,0);shape.lineTo(0,height*.72);
 shape.quadraticCurveTo(depth*.04,height*.98,depth*.18,height);
 shape.lineTo(depth*.80,height*.94);
 shape.quadraticCurveTo(depth*.98,height*.87,depth,height*.78);
 shape.lineTo(depth,0);shape.closePath();
 const bevel=Math.min(.025,width*.012,height*.025);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:width,steps:1,curveSegments:12,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
 geometry.rotateY(Math.PI/2);geometry.translate(-width*.5,baseY,aftZ);geometry.computeVertexNormals();
 mesh(cabin,geometry,materials.trim,'maid-of-endor-low-trunk-cabin');
 const roof=part('coachroof-top',cabin);
 const roofPanel=box(roof,width*.94,.045,depth*.94,materials.deck,'coachroof-curved-top');
 roofPanel.position.set(0,baseY+height*.94,aftZ-depth*.48);
 for(const side of [-1,1]){
  const portlight=mesh(cabin,new THREE.CylinderGeometry(.075,.075,.035,20),materials.glass,'coachroof-portlight');
  portlight.rotation.z=Math.PI/2;portlight.position.set(side*(width*.5+.012),baseY+height*.52,aftZ-depth*.46);
  const ring=mesh(cabin,new THREE.TorusGeometry(.075,.012,7,20),materials.brass,'coachroof-portlight-ring');
  ring.rotation.y=Math.PI/2;ring.position.copy(portlight.position);
 }
 const companion=part('companionway',cabin);
 const hatch=box(companion,width*.40,.06,depth*.20,materials.trim,'companionway-sliding-hatch');
 hatch.position.set(0,baseY+height*.63,aftZ-depth*.72);
 beam(companion,V(-width*.22,hatch.position.y+.045,hatch.position.z),V(width*.22,hatch.position.y+.045,hatch.position.z),
  .018,materials.brass,'companionway-hatch-lip',8);
}
