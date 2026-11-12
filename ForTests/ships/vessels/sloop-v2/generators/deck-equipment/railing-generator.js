import { deckY,halfBreadth,sectionBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildRailings(d,ctx){
 const {part,beam,tube,materials}=ctx,railings=part('railings');
 for(const side of [-1,1]){
  const group=part('railings-'+(side<0?'port':'starboard'),railings),points=[];
  for(let i=0;i<=42;i++){
   const t=.075+.85*i/42,x=side*halfBreadth(d,t)*sectionBreadth(d,t,1)*.91,y=deckY(d,t)+.54,z=stationZ(d,t,1);
   points.push(V(x,y,z));
   if(i%3===0)beam(group,V(x,y-.47,z),V(x,y,z),.032,materials.trim,'sloop-v2-rail-post-'+i,8);
  }
  tube(group,points,.045,materials.trim,'sloop-v2-gunwale-rail',64);
 }
}
