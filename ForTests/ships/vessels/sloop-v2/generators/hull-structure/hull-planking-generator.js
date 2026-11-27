import { hullSurfacePoint } from '../../architecture/hull-geometry.js';

/**
 * Fine carvel plank seams as narrow surface-following ribbons. The former
 * TubeGeometry/Catmull-Rom strakes made round, wavy cords stand proud of the
 * hull; these strips sit close to the actual hull section instead.
 */
export function buildHullPlanking(d,ctx){
 const {THREE,part,mesh,materials}=ctx;
 const strakes=part('hull-strakes');
 const seamMaterial=materials.plank;
 const rows=11,samples=124,halfBand=.0032;
 for(const side of [-1,1]){
  for(let row=0;row<rows;row++){
   const level=.12+row*.78/(rows-1);
   const positions=[],indices=[];
   for(let i=0;i<=samples;i++){
    const t=.012+.976*i/samples;
    for(const v of [Math.max(.01,level-halfBand),Math.min(.99,level+halfBand)]){
     const p=hullSurfacePoint(d,t,side,v);
     p.x+=side*.004;
     positions.push(p.x,p.y,p.z);
    }
    if(i<samples){
     const a=i*2;
     if(side<0)indices.push(a,a+2,a+1,a+1,a+2,a+3);
     else indices.push(a,a+1,a+2,a+1,a+3,a+2);
    }
   }
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   geometry.setIndex(indices);
   geometry.computeVertexNormals();
   mesh(strakes,geometry,seamMaterial,'hull-plank-seam-'+side+'-'+row);
  }
 }
}
