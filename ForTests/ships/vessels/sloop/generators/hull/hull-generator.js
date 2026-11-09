import { deckY, keelY, hullPoint, stationZ } from "../../architecture/hull-geometry.js";

export function buildHull(d,ctx){
  const {THREE,part,mesh,materials}=ctx;
  const hullGroup=part('hull');
  const stations=112,rings=48,positions=[],indices=[];
  for(let i=0;i<=stations;i++){
    const t=i/stations;
    for(let j=0;j<=rings;j++){
      const point=hullPoint(d,t,j/rings*Math.PI*2);
      positions.push(point.x,point.y,point.z);
    }
  }

  const stride=rings+1;
  for(let i=0;i<stations;i++){
    for(let j=0;j<rings;j++){
      const a=i*stride+j;
      indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);
    }
  }
  for(const i of [0,stations]){
    const t=i/stations;
    const center=positions.length/3;
    positions.push(0,(deckY(d,t)+keelY(d,t))*0.5,stationZ(d,t,0.5));
    for(let j=0;j<rings;j++){
      const a=i*stride+j;
      indices.push(center,a,a+1);
    }
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(hullGroup,geometry,materials.hull,'sloop-individual-hull-loft');
}
