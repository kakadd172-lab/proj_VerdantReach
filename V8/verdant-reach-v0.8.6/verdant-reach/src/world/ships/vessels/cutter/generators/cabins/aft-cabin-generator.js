import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function ensureSternTierComponents(d,ctx){
 const {part,box,materials,beam,V}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.62;
  const height=Math.max(.18,tier.h*0.62);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const centerY=deckY(d,.94)+height*(.44+index*.08),baseY=centerY-height*.5;
  const centerZ=d.hullLengthUnits*(.405+index*.014),z0=centerZ-depth*.5;
  const profile=new ctx.THREE.Shape();
  profile.moveTo(0,0);
  profile.lineTo(0,height*.68);
  profile.quadraticCurveTo(depth*.04,height*.96,depth*.14,height*.98);
  profile.lineTo(depth*.27,height*.93);
  profile.lineTo(depth*.40,height*.81);
  profile.lineTo(depth*.53,height*.67);
  profile.lineTo(depth*.66,height*.55);
  profile.lineTo(depth*.80,height*.43);
  profile.lineTo(depth*.92,height*.34);
  profile.lineTo(depth,height*.28);
  profile.lineTo(depth,0);
  profile.closePath();
  const bevel=Math.min(.032,width*.009,height*.024);
  const geometry=new ctx.THREE.ExtrudeGeometry(profile,{depth:width,steps:1,curveSegments:6,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
  geometry.rotateY(-Math.PI/2);
  geometry.translate(width*.5,baseY,z0);
  geometry.computeVertexNormals();
  ctx.mesh(component,geometry,materials.hull,'cutter-folded-aft-cabin-shell');
  const foldStations=[[0,.68],[.14,.98],[.27,.93],[.40,.81],[.53,.67],[.66,.55],[.80,.43],[.92,.34],[1,.28]];
  const ribRadius=Math.max(.017,d.beamUnits*.0023);
  for(let fold=0;fold<foldStations.length;fold++){
   const [along,rise]=foldStations[fold],z=z0+depth*along,y=baseY+height*rise;
   if(fold>0){
    const [prevAlong,prevRise]=foldStations[fold-1],prevZ=z0+depth*prevAlong,prevY=baseY+height*prevRise;
    for(const side of [-1,1])beam(component,V(side*width*.505,prevY,prevZ),V(side*width*.505,y,z),ribRadius,materials.trim,'folded-cabin-side-rib');
   }
   if(fold>0&&fold<foldStations.length-1)beam(component,V(-width*.51,y,z),V(width*.51,y,z),ribRadius*.8,materials.trim,'folded-cabin-cross-rib');
  }
  const paneW=Math.max(.18,depth*.12),paneH=Math.max(.15,height*.17),paneY=baseY+height*.34,paneZ=z0+depth*.17;
  for(const side of [-1,1]){
   const x=side*(width*.5+.018),pane=box(component,.035,paneH,paneW,materials.glass,'cabin-side-window');pane.position.set(x,paneY,paneZ);
   const fx=side*(width*.5+.041),y0=paneY-paneH*.58,y1=paneY+paneH*.58,zA=paneZ-paneW*.58,zB=paneZ+paneW*.58;
   beam(component,V(fx,y0,zA),V(fx,y0,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y1,zA),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zA),V(fx,y1,zA),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zB),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
  }
 });
}
