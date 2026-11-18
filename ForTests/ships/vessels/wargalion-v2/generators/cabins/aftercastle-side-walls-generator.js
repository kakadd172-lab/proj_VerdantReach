import { hullPoint, deckLevelY, V } from '../../architecture/hull-surface.js';

function makeSideWall(ctx,parent,positions,indices,side,tier){
  const geometry=new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position',new ctx.THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();
  ctx.mesh(parent,geometry,ctx.materials.plank,
    'aftercastle-tier-'+tier.id+'-side-planking-'+side);
}

export function buildAftercastleSideWall(d,ctx,parent,side,tier){
  const along=64,vertical=16,positions=[],indices=[],baseRail=[],topRail=[];
  for(let row=0;row<=along;row++){
    const u=row/along,t=tier.t0+(tier.t1-tier.t0)*u;
    const p=hullPoint(d,t,1,side);
    const taper=0.91+0.09*Math.sin(Math.PI*u);
    const baseHalf=Math.abs(p.x)*tier.widthScale*taper;
    const baseY=deckLevelY(d,t,'quarterdeck')+tier.baseOffset;
    for(let col=0;col<=vertical;col++){
      const v=col/vertical;
      const half=baseHalf*(1-tier.topInset*v);
      const crown=tier.sideCamber*Math.sin(Math.PI*u)*v;
      positions.push(side*half,baseY+tier.wallHeight*v+crown,p.z);
    }
    baseRail.push(V(side*baseHalf,baseY+0.025,p.z));
    topRail.push(V(side*baseHalf*(1-tier.topInset),
      baseY+tier.wallHeight+tier.sideCamber*Math.sin(Math.PI*u),p.z));
  }
  const stride=vertical+1;
  for(let r=0;r<along;r++)for(let c=0;c<vertical;c++){
    const a=r*stride+c,b=a+stride,x=a+1,y=b+1;
    if(side>0)indices.push(a,x,b,x,y,b);else indices.push(a,b,x,b,y,x);
  }
  makeSideWall(ctx,parent,positions,indices,side,tier);
  ctx.tube(parent,baseRail,0.055,ctx.materials.trim,
    'aftercastle-tier-'+tier.id+'-lower-string-course-'+side,10);
  ctx.tube(parent,topRail,0.060,ctx.materials.trim,
    'aftercastle-tier-'+tier.id+'-upper-string-course-'+side,10);

  // Vertical timber framing follows the side's inward tumble.
  for(let i=0;i<=8;i++){
    const u=i/8,t=tier.t0+(tier.t1-tier.t0)*u,p=hullPoint(d,t,1,side);
    const half=Math.abs(p.x)*tier.widthScale*(0.91+0.09*Math.sin(Math.PI*u));
    const baseY=deckLevelY(d,t,'quarterdeck')+tier.baseOffset;
    ctx.beam(parent,V(side*half,baseY+0.05,p.z),
      V(side*half*(1-tier.topInset),baseY+tier.wallHeight,p.z),
      0.045,ctx.materials.trim,
      'aftercastle-tier-'+tier.id+'-timber-frame-'+side+'-'+i);
  }
}
