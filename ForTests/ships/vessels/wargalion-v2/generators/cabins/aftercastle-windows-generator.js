import { hullPoint, halfBreadth, hullLongitudinalZ, deckLevelY, V } from '../../architecture/hull-surface.js';

function addSideWindow(d,ctx,parent,side,t,tier,index){
  const {box,beam,materials}=ctx;
  const p=hullPoint(d,t,1,side);
  const half=Math.abs(p.x)*tier.widthScale;
  const baseY=deckLevelY(d,t,'quarterdeck')+tier.baseOffset;
  const width=tier.id===1?0.58:tier.id===2?0.50:0.42;
  const height=tier.id===1?0.48:0.42;
  const x=side*(half*(1-tier.topInset*0.57)+0.025),y=baseY+tier.wallHeight*0.57,z=p.z;
  box(parent,0.055,height,width,materials.glass,
    'aftercastle-side-window-'+tier.id+'-'+side+'-'+index).position.set(x,y,z);
  for(const dz of [-width*0.54,width*0.54]){
    beam(parent,V(x,y-height*0.55,z+dz),V(x,y+height*0.55,z+dz),0.028,materials.trim,'castle-window-jamb');
  }
  for(const dy of [-height*0.55,height*0.55]){
    beam(parent,V(x,y+dy,z-width*0.54),V(x,y+dy,z+width*0.54),0.028,materials.trim,'castle-window-rail');
  }
  beam(parent,V(x,y-height*0.52,z),V(x,y+height*0.52,z),0.022,materials.trim,'castle-window-mullion');
}

function addAftWindow(d,ctx,parent,tier,u,index){
  const {box,beam,materials}=ctx;
  const half=halfBreadth(d,tier.t1)*tier.widthScale;
  const baseY=deckLevelY(d,tier.t1,'quarterdeck')+tier.baseOffset;
  const z=hullLongitudinalZ(d,tier.t1,1)+0.15;
  const width=tier.id===1?0.52:tier.id===2?0.44:0.36;
  const height=tier.id===1?0.42:0.36;
  const x=u*half*0.78,y=baseY+tier.wallHeight*0.57;
  box(parent,width,height,0.055,materials.glass,
    'aftercastle-aft-window-'+tier.id+'-'+index).position.set(x,y,z);
  for(const dx of [-width*0.55,width*0.55]){
    beam(parent,V(x+dx,y-height*0.55,z),V(x+dx,y+height*0.55,z),0.026,materials.trim,'aft-window-jamb');
  }
  for(const dy of [-height*0.55,height*0.55]){
    beam(parent,V(x-width*0.55,y+dy,z),V(x+width*0.55,y+dy,z),0.026,materials.trim,'aft-window-rail');
  }
  beam(parent,V(x,y-height*0.52,z),V(x,y+height*0.52,z),0.022,materials.trim,'aft-window-mullion');
}

export function buildAftercastleWindows(d,ctx,parent,tiers){
  for(const tier of tiers){
    const stations=tier.id===1?[0.735,0.795,0.855,0.915]:
      tier.id===2?[0.825,0.885,0.935]:[0.900,0.930];
    for(const side of [-1,1])stations.forEach((t,i)=>addSideWindow(d,ctx,parent,side,t,tier,i+1));
    const aft=tier.id===1?[-0.65,-0.22,0.22,0.65]:
      tier.id===2?[-0.52,0,0.52]:[-0.38,0.38];
    aft.forEach((u,i)=>addAftWindow(d,ctx,parent,tier,u,i+1));
  }
}
