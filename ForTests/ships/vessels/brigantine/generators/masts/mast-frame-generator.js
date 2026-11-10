import { deckY, halfBreadth, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
import { buildStandingRigging } from "../rigging/standing-rigging-generator.js";
export function buildMast(d,ctx,mast){
 if(!mast)throw new TypeError("brigantine: mast definition is required");
 const {THREE,part,beam,tube,materials,V}=ctx;
 const z=mast.z*d.hullLengthUnits,baseY=deckY(d,.5+mast.z*.45)+.12,totalHeight=mast.height*(4/3),topY=baseY+totalHeight,group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const lowerHeight=totalHeight*(d.structure.lowerMastRatio??.64),radius=d.beamUnits*(mast.rig==='junk'?.026:.018)*(mast.radiusScale??1);
  const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
  beam(step,V(-.33,baseY-.18,z),V(.33,baseY-.18,z),.11,materials.trim,'mast-step-crossbeam');
  const lowerBase=Math.max(.12,radius*1.35),lowerTop=Math.max(.075,radius*.68);
  const lowerSpar=ctx.mesh(lower,new THREE.CylinderGeometry(lowerTop,lowerBase,lowerHeight,12,1),materials.trim,'lower-mast');lowerSpar.position.y=lowerHeight*.5;
  const topStart=lowerHeight-.12,topLength=totalHeight-topStart;
  const topSpar=ctx.mesh(topmast,new THREE.CylinderGeometry(Math.max(.035,radius*.34),Math.max(.055,radius*.68),topLength,10,1),materials.trim,'topmast');topSpar.position.y=topStart+topLength*.5;
  if(mast.rig==='junk'){
   const span=d.hullLengthUnits*(mast.span??.72)*.52,low=totalHeight*.09,high=totalHeight*.88;
   const yard=part('junk-yard-'+mast.id,group),boom=part('junk-boom-'+mast.id,group);
   const topForward=V(0,high,span*.06),topAft=V(0,high*.96,span*.90),bottomForward=V(0,low,0),bottomAft=V(0,low,span);
   beam(yard,topForward,topAft,Math.max(.08,radius*1.25),materials.trim,'junk-lug-yard');
   beam(boom,bottomForward,bottomAft,Math.max(.07,radius*1.05),materials.trim,'junk-lug-boom');
   buildCanvasSail(ctx,'sail-'+mast.id+'-junk',mast.id,[bottomForward,topForward,topAft,bottomAft],.095,group,'x');
   const battens=part('junk-battens-'+mast.id,group);
   for(let i=1;i<=9;i++){const f=i/10,y=low+(high-low)*f,left=span*(.035+.025*f),right=span*(.965-.065*f),batten=part('batten-'+mast.id+'-'+i,battens);beam(batten,V(0,y,left),V(0,y-.025,right),Math.max(.024,radius*.30),materials.trim,'bamboo-batten');}
   const sheets=part('junk-sheets-'+mast.id,group);tube(sheets,[V(.12,low+.18,span*.22),V(.22,low+.12,span*.7),V(.16,low+.1,span*.96)],.016,materials.rope,'junk-sheet-lines',24);
   return group;
  }
  buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);
  if(mast.rig==='square'||mast.rig==='brigantine'){
   if((mast.rig==='square'&&(mast.squares??2)>0)||mast.rig==='brigantine'){
    const platform=part('mast-platform-'+mast.id,group),disk=ctx.mesh(platform,new THREE.CylinderGeometry(Math.max(.40,d.beamUnits*.055),Math.max(.46,d.beamUnits*.062),.12,16),materials.trim,'top-platform');disk.position.set(0,lowerHeight*.86,0);}
   const levels=mast.rig==='square'?['course','topsail','topgallant'].slice(0,mast.squares??2):['topsail'],widths=[.40,.33,.26],starts=[.08,.31,.54];
   levels.forEach((level,index)=>{
    const width=d.hullLengthUnits*(mast.rig==='brigantine'?.32:(widths[index]??.24))*(d.structure.yardSpread??1)*(mast.yardScale??1);
    const y0=totalHeight*(mast.rig==='brigantine'?.48:starts[index]),y1=y0+totalHeight*(mast.rig==='brigantine'?.20:.22),yard=part('yard-'+mast.id+'-'+level,group);
    beam(yard,V(-width*.5,y1,0),V(width*.5,y1,0),Math.max(.055,radius*.72),materials.trim,'square-yard');
    buildCanvasSail(ctx,'sail-'+mast.id+'-'+level,mast.id,[V(-width*.49,y0,0),V(-width*.45,y1,0),V(width*.45,y1,0),V(width*.49,y0,0)],.09-index*.012,group);
    const sheets=part('sheets-'+mast.id+'-'+level,group);for(let side of [-1,1])beam(sheets,V(side*width*.46,y0,0),V(side*width*.46,y0-.24,.16),.016,materials.rope,'sail-sheet');
   });
  }
  if(mast.rig==='gaff'||mast.rig==='trysail'||mast.rig==='brigantine'||mast.spanker){
   const type=mast.rig==='trysail'?'trysail':mast.spanker?'spanker':'gaff',run=d.hullLengthUnits*(mast.span??.38)*1.08,low=lowerHeight*.14,high=lowerHeight*.82,headRun=run*.80,gaff=part('gaff-spar-'+mast.id,group),boom=part('boom-'+mast.id,group);
   beam(gaff,V(0,high,-.12),V(0,high+.05,headRun),.062,materials.trim,'gaff-spar');beam(boom,V(0,low,0),V(0,low,run),.068,materials.trim,'boom-spar');
   buildCanvasSail(ctx,'sail-'+mast.id+'-'+type,mast.id,[V(0,low,0),V(0,high,-.12),V(0,high+.05,headRun),V(0,low,run)],.10,group,'x');
  }else if(mast.rig==='lateen'){
   const span=d.hullLengthUnits*(mast.span??.42)*.94,low=totalHeight*.09,peak=totalHeight*.90,yard=part('lateen-yard-'+mast.id,group);
   beam(yard,V(0,peak,-span*.30),V(0,low,span),.075,materials.trim,'lateen-yard');
   buildCanvasSail(ctx,'sail-'+mast.id+'-lateen',mast.id,[V(0,low,0),V(0,peak,-span*.30),V(0,low,span),V(0,low+.12,span*.92)],.10,group,'x');
  }
 return group;
}
