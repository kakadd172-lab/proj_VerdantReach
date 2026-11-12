import { deckY,halfBreadth,stationZ,V } from '../../architecture/hull-geometry.js';
export function buildStern(d,ctx){
 const {THREE,part,mesh,materials,beam,box}=ctx;
 const stern=part('sternworks'),gallery=part('stern-gallery'),windows=part('stern-windows');
 const along=24,vertical=20,positions=[],indices=[],t=.992;
 const half=halfBreadth(d,t)*.91,z=stationZ(d,t,1);
 for(let j=0;j<=vertical;j++){
  const v=j/vertical,y=d.deckHeightUnits-d.draftUnits*(1-v),width=half*(.72+.28*v);
  for(let i=0;i<=along;i++){const u=i/along*2-1;positions.push(u*width,y,z+.08*(1-u*u));}
 }
 for(let j=0;j<vertical;j++)for(let i=0;i<along;i++){
  const a=j*(along+1)+i;indices.push(a,a+1,a+along+1,a+1,a+along+2,a+along+1);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();mesh(stern,geometry,materials.hull,'sloop-v2-rounded-transom-panel');
 const capY=deckY(d,.965)+.16,capWidth=halfBreadth(d,.965)*1.45;
 beam(stern,V(-capWidth,capY,z-.10),V(capWidth,capY,z-.10),.075,materials.trim,'sloop-v2-counter-cap',12);
 // Separate aft gallery and window assemblies remain independently editable.
 const galleryY=deckY(d,.955)+.32,galleryZ=stationZ(d,.955,1);
 beam(gallery,V(-capWidth*.72,galleryY,galleryZ),V(capWidth*.72,galleryY,galleryZ),.035,materials.trim,'aft-gallery-cross-rail',12);
 for(const side of [-1,1]){
  const pane=box(windows,.055,.30,.44,materials.glass,'stern-window-glass');
  pane.position.set(side*capWidth*.34,galleryY-.17,galleryZ+.025);
  for(const offset of [-.24,.24]){
   beam(windows,V(side*capWidth*.34+offset,galleryY-.34,galleryZ+.06),
    V(side*capWidth*.34+offset,galleryY,galleryZ+.06),.018,materials.trim,'stern-window-upright',8);
  }
  beam(windows,V(side*capWidth*.34-.24,galleryY,galleryZ+.06),
   V(side*capWidth*.34+.24,galleryY,galleryZ+.06),.018,materials.trim,'stern-window-header',8);
 }
}
