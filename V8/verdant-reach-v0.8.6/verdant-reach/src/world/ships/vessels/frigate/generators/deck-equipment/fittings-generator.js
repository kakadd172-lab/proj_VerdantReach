import { deckY, halfBreadth } from "../../architecture/hull-geometry.js";

export function buildDeckEquipment(d,ctx){
 const {part,box,materials}=ctx;
 const fittings=part('deck-fittings');

 for(let h=0;h<2;h++){
  const t=.32+h*.13;
  const z=(t-.5)*d.hullLengthUnits;
  const group=part('cargo-hatch-'+h,fittings);
  const size=d.beamUnits*.2;
  const cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');
  cover.position.set(0,deckY(d,t)+.12,z);
 }

 // Preserve this vessel's gunport openings. Shared cannon models are supplied
 // by the fleet-wide vessels/cannons module, not by the ship generator.
 for(let level=0;level<1;level++){
  for(const side of [-1,1]){
   for(let i=0;i<10;i++){
    const t=.14+i/Math.max(1,10-1)*.72;
    const x=side*halfBreadth(d,t)*.8;
    const z=(t-.5)*d.hullLengthUnits;
    const y=deckY(d,t)-.36;
    const portHole=box(fittings,.34,.28,.08,materials.lower,'gunport-'+level+'-'+side+'-'+i);
    portHole.position.set(x,y,z);
   }
  }
 }
}
