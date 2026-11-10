import { deckY, V } from "../../architecture/hull-geometry.js";
export function buildStern(d,ctx){
 const {part,box,beam,materials,V}=ctx,stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern);
 const deck=deckY(d,.94),z=d.hullLengthUnits*.355,width=d.beamUnits*.48,depth=d.hullLengthUnits*.035;
 const counter=box(stern,width*.78,d.deckHeightUnits*.18,depth,materials.trim,'caravel-narrow-counter');
 counter.position.set(0,deck+d.deckHeightUnits*.09,z);
 for(const side of [-1,1]){
  const railX=side*width*.52,railY=deck+d.deckHeightUnits*.38;
  beam(gallery,V(railX,deck+.12,z-depth),V(railX,railY,z+depth*.8),.032,materials.trim,'caravel-quarter-gallery-rail');
  for(let post=0;post<4;post++){
   const pz=z-depth*.85+post*depth*.85;
   beam(gallery,V(railX,deck+.12,pz),V(railX,railY,pz),.022,materials.trim,'caravel-gallery-baluster');
  }
 }
}
