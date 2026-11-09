import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildRailings(d,ctx){
  const {part,beam,tube,materials,V}=ctx;
  const rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
  for(const [side,group] of [[-1,port],[1,starboard]]){
    const points=[];
    for(let i=0;i<=48;i++){
      const t=0.045+0.91*i/48;
      const x=side*halfBreadth(d,t)*0.955;
      const y=deckY(d,t)+0.46;
      const z=stationZ(d,t,1);
      points.push(V(x,y,z));
      if(i%4===0){
        beam(group,V(x,y-0.40,z),V(x,y+0.015,z),0.031,materials.trim,'rail-post-'+i);
      }
    }
    tube(group,points,0.045,materials.trim,'sloop-gunwale-rail',64);
  }
}
