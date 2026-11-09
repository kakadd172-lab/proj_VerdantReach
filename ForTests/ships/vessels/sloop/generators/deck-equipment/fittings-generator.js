import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildDeckEquipment(d,ctx){
  const {part,box,beam,materials,V}=ctx;
  const fittings=part('deck-fittings');

  // Small working-deck lockers fore and aft of the central vivier.
  for(const [name,t,w,l] of [['fore-locker',0.24,0.48,0.72],['aft-locker',0.82,0.54,0.78]]){
    const z=stationZ(d,t,1),group=part(name,fittings);
    const width=w*(4/3),length=l*(4/3),height=0.09;
    const hatch=box(group,width,height,length,materials.plank,'deck-locker-cover');
    hatch.position.set(0,deckY(d,t)+height*0.36,z);
    for(const side of [-1,1]){
      beam(group,V(side*width*0.53,deckY(d,t)+0.04,z-length*0.50),V(side*width*0.53,deckY(d,t)+0.04,z+length*0.50),0.025,materials.trim,'locker-coaming');
    }
  }

  // Low mooring bitts sit inside the rail at the bow and stern quarters.
  for(const t of [0.10,0.91]){
    const z=stationZ(d,t,1),x=halfBreadth(d,t)*0.68,y=deckY(d,t)+0.04;
    for(const side of [-1,1]){
      const bitt=part('mooring-bitt-'+t+'-'+side,fittings);
      beam(bitt,V(side*x,y,z-0.08),V(side*x,y+0.22,z-0.08),0.045,materials.trim,'mooring-bitt-post');
      beam(bitt,V(side*x,y+0.22,z-0.14),V(side*x,y+0.22,z+0.14),0.040,materials.trim,'mooring-bitt-crosshead');
    }
  }
}
