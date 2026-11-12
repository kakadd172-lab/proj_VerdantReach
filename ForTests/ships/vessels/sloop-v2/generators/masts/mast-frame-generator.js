import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
import { buildCanvasSail } from '../sails/sail-cloth-generator.js';

function setPartPivot(THREE,group,pivot){
 const pivotGroup=new THREE.Group();
 pivotGroup.name=group.name+'-animation-pivot';
 pivotGroup.position.copy(pivot);
 for(const child of [...group.children]){
  group.remove(child);
  child.position.sub(pivot);
  pivotGroup.add(child);
 }
 group.add(pivotGroup);
 group.userData.pivotPoint=pivot.toArray();
 group.userData.animationPivot=pivotGroup;
}

export function buildMast(d,ctx,mast){
 const {THREE,part,beam,mesh,materials}=ctx;
 const station=.5+mast.z;
 const z=mast.z*d.hullLengthUnits;
 const baseY=deckY(d,station)+.14;
 const totalHeight=mast.height*(4/3);
 const lowerHeight=totalHeight*(d.structure.lowerMastRatio??.68);
 const radius=d.beamUnits*.027;
 const group=part('mast-'+mast.id);
 group.position.set(0,baseY,z);
 group.userData.mastControl={mastId:mast.id,windFlex:{side:.01,foreAft:.003}};

 const step=part('mast-step-'+mast.id);
 beam(step,V(-.42,baseY-.16,z),V(.42,baseY-.16,z),
  .105,materials.trim,'sloop-v2-mast-step-crosspiece',10);
 const lower=part('mast-lower-'+mast.id,group);
 const lowerSpar=mesh(lower,new THREE.CylinderGeometry(radius*.62,radius,lowerHeight,14,1),
  materials.trim,'sloop-v2-lower-mast');
 lowerSpar.position.y=lowerHeight*.5;
 const topmast=part('mast-topmast-'+mast.id,group);
 const topLength=totalHeight-lowerHeight+.18;
 const upperSpar=mesh(topmast,new THREE.CylinderGeometry(radius*.30,radius*.62,topLength,12,1),
  materials.trim,'sloop-v2-topmast');
 upperSpar.position.y=lowerHeight+topLength*.5-.18;

 buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);

 const boom=part('boom-'+mast.id,group);
 const gaff=part('gaff-spar-'+mast.id,group);
 const tack=V(0,lowerHeight*.13,0);
 const throat=V(0,lowerHeight*.73,0);
 const peak=V(0,lowerHeight*.91,totalHeight*.28);
 const clew=V(0,lowerHeight*.12,totalHeight*.43);
 beam(boom,tack,clew,Math.max(.055,radius*.75),materials.trim,'sloop-v2-gaff-boom',10);
 setPartPivot(THREE,boom,tack);
 boom.userData.windControl={kind:'boom',trimScale:1};
 beam(gaff,throat,peak,Math.max(.05,radius*.68),materials.trim,'sloop-v2-gaff-spar',10);
 setPartPivot(THREE,gaff,throat);
 gaff.userData.windControl={kind:'gaff'};

 const mainsail=buildCanvasSail(ctx,'sail-'+mast.id+'-gaff',mast.id,
  [tack,throat,peak,clew],.108,group,'x');
 mainsail.userData.sailControl.sailType='gaff-mainsail';

 const running=part('running-rigging-'+mast.id,group);
 const halyards=part('gaff-halyards-'+mast.id,running);
 const throatBlock=V(-.12,lowerHeight*.94,-.05);
 const peakBlock=V(.12,totalHeight*.98,.06);
 const deckLocalY=deckY(d,station)-baseY+.16;
 ctx.tube(halyards,[throat,throatBlock,V(-.24,deckLocalY,.22)],
  .011,materials.rope,'sloop-v2-throat-halyard',32);
 ctx.tube(halyards,[peak,peakBlock,V(.25,deckLocalY,.26)],
  .010,materials.rope,'sloop-v2-peak-halyard',32);
 const sheets=part('mainsheet-'+mast.id,running);
 const aftZ=stationZ(d,.91,1)-z;
 ctx.tube(sheets,[V(.12,clew.y,clew.z),
  V(.10,(clew.y+deckLocalY)*.5,(clew.z+aftZ)*.5),
  V(0,deckLocalY,aftZ)],.012,materials.rope,'sloop-v2-mainsheet',32);
 return group;
}
