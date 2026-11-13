import { deckY, halfBreadth } from '../../architecture/hull-geometry.js';
export function buildDeck(d,ctx){
  const deck=ctx.part('deck'),along=92,across=28,positions=[],faces=[];
  for(let i=0;i<=along;i++){const t=i/along,half=halfBreadth(d,t)*.94;for(let j=0;j<=across;j++){const u=j/across*2-1,camber=d.hull.deckCamber*d.deckHeightUnits*(1-u*u);positions.push(u*half,deckY(d,t)+camber,(t-.5)*d.hullLengthUnits);}}
  for(let i=0;i<along;i++)for(let j=0;j<across;j++){const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
  const geometry=new ctx.THREE.BufferGeometry();geometry.setAttribute('position',new ctx.THREE.Float32BufferAttribute(positions,3));geometry.setIndex(faces);geometry.computeVertexNormals();geometry.computeBoundingBox();
  ctx.mesh(deck,geometry,ctx.materials.deck,'war-galleon-main-deck-surface');
}
