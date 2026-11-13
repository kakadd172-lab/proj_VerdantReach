import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';
import { straightRiggingPath } from '../../architecture/rigging-geometry.js';

export function buildHeadSails(d,ctx){
 const {part,tube,materials}=ctx,group=part('head-sails');
 const mast=d.masts[0],mastStation=.5+mast.z;
 const mastZ=stationZ(d,mastStation,1),mastBase=deckY(d,mastStation)+.11;
 const mastHead=mastBase+mast.height*(4/3);
 const bowspritTip=stationZ(d,.025,1)-d.bowspritLength*(4/3);
 const bowY=deckY(d,.025)+.18;
 const innerTackStation=.12,innerTackZ=stationZ(d,innerTackStation,1);
 const innerTackY=deckY(d,innerTackStation)+.12;
 const outerClew=V(0,bowY+(mastHead-bowY)*.24,bowspritTip+(mastZ-bowspritTip)*.70);
 const innerPeakY=mastBase+(mastHead-mastBase)*.73;
 const innerPeakZ=mastZ-.18;
 const innerClew=V(0,innerTackY+(innerPeakY-innerTackY)*.24,
  innerTackZ+(innerPeakZ-innerTackZ)*.74);
 const plans=[
  {id:'outer-jib',name:'sail-head-1',tack:V(0,bowY,bowspritTip),
   head:V(0,mastHead-.10,mastZ-.05),clew:outerClew,area:60.5,fullness:.095,sheetStation:.55},
  {id:'inner-staysail',name:'sail-head-2',tack:V(0,innerTackY,innerTackZ),
   head:V(0,innerPeakY,innerPeakZ),clew:innerClew,area:58.5,fullness:.09,sheetStation:.68}
 ];
 for(let i=0;i<plans.length;i++){
  const plan=plans[i],index=i+1;
  const sail=buildCanvasSail(ctx,plan.name,mast.id,[plan.tack,plan.head,plan.clew,plan.tack],
   plan.fullness,group,'x');
  sail.userData.sailControl.sailType=plan.id;
  sail.userData.sailControl.sailAreaSquareFeet=plan.area;
  const stayGroup=part('head-stays-'+index,group);
  const staySide=index===1?-1:1,stayX=staySide*.045;
  const stay=tube(stayGroup,[V(stayX,plan.tack.y,plan.tack.z),V(stayX,plan.head.y,plan.head.z)],
   .012,materials.rope,index===1?'outer-jib-forestay':'inner-staysail-stay',36);
  stay.userData.rigRole=plan.id;
  const halyards=part('head-halyards-'+plan.id,group);
  const halyardX=staySide*.12;
  straightRiggingPath(ctx,halyards,[V(halyardX,plan.head.y+.05,plan.head.z),V(halyardX,plan.head.y-.25,plan.head.z+.08),
   V(halyardX,deckY(d,mastStation)+.15,mastZ+.12)],.008,materials.rope,plan.id+'-halyard',30);
  const sheets=part('head-sheets-'+plan.id,group);
  const fairleadStation=plan.sheetStation;
  const fairleadZ=stationZ(d,fairleadStation,1),fairleadY=deckY(d,fairleadStation)+.10;
  for(const side of [-1,1]){
   const fairlead=V(side*halfBreadth(d,fairleadStation)*.82,fairleadY,fairleadZ);
   const sheet=straightRiggingPath(ctx,sheets,[plan.clew,V(side*.04,plan.clew.y-.08,plan.clew.z+.16),fairlead],
    .009,materials.rope,plan.id+'-sheet-'+(side<0?'port':'starboard'),28);
   sheet.userData.sheetSide=side<0?'port':'starboard';
  }
 }
 group.userData.headRig='double-head cutter';
 group.userData.designSailAreaSquareFeet=119;
}
