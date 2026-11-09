import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
export function buildCargoDeck(d,ctx){
 const {part,box,beam,materials,V}=ctx,cargo=part('cargo-deck-details');
 for(const [label,t] of [['forward',.34],['aft',.63]]){
  const hatch=part('cargo-hatch-'+label,cargo),z=(t-.5)*d.hullLengthUnits;
  const width=halfBreadth(d,t)*.72,length=d.hullLengthUnits*.075,y=deckY(d,t);
  const coaming=box(hatch,width,.16,length,materials.trim,'cargo-hatch-coaming');coaming.position.set(0,y+.09,z);
  const cover=box(hatch,width*.91,.10,length*.9,materials.plank,'cargo-hatch-cover');cover.position.set(0,y+.18,z);
  for(let n=1;n<=4;n++){const x=-width*.39+width*.78*n/5;beam(hatch,V(x,y+.245,z-length*.43),V(x,y+.245,z+length*.43),.018,materials.trim,'cargo-hatch-grating');}
  beam(hatch,V(-width*.5,y+.19,z-length*.5),V(-width*.5,y+.19,z+length*.5),.025,materials.trim,'hatch-long-coaming');
  beam(hatch,V(width*.5,y+.19,z-length*.5),V(width*.5,y+.19,z+length*.5),.025,materials.trim,'hatch-long-coaming');
 }
 const windlass=part('merchant-windlass',cargo),y=deckY(d,.13)+.34,z=-d.hullLengthUnits*.36;
 beam(windlass,V(-d.beamUnits*.18,y,z),V(d.beamUnits*.18,y,z),.10,materials.trim,'windlass-drum',12);
 for(const side of [-1,1])beam(windlass,V(side*d.beamUnits*.17,y-.38,z),V(side*d.beamUnits*.17,y+.04,z),.065,materials.trim,'windlass-post');
}
