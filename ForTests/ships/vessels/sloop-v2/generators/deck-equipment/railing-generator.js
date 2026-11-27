import { deckY,halfBreadth,sectionBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildRailings(d,ctx){
 const {part,tube,materials}=ctx,railings=part('railings');
 for(const side of [-1,1]){
  const group=part('railings-'+(side<0?'port':'starboard'),railings),line=[];
  for(let i=0;i<=56;i++){
   const t=.035+.93*i/56,x=side*halfBreadth(d,t)*sectionBreadth(d,t,1)*.965;
   line.push(V(x,deckY(d,t)+.085,stationZ(d,t,1)));
  }
  tube(group,line,.028,materials.trim,'low-sheer-toe-rail',72);
 }
}
