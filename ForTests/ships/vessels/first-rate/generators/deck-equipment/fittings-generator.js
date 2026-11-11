import { deckY, hullPoint, V } from "../../architecture/hull-geometry.js";

export function buildDeckEquipment(d,ctx){
 const {part,beam,box,materials}=ctx;
 const fittings=part('deck-fittings');

 for(let h=0;h<3;h++){
  const t=.32+h*.13;
  const z=(t-.5)*d.hullLengthUnits;
  const group=part('cargo-hatch-'+h,fittings);
  const size=d.beamUnits*.2;
  const cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');
  cover.position.set(0,deckY(d,t)+.12,z);
 }

 // Keep gunport openings and frames as vessel-specific hull details. Reusable
 // cannon models are attached later from the common vessels/cannons module.
 const gunLevels=[0.78, 0.59, 0.4];
 const portHeight=Math.max(.48,d.deckHeightUnits*.24);
 const portLength=Math.max(.68,d.beamUnits*.055);
 for(let level=0;level<gunLevels.length;level++){
  for(const side of [-1,1]){
   for(let i=0;i<18;i++){
    const t=.16+i/Math.max(1,18-1)*.68;
    const point=hullPoint(d,t,Math.asin(2*gunLevels[level]-1));
    const x=side*(Math.abs(point.x)+.045);
    const y=point.y;
    const z=point.z;
    const portHole=box(fittings,.065,portHeight*.78,portLength*.78,materials.lower,'gunport-'+level+'-'+side+'-'+i);
    portHole.position.set(x,y,z);

    const frameX=side*(Math.abs(point.x)+.095);
    const halfH=portHeight*.5;
    const halfL=portLength*.5;
    beam(fittings,V(frameX,y-halfH,z-halfL),V(frameX,y-halfH,z+halfL),.026,materials.trim,'gunport-sill');
    beam(fittings,V(frameX,y+halfH,z-halfL),V(frameX,y+halfH,z+halfL),.026,materials.trim,'gunport-lintel');
    beam(fittings,V(frameX,y-halfH,z-halfL),V(frameX,y+halfH,z-halfL),.026,materials.trim,'gunport-jamb');
    beam(fittings,V(frameX,y-halfH,z+halfL),V(frameX,y+halfH,z+halfL),.026,materials.trim,'gunport-jamb');
   }
  }
 }
}
