import { deckY,halfBreadth,sectionBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildDeckPlanking(d,ctx){
 const {part,tube,materials}=ctx,seams=part('deck-planks');
 for(let row=-8;row<=8;row++){
  const u=row/9,points=[];
  for(let i=0;i<=116;i++){
   const t=.035+.93*i/116,half=halfBreadth(d,t)*sectionBreadth(d,t,1)*.965;
   const camber=(d.hull.deckCamber??.10)*d.beamUnits*.045*(1-u*u);
   points.push(V(u*half,deckY(d,t)+camber+.018,stationZ(d,t,1)));
  }
  tube(seams,points,.008,materials.plank,'sloop-v2-deck-seam-'+row,120);
 }
}
