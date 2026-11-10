import { deckY, halfBreadth, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
import { buildStandingRigging } from "../rigging/standing-rigging-generator.js";

export function buildMast(d,ctx,mast){
 const {THREE,part,beam,tube,materials,V}=ctx;
 const mastT=0.5+mast.z;
 const z=mast.z*d.hullLengthUnits,baseY=deckY(d,mastT)+0.12,totalHeight=mast.height*(4/3),group=part('mast-'+mast.id);
 group.position.set(0,baseY,z);
 group.userData.mastControl={mastId:mast.id};
 const lowerHeight=totalHeight*(d.structure.lowerMastRatio??.68),radius=d.beamUnits*(mast.rig==='junk'?.026:.032);
 const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
 beam(step,V(-.42,baseY-.18,z),V(.42,baseY-.18,z),.10,materials.trim,'mast-step-crossbeam');
 const lowerBase=Math.max(.12,radius*1.35),lowerTop=Math.max(.075,radius*.68),lowerSpar=ctx.mesh(lower,new THREE.CylinderGeometry(lowerTop,lowerBase,lowerHeight,12,1),materials.trim,'lower-mast');
 lowerSpar.position.y=lowerHeight*.5;
 const topStart=lowerHeight-.12,topLength=totalHeight-topStart,topSpar=ctx.mesh(topmast,new THREE.CylinderGeometry(Math.max(.035,radius*.34),Math.max(.055,radius*.68),topLength,10,1),materials.trim,'topmast');
 topSpar.position.y=topStart+topLength*.5;

 // Standing stays are nested beneath the mast so moving the mast in the
 // editor carries its shrouds, ratlines and backstays with it.
 buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);

 if(mast.rig==='gaff'||mast.rig==='trysail'){
  const type=mast.rig==='trysail'?'trysail':'gaff';
  const run=d.hullLengthUnits*(mast.span??.42);
  const low=lowerHeight*.14,throat=lowerHeight*.76,peak=lowerHeight*.95,headRun=run*.78,clewRun=run;
  const gaff=part('gaff-spar-'+mast.id,group),boom=part('boom-'+mast.id,group);
  const tack=V(0,low,0),throatPoint=V(0,throat,0),peakPoint=V(0,peak,headRun),clew=V(0,low*.92,clewRun);
  beam(gaff,throatPoint,peakPoint,.062,materials.trim,'gaff-spar');
  beam(boom,tack,clew,.066,materials.trim,'boom-spar');
  const mainsail=buildCanvasSail(ctx,'sail-'+mast.id+'-'+type,mast.id,[tack,throatPoint,peakPoint,clew],.105,group,'x');
  mainsail.userData.sailControl.sailType='gaff-mainsail';

  // A separate jackyard and triangular gaff topsail sit above the gaff.
  const masthead=V(0,totalHeight*.985,0);
  const jackyardTip=V(0,totalHeight*.875,headRun*.98);
  const jackyard=part('topsail-jackyard-'+mast.id,group);
  beam(jackyard,masthead,jackyardTip,.043,materials.trim,'gaff-topsail-jackyard');
  const topsail=buildCanvasSail(ctx,'sail-'+mast.id+'-gaff-topsail',mast.id,
    [peakPoint,masthead,jackyardTip,peakPoint],.078,group,'x');
  topsail.userData.sailControl.sailType='gaff-topsail';

  const running=part('running-rigging-'+mast.id,group);
  const gaffHalyards=part('gaff-halyards-'+mast.id,running);
  tube(gaffHalyards,[V(0,lowerHeight*.91,-.05),V(0,throat,0)],.012,materials.rope,'gaff-throat-halyard',24);
  tube(gaffHalyards,[masthead,peakPoint],.012,materials.rope,'gaff-peak-halyard',28);

  const topsailHalyards=part('topsail-halyards-'+mast.id,running);
  tube(topsailHalyards,[masthead,jackyardTip],.010,materials.rope,'topsail-jackyard-lift',24);
  tube(topsailHalyards,[V(0,totalHeight*.91,headRun*.18),peakPoint],.009,materials.rope,'topsail-downhaul',24);

  const boomLines=part('boom-running-rigging-'+mast.id,running);
  const aftDeckY=deckY(d,Math.min(.96,mastT+.22))-baseY+.14;
  tube(boomLines,[masthead,V(0,low*.92,clewRun)],.011,materials.rope,'boom-topping-lift',28);
  tube(boomLines,[V(0,low*.92,clewRun),V(0,aftDeckY,clewRun+.42)],.012,materials.rope,'mainsheet',28);
  tube(boomLines,[V(0,low*.55,clewRun*.55),V(0,deckY(d,Math.min(.94,mastT+.12))-baseY+.10,clewRun*.64)],.010,materials.rope,'boom-vang',24);
 }
 return group;
}
