import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildAnchors(d,ctx){
  const {part,beam,tube,materials,V}=ctx,anchors=part('anchors');
  for(const side of [-1,1]){
    const suffix=side<0?'port':'starboard',anchor=part('anchor-'+suffix,anchors);
    const x=side*d.beamUnits*0.46,y=deckY(d,0.1)-0.35,z=stationZ(d,0.12,1),span=d.beamUnits*0.10;
    beam(anchor,V(x,y,z),V(x,y-d.draftUnits*0.42,z),Math.max(0.04,d.beamUnits*0.014),materials.iron,'sloop-anchor-shank');
    beam(anchor,V(x-span,y-d.draftUnits*0.35,z),V(x+span,y-d.draftUnits*0.35,z),Math.max(0.04,d.beamUnits*0.015),materials.iron,'sloop-anchor-stock');
    beam(anchor,V(x-span,y-d.draftUnits*0.35,z),V(x-span*0.42,y-d.draftUnits*0.58,z),Math.max(0.03,d.beamUnits*0.012),materials.iron,'anchor-fluke-port');
    beam(anchor,V(x+span,y-d.draftUnits*0.35,z),V(x+span*0.42,y-d.draftUnits*0.58,z),Math.max(0.03,d.beamUnits*0.012),materials.iron,'anchor-fluke-starboard');
    const chain=part('anchor-chain-'+suffix,anchors);
    tube(chain,[V(x,y,z),V(x,y-0.28,z-0.24),V(x*0.92,y-0.52,z-0.44)],0.022,materials.iron,'sloop-anchor-rode',18);
  }
}
