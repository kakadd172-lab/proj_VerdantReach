import { deckY, keelY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStem(d,ctx){
  const {part,tube,materials,V}=ctx;
  const stem=part('stem'),line=[];
  for(let i=0;i<=18;i++){
    const v=i/18,t=0.012+0.008*(1-v);
    line.push(V(0,keelY(d,t)+(deckY(d,t)-keelY(d,t))*v,stationZ(d,t,v)));
  }
  tube(stem,line,Math.max(0.055,d.beamUnits*0.014),materials.trim,'Loguivy-rising-stem-post',40);
}
