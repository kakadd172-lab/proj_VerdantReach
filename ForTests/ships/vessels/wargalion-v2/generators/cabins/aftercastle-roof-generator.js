import { halfBreadth, hullLongitudinalZ, deckLevelY, V } from '../../architecture/hull-surface.js';

/**
 * Each tier has a walkable deck-like top. The uppermost small cabin alone
 * receives a pitched cap. Geometry remains a distinct assembly per tier.
 */
export function buildAftercastleRoof(d,ctx,parent,tier){
  const {THREE,mesh,materials,tube}=ctx;
  const along=56,across=32,positions=[],indices=[],portEdge=[],starboardEdge=[],ridge=[];
  for(let row=0;row<=along;row++){
    const u=row/along,t=tier.t0+(tier.t1-tier.t0)*u;
    const half=halfBreadth(d,t)*tier.widthScale*1.055;
    const z=hullLongitudinalZ(d,t,1);
    const y0=deckLevelY(d,t,'quarterdeck')+tier.baseOffset+tier.wallHeight;
    for(let col=0;col<=across;col++){
      const q=col/across,a=-1+2*q;
      const lift=tier.roofStyle==='cap'?tier.roofRise*(1-Math.abs(a)):tier.roofRise*(1-a*a);
      const p=V(a*half,y0+lift,z);
      positions.push(p.x,p.y,p.z);
      if(col===0)portEdge.push(p);
      if(col===across)starboardEdge.push(p);
      if(col===across/2)ridge.push(p);
    }
  }
  const stride=across+1;
  for(let r=0;r<along;r++)for(let c=0;c<across;c++){
    const a=r*stride+c,b=a+stride,x=a+1,y=b+1;
    indices.push(a,b,x,b,y,x);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();
  mesh(parent,g,materials.deck,'aftercastle-tier-'+tier.id+
    (tier.roofStyle==='cap'?'-upper-roof-cap':'-raised-deck-level'));
  tube(parent,portEdge,0.045,materials.trim,'aftercastle-tier-'+tier.id+'-port-eave',10);
  tube(parent,starboardEdge,0.045,materials.trim,'aftercastle-tier-'+tier.id+'-starboard-eave',10);
  if(tier.roofStyle==='cap')tube(parent,ridge,0.04,materials.trim,
    'aftercastle-tier-'+tier.id+'-roof-ridge',10);
}
