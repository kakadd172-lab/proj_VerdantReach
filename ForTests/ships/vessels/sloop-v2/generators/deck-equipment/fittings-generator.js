import { deckY,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildDeckEquipment(d,ctx){
 const {part,box,beam,materials}=ctx,fittings=part('deck-fittings');
 const hatch=part('foredeck-hatch',fittings),t=.18,z=stationZ(d,t,1),y=deckY(d,t)+.045;
 const width=d.beamUnits*.19,length=d.hullLengthUnits*.085;
 const panel=box(hatch,width,.055,length,materials.trim,'small-foredeck-hatch');panel.position.set(0,y,z);
 const inner=box(hatch,width*.78,.018,length*.82,materials.deck,'foredeck-hatch-panel');inner.position.set(0,y+.035,z);
 const cleats=part('mooring-cleats',fittings);
 for(const station of [.10,.91]){
  const cz=stationZ(d,station,1),cy=deckY(d,station)+.065;
  for(const side of [-1,1]){
   beam(cleats,V(side*.15,cy,cz),V(side*.15,cy+.075,cz),.022,materials.brass,'mooring-cleat-post',8);
   beam(cleats,V(side*.06,cy+.075,cz),V(side*.25,cy+.075,cz),.023,materials.brass,'mooring-cleat-crossbar',8);
  }
 }
}
