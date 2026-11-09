import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function ensureSternTierComponents(d,ctx){
 const {part,box,materials,beam,V}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.72;
  const height=Math.max(.18,tier.h*0.72);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const centerY=deckY(d,.94)+height*(.44+index*.08),baseY=centerY-height*.5;
  const centerZ=d.hullLengthUnits*(.405+index*.014),z0=centerZ-depth*.5;
  const profile=new ctx.THREE.Shape();
  profile.moveTo(0,0);
  profile.lineTo(0,height*.67);
  profile.quadraticCurveTo(depth*.035,height*.95,depth*.13,height*.97);
  profile.lineTo(depth*.25,height*.92);
  profile.lineTo(depth*.38,height*.80);
  profile.lineTo(depth*.51,height*.66);
  profile.lineTo(depth*.64,height*.54);
  profile.lineTo(depth*.78,height*.42);
  profile.lineTo(depth*.91,height*.34);
  profile.lineTo(depth,height*.28);
  profile.lineTo(depth,0);
  profile.closePath();
  const bevel=Math.min(.03,width*.008,height*.023);
  const geometry=new ctx.THREE.ExtrudeGeometry(profile,{depth:width,steps:1,curveSegments:6,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
  geometry.rotateY(-Math.PI/2);
  geometry.translate(width*.5,baseY,z0);
  geometry.computeVertexNormals();
  ctx.mesh(component,geometry,materials.hull,'schooner-folded-aft-cabin-shell');
  const foldStations=[[0,.67],[.13,.97],[.25,.92],[.38,.80],[.51,.66],[.64,.54],[.78,.42],[.91,.34],[1,.28]];
  const ribRadius=Math.max(.016,d.beamUnits*.0022);
  for(let fold=0;fold<foldStations.length;fold++){
   const [along,rise]=foldStations[fold],z=z0+depth*along,y=baseY+height*rise;
   if(fold>0){
    const [prevAlong,prevRise]=foldStations[fold-1],prevZ=z0+depth*prevAlong,prevY=baseY+height*prevRise;
    for(const side of [-1,1])beam(component,V(side*width*.505,prevY,prevZ),V(side*width*.505,y,z),ribRadius,materials.trim,'folded-cabin-side-rib');
   }
   if(fold>0&&fold<foldStations.length-1)beam(component,V(-width*.51,y,z),V(width*.51,y,z),ribRadius*.8,materials.trim,'folded-cabin-cross-rib');
  }
  const paneW=Math.max(.16,depth*.12),paneH=Math.max(.14,height*.17),paneY=baseY+height*.33,paneZ=z0+depth*.17;
  for(const side of [-1,1]){
   const x=side*(width*.5+.016),pane=box(component,.032,paneH,paneW,materials.glass,'cabin-side-window');pane.position.set(x,paneY,paneZ);
   const fx=side*(width*.5+.038),y0=paneY-paneH*.58,y1=paneY+paneH*.58,zA=paneZ-paneW*.58,zB=paneZ+paneW*.58;
   beam(component,V(fx,y0,zA),V(fx,y0,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y1,zA),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zA),V(fx,y1,zA),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zB),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
  }
 });
}
