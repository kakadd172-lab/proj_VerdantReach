import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "./sail-cloth-generator.js";

export function buildHeadSails(d,ctx){
 const {part,tube,materials,V}=ctx;
 const head=part('head-sails');
 const fore=d.masts[0],mastStation=0.5+fore.z,foreZ=fore.z*d.hullLengthUnits;
 const foreBase=deckY(d,mastStation)+0.12;
 const foreTop=foreBase+fore.height*(4/3);
 const bowspritLength=(d.bowspritLength??2.7)*(4/3);
 const bowspritTipZ=stationZ(d,0.012,1)-bowspritLength;
 const bowY=deckY(d,0.035)+0.22;
 const outerSpan=foreZ-bowspritTipZ;
 const innerTackZ=stationZ(d,0.035,1)-.08;
 const innerTackY=deckY(d,0.035)+.27;
 const innerPeakY=bowY+(foreTop-bowY)*.78;

 const plans=[
  {
   id:'outer-jib',
   tack:V(0,bowY+.08,bowspritTipZ),
   peak:V(0,foreTop-.16,foreZ-.08),
   clew:V(0,bowY+(foreTop-bowY)*.42,bowspritTipZ+outerSpan*.57),
   fullness:.082,
   sheetStation:.24
  },
  {
   id:'inner-staysail',
   tack:V(0,innerTackY,innerTackZ),
   peak:V(0,innerPeakY,foreZ-.42),
   clew:V(0,innerTackY+(innerPeakY-innerTackY)*.40,innerTackZ+(foreZ-innerTackZ)*.61),
   fullness:.070,
   sheetStation:.34
  }
 ];

 for(let i=0;i<Math.min(d.headsails,plans.length);i++){
  const plan=plans[i];
  const index=i+1;
  const sail=buildCanvasSail(ctx,'sail-head-'+index,fore.id,
    [plan.tack,plan.peak,plan.clew,plan.tack],plan.fullness,head,'x');
  sail.userData.sailControl.sailType=plan.id;
  const stays=part('head-stays-'+index,head);
  stays.userData.rigRole=plan.id;
  tube(stays,[plan.tack,plan.peak],.012,materials.rope,plan.id+'-stay',34);
  tube(stays,[plan.tack,plan.clew],.008,materials.rope,plan.id+'-clew-line',26);

  const sheets=part('head-sheets-'+plan.id,head);
  const anchorY=deckY(d,plan.sheetStation)+.16;
  const anchorZ=stationZ(d,plan.sheetStation,1);
  const rail=halfBreadth(d,plan.sheetStation)*.72;
  for(const side of [-1,1]){
   tube(sheets,[plan.clew,V(side*rail,anchorY,anchorZ)],.010,materials.rope,
    plan.id+'-sheet-'+(side<0?'port':'starboard'),26);
  }
 }
}
