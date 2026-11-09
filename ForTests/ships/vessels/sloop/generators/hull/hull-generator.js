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
  // Keep the bow closed by the loft. The aft perimeter is left open for the
  // transom surface, which is generated from the exact final hull section.
  const t=0,center=positions.length/3,centreLevel=Math.pow(0.5,0.92);
  positions.push(0,keelY(d,t)+(deckY(d,t)-keelY(d,t))*centreLevel,stationZ(d,t,centreLevel));
  for(let j=0;j<rings;j++){
    const a=j;
    indices.push(center,a,a+1);
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(hullGroup,geometry,materials.hull,'sloop-individual-hull-loft');
}
