import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';
export function buildDeckPlanking(d,ctx){
  const seams=ctx.part('deck-planks');
  for(let row=-12;row<=12;row++){const fraction=row/13,points=[];for(let i=0;i<=56;i++){const t=.035+.93*i/56,half=halfBreadth(d,t)*.92,y=deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-fraction*fraction)+.018;points.push(V(fraction*half,y,(t-.5)*d.hullLengthUnits));}ctx.tube(seams,points,.010,ctx.materials.plank,'war-galleon-deck-seam-'+row,64);}
}
