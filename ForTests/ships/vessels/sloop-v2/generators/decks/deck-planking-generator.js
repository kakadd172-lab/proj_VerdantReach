import { deckY,halfBreadth,sectionBreadth,stationZ } from '../../architecture/hull-geometry.js';

/**
 * Deck seams are thin flush ribbon meshes, not round Catmull-Rom tubes.
 * Every ribbon follows the exact same station/camber equation as the deck
 * skin, so seams cannot wobble independently or form raised rib-like ridges.
 */
export function buildDeckPlanking(d,ctx){
 const {THREE,part,mesh,materials}=ctx;
 const seams=part('deck-planks');
 const seamMaterial=new THREE.MeshStandardMaterial({
  color:0x806448,roughness:.96,side:THREE.DoubleSide
 });
 const along=148,seamWidth=.0065;
 const surfacePoint=(t,u)=>{
  const half=halfBreadth(d,t)*sectionBreadth(d,t,1)*1.004;
  const camber=(d.hull.deckCamber??.075)*d.beamUnits*.045*(1-u*u);
  return [u*half,deckY(d,t)+camber+.004,stationZ(d,t,1)];
 };
 const makeRun=(row,u,start,end)=>{
  const positions=[],indices=[],stride=2;
  for(let i=0;i<=along;i++){
   const t=start+(end-start)*i/along;
   const half=halfBreadth(d,t)*sectionBreadth(d,t,1)*1.004;
   const delta=Math.min(.08,seamWidth/(2*Math.max(half,.08)));
   const left=surfacePoint(t,Math.max(-.995,u-delta));
   const right=surfacePoint(t,Math.min(.995,u+delta));
   positions.push(...left,...right);
   if(i<along){
    const a=i*stride;
    indices.push(a,a+2,a+1,a+1,a+2,a+3);
   }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(seams,geometry,seamMaterial,'deck-seam-'+row+'-'+start.toFixed(3));
 };
 for(let row=-8;row<=8;row++){
  const u=row/9;
  // Leave the cockpit well genuinely open: no plank seam is drawn across it.
  if(Math.abs(u)<.49){
   makeRun(row,u,.035,.785);
   makeRun(row,u,.955,.965);
  }else makeRun(row,u,.035,.965);
 }
}
