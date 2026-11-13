import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';
import { straightRiggingPath } from '../../architecture/rigging-geometry.js';

export function buildHeadSails(d,ctx){
 const {part,materials,root}=ctx,group=part('head-sails');
 const mast=d.masts[0],mastPart=ctx.registry.get('mast-'+mast.id);
 if(!mastPart)throw new Error('sloop-v2: head sails require the generated mast');
 const mastStation=.5+mast.z;
 const mastBase=V(0,mastPart.position.y,mastPart.position.z);
 // Use the actual raked mast transform. The former vertical approximation
 // missed the masthead by a visible distance and made the forestays float.
 root.updateMatrixWorld(true);
 const mastHead=mastPart.localToWorld(V(0,mast.height*(4/3),0));
 const bowStation=.012,bowZ=stationZ(d,bowStation,1),bowBaseY=deckY(d,.018)+.12;
 const bowspritTack=V(0,bowBaseY+.22,bowZ-d.bowspritLength*(4/3));
 const innerTackStation=.12;
 const innerTack=V(0,deckY(d,innerTackStation)+.12,stationZ(d,innerTackStation,1));
 const innerHead=mastBase.clone().lerp(mastHead,.73);
 innerHead.z-=.025;

 const outerClew=V(0,bowspritTack.y+(mastHead.y-bowspritTack.y)*.24,
  bowspritTack.z+(mastHead.z-bowspritTack.z)*.70);
 const innerClew=V(0,innerTack.y+(innerHead.y-innerTack.y)*.24,
  innerTack.z+(innerHead.z-innerTack.z)*.74);
 const plans=[
  {id:'outer-jib',name:'sail-head-1',tack:bowspritTack,head:mastHead.clone().add(V(0,-.10,-.04)),
   clew:outerClew,area:60.5,fullness:.085,sheetStation:.55},
  {id:'inner-staysail',name:'sail-head-2',tack:innerTack,head:innerHead,
   clew:innerClew,area:58.5,fullness:.08,sheetStation:.68}
 ];
 for(const [index,plan] of plans.entries()){
  const sail=buildCanvasSail(ctx,plan.name,mast.id,[plan.tack,plan.head,plan.clew,plan.tack],
   plan.fullness,group,'x');
  sail.userData.sailControl.sailType=plan.id;
  sail.userData.sailControl.sailAreaSquareFeet=plan.area;

  // The luff is also the forestay: one straight, centred lead per headsail.
  // Its first point is the moving masthead; the lower end remains at the bow
  // or inner forestay fitting on the hull.
  const stayName=plan.id+'-forestay';
  const stayGroup=part('head-stays-'+(index+1),group);
  const stayPoints=[plan.head,plan.tack];
  const stay=straightRiggingPath(ctx,stayGroup,stayPoints,.010,materials.rope,stayName,36);
  stay.userData.rigRole=plan.id;
  // All articulated stays use the same mast-component reference frame.
  // Convert both authored endpoints into that frame; the lower fitting is
  // still resolved into hull-local coordinates by the shared rigging API.
  const mastFramePoints=stayPoints.map(point=>mastPart.worldToLocal(point.clone()).toArray());
  stay.userData.dynamicMastStay={
   mastId:mast.id,coordinateSpace:'mast-group',points:mastFramePoints,
   fixedEndIndex:1,fixedPoint:mastFramePoints[1],radius:.010,segments:36,radialSegments:7
  };

  const halyards=part('head-halyards-'+plan.id,group);
  const halyardFoot=V(0,deckY(d,mastStation)+.15,mastPart.position.z+.12);
  straightRiggingPath(ctx,halyards,[plan.head,halyardFoot],.0075,materials.rope,
   plan.id+'-halyard',30);

  const sheets=part('head-sheets-'+plan.id,group);
  const fairleadStation=plan.sheetStation;
  const fairleadZ=stationZ(d,fairleadStation,1),fairleadY=deckY(d,fairleadStation)+.07;
  for(const side of [-1,1]){
   const fairlead=V(side*halfBreadth(d,fairleadStation)*.80,fairleadY,fairleadZ);
   const lead=straightRiggingPath(ctx,sheets,[plan.clew,fairlead],.0085,materials.rope,
    plan.id+'-sheet-'+(side<0?'port':'starboard'),24);
   lead.userData.sheetSide=side<0?'port':'starboard';
  }
 }
 group.userData.headRig='double-head cutter';
 group.userData.designSailAreaSquareFeet=119;
}
