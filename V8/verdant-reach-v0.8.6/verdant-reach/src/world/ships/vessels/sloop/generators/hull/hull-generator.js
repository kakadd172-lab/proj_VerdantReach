import { deckY, keelY, hullPoint, stationZ } from "../../architecture/hull-geometry.js";

export function buildHull(d,ctx){
  const {THREE,part,mesh,materials}=ctx;
  const hullGroup=part('hull');
  const stations=180,rings=64,positions=[],indices=[];
  for(let i=0;i<=stations;i++){
    const t=i/stations;
    // Only the submerged/side shell is lofted. The top remains open between
    // the gunwales so the separate deck and vivier opening remain real holes.
    for(let j=0;j<=rings;j++){
      const point=hullPoint(d,t,Math.PI+(j/rings)*Math.PI);
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

  // Close only the fine bow. The broad aft terminal section is closed by the
  // shaped transom component, not by a deck-plane cap.
  const t=0,center=positions.length/3;
  positions.push(0,(deckY(d,t)+keelY(d,t))*0.5,stationZ(d,t,0.5));
  for(let j=0;j<rings;j++)indices.push(center,j,j+1);

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const hullMesh=mesh(hullGroup,geometry,materials.hull,'loguivy-1866-open-shell');
  hullMesh.userData.openSheerDeck=true;
}
