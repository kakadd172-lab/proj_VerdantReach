import { deckY, halfBreadth, V } from "../../architecture/hull-geometry.js";
export function buildDeckEquipment(d,ctx){
 const {part,beam,tube,box,materials}=ctx;
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 const gunLevels=[0.75,0.53],portHeight=Math.max(.48,d.deckHeightUnits*.24),portLength=Math.max(.68,d.beamUnits*.055);
 for(let level=0;level<gunLevels.length;level++)for(let side of [-1,1]){const count=12;for(let i=0;i<count;i++){
  const t=.16+i/Math.max(1,count-1)*.68,point=hullPoint(d,t,Math.asin(2*gunLevels[level]-1)),x=side*(Math.abs(point.x)+.045),y=point.y,z=point.z;
  const portHole=box(fittings,.065,portHeight*.78,portLength*.78,materials.lower,'gunport-'+level+'-'+side+'-'+i);portHole.position.set(x,y,z);
  const frameX=side*(Math.abs(point.x)+.095),halfH=portHeight*.5,halfL=portLength*.5;
  beam(fittings,V(frameX,y-halfH,z-halfL),V(frameX,y-halfH,z+halfL),.026,materials.trim,'gunport-sill');
  beam(fittings,V(frameX,y+halfH,z-halfL),V(frameX,y+halfH,z+halfL),.026,materials.trim,'gunport-lintel');
  beam(fittings,V(frameX,y-halfH,z-halfL),V(frameX,y+halfH,z-halfL),.026,materials.trim,'gunport-jamb');
  beam(fittings,V(frameX,y-halfH,z+halfL),V(frameX,y+halfH,z+halfL),.026,materials.trim,'gunport-jamb');
  const cannon=part('deck-gun-'+level+'-'+side+'-'+i,fittings);
  beam(cannon,V(frameX+side*.015,y,z),V(frameX+side*.62,y,z),.078,materials.iron,'cannon-barrel',12);
  for(let wheel=0;wheel<2;wheel++){const w=ctx.mesh(cannon,new ctx.THREE.CylinderGeometry(.095,.095,.06,10),materials.trim,'gun-carriage-wheel');w.rotation.z=Math.PI/2;w.position.set(frameX+side*.17,y-.15,z+(wheel-.5)*.3);}
 }}
}
