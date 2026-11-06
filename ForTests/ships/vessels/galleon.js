/**
 * galleon — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, resolveVesselForGeneration } from '../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../shared/ship-editor-kit.js';

export const GalleonDefinition = defineVesselSpec({
  id: 'galleon',
  design: {
    id: 'galleon', label: 'Iberian ocean-going galleon', era: 'Mid-to-late 16th century reconstruction',
    hullLength: 34.0, beam: 8.5, draft: 4.4, freeboard: 2.55,
    rig: 'Three-masted early Iberian galleon: square courses, topsails and topgallants on fore and main; lateen mizzen; bowsprit and stay sails.',
    hullProfile: 'Slender early Iberian galleon reconstruction (about 4:1 length-to-beam), bluff lower bow, fine aft run, pronounced tumblehome, raised foredeck and an aft-projecting tapered sterncastle.',
    reference: 'Game-scale early Iberian galleon reconstruction using a c.1550 galleon length-to-beam proportion of about 4:1 as a typological guide. Overall dimensions are design estimates, not measured plans for a named surviving ship. Stern profile informed by period galleon reconstructions.',
    sources: [{ label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' }, { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' }, { label: 'Maritime Museum of San Diego — San Salvador dimensions and sail plan', url: 'https://sdmaritime.org/visit/the-ships/san-salvador/' }],
    hull: { fullness: 0.74, entry: 0.58, stern: 'transom', sternWidth: 0.37, tumblehome: 0.19, sheer: 0.24, bowRise: 0.43, sternRise: 0.62, keelDepth: 0.24, deckCamber: 0.19 },
    sternwork: 'galleon-castle',
    sternTiers: [{"w":0.78,"d":0.22,"h":2.25},{"w":0.58,"d":0.17,"h":1.72},{"w":0.42,"d":0.14,"h":1.38}], bowwork: 'beakhead',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 6.2, handling: 0.58,
    masts: [
      { id: 'fore', z: -0.28, height: 22.0, rig: 'square', squares: 3 },
      { id: 'main', z: -0.025, height: 25.1, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 17.0, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 48, beamStation: .51, forebody: .82, aftbody: .84, foreTip: .003, aftTip: .11, bottomFlat: .34, bilge: .23, flare: .11, tumble: .18, sheer: 1.25, lowerMastRatio: .63, shroudPairs: 4, ratlines: 12, yardSpread: 1.02 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){
 const q=Math.max(0,Math.min(1,t));
 const edge=Math.pow(Math.abs(2*q-1),.92);
 const bow=Math.pow(Math.max(0,1-q/.34),1.55);
 const stern=Math.pow(Math.max(0,(q-.70)/.30),1.28);
 const waveSheer=.018*Math.sin(Math.PI*q);
 return d.deckHeightUnits
  +d.hull.sheer*d.deckHeightUnits*edge*d.structure.sheer
  +d.hull.bowRise*d.deckHeightUnits*bow
  +d.hull.sternRise*d.deckHeightUnits*stern
  +waveSheer*d.deckHeightUnits;
}
function keelY(d,t){
 const q=Math.max(0,Math.min(1,t));
 const mid=Math.pow(Math.max(0,Math.sin(Math.PI*q)),.62);
 const endDepth=.56+.055*q;
 const shoulder=.035*Math.pow(Math.max(0,Math.sin(Math.PI*q)),1.4);
 const depth=Math.min(1,endDepth+(1-endDepth)*mid+shoulder);
 return -d.draftUnits*depth;
}
function deckBreadthRatio(d){
 return Math.max(.56,Math.min(.96,.865-d.hull.tumblehome*.42-d.structure.tumble*.26-.012+d.structure.flare*.20));
}
function halfBreadth(d,t){
 const q=Math.max(0,Math.min(1,t));
 const raw=Math.pow(Math.max(0,Math.sin(Math.PI*q)),.56);
 const aftBlend=Math.max(0,Math.min(1,(q-.79)/.21));
 const aftSmooth=aftBlend*aftBlend*(3-2*aftBlend);
 const shoulder=raw*(1-aftSmooth)+.70*aftSmooth;
 const belly=.92+.12*Math.sin(Math.PI*q);
 const foreShoulder=.78+.22*Math.max(0,Math.min(1,q/.34));
 const counter=.98+.02*Math.max(0,Math.min(1,(1-q)*5));
 return d.beamUnits*.5*shoulder*belly*foreShoulder*counter;
}
function hullPoint(d,t,a){
 const v=1-Math.pow(Math.abs(Math.sin(a)),1.38),deck=deckY(d,t),keel=keelY(d,t);
 const transition=.64,lowerT=Math.max(0,Math.min(1,v/transition)),upperT=Math.max(0,Math.min(1,(v-transition)/(1-transition)));
 const lower=.045+.955*Math.pow(Math.sin(lowerT*Math.PI*.5),.48)*(1+(d.structure.bilge||0)*.2*Math.sin(Math.PI*lowerT));
 const smooth=upperT*upperT*(3-2*upperT);
 const deckRatio=deckBreadthRatio(d);
 const upper=1+(deckRatio-1)*Math.pow(smooth,.98);
 const section=v<=transition?lower:upper;
 return V(Math.cos(a)*halfBreadth(d,t)*section,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);
}
function hullPointAtV(d,t,v,side=1){
 const sine=Math.pow(Math.max(0,Math.min(1,1-v)),1/1.38);
 const angle=Math.asin(Math.min(1,sine));
 return hullPoint(d,t,side<0?Math.PI-angle:angle);
}
function buildKeelMember(d,ctx,parent,name,widthFactor,height,offsetY,material){
 const {THREE,mesh}=ctx,stations=104;
 const profile=[
  [-.50,.12],[-.48,-.10],[-.36,-.48],[-.22,-.86],[-.12,-1],
  [.12,-1],[.22,-.86],[.36,-.48],[.48,-.10],[.50,.12],
  [.34,.22],[-.34,.22]
 ];
 const ring=profile.length,positions=[],indices=[];
 for(let i=0;i<=stations;i++){
  const q=i/stations,t=.004+.992*q;
  const rocker=Math.pow(Math.max(0,Math.sin(Math.PI*q)),.58);
  const endTaper=.025+.975*Math.pow(rocker,.43);
  const width=d.beamUnits*widthFactor*endTaper;
  const depth=height*(.18+.82*Math.pow(rocker,.68));
  const centerY=keelY(d,t)+offsetY,z=(t-.5)*d.hullLengthUnits;
  for(const [x,y] of profile)positions.push(x*width,centerY+y*depth,z);
 }
 for(let i=0;i<stations;i++)for(let j=0;j<ring;j++){
  const a=i*ring+j,b=i*ring+(j+1)%ring;
  indices.push(a,a+ring,b,b,a+ring,(i+1)*ring+(j+1)%ring);
 }
 for(const i of [0,stations]){
  const q=i/stations,t=.004+.992*q,c=positions.length/3;
  positions.push(0,keelY(d,t)+offsetY,(t-.5)*d.hullLengthUnits);
  for(let j=0;j<ring;j++)indices.push(c,i*ring+j,i*ring+(j+1)%ring);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(parent,geometry,material,name);
}
function buildKeelStructure(d,ctx){
 const {part,tube,materials,V}=ctx;
 const keel=part('keel');
 buildKeelMember(d,ctx,keel,'galleon-sculpted-keel',.092,1.02,.12,materials.trim);
 const shoe=part('keel-shoe',keel);
 buildKeelMember(d,ctx,shoe,'galleon-tapered-false-keel',.052,.28,-.78,materials.lower);
 const keelson=part('keelson');
 buildKeelMember(d,ctx,keelson,'galleon-inboard-keelson',.067,.34,.34,materials.plank);
 const stem=part('stem'),fore=[],aft=[];
 for(let i=0;i<=28;i++){
  const q=i/28,t=.105*(1-q);
  const z=(t-.5)*d.hullLengthUnits-q*d.beamUnits*.92;
  const y=keelY(d,.105)*(1-q)+(deckY(d,.004)+.58)*q;
  fore.push(V(0,y,z));
  const ta=.885+.113*q,za=(ta-.5)*d.hullLengthUnits+q*d.beamUnits*.28;
  const ya=keelY(d,.885)*(1-q)+(deckY(d,.998)+.34)*q;
  aft.push(V(0,ya,za));
 }
 tube(stem,fore,d.beamUnits*.021,materials.trim,'swept-forward-stem-and-apron',64);
 tube(stem,aft,d.beamUnits*.022,materials.trim,'raked-sternpost',64);
 const deadwood=part('after-deadwood');
 tube(deadwood,[
  V(0,keelY(d,.78)+.05,d.hullLengthUnits*.28),
  V(0,keelY(d,.86)+.24,d.hullLengthUnits*.36),
  V(0,keelY(d,.94)+.56,d.hullLengthUnits*.445)
 ],d.beamUnits*.052,materials.trim,'tapered-after-deadwood',38);
}

function buildHull(d,ctx){
 const {THREE,part,mesh,materials}=ctx,stations=120,rings=48,positions=[],indices=[];
 const hullGroup=part('hull');
 for(let i=0;i<=stations;i++){
  const t=i/stations;
  for(let j=0;j<=rings;j++){
   const q=hullPoint(d,t,j/rings*Math.PI*2);
   positions.push(q.x,q.y,q.z);
  }
 }
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){
  const a=i*stride+j;
  indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);
 }
 for(const i of [0,stations]){
  const t=i/stations,c=positions.length/3;
  positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);
  for(let j=0;j<rings;j++){
   const a=i*stride+j;
   indices.push(c,a,a+1);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(hullGroup,geometry,materials.hull,'galleon-curved-transom-hull-shell');
 const deck=part('deck'),along=88,across=24,pos=[],faces=[];
 for(let i=0;i<=along;i++){
  const t=i/along,half=halfBreadth(d,t)*deckBreadthRatio(d);
  for(let j=0;j<=across;j++){
   const u=j/across*2-1;
   pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);
  }
 }
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){
  const a=i*(across+1)+j;
  faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
 }
 const deckGeo=new THREE.BufferGeometry();
 deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 deckGeo.setIndex(faces);deckGeo.computeVertexNormals();
 mesh(deck,deckGeo,materials.deck,'galleon-cambered-main-deck');
 buildKeelStructure(d,ctx);
}
function buildFramesAndPlanking(d,ctx){
 const {part,beam,tube,materials,V}=ctx;
 const frames=part('frame-set');
 for(let i=0;i<d.structure.frameCount;i++){
  const t=.022+.956*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0'),frames),line=[];
  for(let j=0;j<=52;j++)line.push(hullPoint(d,t,j/52*Math.PI*2));
  tube(frame,line,Math.max(.032,d.beamUnits*.0055),materials.trim,'galleon-oak-frame',58);
 }
 const strakes=part('hull-strakes'),rows=12;
 for(const side of [-1,1])for(let row=0;row<rows;row++){
  const v=.12+row*.069,points=[];
  for(let i=0;i<=88;i++){
   const t=.018+.964*i/88,p=hullPointAtV(d,t,v,side);
   p.y+=.018;points.push(p);
  }
  tube(strakes,points,Math.max(.014,d.beamUnits*.0026),row<2?materials.lower:materials.plank,'galleon-longitudinal-plank-seam-'+side+'-'+row,92);
 }
 const wales=part('hull-wales');
 for(const side of [-1,1]){
  for(const item of [{v:.73,r:.085,m:materials.trim,label:'lower'},{v:.84,r:.07,m:materials.lower,label:'upper'},{v:.91,r:.045,m:materials.brass,label:'decorative'}]){
   const points=[];
   for(let i=0;i<=88;i++){
    const t=.035+.93*i/88,p=hullPointAtV(d,t,item.v,side);
    p.y+=.045;points.push(p);
   }
   tube(wales,points,item.r,item.m,'galleon-'+item.label+'-wale-'+side,92);
  }
 }
 const seams=part('deck-planks');
 for(let line=-10;line<=10;line++){
  const u=line/11,points=[];
  for(let i=0;i<=52;i++){
   const t=.035+.93*i/52,half=halfBreadth(d,t)*deckBreadthRatio(d);
   points.push(V(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+.025,(t-.5)*d.hullLengthUnits));
  }
  tube(seams,points,.012,materials.plank,'galleon-deck-plank-seam-'+line,56);
 }
}

function buildStern(d,ctx){
 const {THREE,part,mesh,box,beam,tube,materials,V}=ctx;
 const stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern);
 const tiers=d.sternTiers||[],baseDeck=deckY(d,.9)+.18;
 let bottomY=baseDeck,tierCenterZ=d.hullLengthUnits*.355;
 function addSternDeck(parent,name,width,depth,y,centerZ,material,camber=.12){
  const across=24,along=12,positions=[],indices=[];
  for(let row=0;row<=along;row++){
   const q=row/along,half=width*.5*(.965+.035*q);
   for(let col=0;col<=across;col++){
    const u=col/across*2-1,z=centerZ+(q-.5)*depth;
    const crown=camber*(1-u*u)+.035*Math.sin(Math.PI*q);
    positions.push(u*half,y+crown,z);
   }
  }
  for(let row=0;row<along;row++)for(let col=0;col<across;col++){
   const a=row*(across+1)+col;
   indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return mesh(parent,geometry,material,name);
 }
 function addTransom(parent,name,width,bottomY,height,aftZ,topWidth,topAftZ,bulge){
  const across=36,rows=12,positions=[],indices=[];
  for(let row=0;row<=rows;row++){
   const v=row/rows,sectionWidth=width+(topWidth-width)*v;
   const transomZ=aftZ+(topAftZ-aftZ)*v;
   for(let col=0;col<=across;col++){
    const u=col/across*2-1;
    const x=u*sectionWidth*.5,y=bottomY+height*v+.035*(1-u*u)*Math.sin(Math.PI*v);
    const z=transomZ+bulge*(1-u*u);
    positions.push(x,y,z);
   }
  }
  for(let row=0;row<rows;row++)for(let col=0;col<across;col++){
   const a=row*(across+1)+col;
   indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  mesh(parent,geometry,materials.hull,name);
 }
 function addCabinSide(parent,name,side,width,topWidth,bottomY,height,foreZ,aftZ,topForeZ,topAftZ){
  const along=24,rows=12,positions=[],indices=[];
  for(let row=0;row<=rows;row++){
   const v=row/rows,w=width+(topWidth-width)*v;
   const startZ=foreZ+(topForeZ-foreZ)*v,endZ=aftZ+(topAftZ-aftZ)*v;
   for(let col=0;col<=along;col++){
    const u=col/along,z=startZ+(endZ-startZ)*u;
    const flare=.12*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
    const x=side*(w*.5+flare);
    const y=bottomY+height*v+.04*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
    positions.push(x,y,z);
   }
  }
  for(let row=0;row<rows;row++)for(let col=0;col<along;col++){
   const a=row*(along+1)+col;
   indices.push(a,a+1,a+along+1,a+1,a+along+2,a+along+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  mesh(parent,geometry,materials.hull,name);
 }
 function addForwardCabinFace(parent,name,width,topWidth,bottomY,height,foreZ,topForeZ){
  const geometry=new THREE.BufferGeometry();
  const points=[
   [-width*.5,bottomY,foreZ],[width*.5,bottomY,foreZ],
   [topWidth*.5,bottomY+height,topForeZ],[-topWidth*.5,bottomY+height,topForeZ]
  ];
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
  mesh(parent,geometry,materials.hull,name);
 }
 tiers.forEach((tier,index)=>{
  const tierGroup=part('stern-tier-'+(index+1),stern);
  const width=d.beamUnits*tier.w,topWidth=width*(index===0?.72:.76);
  const depth=d.hullLengthUnits*tier.d,height=tier.h*(4/3);
  const foreZ=tierCenterZ-depth*.5,aftZ=tierCenterZ+depth*.5;
  const aftOverhang=.92+index*.16,topForeZ=foreZ+.10,topAftZ=aftZ+aftOverhang;
  const topCenterZ=(topForeZ+topAftZ)*.5,topDepth=topAftZ-topForeZ;
  const topY=bottomY+height,bulge=.44-index*.045;
  addSternDeck(tierGroup,'sterncastle-tier-floor',width+.28,depth+.3,bottomY,tierCenterZ,materials.deck,.12);
  addTransom(tierGroup,'curved-transom-wall-'+(index+1),width,bottomY,height,aftZ,topWidth,topAftZ,bulge);
  const sideWalls=part('stern-tier-side-walls-'+(index+1),tierGroup);
  for(const side of [-1,1])addCabinSide(sideWalls,'sloped-quarter-cabin-wall-'+side,side,width,topWidth,bottomY,height,foreZ,aftZ,topForeZ,topAftZ);
  addForwardCabinFace(tierGroup,'sloped-forward-cabin-face-'+(index+1),width,topWidth,bottomY,height,foreZ,topForeZ);
  addSternDeck(tierGroup,'sterncastle-upper-deck',topWidth+.42,topDepth+.46,topY+.035,topCenterZ,materials.deck,.16);
  const transomTrim=part('stern-transom-trim-'+(index+1),tierGroup);
  for(const v of [.06,.94]){
   const y=bottomY+height*v,z0=aftZ+(topAftZ-aftZ)*v,w=width+(topWidth-width)*v,points=[];
   for(let i=0;i<=32;i++){
    const u=-1+2*i/32;
    points.push(V(u*w*.5,y,z0+bulge*(1-u*u)+.035));
   }
   tube(transomTrim,points,.048,materials.brass,'curved-transom-moulding',40);
  }
  const tierWindows=part('stern-windows-tier-'+(index+1),windows);
  const count=Math.max(3,5-index),windowW=width/(count+1)*.46,windowH=height*.34;
  const windowV=.55,windowY=bottomY+height*windowV;
  const sideWindows=part('stern-side-windows-tier-'+(index+1),windows);
  for(let n=0;n<count;n++){
   const x=-width*.34+width*.68*n/Math.max(1,count-1);
   const normalized=x/(width*.5),z=aftZ+(topAftZ-aftZ)*windowV+bulge*(1-normalized*normalized)+.075;
   const pane=box(tierWindows,windowW,windowH,.065,materials.glass,'arched-stern-window-pane');
   pane.position.set(x,windowY,z);
   const frame=part('stern-window-frame-'+(index+1)+'-'+(n+1),tierWindows);
   const left=x-windowW*.55,right=x+windowW*.55,low=windowY-windowH*.5,high=windowY+windowH*.42;
   beam(frame,V(left,low,z+.045),V(right,low,z+.045),.032,materials.brass,'window-sill');
   beam(frame,V(left,low,z+.045),V(left,high,z+.045),.032,materials.brass,'window-left-jamb');
   beam(frame,V(right,low,z+.045),V(right,high,z+.045),.032,materials.brass,'window-right-jamb');
   const arch=[];
   for(let k=0;k<=12;k++){
    const a=Math.PI-k*Math.PI/12;
    arch.push(V(x+Math.cos(a)*windowW*.55,high+Math.sin(a)*windowW*.24,z+.045));
   }
   tube(frame,arch,.035,materials.brass,'arched-window-head',16);
   beam(frame,V(x,low+.05,z+.055),V(x,high-.02,z+.055),.018,materials.trim,'window-mullion');
   beam(frame,V(left+.03,windowY,z+.055),V(right-.03,windowY,z+.055),.018,materials.trim,'window-crossbar');
  }
  for(const side of [-1,1])for(let paneIndex=0;paneIndex<3;paneIndex++){
   const u=.32+paneIndex*.23,v=.49,startZ=foreZ+(topForeZ-foreZ)*v,endZ=aftZ+(topAftZ-aftZ)*v;
   const z=startZ+(endZ-startZ)*u,w=width+(topWidth-width)*v,x=side*(w*.5+.16),y=bottomY+height*v;
   const pane=box(sideWindows,.06,.38,.32,materials.glass,'quarter-gallery-side-window');
   pane.position.set(x,y,z);
   for(const yy of [-.22,.22])beam(sideWindows,V(x+side*.04,y+yy,z-.18),V(x+side*.04,y+yy,z+.18),.024,materials.brass,'side-window-horizontal-trim');
   for(const zz of [-.18,.18])beam(sideWindows,V(x+side*.04,y-.22,z+zz),V(x+side*.04,y+.22,z+zz),.024,materials.brass,'side-window-vertical-trim');
  }
  const galleryTier=part('stern-gallery-tier-'+(index+1),gallery),balconyCenter=topAftZ+.16;
  addSternDeck(galleryTier,'stern-balcony-walkway',topWidth*.98,Math.max(.8,topDepth*.17),topY+.12,balconyCenter,materials.deck,.07);
  const railY=topY+.72,railPoints=[];
  for(let i=0;i<=24;i++){
   const u=-1+2*i/24,x=u*topWidth*.49,z=topAftZ+.18+bulge*(1-u*u);
   railPoints.push(V(x,railY,z));
   if(i%2===0)beam(galleryTier,V(x,topY+.19,z),V(x,railY,z),.032,materials.brass,'sternwalk-baluster');
  }
  tube(galleryTier,railPoints,.05,materials.trim,'curved-sternwalk-handrail',42);
  for(const side of [-1,1]){
   const quarter=part('quarter-gallery-'+(index+1)+'-'+side,galleryTier);
   const wing=box(quarter,.82,.14,Math.max(1.2,topDepth*.58),materials.deck,'projecting-quarter-gallery');
   wing.position.set(side*(width*.5+.30),topY+.14,tierCenterZ+.12);
   for(let j=0;j<=5;j++){
    const z=tierCenterZ-depth*.20+j*depth*.13,x=side*(width*.5+.70);
    beam(quarter,V(x,topY+.19,z),V(x,topY+.67,z),.03,materials.brass,'quarter-gallery-baluster');
   }
   tube(quarter,[V(side*(width*.5+.70),topY+.67,tierCenterZ-depth*.20),V(side*(width*.5+.70),topY+.67,tierCenterZ+depth*.45)],.045,materials.trim,'quarter-gallery-rail',24);
   beam(quarter,V(side*width*.46,topY-.08,tierCenterZ),V(side*(width*.5+.30),topY+.10,topAftZ),.07,materials.trim,'gallery-support-knee');
  }
  if(index===0){
   const ornament=part('stern-escutcheon',stern);
   const medallion=mesh(ornament,new THREE.CylinderGeometry(.4,.4,.075,28),materials.brass,'gilded-stern-medallion');
   medallion.rotation.x=Math.PI/2;medallion.position.set(0,bottomY+height*.20,topAftZ+bulge+.12);
   const ring=mesh(ornament,new THREE.TorusGeometry(.49,.045,8,32),materials.trim,'stern-medallion-ring');
   ring.rotation.x=Math.PI/2;ring.position.set(0,bottomY+height*.20,topAftZ+bulge+.16);
   for(let ray=0;ray<8;ray++){
    const a=ray*Math.PI/4;
    beam(ornament,V(Math.cos(a)*.19,bottomY+height*.20+Math.sin(a)*.19,topAftZ+bulge+.19),V(Math.cos(a)*.34,bottomY+height*.20+Math.sin(a)*.34,topAftZ+bulge+.19),.018,materials.trim,'stern-ornament-ray');
   }
  }
  if(index===tiers.length-1){
   const lanterns=part('stern-lanterns',stern);
   for(const side of [-1,1]){
    const x=side*topWidth*.42,z=topAftZ+bulge*.55+.24,y=topY+.38;
    const glass=box(lanterns,.34,.5,.34,materials.glass,'stern-lantern-glass');
    glass.position.set(x,y,z);
    for(const yy of [y-.27,y+.27]){
     const cap=box(lanterns,.42,.06,.42,materials.brass,'stern-lantern-cap');
     cap.position.set(x,yy,z);
    }
    for(const xx of [-1,1]){
     const post=box(lanterns,.035,.52,.035,materials.trim,'stern-lantern-frame');
     post.position.set(x+xx*.18,y,z);
    }
   }
  }
  bottomY=topY+.20;
  const nextTier=tiers[index+1];
  tierCenterZ=nextTier
   ? topAftZ-(d.hullLengthUnits*nextTier.d)*.46+.18
   : topCenterZ+.12;
 });
}

function buildBow(d,ctx){
 const {THREE,part,beam,tube,box,materials,V}=ctx;
 const bow=part('bowworks'),forecastle=part('raised-forecastle',bow);
 const tip=-d.hullLengthUnits*.5,deckBase=deckY(d,.045);
 const stations=26,across=22,positions=[],indices=[];
 // Raised foredeck sits down into the bow shoulder and follows its taper.
 for(let i=0;i<=stations;i++){
  const q=i/stations,t=.025+q*.17,half=halfBreadth(d,t)*deckBreadthRatio(d)*.96;
  for(let j=0;j<=across;j++){
   const u=j/across*2-1;
   positions.push(u*half,deckY(d,t)+.58+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);
  }
 }
 for(let i=0;i<stations;i++)for(let j=0;j<across;j++){
  const a=i*(across+1)+j;
  indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
 }
 const forecastleGeo=new THREE.BufferGeometry();
 forecastleGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 forecastleGeo.setIndex(indices);forecastleGeo.computeVertexNormals();
 ctx.mesh(forecastle,forecastleGeo,materials.deck,'curved-raised-forecastle-deck');

 const bulwarks=part('forecastle-bulwarks');
 for(const side of [-1,1]){
  const top=[];
  for(let i=0;i<=22;i++){
   const t=.035+.145*i/22,x=side*halfBreadth(d,t)*deckBreadthRatio(d)*.96;
   const z=(t-.5)*d.hullLengthUnits,y=deckY(d,t)+.58;
   if(i%3===0)beam(bulwarks,V(x,y,z),V(x,y+.42,z),.038,materials.trim,'forecastle-baluster');
   top.push(V(x,y+.42,z));
  }
  tube(bulwarks,top,.046,materials.trim,'forecastle-swept-rail',38);
 }

 // Broad, tapered beakhead platform: its aft end is bedded into the stem and foredeck.
 const beak=part('galleon-beakhead');
 const rootZ=tip+d.beamUnits*.15,noseZ=tip-d.beamUnits*.47;
 const rootHalf=d.beamUnits*.185,noseHalf=d.beamUnits*.075;
 const rows=38,cols=18,deckPos=[],deckIndex=[];
 for(let row=0;row<=rows;row++){
  const q=row/rows,z=rootZ+(noseZ-rootZ)*q;
  const half=rootHalf+(noseHalf-rootHalf)*q;
  const y=deckBase+.15+.10*q;
  for(let col=0;col<=cols;col++){
   const u=col/cols*2-1;
   deckPos.push(u*half,y+.04*(1-u*u),z);
  }
 }
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const a=row*(cols+1)+col;
  deckIndex.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
 }
 const beakGeo=new THREE.BufferGeometry();
 beakGeo.setAttribute('position',new THREE.Float32BufferAttribute(deckPos,3));
 beakGeo.setIndex(deckIndex);beakGeo.computeVertexNormals();
 ctx.mesh(beak,beakGeo,materials.deck,'broad-tapered-beakhead-platform');

 const beakRails=part('beakhead-rails');
 for(const side of [-1,1]){
  const rail=[];
  for(let i=0;i<=24;i++){
   const q=i/24,z=rootZ+(noseZ-rootZ)*q,half=rootHalf+(noseHalf-rootHalf)*q;
   const y=deckBase+.15+.10*q;
   rail.push(V(side*half,y+.36,z));
   if(i%4===0)beam(beakRails,V(side*half,y+.04,z),V(side*half,y+.36,z),.032,materials.trim,'beakhead-post');
  }
  tube(beakRails,rail,.043,materials.trim,'beakhead-rail',36);
  // Solid knees blend the platform into the bow shoulder.
  beam(beakRails,V(side*d.beamUnits*.17,deckBase-.22,tip+d.beamUnits*.20),
    V(side*rootHalf,deckBase+.18,rootZ),.09,materials.trim,'beakhead-knee');
 }
 for(let i=0;i<=10;i++){
  const q=i/10,z=rootZ+(noseZ-rootZ)*q,half=rootHalf+(noseHalf-rootHalf)*q,y=deckBase+.18+.10*q;
  beam(beak,V(-half*.84,y,z),V(half*.84,y,z),.022,materials.plank,'beakhead-grating-bar');
 }

 // Short, tapered bowsprit enters a saddle on the platform rather than floating above it.
 function taperedSpar(parent,name,start,end,radiusBase,radiusTip,material,segments=14){
  const direction=end.clone().sub(start),length=direction.length();
  const geometry=new THREE.CylinderGeometry(radiusTip,radiusBase,length,segments,4);
  const spar=ctx.mesh(parent,geometry,material,name);
  spar.position.copy(start).add(end).multiplyScalar(.5);
  spar.quaternion.setFromUnitVectors(V(0,1,0),direction.normalize());
  return spar;
 }
 const bowsprit=part('bowsprit');
 const spritRoot=V(0,deckBase+.42,tip+d.beamUnits*.13);
 const spritEnd=V(0,deckBase+.78,tip-d.beamUnits*.48);
 taperedSpar(bowsprit,'short-tapered-bowsprit',spritRoot,spritEnd,.18,.095,materials.trim,16);
 const extension=spritEnd.clone().add(V(0,.08,-d.beamUnits*.13));
 taperedSpar(bowsprit,'light-sprit-topmast',spritEnd,extension,.09,.055,materials.trim,12);

 const saddle=part('bowsprit-saddle',beak);
 const saddleBlock=box(saddle,d.beamUnits*.21,.20,d.beamUnits*.22,materials.trim,'bowsprit-partner');
 saddleBlock.position.set(0,deckBase+.40,tip+d.beamUnits*.12);
 for(const side of [-1,1]){
  beam(saddle,V(side*.18,deckBase+.42,tip+d.beamUnits*.10),
    V(side*.12,deckBase+.64,tip+d.beamUnits*.02),.05,materials.brass,'saddle-cheek');
  beam(saddle,V(side*.12,deckBase+.64,tip+d.beamUnits*.02),
    V(side*.08,deckBase+.66,tip-d.beamUnits*.06),.032,materials.trim,'saddle-cap');
 }

 // Compact spritsail below the bowsprit, kept subordinate to the fore and main courses.
 const spritYard=part('spritsail-yard');
 const yardZ=spritRoot.z+(extension.z-spritRoot.z)*.56,yardY=deckBase-.26,halfYard=d.beamUnits*.255;
 taperedSpar(spritYard,'spritsail-yard-spar',V(-halfYard,yardY,yardZ),V(halfYard,yardY,yardZ),.065,.05,materials.trim,12);
 buildCanvasSail(ctx,'sail-spritsail','bowsprit',[
  V(-halfYard*.94,yardY-.82,yardZ+.08),
  V(-halfYard,yardY+.02,yardZ-.04),
  V(halfYard,yardY+.02,yardZ-.04),
  V(halfYard*.94,yardY-.82,yardZ+.08)
 ],.22,beak,'z');

 const stays=part('bowsprit-standing-rigging');
 tube(stays,[extension,V(0,deckBase+2.0,tip-d.beamUnits*.16),
   V(0,deckY(d,.26)+.42,d.masts[0].z*d.hullLengthUnits)],.02,materials.rope,'bowsprit-forestay',42);
 tube(stays,[spritEnd,V(0,deckBase+1.10,tip+d.beamUnits*.02)],.016,materials.rope,'bowsprit-backstay',26);

 const figurehead=part('galleon-figurehead');
 const medallion=ctx.mesh(figurehead,new THREE.TorusGeometry(.18,.035,8,20),materials.brass,'stem-figurehead-ring');
 medallion.rotation.x=Math.PI/2;medallion.position.set(0,deckBase+.16,tip-.04);
 const finial=ctx.mesh(figurehead,new THREE.SphereGeometry(.11,12,10),materials.brass,'figurehead-finial');
 finial.position.set(0,deckBase+.16,tip-.06);
}

function buildRudderAndHelm(d,ctx){const {part,box,beam,materials,V}=ctx,rudder=part('rudder'),config=d.rudderDetails,stern=d.hullLengthUnits*.47;rudder.position.set(0,0,stern+config.pivotOffset);const width=d.beamUnits*config.breadthFactor*1,height=d.draftUnits*config.depthFactor,blade=box(rudder,width,height,.22,materials.trim,'galleon-rudder-blade');blade.position.set(0,-d.draftUnits*config.yFactor,0);beam(rudder,V(0,-d.draftUnits*.4,-.02),V(0,deckY(d,.97)+.22,0),Math.max(.045,d.beamUnits*.014),materials.trim,'rudder-stock');const helm=part('helm'),wheel=part('helm-wheel'),y=deckY(d,.83),z=d.hullLengthUnits*.31;beam(helm,V(0,y+.18,z),V(0,y+.9,z),.065,materials.trim,'helm-post');const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.44,.045,8,20),materials.trim,'helm-wheel-ring');ring.position.set(0,y+1.02,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y+1.02,z),V(Math.cos(a)*.44,y+1.02+Math.sin(a)*.44,z),.022,materials.trim,'helm-spoke');}}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx;
 const rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){
  const top=[],inner=[];
  for(let i=0;i<=52;i++){
   const t=.065+.87*i/52,edge=halfBreadth(d,t)*deckBreadthRatio(d)*.965;
   const x=side*edge,y=deckY(d,t)+.62,z=(t-.5)*d.hullLengthUnits;
   top.push(V(x,y,z));inner.push(V(x-side*.04,y-.5,z));
   if(i%2===0)beam(group,V(x-side*.025,y-.55,z),V(x,y,z),.034,materials.trim,'main-deck-rail-stanchion');
  }
  tube(group,top,.06,materials.trim,'main-deck-gunwale-rail',74);
  tube(group,inner,.035,materials.brass,'lower-rail-moulding',74);
 }
 const bulwarks=part('main-deck-bulwarks');
 for(const side of [-1,1]){
  for(let i=0;i<36;i++){
   const t=.12+i*.76/35,edge=halfBreadth(d,t)*deckBreadthRatio(d)*.94;
   const x=side*edge,z=(t-.5)*d.hullLengthUnits,y=deckY(d,t)+.16;
   const panel=box(bulwarks,.1,.34,Math.max(.2,d.hullLengthUnits*.025),materials.hull,'bulwark-plank');
   panel.position.set(x,y,z);
  }
 }
 const fittings=part('deck-fittings');
 for(let h=0;h<3;h++){
  const t=.3+h*.12,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*(h===0?.23:.16);
  const cover=box(group,size,.12,size*.82,materials.plank,'planked-cargo-hatch');
  cover.position.set(0,deckY(d,t)+.14,z);
  for(const side of [-1,1]){
   beam(group,V(side*size*.5,deckY(d,t)+.19,z-size*.42),V(side*size*.5,deckY(d,t)+.19,z+size*.42),.025,materials.trim,'hatch-coaming');
  }
 }

 const companionways=part('quarterdeck-companionways');
 for(const side of [-1,1]){
  const stair=part('sterncastle-stairs-'+side,companionways);
  for(let step=0;step<8;step++){
   const f=step/7,y=deckY(d,.76)+.18+f*1.2,z=d.hullLengthUnits*(.25+f*.105),x=side*d.beamUnits*.28;
   const tread=box(stair,.7,.12,.42,materials.deck,'quarterdeck-stair-tread');
   tread.position.set(x,y,z);
   const riser=box(stair,.7,.22,.08,materials.trim,'quarterdeck-stair-riser');
   riser.position.set(x,y-.13,z-.17);
  }
 }
}

function buildCanvasSail(ctx,name,mastId,corners,fullness=.28,parent=ctx.root,axis='z'){
 const {part,mesh,tube,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const rows=30,columns=36,positions=[],indices=[];
 const offset=(u,v)=>{
  const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),.72);
  const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),.82);
  const belly=fullness*chord*vertical*(1+.12*(2*u-1));
  const twist=.075*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
  return axis==='x' ? {x:belly,z:twist} : {x:twist,z:belly};
 };
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let column=0;column<=columns;column++){
   const u=column/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const point=lower.lerp(upper,v),billow=offset(u,v);
   point.x+=billow.x;point.z+=billow.z;
   positions.push(point.x,point.y,point.z);
  }
 }
 const stride=columns+1;
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const a=row*stride+column;
  indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const canvas=mesh(cloth,geometry,materials.sail,'full-cut-curved-canvas');
 canvas.material.side=THREE.DoubleSide;

 // Fine panel seams are inset into the billowed cloth; there is deliberately no rope tube
 // running around the perimeter of the sail.
 const seams=part('canvas-panel-seams-'+name,control);
 for(let uIndex=1;uIndex<=5;uIndex++){
  const u=uIndex/6,line=[];
  for(let k=0;k<=24;k++){
   const v=k/24,low=points[0].clone().lerp(points[3],u),high=points[1].clone().lerp(points[2],u);
   const p=low.lerp(high,v),billow=offset(u,v);
   p.x+=billow.x+(axis==='x'?.006:0);
   p.z+=billow.z+(axis==='z'?.006:0);
   line.push(p);
  }
  tube(seams,line,.006,materials.sailShade,'fine-vertical-canvas-seam',28);
 }
 for(const v of [.32,.66]){
  const line=[];
  for(let k=0;k<=30;k++){
   const u=k/30,low=points[0].clone().lerp(points[3],u),high=points[1].clone().lerp(points[2],u);
   const p=low.lerp(high,v),billow=offset(u,v);
   p.x+=billow.x+(axis==='x'?.009:0);
   p.z+=billow.z+(axis==='z'?.009:0);
   line.push(p);
  }
  tube(seams,line,.006,materials.sailShade,'fine-horizontal-canvas-seam',34);
 }
 return control;
}

function buildRig(d,ctx){
 const {part,beam,tube,materials,V,THREE}=ctx;

 function taperedSpar(parent,name,start,end,radiusBase,radiusTip,material,segments=14){
  const direction=end.clone().sub(start),length=direction.length();
  const geometry=new THREE.CylinderGeometry(radiusTip,radiusBase,length,segments,5);
  const spar=ctx.mesh(parent,geometry,material,name);
  spar.position.copy(start).add(end).multiplyScalar(.5);
  spar.quaternion.setFromUnitVectors(V(0,1,0),direction.normalize());
  return spar;
 }

 for(const mast of d.masts){
  const z=mast.z*d.hullLengthUnits,baseT=.5+mast.z*.45,baseY=deckY(d,baseT)+.16;
  const totalHeight=mast.height*1.18,lowerHeight=totalHeight*.64;
  const group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);
  group.userData.mastControl={mastId:mast.id};
  const radius=d.beamUnits*(mast.id==='main'?.025:mast.id==='fore'?.023:.018);

  const lower=part('mast-lower-'+mast.id,group);
  const topmast=part('mast-topmast-'+mast.id,group);
  taperedSpar(lower,'tapered-lower-mast',V(0,0,0),V(0,lowerHeight,0),radius,radius*.48,materials.trim,16);
  taperedSpar(topmast,'tapered-topmast',V(0,lowerHeight-.07,0),V(0,totalHeight,0),radius*.50,radius*.23,materials.trim,14);

  // A visible mast partner at deck level prevents the mast from reading as a pole simply planted on deck.
  const partners=part('mast-partners-'+mast.id,group);
  const partner=ctx.box(partners,d.beamUnits*.14,.20,d.beamUnits*.12,materials.trim,'mast-partner-block');
  partner.position.set(0,-.08,0);
  beam(partners,V(-d.beamUnits*.11,-.08,0),V(d.beamUnits*.11,-.08,0),.065,materials.brass,'partner-cross-pin');

  const cap=part('mast-cap-'+mast.id,group);
  const capRing=ctx.mesh(cap,new THREE.CylinderGeometry(radius*.74,radius*1.25,.18,14),materials.trim,'mast-cap-collar');
  capRing.position.y=lowerHeight-.09;
  const truck=part('mast-truck-'+mast.id,group);
  const truckMesh=ctx.mesh(truck,new THREE.CylinderGeometry(radius*.42,radius*.62,.28,12),materials.trim,'rounded-masthead-truck');
  truckMesh.position.y=totalHeight+.02;

  // Compact polygonal fighting top with a complete handrail and radial knees.
  const topY=lowerHeight*.90,fightingTop=part('mast-platform-'+mast.id,group);
  const topRadius=d.beamUnits*(mast.id==='main'?.15:.135);
  const platform=ctx.mesh(fightingTop,new THREE.CylinderGeometry(topRadius*.92,topRadius,.15,12,1),materials.deck,'twelve-sided-fighting-top');
  platform.scale.z=.78;platform.position.y=topY;
  const rail=[],railRadius=topRadius*.98;
  for(let i=0;i<=24;i++){
   const a=i/24*Math.PI*2,x=Math.cos(a)*railRadius,zz=Math.sin(a)*railRadius*.78;
   rail.push(V(x,topY+.43,zz));
   if(i%3===0){
    beam(fightingTop,V(x,topY+.08,zz),V(x,topY+.43,zz),.026,materials.trim,'fighting-top-baluster');
    beam(fightingTop,V(0,topY-.06,0),V(x*.88,topY+.02,zz*.88),.04,materials.trim,'fighting-top-knee');
   }
  }
  tube(fightingTop,rail,.035,materials.trim,'fighting-top-handrail',38);

  const standing=part('standing-rigging-'+mast.id);
  const shrouds=part('shrouds-'+mast.id,standing);
  const ratlines=part('ratlines-'+mast.id,standing);
  const stays=part('mast-stays-'+mast.id,standing);
  const running=part('running-rigging-'+mast.id,standing);
  const braces=part('running-braces-'+mast.id,running);
  const pairs=d.structure.shroudPairs??4,spread=Math.max(1.3,d.beamUnits*.21);
  for(const side of [-1,1]){
   const anchors=[];
   for(let pair=0;pair<pairs;pair++){
    const f=pairs===1?0:pair/(pairs-1)-.5;
    const anchorT=Math.max(.08,Math.min(.94,baseT+f*.07));
    const anchorZ=(anchorT-.5)*d.hullLengthUnits-z;
    const anchorX=side*halfBreadth(d,anchorT)*.91;
    const anchorY=deckY(d,anchorT)+.18-baseY;
    const points=[
     V(side*radius*.75,totalHeight*.98,0),
     V(side*(radius+spread*.14),lowerHeight*.68,f*spread*.10),
     V(anchorX,anchorY,anchorZ)
    ];
    tube(shrouds,points,.020,materials.rope,'standing-shroud-'+side+'-'+pair,30);
    anchors.push({x:anchorX,y:anchorY,z:anchorZ});
   }
   if(anchors.length>=2){
    for(let r=1;r<=11;r++){
     const h=lowerHeight*r/12,u=h/lowerHeight,a=anchors[0],b=anchors[anchors.length-1];
     const xa=a.x+(side*radius*.75-a.x)*u,xb=b.x+(side*radius*.75-b.x)*u;
     const za=a.z*(1-u),zb=b.z*(1-u);
     tube(ratlines,[V(xa,h,za),V(xb,h,zb)],.010,materials.rope,'ratline-'+side+'-'+r,14);
    }
   }
  }
  const foreT=.045,foreTarget=V(0,deckY(d,foreT)+.34-baseY,-d.hullLengthUnits*.5-d.beamUnits*.45-z);
  tube(stays,[V(0,totalHeight,0),V(0,lowerHeight*.80,-d.hullLengthUnits*.055),foreTarget],.022,materials.rope,'mast-forestay',46);
  const aftT=.955,aftTarget=V(0,deckY(d,aftT)+.24-baseY,(aftT-.5)*d.hullLengthUnits-z);
  tube(stays,[V(0,totalHeight,0),V(0,lowerHeight*.74,d.hullLengthUnits*.10),aftTarget],.020,materials.rope,'mast-backstay',38);

  if(mast.rig==='square'){
   const main=mast.id==='main';
   const levels=[
    {id:'course',low:.07,high:.35,span:main?1.62:1.50,full:.38},
    {id:'topsail',low:.43,high:.64,span:main?1.37:1.27,full:.30},
    {id:'topgallant',low:.72,high:.88,span:main?1.10:1.02,full:.22}
   ];
   for(const level of levels){
    const yard=part('yard-'+mast.id+'-'+level.id,group);
    const half=d.beamUnits*level.span*d.structure.yardSpread*.5;
    const y0=totalHeight*level.low,y1=totalHeight*level.high;
    taperedSpar(yard,'tapered-yard-'+level.id,V(-half,y1,0),V(half,y1,0),
      Math.max(.07,radius*.62),Math.max(.045,radius*.32),materials.trim,12);
    buildCanvasSail(ctx,'sail-'+mast.id+'-'+level.id,mast.id,[
     V(-half*.93,y0,0),V(-half,y1,0),V(half,y1,0),V(half*.93,y0,0)
    ],level.full,group,'z');
    const sheets=part('sheets-'+mast.id+'-'+level.id,group);
    for(const side of [-1,1]){
     tube(sheets,[V(side*half*.93,y0,0),V(side*half*.96,y0-.28,.08),V(side*half*.96,y0-.48,.14)],.014,materials.rope,'course-sheet',18);
     tube(braces,[V(side*half,y1,0),V(side*half*.30,y1+.24,-d.beamUnits*.12)],.014,materials.rope,'yard-brace',18);
    }
    // Reef points are short ties through the cloth, not ropes circling its edges.
    const reefs=part('reef-points-'+mast.id+'-'+level.id,group);
    for(const reefRow of [1,2]){
     const y=y0+(y1-y0)*reefRow/3;
     for(let tie=0;tie<9;tie++){
      const x=-half*.70+half*1.40*tie/8;
      beam(reefs,V(x,y-.06,-.05),V(x,y+.06,-.05),.008,materials.rope,'reef-tie');
     }
    }
   }
  }else if(mast.rig==='lateen'){
   const span=d.hullLengthUnits*.235,lateen=part('lateen-yard-'+mast.id);
   const peak=V(0,totalHeight*.80,-span*.40),heel=V(0,totalHeight*.30,span*.55);
   taperedSpar(lateen,'tapered-lateen-yard',peak,heel,Math.max(.085,radius*.80),Math.max(.05,radius*.42),materials.trim,14);
   const footA=V(0,totalHeight*.25,span*.05),footB=V(0,totalHeight*.24,span*.55);
   buildCanvasSail(ctx,'sail-'+mast.id+'-lateen',mast.id,[footA,peak.clone(),heel.clone(),footB],.24,group,'x');
   const lateenRigging=part('lateen-rigging-'+mast.id,group);
   tube(lateenRigging,[peak, V(0,totalHeight*.54,span*.02), footA],.014,materials.rope,'lateen-luff',28);
   tube(lateenRigging,[heel,footB],.014,materials.rope,'lateen-foot-line',22);
   tube(braces,[V(0,totalHeight*.69,0),V(0,totalHeight*.58,span*.27)],.014,materials.rope,'lateen-sheet',22);
  }

  const pennant=part('mast-pennant-'+mast.id,group);
  const pennantPoints=[
   V(0,totalHeight+.10,0),V(0,totalHeight+.10,-d.beamUnits*.56),
   V(0,totalHeight-.34,-d.beamUnits*.54)
  ];
  const pennantGeo=new THREE.BufferGeometry();
  pennantGeo.setAttribute('position',new THREE.Float32BufferAttribute(pennantPoints.flatMap(p=>[p.x,p.y,p.z]),3));
  pennantGeo.setIndex([0,1,2]);pennantGeo.computeVertexNormals();
  const pennantMesh=ctx.mesh(pennant,pennantGeo,materials.flag,'mast-top-pennant');
  pennantMesh.material.side=THREE.DoubleSide;
 }

 // One compact fore-staysail replaces the pair of oversized triangular sails.
 const fore=d.masts.find(m=>m.id==='fore');
 if(fore){
  const foreZ=fore.z*d.hullLengthUnits,baseT=.5+fore.z*.45,baseY=deckY(d,baseT)+.16;
  const head=V(0,baseY+fore.height*1.18*.72,foreZ-d.hullLengthUnits*.02);
  const tack=V(0,deckY(d,.04)+.70,-d.hullLengthUnits*.5-d.beamUnits*.31);
  const clew=V(0,deckY(d,.19)+.82,foreZ-d.hullLengthUnits*.06);
  const lower=V(0,deckY(d,.16)+.32,foreZ-d.hullLengthUnits*.09);
  buildCanvasSail(ctx,'sail-fore-staysail','fore',[tack,head,clew,lower],.18,ctx.root,'x');
 }
}

function buildAnchors(d,ctx){
 const {part,beam,tube,materials,V}=ctx,anchors=part('anchors');
 for(const side of [-1,1]){
  const suffix=side<0?'port':'starboard',anchor=part('anchor-'+suffix,anchors);
  const x=side*d.beamUnits*.46,y=deckY(d,.1)-.35,z=-d.hullLengthUnits*.38,span=d.beamUnits*.105*1.22;
  beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),Math.max(.04,d.beamUnits*.014*1.22),materials.iron,'galleon-anchor-shank');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),Math.max(.04,d.beamUnits*.016*1.22),materials.iron,'galleon-anchor-stock');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-port');
  beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-starboard');
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x,y-.28,z-.24),V(x*.92,y-.52,z-.44)],.022,materials.iron,'galleon-anchor-rode',18);
 }
}

function ensureSternTierComponents(d,ctx){
 const {part,box,materials}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*1.08;
  const height=Math.max(.18,tier.h*1.08);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const shell=box(component,width,height,depth,materials.hull,'galleon-independent-stern-tier');
  shell.position.set(0,deckY(d,.94)+height*(.44+index*.08),d.hullLengthUnits*(.405+index*.014));
  const cap=box(component,width*1.04,.09,depth*1.04,materials.trim,'stern-tier-cap');
  cap.position.set(0,shell.position.y+height*.52,shell.position.z);
 });
}


function generateGalleonGeometry(vessel,componentTransforms={},savedState={}){
 const ctx=createShipContext(vessel,{"hull":5847335,"plank":9463106,"deck":11635808,"sail":15327178});
 buildHull(ctx.design,ctx);
 buildFramesAndPlanking(ctx.design,ctx);
 buildStern(ctx.design,ctx);
 ensureSternTierComponents(ctx.design,ctx);
 buildBow(ctx.design,ctx);
 buildRudderAndHelm(ctx.design,ctx);
 buildRailingsAndEquipment(ctx.design,ctx);
 buildAnchors(ctx.design,ctx);
 buildRig(ctx.design,ctx);
 return finishShipModel(ctx,componentTransforms,savedState);
}

export function createGalleonModel(componentTransforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(GalleonDefinition);
  return generateGalleonGeometry(vessel, componentTransforms, savedState);
}
export function generateGalleon(componentTransforms = {}, savedState = {}) {
  return createGalleonModel(componentTransforms, savedState);
}
export const Galleon = Object.freeze({
  id: GalleonDefinition.id,
  definition: GalleonDefinition,
  design: GalleonDefinition.design,
  structure: GalleonDefinition.structure,
  editorModulePath: GalleonDefinition.editorModulePath,
  createModel: createGalleonModel,
  generate: generateGalleon,
});
export const id = Galleon.id;
export const design = Galleon.design;
export const structure = Galleon.structure;
export const createModel = Galleon.createModel;
export const generate = Galleon.generate;
export default Galleon;
