import { hullPoint } from '../../architecture/hull-geometry.js';
export function buildHull(d,ctx){
 const {THREE,part,mesh,materials}=ctx,hull=part('hull'),stations=132,rings=48,positions=[],indices=[];
 for(let i=0;i<=stations;i++)for(let j=0;j<=rings;j++){
  const p=hullPoint(d,i/stations,j/rings*Math.PI*2);positions.push(p.x,p.y,p.z);
 }
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){
  const a=i*stride+j;indices.push(a,a+1,a+stride,a+1,a+stride+1,a+stride);
 }
 for(const end of [0,stations]){
  const t=end/stations,p=hullPoint(d,t,0),center=positions.length/3;
  positions.push(0,p.y+d.deckHeightUnits*.2,p.z);
  for(let j=0;j<rings;j++){const a=end*stride+j;if(end===0)indices.push(center,a+1,a);else indices.push(center,a,a+1);}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 mesh(hull,geometry,materials.hull,'sloop-v2-independent-hull-loft');
}
