import { deckY, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
import { buildStandingRigging } from "../rigging/standing-rigging-generator.js";

export function buildMast(d,ctx,mast){
 const {THREE,part,beam,tube,materials,V}=ctx;
 const mastT=0.5+mast.z;
 const z=mast.z*d.hullLengthUnits,baseY=deckY(d,mastT)+0.12,totalHeight=mast.height*(4/3),group=part('mast-'+mast.id);
 group.position.set(0,baseY,z);
 group.userData.mastControl={mastId:mast.id};
 const lowerHeight=totalHeight*(d.structure.lowerMastRatio??.68),radius=d.beamUnits*.032;
 const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
 beam(step,V(-.42,baseY-.18,z),V(.42,baseY-.18,z),.10,materials.trim,'mast-step-crossbeam');
 const lowerBase=Math.max(.12,radius*1.35),lowerTop=Math.max(.075,radius*.68);
 const lowerSpar=ctx.mesh(lower,new THREE.CylinderGeometry(lowerTop,lowerBase,lowerHeight,12,1),materials.trim,'lower-mast');
 lowerSpar.position.y=lowerHeight*.5;
 const topStart=lowerHeight-.12,topLength=totalHeight-topStart;
 const topSpar=ctx.mesh(topmast,new THREE.CylinderGeometry(Math.max(.035,radius*.34),Math.max(.055,radius*.68),topLength,10,1),materials.trim,'topmast');
 topSpar.position.y=topStart+topLength*.5;

 // Shrouds, ratlines and backstays belong to this mast assembly.
 buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);

 if(mast.rig==='gaff'||mast.rig==='trysail'){
  const type=mast.rig==='trysail'?'trysail':'gaff';
  const run=d.hullLengthUnits*(mast.span??.42);
  const low=lowerHeight*.14,throat=lowerHeight*.76,peak=lowerHeight*.95;
  const headRun=run*.78,clewRun=run;
  const gaff=part('gaff-spar-'+mast.id,group),boom=part('boom-'+mast.id,group);
  const tack=V(0,low,0),throatPoint=V(0,throat,0),peakPoint=V(0,peak,headRun),clew=V(0,low*.92,clewRun);
  beam(gaff,throatPoint,peakPoint,.062,materials.trim,'gaff-spar');
  beam(boom,tack,clew,.066,materials.trim,'boom-spar');

  const mainsail=buildCanvasSail(ctx,'sail-'+mast.id+'-'+type,mast.id,[tack,throatPoint,peakPoint,clew],.105,group,'x');
  mainsail.userData.sailControl.sailType='gaff-mainsail';

  // The gaff itself forms the foot of the topsail. No extra jackyard is used.
  const masthead=V(0,totalHeight*.985,0);
  const topsail=buildCanvasSail(ctx,'sail-'+mast.id+'-gaff-topsail',mast.id,
    [throatPoint,masthead,peakPoint,throatPoint],.112,group,'x');
  topsail.userData.sailControl.sailType='gaff-topsail';

  // Only the two functional gaff halyards are shown, routed just off the sail plane.
  const halyardX=-.15;
  const running=part('running-rigging-'+mast.id,group);
  const gaffHalyards=part('gaff-halyards-'+mast.id,running);
  tube(gaffHalyards,[V(halyardX,lowerHeight*.93,-.05),V(halyardX,throat,0)],
    .010,materials.rope,'gaff-throat-halyard',24);
  tube(gaffHalyards,[V(halyardX,totalHeight*.985,0),V(halyardX,peak,headRun)],
    .010,materials.rope,'gaff-peak-halyard',28);

  // A compact mainsheet and vang are enough for this small working sloop.
  const boomLines=part('boom-running-rigging-'+mast.id,running);
  const aftStation=Math.min(.96,mastT+.24);
  const aftDeckY=deckY(d,aftStation)-baseY+.14;
  tube(boomLines,[V(-.10,low*.92,clewRun),V(-.30,aftDeckY,clewRun+.42)],
    .011,materials.rope,'mainsheet',28);
  tube(boomLines,[V(-.10,low*.58,clewRun*.52),V(-.24,deckY(d,Math.min(.94,mastT+.13))-baseY+.10,clewRun*.62)],
    .009,materials.rope,'boom-vang',24);
 }
 return group;
}
