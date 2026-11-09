import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "./sail-cloth-generator.js";
export function buildHeadSails(d,ctx){const {part,tube,materials,V}=ctx,head=part("head-sails");
for(let i=0;i<d.headsails;i++){
const fore=d.masts[0],foreZ=fore.z*d.hullLengthUnits,foreBase=deckY(d,.5+fore.z*.45)+.12,foreTop=foreBase+fore.height*(4/3),bowZ=-d.hullLengthUnits*.5-d.beamUnits*.68,bowY=deckY(d,.035)+.42,staySpan=foreZ-bowZ;
  const tackFraction=.015+i*.022,peakFraction=.96-i*.085,clewFraction=.53-i*.065,tack=V(0,bowY,bowZ+staySpan*tackFraction),peak=V(0,bowY+(foreTop-bowY)*peakFraction,bowZ+staySpan*peakFraction),clew=V(0,bowY+.18,bowZ+staySpan*clewFraction);
  buildCanvasSail(ctx,'sail-head-'+(i+1),fore.id,[tack,peak,clew,tack],.085-i*.006,head,'x');
  const stays=part('head-stays-'+(i+1),head);tube(stays,[tack,peak],.014,materials.rope,'headstay-'+(i+1),28);tube(stays,[tack,clew],.011,materials.rope,'headsail-clew-line-'+(i+1),24);
}
}
