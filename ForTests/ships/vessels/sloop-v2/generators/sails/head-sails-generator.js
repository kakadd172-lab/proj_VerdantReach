import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';
export function buildHeadSails(d,ctx){
 const {part,tube,materials}=ctx,group=part('head-sails'),mast=d.masts[0],station=.5+mast.z;
 const mastZ=stationZ(d,station,1),mastBase=deckY(d,station)+.14,mastHead=mastBase+mast.height*(4/3);
 const bowStation=.025,bowZ=stationZ(d,bowStation,1)-d.bowspritLength*(4/3),bowY=deckY(d,bowStation)+.24;
 const plans=[
  {id:'outer-jib',name:'sail-head-1',tack:V(0,bowY,bowZ),head:V(0,mastHead-.12,mastZ-.10),
   clew:V(0,bowY+(mastHead-bowY)*.28,bowZ+(mastZ-bowZ)*.73),fullness:.105},
  {id:'inner-staysail',name:'sail-head-2',tack:V(0,bowY+.12,bowZ+d.hullLengthUnits*.06),
   head:V(0,mastBase+(mastHead-mastBase)*.72,mastZ-.35),
   clew:V(0,bowY+(mastHead-bowY)*.36,bowZ+(mastZ-bowZ)*.75),fullness:.095}
 ];
 for(let i=0;i<Math.min(d.headsails,plans.length);i++){
  const plan=plans[i],index=i+1,sail=buildCanvasSail(ctx,plan.name,mast.id,[plan.tack,plan.head,plan.clew,plan.tack],plan.fullness,group,'x');
  sail.userData.sailControl.sailType=plan.id;
  const stay=part('head-stays-'+index,group);
  tube(stay,[plan.tack.clone().add(V(.045,0,0)),plan.head.clone().add(V(.045,0,0))],.014,materials.rope,'sloop-v2-'+plan.id+'-stay',36);
  const sheets=part('head-sheets-'+index,group);
  for(const side of [-1,1]){
   const fairlead=V(side*halfBreadth(d,.58)*.82,deckY(d,.58)+.15,stationZ(d,.58,1));
   tube(sheets,[plan.clew,V(side*.08,plan.clew.y-.10,plan.clew.z+.25),fairlead],.010,materials.rope,'sloop-v2-'+plan.id+'-sheet-'+side,28);
  }
 }
}
