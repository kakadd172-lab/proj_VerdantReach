import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
export function buildOarBanks(d,ctx){
 const {part,beam,box,materials,V}=ctx,bank=part('xebec-oar-banks');
 for(let side of [-1,1]){
  const label=side<0?'port':'starboard';
  for(let station=0;station<8;station++){
   const t=.20+station*.085,z=(t-.5)*d.hullLengthUnits,inner=halfBreadth(d,t)*.88,outer=inner+d.beamUnits*.62;
   const y=deckY(d,t)+.08,fan=station%2===0?-.18:.18;
   const oar=part('oar-station-'+label+'-'+String(station+1).padStart(2,'0'),bank);
   const start=V(side*inner,y,z),tip=V(side*outer,y-.24,z+fan);
   beam(oar,start,tip,.052,materials.trim,'oar-shaft',9);
   beam(oar,V(side*(inner+.10),y-.02,z),V(side*(inner+.10),y+.18,z),.038,materials.trim,'oarlock-post',8);
   const blade=box(oar,.56,.075,.19,materials.plank,'oar-blade');blade.position.copy(tip).add(V(-side*.12,-.02,0));blade.rotation.y=side*.12;
  }
 }
 const benches=part('xebec-rowing-benches');
 for(let station=0;station<4;station++){const t=.29+station*.13,z=(t-.5)*d.hullLengthUnits,width=halfBreadth(d,t)*1.25,seat=box(benches,width,.12,.42,materials.plank,'rowing-bench');seat.position.set(0,deckY(d,t)+.30,z);}
}
