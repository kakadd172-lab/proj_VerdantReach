import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildDeckPlanking(d,ctx){
  const {part,tube,materials}=ctx;
  const seams=part('deck-planks');
  for(let line=-9;line<=9;line++){
    const u=line/10,points=[];
    for(let i=0;i<=52;i++){
      const t=0.035+0.93*i/52,half=halfBreadth(d,t)*0.91;
      points.push(V(
        u*half,
        deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+0.025,
        stationZ(d,t,1)
      ));
    }
    tube(seams,points,0.011,materials.plank,'sloop-deck-seam-'+line,56);
  }
}
