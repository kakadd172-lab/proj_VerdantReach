import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildAftCabin(d,ctx){
 const {THREE,part,mesh,box,beam,materials}=ctx,tier=d.sternTiers?.[0];if(!tier)return;
 const cabin=part('stern-tier-1'),width=d.beamUnits*tier.w*.72,depth=d.hullLengthUnits*tier.d,height=tier.h*(4/3);
 const baseY=deckY(d,.88)+.06,aftZ=stationZ(d,.975,1)-depth*.42,shape=new THREE.Shape();
 shape.moveTo(0,0);shape.lineTo(0,height*.76);shape.quadraticCurveTo(depth*.035,height*1.02,depth*.18,height);
 shape.lineTo(depth*.78,height*.70);shape.quadraticCurveTo(depth*.96,height*.61,depth,height*.57);shape.lineTo(depth,0);shape.closePath();
 const bevel=Math.min(.035,width*.012,height*.025),geometry=new THREE.ExtrudeGeometry(shape,{depth:width,steps:1,curveSegments:8,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
 geometry.rotateY(Math.PI/2);geometry.translate(-width*.5,baseY,aftZ);geometry.computeVertexNormals();
 mesh(cabin,geometry,materials.hull,'sloop-v2-folded-aft-cabin-shell');
 const folds=[[0,.76],[.18,1],[.40,.91],[.62,.80],[.78,.70],[.90,.63],[1,.57]],radius=Math.max(.018,d.beamUnits*.0027);
 for(let i=1;i<folds.length;i++){
  const [u,v]=folds[i],[pu,pv]=folds[i-1],z=aftZ-u*depth,y=baseY+height*v;
  for(const side of [-1,1])beam(cabin,V(side*width*.505,baseY+height*pv,aftZ-pu*depth),V(side*width*.505,y,z),radius,materials.trim,'folded-cabin-side-rib');
  if(i<folds.length-1)beam(cabin,V(-width*.51,y,z),V(width*.51,y,z),radius*.85,materials.trim,'folded-cabin-cross-rib');
 }
 for(const side of [-1,1]){
  const pane=box(cabin,.035,height*.22,depth*.17,materials.glass,'aft-cabin-side-window');pane.position.set(side*(width*.5+.02),baseY+height*.43,aftZ-depth*.34);
  const trim=box(cabin,.045,height*.26,depth*.20,materials.trim,'aft-cabin-window-trim');trim.position.copy(pane.position);
 }
}
