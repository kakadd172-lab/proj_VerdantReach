import { deckY,halfBreadth,sectionBreadth,stationZ } from '../../architecture/hull-geometry.js';
export function buildDeck(d,ctx){
 const {THREE,part,mesh,materials}=ctx,deck=part('deck'),along=148,across=44,positions=[],indices=[];
 for(let i=0;i<=along;i++){
  const t=i/along,half=halfBreadth(d,t)*sectionBreadth(d,t,1)*.975,z=stationZ(d,t,1);
  for(let j=0;j<=across;j++){
   const u=j/across*2-1,camber=(d.hull.deckCamber??.10)*d.beamUnits*.045*(1-u*u);
   positions.push(u*half,deckY(d,t)+camber,z);
  }
 }
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){
  const a=i*(across+1)+j;indices.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();mesh(deck,geometry,materials.deck,'sloop-v2-cambered-deck-surface');
}
