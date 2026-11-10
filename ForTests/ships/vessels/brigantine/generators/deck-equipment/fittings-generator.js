import { deckY, halfBreadth, V } from "../../architecture/hull-geometry.js";
export function buildDeckEquipment(d,ctx){
 const {part,beam,tube,box,materials}=ctx;
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 for(let level=0;level<1;level++)for(let side of [-1,1])for(let i=0;i<6;i++){const t=.14+i/Math.max(1,6-1)*.72,x=side*halfBreadth(d,t)*.8,z=(t-.5)*d.hullLengthUnits,y=deckY(d,t)-.36-level*d.deckHeightUnits*.24,portHole=box(fittings,.34,.28,.08,materials.lower,'gunport-'+level+'-'+side+'-'+i);portHole.position.set(x,y,z);const cannon=part('deck-gun-'+level+'-'+side+'-'+i,fittings);beam(cannon,V(x,y+.02,z),V(x+side*.48,y+.02,z),.068,materials.iron,'cannon-barrel',12);for(let wheel=0;wheel<2;wheel++){const w=ctx.mesh(cannon,new ctx.THREE.CylinderGeometry(.1,.1,.055,10),materials.trim,'gun-carriage-wheel');w.rotation.z=Math.PI/2;w.position.set(x+side*.15,y-.12,z+(wheel-.5)*.2);}}
}
