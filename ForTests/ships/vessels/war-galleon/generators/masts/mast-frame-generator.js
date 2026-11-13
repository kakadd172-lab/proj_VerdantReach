import { deckY, V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from '../sails/sail-cloth-generator.js';
import { buildStandingRigging } from '../rigging/standing-rigging-generator.js';
export function buildMast(d,ctx,mast){
  const {THREE,part,beam,materials}=ctx,z=mast.z*d.hullLengthUnits,baseY=deckY(d,.5+mast.z*.45)+.12,totalHeight=mast.height*(4/3),lowerHeight=totalHeight*(d.structure.lowerMastRatio||.65),radius=d.beamUnits*(mast.id==='main'?.019:.017);
  const group=part('mast-'+mast.id);group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
  beam(step,V(-.34,baseY-.17,z),V(.34,baseY-.17,z),.10,materials.trim,'mast-step-crossbeam');
  const heel=ctx.mesh(lower,new THREE.CylinderGeometry(radius*.72,radius*1.4,lowerHeight,14,1),materials.trim,'lower-mast-spar');heel.position.y=lowerHeight*.5;
  const topStart=lowerHeight-.12,topLength=totalHeight-topStart,top=ctx.mesh(topmast,new THREE.CylinderGeometry(radius*.34,radius*.72,topLength,12,1),materials.trim,'topmast-spar');top.position.y=topStart+topLength*.5;
  buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);
  if(mast.rig==='square'){
    const platform=part('mast-platform-'+mast.id,group),topPlatform=ctx.mesh(platform,new THREE.CylinderGeometry(Math.max(.42,d.beamUnits*.055),Math.max(.46,d.beamUnits*.062),.12,18),materials.trim,'topmast-platform');topPlatform.position.y=lowerHeight*.86;
    const levels=['course','topsail','topgallant'].slice(0,mast.squares||3),widths=[.41,.33,.25],starts=[.08,.34,.59];
    levels.forEach((level,index)=>{
      const width=d.hullLengthUnits*widths[index]*d.structure.yardSpread*(mast.yardScale||1),y0=totalHeight*starts[index],y1=y0+totalHeight*.19,yard=part('yard-'+mast.id+'-'+level,group);
      beam(yard,V(-width*.5,y1,0),V(width*.5,y1,0),Math.max(.055,radius*.72),materials.trim,'square-yard',10);
      buildCanvasSail(ctx,'sail-'+mast.id+'-'+level,mast.id,[V(-width*.49,y0,0),V(-width*.47,y1,0),V(width*.47,y1,0),V(width*.49,y0,0)],.105-index*.012,group,'z');
      const sheets=part('sheets-'+mast.id+'-'+level,group);for(const side of [-1,1])beam(sheets,V(side*width*.46,y0,0),V(side*width*.46,y0-.24,.14),.016,materials.rope,'sail-sheet');
    });
  }else if(mast.rig==='lateen'){
    const span=d.hullLengthUnits*(mast.span||.40),low=totalHeight*.10,peak=totalHeight*.91,yard=part('lateen-yard-'+mast.id,group);
    beam(yard,V(0,peak,-span*.30),V(0,low,span),.075,materials.trim,'lateen-yard',12);
    buildCanvasSail(ctx,'sail-'+mast.id+'-lateen',mast.id,[V(0,low,0),V(0,peak,-span*.30),V(0,peak*.67,span*.76),V(0,low,span)],.092,group,'x');
  }
  return group;
}
