import { deckY,halfBreadth,sectionBreadth,stationZ } from '../../architecture/hull-geometry.js';
export function buildDeck(d,ctx){
 const {THREE,part,mesh,materials}=ctx,deck=part('deck'),along=160,across=48,positions=[],indices=[];
 for(let i=0;i<=along;i++){
  const t=i/along,half=halfBreadth(d,t)*sectionBreadth(d,t,1)*.978,z=stationZ(d,t,1);
  for(let j=0;j<=across;j++){
   const u=j/across*2-1,camber=(d.hull.deckCamber??.075)*d.beamUnits*.045*(1-u*u);
   positions.push(u*half,deckY(d,t)+camber,z);
  }
 }
 for(let i=0;i<along;i++){
  const t=(i+.5)/along;
  for(let j=0;j<across;j++){
   const u=((j+.5)/across)*2-1;
   // A real aft cockpit well interrupts the deck skin. Its floor and coamings
   // are generated as separate editor parts rather than painted on top.
   if(t>.785&&t<.955&&Math.abs(u)<.49)continue;
   const a=i*(across+1)+j;
   indices.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 mesh(deck,geometry,materials.deck,'maid-of-endor-cambered-deck');
}
