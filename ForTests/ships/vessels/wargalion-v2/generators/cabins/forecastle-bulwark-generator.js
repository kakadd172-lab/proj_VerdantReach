import { deckPoint, V } from '../../architecture/hull-surface.js';

function sideWall(d, ctx, parent, side) {
  const along=48, vertical=8, positions=[], indices=[], rail=[];
  const height=0.72;
  for(let row=0;row<=along;row++){
    const t=0.045+0.215*row/along;
    const edge=deckPoint(d,t,side,'forecastle');
    for(let col=0;col<=vertical;col++){
      const v=col/vertical;
      positions.push(edge.x*(1-0.035*v),edge.y+0.045+height*v,edge.z-0.025*v);
    }
    rail.push(V(edge.x*0.965,edge.y+0.045+height+0.025,edge.z-0.025));
  }
  const stride=vertical+1;
  for(let r=0;r<along;r++)for(let c=0;c<vertical;c++){
    const a=r*stride+c,b=a+stride,e=b+1,f=a+1;
    if(side>0)indices.push(a,f,b,f,e,b);else indices.push(a,b,f,b,e,f);
  }
  const g=new ctx.THREE.BufferGeometry();
  g.setAttribute('position',new ctx.THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();
  ctx.mesh(parent,g,ctx.materials.plank,'forecastle-bulwark-side-'+side);
  ctx.tube(parent,rail,0.045,ctx.materials.trim,'forecastle-bulwark-rail-'+side,12);
  for(let i=0;i<=8;i++){
    const t=0.045+0.215*i/8,e=deckPoint(d,t,side,'forecastle');
    ctx.beam(parent,V(e.x,e.y+0.045,e.z),V(e.x*0.965,e.y+0.765,e.z-0.025),
      0.035,ctx.materials.trim,'forecastle-bulwark-stanchion-'+side);
  }
}
export function buildForecastleBulwark(d,ctx){
  const root=ctx.part('forecastle-bulwark');
  sideWall(d,ctx,ctx.part('forecastle-bulwark-port',root),-1);
  sideWall(d,ctx,ctx.part('forecastle-bulwark-starboard',root),1);
  root.userData.form='low timber bulwarks defining the raised forecastle edge';
}
