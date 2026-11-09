import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
export function buildFluytSpritsail(d,ctx){
 const {part,beam,materials,V}=ctx,group=part('fluyt-spritsail-rig');
 const z=-d.hullLengthUnits*.5-d.beamUnits*.52,y=deckY(d,.025)+.72,width=d.beamUnits*.48,height=d.deckHeightUnits*.62,half=width*.5,yardY=y+height;
 beam(group,V(-half,yardY,z),V(half,yardY,z),.052,materials.trim,'fluyt-spritsail-yard');
 beam(group,V(0,yardY,z),V(0,y,z),.045,materials.trim,'spritsail-luff-spar');
 buildCanvasSail(ctx,'sail-spritsail','main',[V(-half*.94,y,z),V(-half*.94,yardY,z),V(half*.94,yardY,z),V(half*.94,y,z)],.035,group,'z');
}
