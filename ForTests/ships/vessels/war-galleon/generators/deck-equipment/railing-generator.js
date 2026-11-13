import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';
export function buildRailings(d,ctx){
  const rails=ctx.part('railings');
  for(const side of [-1,1]){
    const run=ctx.part(side<0?'railings-port':'railings-starboard',rails),top=[];
    for(let i=0;i<=54;i++){
      const t=.075+.85*i/54,x=side*halfBreadth(d,t)*.90,y=deckY(d,t)+.54,z=(t-.5)*d.hullLengthUnits;
      top.push(V(x,y,z));
      if(i%3===0)ctx.beam(run,V(x,y-.48,z),V(x,y+.02,z),.030,ctx.materials.trim,'rail-stanchion');
    }
    ctx.tube(run,top,.046,ctx.materials.trim,'war-galleon-gunwale-handrail',72);
    ctx.tube(run,top.map(p=>V(p.x,p.y-.16,p.z)),.022,ctx.materials.trim,'war-galleon-lower-rail',72);
  }
}
