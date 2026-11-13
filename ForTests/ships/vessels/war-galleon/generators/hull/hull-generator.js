import { deckY, keelY, hullPoint } from '../../architecture/hull-geometry.js';
export function buildHull(d,ctx){
  const {THREE,part,mesh,materials}=ctx,hull=part('hull');
  const stations=112,rings=40,positions=[],indices=[];
  for(let i=0;i<=stations;i++){const t=i/stations;for(let j=0;j<=rings;j++){const p=hullPoint(d,t,j/rings*Math.PI*2);positions.push(p.x,p.y,p.z);}}
  const stride=rings+1;
  for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
  for(const i of [0,stations]){const t=i/stations,c=positions.length/3;positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(c,a,a+1);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  mesh(hull,geometry,materials.hull,'war-galleon-lofted-carvel-hull');
}
