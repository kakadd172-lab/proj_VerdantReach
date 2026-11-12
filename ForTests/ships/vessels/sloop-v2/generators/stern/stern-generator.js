import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildStern(d,ctx){
 const {THREE,part,mesh,materials,beam}=ctx,stern=part('sternworks');
 part('stern-gallery');part('stern-windows');
 const across=32,vertical=24,positions=[],indices=[],t=.995,half=halfBreadth(d,t)*.96,z=stationZ(d,t,1);
 const topY=deckY(d,t),bottomY=topY-d.draftUnits*.92;
 for(let j=0;j<=vertical;j++){
  const v=j/vertical,y=bottomY+(topY-bottomY)*v,width=half*(.82+.18*v);
  for(let i=0;i<=across;i++){const u=i/across*2-1;positions.push(u*width,y,z+.045*(1-u*u));}
 }
 for(let j=0;j<vertical;j++)for(let i=0;i<across;i++){
  const a=j*(across+1)+i;indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 mesh(stern,geometry,materials.hull,'maid-of-endor-transom');
 const capY=topY+.10,capWidth=halfBreadth(d,.97)*.98,capZ=stationZ(d,.97,1);
 beam(stern,V(-capWidth,capY,capZ),V(capWidth,capY,capZ),.045,materials.trim,'transom-cap-rail',12);
}
