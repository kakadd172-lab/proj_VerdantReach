import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';

export function buildCockpit(d,ctx){
 const {part,box,beam,materials}=ctx;
 const cockpit=part('cockpit');
 const well=part('cockpit-well',cockpit);
 const seats=part('cockpit-seats',cockpit);
 const coaming=part('cockpit-coaming',cockpit);
 const foreStation=.79,aftStation=.955,center=(foreStation+aftStation)*.5;
 const length=d.hullLengthUnits*(aftStation-foreStation);
 const width=Math.min(d.beamUnits*.43,halfBreadth(d,center)*1.10);
 const foreZ=stationZ(d,foreStation,1),aftZ=stationZ(d,aftStation,1);
 const deckLevel=deckY(d,center),soleY=deckLevel-.25*(4/3);
 const floor=box(well,width,.055,length,materials.lower,'sloop-v2-cockpit-sole');
 floor.position.set(0,soleY,(foreZ+aftZ)*.5);
 const sideHeight=.31*(4/3);
 for(const side of [-1,1]){
  const sideWall=box(well,.045,sideHeight,length,materials.trim,'cockpit-inner-side');
  sideWall.position.set(side*(width*.5-.022),soleY+sideHeight*.5,(foreZ+aftZ)*.5);
  const sideSeat=box(seats,width*.17,.09,length*.88,materials.trim,'cockpit-side-seat');
  sideSeat.position.set(side*width*.39,deckLevel-.045,(foreZ+aftZ)*.5);
  const seatTop=box(seats,width*.17,.028,length*.84,materials.deck,'cockpit-seat-top');
  seatTop.position.set(side*width*.39,deckLevel+.013,(foreZ+aftZ)*.5);
  beam(coaming,V(side*width*.53,deckLevel+.12,foreZ-.025),
   V(side*width*.53,deckLevel+.12,aftZ+.025),.045,materials.trim,'cockpit-coaming-side',12);
  beam(coaming,V(side*width*.53,deckLevel+.12,foreZ-.025),
   V(side*width*.53,deckLevel+.12,foreZ+.13),.035,materials.trim,'cockpit-coaming-forward',8);
  beam(coaming,V(side*width*.53,deckLevel+.12,aftZ-.12),
   V(side*width*.53,deckLevel+.12,aftZ+.025),.035,materials.trim,'cockpit-coaming-aft',8);
 }
 const bridge=box(well,width*.78,.12,.20,materials.trim,'cockpit-bridge-deck');
 bridge.position.set(0,soleY+.10,foreZ+.13);
}
