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
 const innerHead=mastBase.clone().lerp(mastHead,.94);
 innerHead.z-=.025;

 // The specification gives each headsail area. Calculate the clew station
 // from that area instead of using arbitrary fractional offsets that silently
 // produce sails much larger or smaller than the stated plan.
 const squareFeetToSquareMetres=1/10.7639104167;
 const worldUnitsPerMetre=4/3;
 const clewForSpecifiedArea=(tack,head,areaSquareFeet,verticalFraction=.24)=>{
  const rise=head.y-tack.y,run=head.z-tack.z;
  const targetAreaUnits=areaSquareFeet*squareFeetToSquareMetres*
   worldUnitsPerMetre*worldUnitsPerMetre;
  if(!(rise>0&&run>0))throw new Error('sloop-v2: headsail head must be above and aft of its tack');
  const fraction=verticalFraction+(2*targetAreaUnits)/(rise*run);
  if(fraction<=verticalFraction||fraction>=.99)
   throw new Error('sloop-v2: specified headsail area cannot fit the available luff and foot');
  return V(tack.x+(head.x-tack.x)*verticalFraction,
   tack.y+rise*verticalFraction,tack.z+run*fraction);
 };
 const outerHead=mastHead.clone().add(V(0,-.10,-.04));
 const outerClew=clewForSpecifiedArea(bowspritTack,outerHead,60.5);
 const innerClew=clewForSpecifiedArea(innerTack,innerHead,58.5);
 const plans=[
  {id:'outer-jib',name:'sail-head-1',tack:bowspritTack,head:outerHead,
   clew:outerClew,area:60.5,fullness:.085,sheetStation:.55},
  {id:'inner-staysail',name:'sail-head-2',tack:innerTack,head:innerHead,
   clew:innerClew,area:58.5,fullness:.08,sheetStation:.68}
 ];
 for(const [index,plan] of plans.entries()){
  const sail=buildCanvasSail(ctx,plan.name,mast.id,[plan.tack,plan.head,plan.clew,plan.tack],
   plan.fullness,group,'x');
  sail.userData.sailControl.sailType=plan.id;
  sail.userData.sailControl.sailAreaSquareFeet=plan.area;
  const areaVector=plan.head.clone().sub(plan.tack).cross(plan.clew.clone().sub(plan.tack));
  sail.userData.sailControl.geometricPlanAreaSquareFeet=
   .5*areaVector.length()/(worldUnitsPerMetre*worldUnitsPerMetre)/squareFeetToSquareMetres;

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
   fixedEndIndex:1,fixedPoint:mastFramePoints[1],resolveAgainstChainplates:false,
   anchorRole:plan.id==='outer-jib'?'bowsprit-tack':'inner-forestay-hull-fitting',
   radius:.010,segments:36,radialSegments:7
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
