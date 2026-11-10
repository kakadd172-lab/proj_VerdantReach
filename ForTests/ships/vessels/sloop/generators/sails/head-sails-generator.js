import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "./sail-cloth-generator.js";

export function buildHeadSails(d,ctx){
 const {part,tube,materials,V}=ctx;
 const head=part('head-sails');
 const fore=d.masts[0],mastStation=0.5+fore.z,foreZ=fore.z*d.hullLengthUnits;
 const foreBase=deckY(d,mastStation)+.12;
 const foreTop=foreBase+fore.height*(4/3);
 const bowspritLength=(d.bowspritLength??2.7)*(4/3);
 const bowspritTipZ=stationZ(d,.012,1)-bowspritLength;
 const bowY=deckY(d,.035)+.22;
 const outerSpan=foreZ-bowspritTipZ;

 // Keep the two head sails on separate, parallel stays so their canvas and
 // outlines do not z-fight or read as one narrow double-thick strip.
 const innerTackZ=stationZ(d,.055,1)-.12;
 const innerTackY=deckY(d,.055)+.30;
 const innerPeakY=foreBase+(foreTop-foreBase)*.77;
 const innerPeakZ=foreZ-.55;

 const plans=[
  {
   id:'outer-jib',
   side:-1,
   tack:V(-.28,bowY+.06,bowspritTipZ),
   peak:V(-.28,foreTop-.12,foreZ-.06),
   clew:V(-.28,bowY+(foreTop-bowY)*.26,bowspritTipZ+outerSpan*.74),
   fullness:.112,
   sheetStation:.46
  },
  {
   id:'inner-staysail',
   side:1,
   tack:V(.28,innerTackY,innerTackZ),
   peak:V(.28,innerPeakY,innerPeakZ),
   clew:V(.28,innerTackY+(innerPeakY-innerTackY)*.22,innerTackZ+(innerPeakZ-innerTackZ)*.76),
   fullness:.102,
   sheetStation:.57
  }
 ];

 for(let i=0;i<Math.min(d.headsails,plans.length);i++){
  const plan=plans[i],index=i+1;
  const sail=buildCanvasSail(ctx,'sail-head-'+index,fore.id,
    [plan.tack,plan.peak,plan.clew,plan.tack],plan.fullness,head,'x');
  sail.userData.sailControl.sailType=plan.id;

  // The sail's luff boltrope is also its supporting stay. Keep a named
  // editor handle, but do not draw a second rope on top of that edge.
  const stays=part('head-stays-'+index,head);
  stays.userData.rigRole=plan.id;
  stays.userData.sailLuffPart='sail-head-'+index;
  stays.userData.supportLine='luff-boltrope';

  // One working sheet per sail keeps the foredeck clear of crossed spare lines.
  const sheets=part('head-sheets-'+plan.id,head);
  const anchorY=deckY(d,plan.sheetStation)+.20;
  const anchorZ=stationZ(d,plan.sheetStation,1);
  const rail=halfBreadth(d,plan.sheetStation)*.84;
  tube(sheets,[plan.clew,V(plan.side*rail,anchorY,anchorZ)],
    .010,materials.rope,plan.id+'-working-sheet',28);
 }
}
