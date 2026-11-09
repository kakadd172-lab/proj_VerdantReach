import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "./sail-cloth-generator.js";

export function buildHeadSails(d,ctx){
  const {part,tube,materials,V}=ctx,head=part('head-sails');
  for(let i=0;i<d.headsails;i++){
    const fore=d.masts[0];
    const mastStation=0.5+fore.z*0.45;
    const foreZ=fore.z*d.hullLengthUnits;
    const foreBase=deckY(d,mastStation)+0.12;
    const foreTop=foreBase+fore.height*(4/3);
    const bowZ=stationZ(d,0.02,1)-d.beamUnits*0.30;
    const bowY=deckY(d,0.035)+0.34;
    const staySpan=foreZ-bowZ;
    const tackFraction=0.025+i*0.018;
    const peakFraction=0.975-i*0.06;
    const clewFraction=0.48-i*0.05;
    const tack=V(0,bowY,bowZ+staySpan*tackFraction);
    const peak=V(0,bowY+(foreTop-bowY)*peakFraction,bowZ+staySpan*peakFraction);
    const clew=V(0,bowY+0.14,bowZ+staySpan*clewFraction);
    buildCanvasSail(ctx,'sail-head-'+(i+1),fore.id,[tack,peak,clew,tack],0.078-i*0.006,head,'x');
    const stays=part('head-stays-'+(i+1),head);
    tube(stays,[tack,peak],0.013,materials.rope,'headstay-'+(i+1),28);
    tube(stays,[tack,clew],0.010,materials.rope,'headsail-clew-line-'+(i+1),24);
  }
}
