import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildDeckEquipment(d,ctx){
 const {part,box,beam,materials}=ctx,fittings=part('deck-fittings');
 for(let i=0;i<3;i++){
  const t=.28+i*.20,z=stationZ(d,t,1),y=deckY(d,t)+.11,hatch=part('cargo-hatch-'+(i+1),fittings);
  const size=d.beamUnits*(i===1?.18:.15),panel=box(hatch,size,.10,size*.83,materials.plank,'sloop-v2-cargo-hatch-cover');
  panel.position.set(0,y,z);
  for(const side of [-1,1])beam(hatch,V(side*size*.42,y+.06,z-size*.28),V(side*size*.42,y+.06,z+size*.28),.014,materials.trim,'sloop-v2-hatch-cleat',8);
 }
 const cleats=part('mooring-cleats',fittings);
 for(const t of [.13,.87]){
  const z=stationZ(d,t,1),y=deckY(d,t)+.09;
  for(const side of [-1,1]){
   beam(cleats,V(side*.32,y,z),V(side*.32,y+.12,z),.035,materials.trim,'sloop-v2-mooring-cleat-post',8);
   beam(cleats,V(side*.18,y+.12,z),V(side*.46,y+.12,z),.035,materials.trim,'sloop-v2-mooring-cleat-crossbar',8);
  }
 }
}
