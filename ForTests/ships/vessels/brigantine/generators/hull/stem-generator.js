import { deckY, keelY, V } from "../../architecture/hull-geometry.js";
export function buildStem(d,ctx){
 const {part,V,materials}=ctx;
 const stem=part('stem');if(d.keelDetails.stemPosts){ctx.beam(stem,V(0,keelY(d,.012),-d.hullLengthUnits*.5),V(0,deckY(d,.012)+.2,-d.hullLengthUnits*.5),Math.max(.08,d.beamUnits*.023),materials.trim,'brigantine-stem-post');
 }
}
