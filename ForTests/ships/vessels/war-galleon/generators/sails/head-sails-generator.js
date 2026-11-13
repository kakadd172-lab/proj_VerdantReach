import { deckY, V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';
export function buildHeadSails(d,ctx){
  const head=ctx.part('head-sails'),fore=d.masts[0],foreZ=fore.z*d.hullLengthUnits,foreBase=deckY(d,.5+fore.z*.45)+.12,foreTop=foreBase+fore.height*(4/3);
  const bowZ=-d.hullLengthUnits*.5-d.beamUnits*.62,bowY=deckY(d,.035)+.52,staySpan=foreZ-bowZ;
  for(let i=0;i<d.headsails;i++){
    const tack=V(0,bowY+i*.12,bowZ+staySpan*(.025+i*.035)),peak=V(0,bowY+(foreTop-bowY)*(.93-i*.08),bowZ+staySpan*(.92-i*.09));
    const clew=V(0,bowY+(foreTop-bowY)*(.48-i*.06),bowZ+staySpan*(.62-i*.07)),outer=V(.12,clew.y-.20,clew.z+.30);
    buildCanvasSail(ctx,'sail-head-'+(i+1),'fore',[tack,peak,outer,clew],.075+i*.008,head,'x');
  }
}
