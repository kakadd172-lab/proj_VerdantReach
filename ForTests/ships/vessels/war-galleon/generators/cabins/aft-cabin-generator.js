import { deckY, V } from '../../architecture/hull-geometry.js';
export function ensureSternTierComponents(d,ctx){
  const details=ctx.part('stern-cabin-details'),top=d.sternTiers[d.sternTiers.length-1];
  const y=deckY(d,.94)+d.sternTiers.reduce((sum,tier)=>sum+tier.h*(4/3)*.83+.10,0),z=d.hullLengthUnits*.42;
  const roof=ctx.box(details,d.beamUnits*top.w*.94,.14,d.hullLengthUnits*top.d*.86,ctx.materials.trim,'poop-deck-roof-cap');roof.position.set(0,y,z);
  const door=ctx.box(details,d.beamUnits*.075,d.deckHeightUnits*.23,.045,ctx.materials.lower,'aft-cabin-door');door.position.set(0,y-d.deckHeightUnits*.17,z+d.hullLengthUnits*top.d*.40);
  const lanterns=ctx.part('stern-lantern-mounts',details);
  for(const side of [-1,1]){const x=side*d.beamUnits*top.w*.36;ctx.beam(lanterns,V(x,y-.02,z),V(x,y-.27,z),.025,ctx.materials.brass,'stern-lantern-hanger');const lamp=ctx.box(lanterns,.13,.18,.13,ctx.materials.glass,'stern-lantern');lamp.position.set(x,y-.37,z);}
}
