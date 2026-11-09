import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "./sail-cloth-generator.js";

export function buildHeadSails(d,ctx){
 const {part,tube,materials,V}=ctx,head=part('head-sails');
 for(let i=0;i<d.headsails;i++){
  const fore=d.masts[0],mastStation=0.5+fore.z,foreZ=fore.z*d.hullLengthUnits;
  const foreBase=deckY(d,mastStation)+0.12,foreTop=foreBase+fore.height*(4/3);
  const bowspritLength=(d.bowspritLength??2.7)*(4/3);
  const bowZ=stationZ(d,0.012,1)-bowspritLength;
  const bowY=deckY(d,0.035)+0.22,staySpan=foreZ-bowZ;
  const tack=V(0,bowY,bowZ+staySpan*.025);
  const peak=V(0,bowY+(foreTop-bowY)*.975,bowZ+staySpan*.975);
  const clew=V(0,bowY+0.12,bowZ+staySpan*.50);
  buildCanvasSail(ctx,'sail-head-'+(i+1),fore.id,[tack,peak,clew,tack],.082,head,'x');
  const stays=part('head-stays-'+(i+1),head);
  tube(stays,[tack,peak],.012,materials.rope,'headstay-'+(i+1),34);
  tube(stays,[tack,clew],.009,materials.rope,'headsail-clew-line-'+(i+1),28);
 }
}
