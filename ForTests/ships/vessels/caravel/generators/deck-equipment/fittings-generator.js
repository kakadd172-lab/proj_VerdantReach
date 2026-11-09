import { deckY, halfBreadth, V } from "../../architecture/hull-geometry.js";
export function buildDeckEquipment(d,ctx){
 const {part,beam,tube,box,materials}=ctx;
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
}
