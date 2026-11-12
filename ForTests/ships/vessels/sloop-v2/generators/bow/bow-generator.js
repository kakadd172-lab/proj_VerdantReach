import { deckY,keelY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildBow(d,ctx){
 const {part,beam,tube,materials}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit');
 const bowZ=stationZ(d,.015,1),baseY=deckY(d,.025)+.16;
 beam(bow,V(0,keelY(d,.01),bowZ),V(0,baseY,bowZ+.32),Math.max(.09,d.beamUnits*.019),materials.trim,'sloop-v2-stem-cap',12);
 const start=V(0,baseY+.10,bowZ+.22),tip=V(0,baseY+.28,bowZ-d.hullLengthUnits*.18);
 beam(bowsprit,start,tip,Math.max(.065,d.beamUnits*.011),materials.trim,'sloop-v2-bowsprit',12);
 for(const side of [-1,1])tube(bowsprit,[V(side*.06,start.y-.10,start.z+.12),
  V(side*halfBreadth(d,.08)*.70,deckY(d,.08)+.10,stationZ(d,.08,1)),
  V(side*halfBreadth(d,.18)*.72,deckY(d,.18)+.10,stationZ(d,.18,1))],
  .014,materials.rope,'sloop-v2-bowsprit-side-guy-'+side,28);
}
