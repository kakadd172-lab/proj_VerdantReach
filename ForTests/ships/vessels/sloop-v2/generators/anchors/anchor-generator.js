import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildAnchors(d,ctx){
 const {part,beam,tube,materials}=ctx,anchors=part('anchors');
 for(const side of [-1,1]){
  const suffix=side<0?'port':'starboard',stowed=part('anchor-'+suffix,anchors);
  const x=side*halfBreadth(d,.12)*.82,y=deckY(d,.12)+.22,z=stationZ(d,.12,1);
  beam(stowed,V(x,y,z),V(x+side*.12,y-.36,z+.10),.042,materials.iron,'sloop-v2-stowed-anchor-shank',10);
  beam(stowed,V(x-side*.22,y-.30,z+.10),V(x+side*.22,y-.30,z+.10),.035,materials.iron,'sloop-v2-stowed-anchor-stock',10);
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x+side*.12,y-.22,z+.18),V(x+side*.18,y-.35,z+.30)],.012,materials.iron,'sloop-v2-stowed-anchor-chain',20);
 }
}
