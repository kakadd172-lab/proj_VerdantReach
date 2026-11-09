import { deckY, halfBreadth, sectionBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildDeckPlanking(d,ctx){
  const {part,tube,materials}=ctx;
  const seams=part('deck-planks'),vivier=d.vivier||{width:1.1,startStation:0.40,endStation:0.69};
  const vivierHalf=vivier.width*(4/3)*0.5;
  for(let line=-7;line<=7;line++){
    const u=line/8,points=[];
    for(let i=0;i<=112;i++){
      const t=0.025+0.95*i/112;
      const half=halfBreadth(d,t)*sectionBreadth(d,t,1)*0.94;
      if(t>vivier.startStation&&t<vivier.endStation&&Math.abs(u*half)<vivierHalf+0.025)continue;
      points.push(V(
        u*half,
        deckY(d,t)+d.hull.deckCamber*d.beamUnits*0.045*(1-u*u)+0.022,
        stationZ(d,t,1)
      ));
    }
    if(points.length>1)tube(seams,points,0.008,materials.plank,'Loguivy-deck-seam-'+line,120);
  }
}
