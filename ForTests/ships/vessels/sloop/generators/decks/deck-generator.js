import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildDeck(d,ctx){
  const {THREE,part,mesh,materials}=ctx;
  const deck=part('deck'),along=88,across=24,pos=[],faces=[];
  for(let i=0;i<=along;i++){
    const t=i/along,half=halfBreadth(d,t)*0.95,z=stationZ(d,t,1);
    for(let j=0;j<=across;j++){
      const u=j/across*2-1;
      pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),z);
    }
  }
  for(let i=0;i<along;i++){
    for(let j=0;j<across;j++){
      const a=i*(across+1)+j;
      faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
    }
  }
  const deckGeo=new THREE.BufferGeometry();
  deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  deckGeo.setIndex(faces);
  deckGeo.computeVertexNormals();
  mesh(deck,deckGeo,materials.deck,'sloop-independent-deck-plan');
}
