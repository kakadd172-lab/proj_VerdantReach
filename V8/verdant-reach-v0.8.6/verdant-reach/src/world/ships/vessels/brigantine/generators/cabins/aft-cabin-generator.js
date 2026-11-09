import { deckY, V } from "../../architecture/hull-geometry.js";
export function ensureSternTierComponents(d,ctx){
 const {part,box,materials,beam,V}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.8;
  const height=Math.max(.18,tier.h*0.8);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const centerY=deckY(d,.94)+height*(.44+index*.08),baseY=centerY-height*.5;
  const centerZ=d.hullLengthUnits*(.405+index*.014),z0=centerZ-depth*.5;
  const profile=new ctx.THREE.Shape();
  profile.moveTo(0,0);
  profile.lineTo(0,height*.70);
  profile.quadraticCurveTo(depth*.035,height*.98,depth*.12,height*.99);
  profile.lineTo(depth*.24,height*.94);
  profile.lineTo(depth*.37,height*.82);
  profile.lineTo(depth*.51,height*.68);
  profile.lineTo(depth*.65,height*.55);
  profile.lineTo(depth*.79,height*.43);
  profile.lineTo(depth*.91,height*.35);
  profile.lineTo(depth,height*.29);
  profile.lineTo(depth,0);
  profile.closePath();
  const bevel=Math.min(.035,width*.009,height*.025);
  const geometry=new ctx.THREE.ExtrudeGeometry(profile,{depth:width,steps:1,curveSegments:5,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
  geometry.rotateY(-Math.PI/2);
  geometry.translate(width*.5,baseY,z0);
  geometry.computeVertexNormals();
  ctx.mesh(component,geometry,materials.hull,'brigantine-folded-aft-cabin-shell');
  const foldStations=[[0,.70],[.12,.99],[.24,.94],[.37,.82],[.51,.68],[.65,.55],[.79,.43],[.91,.35],[1,.29]];
  const ribRadius=Math.max(.018,d.beamUnits*.0025);
  for(let fold=0;fold<foldStations.length;fold++){
   const [along,rise]=foldStations[fold],z=z0+depth*along,y=baseY+height*rise;
   if(fold>0){
    const [prevAlong,prevRise]=foldStations[fold-1],prevZ=z0+depth*prevAlong,prevY=baseY+height*prevRise;
    for(const side of [-1,1])beam(component,V(side*width*.505,prevY,prevZ),V(side*width*.505,y,z),ribRadius,materials.trim,'folded-cabin-side-rib');
   }
   if(fold>0&&fold<foldStations.length-1)beam(component,V(-width*.51,y,z),V(width*.51,y,z),ribRadius*.8,materials.trim,'folded-cabin-cross-rib');
  }
  const paneW=Math.max(.18,depth*.12),paneH=Math.max(.16,height*.18),paneY=baseY+height*.36,paneZ=z0+depth*.16;
  for(const side of [-1,1]){
   const x=side*(width*.5+.018),pane=box(component,.035,paneH,paneW,materials.glass,'cabin-side-window');
   pane.position.set(x,paneY,paneZ);
   const fx=side*(width*.5+.042),y0=paneY-paneH*.58,y1=paneY+paneH*.58,zA=paneZ-paneW*.58,zB=paneZ+paneW*.58;
   beam(component,V(fx,y0,zA),V(fx,y0,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y1,zA),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zA),V(fx,y1,zA),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zB),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
  }
 });
}
