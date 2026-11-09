import { deckY, keelY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStem(d,ctx){
  const {part,V,materials}=ctx;
  const stem=part('stem');
  if(d.keelDetails.stemPosts){
    const t=0.012;
    ctx.beam(
      stem,
      V(0,keelY(d,t),stationZ(d,t,0)),
      V(0,deckY(d,t)+0.12,stationZ(d,t,1)),
      Math.max(0.075,d.beamUnits*0.019),
      materials.trim,
      'sloop-raked-stem-post'
    );
  }
}
