import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "./sail-cloth-generator.js";

export function buildHeadSails(d,ctx){
  const {part,tube,materials,V}=ctx;
  const head=part('head-sails');
  const fore=d.masts[0];
  const mastStation=.5+fore.z;
  const foreZ=fore.z*d.hullLengthUnits;
  const foreBase=deckY(d,mastStation)+.12;
  const foreTop=foreBase+fore.height*(4/3);
  const bowspritLength=(d.bowspritLength??2.7)*(4/3);
  const bowspritTipZ=stationZ(d,.012,1)-bowspritLength;
  const bowY=deckY(d,.035)+.22;
  const outerSpan=foreZ-bowspritTipZ;

  // The inner staysail is set aft of the outer jib, preserving both sail plans.
  const innerStaysailAftOffset=.75;
  const innerTackZ=stationZ(d,.055,1)-.12+innerStaysailAftOffset;
  const innerTackY=deckY(d,.055)+.30;
  const innerPeakY=foreBase+(foreTop-foreBase)*.77;
  const innerPeakZ=foreZ-.55+innerStaysailAftOffset;

  const plans=[
    {
      id:'outer-jib',
      tack:V(0,bowY+.06,bowspritTipZ),
      peak:V(0,foreTop-.12,foreZ-.06),
      clew:V(0,bowY+(foreTop-bowY)*.26,bowspritTipZ+outerSpan*.74),
      fullness:.112,
      sheetStation:.46
    },
    {
      id:'inner-staysail',
      tack:V(0,innerTackY,innerTackZ),
      peak:V(0,innerPeakY,innerPeakZ),
      clew:V(0,innerTackY+(innerPeakY-innerTackY)*.22,
        innerTackZ+(innerPeakZ-innerTackZ)*.76),
      fullness:.102,
      sheetStation:.57
    }
  ];

  for(let i=0;i<Math.min(d.headsails,plans.length);i++){
    const plan=plans[i],index=i+1;
    const sail=buildCanvasSail(ctx,'sail-head-'+index,fore.id,
      [plan.tack,plan.peak,plan.clew,plan.tack],
      plan.fullness,head,'x');
    sail.userData.sailControl.sailType=plan.id;

    // The stay is a separate structural rope, slightly offset from the sail
    // luff so both the support and the canvas edge remain readable.
    const stayGroup=part('head-stays-'+index,head);
    const staySide=index===1?-1:1;
    const stayX=staySide*.055;
    const stay=tube(stayGroup,
      [V(stayX,plan.tack.y,plan.tack.z),V(stayX,plan.peak.y,plan.peak.z)],
      index===1?.015:.013,materials.rope,
      index===1?'outer-jib-forestay':'inner-staysail-stay',40);
    stay.userData.riggingFunction=index===1?'supports-outer-jib':'supports-inner-staysail';
    stayGroup.userData.rigRole=plan.id;

    // Each sail has its own halyard: from its head to a masthead/hounds block,
    // then down the mast to a belaying point. The two falls are kept on
    // opposite sides to avoid visually merging.
    const halyards=part('head-halyards-'+plan.id,head);
    const halyardX=staySide*.16;
    const block=V(halyardX,plan.peak.y+(index===1?.18:.24),
      foreZ+(index===1?-.02:.10));
    const belay=V(halyardX*1.45,deckY(d,mastStation)+.26,
      stationZ(d,mastStation,1)+.18);
    tube(halyards,
      [V(stayX,plan.peak.y,plan.peak.z),block,
       V(halyardX*1.25,(block.y+belay.y)*.52,block.z+.03),belay],
      .009,materials.rope,plan.id+'-halyard-fall',36);
    halyards.userData.servesSail=plan.id;

    // Port and starboard sheets are both present, led through quarter blocks
    // and aft to separate fairleads. One is working and the other is slack in
    // a real tack, but both are retained in the static editor model.
    const sheets=part('head-sheets-'+plan.id,head);
    const fairleadStation=plan.sheetStation;
    const leadStation=Math.min(.86,fairleadStation+.12);
    for(const side of [-1,1]){
      const fairlead=V(side*halfBreadth(d,fairleadStation)*.84,
        deckY(d,fairleadStation)+.18,
        stationZ(d,fairleadStation,1));
      const belayPoint=V(side*halfBreadth(d,leadStation)*.72,
        deckY(d,leadStation)+.15,
        stationZ(d,leadStation,1));
      const sheet=tube(sheets,
        [plan.clew,V(side*.06,plan.clew.y-.10,plan.clew.z+.30),
         fairlead,belayPoint],
        .010,materials.rope,
        plan.id+'-sheet-'+(side<0?'port':'starboard'),36);
      sheet.userData.sheetSide=side<0?'port':'starboard';
    }
  }
}
