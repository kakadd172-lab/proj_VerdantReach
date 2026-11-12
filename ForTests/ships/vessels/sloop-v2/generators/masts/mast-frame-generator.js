import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
import { buildCanvasSail } from '../sails/sail-cloth-generator.js';

function setPartPivot(THREE,group,pivot){
 const pivotGroup=new THREE.Group();
 pivotGroup.name=group.name+'-animation-pivot';
 pivotGroup.position.copy(pivot);
 for(const child of [...group.children]){
  group.remove(child);child.position.sub(pivot);pivotGroup.add(child);
 }
 group.add(pivotGroup);
 group.userData.pivotPoint=pivot.toArray();
 group.userData.animationPivot=pivotGroup;
}
export function buildMast(d,ctx,mast){
 const {THREE,part,beam,mesh,materials}=ctx;
 const station=.5+mast.z,z=mast.z*d.hullLengthUnits,baseY=deckY(d,station)+.11;
 const totalHeight=mast.height*(4/3),lowerHeight=totalHeight*(d.structure.lowerMastRatio??.68);
 const radius=d.beamUnits*.025,group=part('mast-'+mast.id);
 group.position.set(0,baseY,z);
 group.rotation.x=THREE.MathUtils.degToRad(mast.rakeDegrees??4.2);
 group.userData.mastControl={mastId:mast.id,windFlex:{side:.008,foreAft:.003}};
 const step=part('mast-step-'+mast.id);
 beam(step,V(-.30,baseY-.10,z),V(.30,baseY-.10,z),.065,materials.trim,'mast-step-crosspiece',10);
 const lower=part('mast-lower-'+mast.id,group);
 const lowerSpar=mesh(lower,new THREE.CylinderGeometry(radius*.62,radius,lowerHeight,14,1),materials.trim,'sloop-v2-lower-mast');
 lowerSpar.position.y=lowerHeight*.5;
 const topmast=part('mast-topmast-'+mast.id,group),topLength=totalHeight-lowerHeight+.15;
 const upperSpar=mesh(topmast,new THREE.CylinderGeometry(radius*.30,radius*.62,topLength,12,1),materials.trim,'sloop-v2-topmast');
 upperSpar.position.y=lowerHeight+topLength*.5-.15;
 buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);
 const boom=part('boom-'+mast.id,group),gaff=part('gaff-spar-'+mast.id,group);
 const tack=V(0,lowerHeight*.11,0),throat=V(0,lowerHeight*.72,0);
 const peak=V(0,lowerHeight*.91,totalHeight*.18),clew=V(0,lowerHeight*.11,totalHeight*.42);
 beam(boom,tack,clew,Math.max(.040,radius*.72),materials.trim,'maid-of-endor-gaff-boom',10);
 setPartPivot(THREE,boom,tack);boom.userData.windControl={kind:'boom',trimScale:1};
 beam(gaff,throat,peak,Math.max(.038,radius*.64),materials.trim,'maid-of-endor-gaff-spar',10);
 setPartPivot(THREE,gaff,throat);gaff.userData.windControl={kind:'gaff'};
 const mainsail=buildCanvasSail(ctx,'sail-'+mast.id+'-gaff',mast.id,[tack,throat,peak,clew],.105,group,'x');
 mainsail.userData.sailControl.sailType='gaff-mainsail';
 mainsail.userData.sailControl.sailAreaSquareFeet=214;
 const running=part('running-rigging-'+mast.id,group),halyards=part('gaff-halyards-'+mast.id,running);
 const throatBlock=V(-.10,lowerHeight*.94,-.04),peakBlock=V(.10,totalHeight*.98,.04);
 const deckLocalY=deckY(d,station)-baseY+.10;
 ctx.tube(halyards,[throat,throatBlock,V(-.18,deckLocalY,.16)],.009,materials.rope,'throat-halyard',28);
 ctx.tube(halyards,[peak,peakBlock,V(.18,deckLocalY,.20)],.009,materials.rope,'peak-halyard',28);
 const sheets=part('mainsheet-'+mast.id,running),aftZ=stationZ(d,.88,1)-z;
 ctx.tube(sheets,[V(.10,clew.y,clew.z),V(.08,(clew.y+deckLocalY)*.5,(clew.z+aftZ)*.5),
  V(0,deckLocalY,aftZ)],.010,materials.rope,'gaff-mainsheet',28);
 return group;
}
