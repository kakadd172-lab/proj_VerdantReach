import { deckY, stationZ } from "../../architecture/hull-geometry.js";

export function buildDeckEquipment(d,ctx){
  const {part,box,materials}=ctx;
  const fittings=part('deck-fittings');
  for(let h=0;h<2;h++){
    const t=0.32+h*0.13,z=stationZ(d,t,1),group=part('cargo-hatch-'+h,fittings);
    const size=d.beamUnits*0.19;
    const cover=box(group,size,0.11,size*0.82,materials.plank,'hatch-cover');
    cover.position.set(0,deckY(d,t)+0.11,z);
  }
}
