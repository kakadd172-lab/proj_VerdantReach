import { hullPoint, deckLevelY } from '../../architecture/hull-surface.js';

export function buildAftercastleEndWall(d,ctx,parent,tier,t,direction){
  const across=40,vertical=16,positions=[],indices=[];
  const baseY=deckLevelY(d,t,'quarterdeck')+tier.baseOffset;
  const half=Math.abs(hullPoint(d,t,1,1).x)*tier.widthScale;
  const z=hullPoint(d,t,1,1).z+direction*0.075;
  for(let row=0;row<=vertical;row++){
    const v=row/vertical;
    for(let col=0;col<=across;col++){
      const u=-1+2*col/across;
      const inset=1-tier.topInset*v;
      const crown=tier.endCrown*(1-u*u)*Math.pow(v,3);
      positions.push(u*half*inset,baseY+tier.wallHeight*v+crown,z+direction*0.035*v);
    }
  }
  const stride=across+1;
  for(let r=0;r<vertical;r++)for(let c=0;c<across;c++){
    const a=r*stride+c,b=a+stride,x=a+1,y=b+1;
    if(direction>0)indices.push(a,x,b,x,y,b);else indices.push(a,b,x,x,b,y);
  }
  const geometry=new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position',new ctx.THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();
  ctx.mesh(parent,geometry,ctx.materials.plank,
    'aftercastle-tier-'+tier.id+(direction>0?'-aft-wall':'-forward-wall'));
}
