import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildBow(d,ctx){
 const {part,beam,tube,materials}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit');
 const bowZ=stationZ(d,.012,1),baseY=deckY(d,.018)+.12;
 beam(bow,V(0,baseY-.42,bowZ+.10),V(0,baseY,bowZ+.32),
  Math.max(.065,d.beamUnits*.016),materials.trim,'maid-of-endor-raked-stem-cap',12);
 const start=V(0,baseY+.10,bowZ+.22),tip=V(0,baseY+.22,bowZ-d.bowspritLength*(4/3));
 beam(bowsprit,start,tip,Math.max(.045,d.beamUnits*.010),materials.trim,'maid-of-endor-bowsprit',12);
 for(const side of [-1,1])tube(bowsprit,[V(side*.045,start.y-.06,start.z+.12),
  V(side*halfBreadth(d,.075)*.70,deckY(d,.075)+.07,stationZ(d,.075,1)),
  V(side*halfBreadth(d,.17)*.68,deckY(d,.17)+.07,stationZ(d,.17,1))],
  .010,materials.rope,'bowsprit-side-guy-'+side,28);
 const bobstay=part('bowsprit-bobstay',bowsprit);
 tube(bobstay,[V(0,tip.y-.04,tip.z),V(0,deckY(d,.025)-.10,stationZ(d,.025,1)),
  V(0,baseY-.48,stationZ(d,.06,1))],.012,materials.rope,'bowsprit-bobstay-line',32);
}
