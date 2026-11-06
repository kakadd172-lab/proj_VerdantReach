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
    hullLength: 30.5, beam: 10.0, draft: 4.1, freeboard: 2.25,
    rig: 'Three-masted early Iberian galleon: square courses, topsails and topgallants on fore and main; lateen mizzen; bowsprit and stay sails.',
    hullProfile: 'Long ocean-going hull with a bluff lower bow, fine run aft, pronounced tumblehome, lowered forecastle, beakhead and a three-stage projecting sterncastle.',
    reference: 'An early Iberian galleon reconstruction constrained by Santa Maria del Pilar (c. 1535), 30.5 m × 10 m, and the three-masted San Salvador replica sail plan. The game-inspired silhouette is an artistic interpretation, not a traced original lines plan.',
    sources: [{ label: 'Deutsches Historisches Museum — Galleon', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/' }, { label: 'The Mariners’ Museum — Galleon development and rig', url: 'https://exploration.marinersmuseum.org/watercraft/galleon/' }, { label: 'Maritime Museum of San Diego — San Salvador dimensions and sail plan', url: 'https://sdmaritime.org/visit/the-ships/san-salvador/' }],
    hull: { fullness: 0.8, entry: 0.66, stern: 'transom', sternWidth: 0.42, tumblehome: 0.15, sheer: 0.18, bowRise: 0.34, sternRise: 0.48, keelDepth: 0.16, deckCamber: 0.19 },
    sternwork: 'galleon-castle',
    sternTiers: [{"w":0.72,"d":0.19,"h":2.2},{"w":0.58,"d":0.15,"h":1.75},{"w":0.43,"d":0.12,"h":1.45}], bowwork: 'beakhead',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 6.2, handling: 0.58,
    masts: [
      { id: 'fore', z: -0.28, height: 22.0, rig: 'square', squares: 3 },
      { id: 'main', z: -0.025, height: 25.1, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 17.0, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 2, oars: false,
  },
  structure: { frameCount: 44, beamStation: .51, forebody: .86, aftbody: .91, foreTip: .003, aftTip: .14, bottomFlat: .39, bilge: .27, flare: .14, tumble: .15, sheer: 1.2, lowerMastRatio: .63, shroudPairs: 4, ratlines: 12, yardSpread: .96 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){
 const q=Math.max(0,Math.min(1,t)),edge=Math.abs(2*q-1);
 const sheer=Math.pow(edge,1.08),bow=Math.pow(Math.max(0,1-2*q),1.08),stern=Math.pow(Math.max(0,2*q-1),1.02);
 return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*sheer*d.structure.sheer
  +d.hull.bowRise*d.deckHeightUnits*bow+d.hull.sternRise*d.deckHeightUnits*stern;
}
function keelY(d,t){
 const q=Math.max(0,Math.min(1,t)),mid=Math.pow(Math.max(0,Math.sin(Math.PI*q)),.64);
 const depth=.82+(.18)*mid+d.hull.keelDepth*.09*mid*(1-mid);
 return -d.draftUnits*Math.min(1,depth);
}
function deckBreadthRatio(d){
 return Math.max(.56,Math.min(.99,.89-d.hull.tumblehome*.34-d.structure.tumble*.22-.012+d.structure.flare*.22));
}
function halfBreadth(d,t){
 const q=Math.max(0,Math.min(1,t));
 const raw=Math.pow(Math.max(0,Math.sin(Math.PI*q)),.61);
 const transomBlend=Math.pow(Math.max(0,Math.min(1,(q-.79)/.21)),2)*(3-2*Math.max(0,Math.min(1,(q-.79)/.21)));
 const shoulder=raw*(1-transomBlend)+.42*transomBlend;
 const belly=.88+.18*Math.sin(Math.PI*q*.9);
 const entry=.77+.23*Math.min(1,q*3.1);
 const counter=.94+.06*Math.min(1,(1-q)*4);
 return d.beamUnits*.5*shoulder*belly*entry*counter;
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
 const {THREE,mesh}=ctx,stations=72,ring=8,positions=[],indices=[];
 const profile=[[-.5,-.22],[-.36,-.5],[.36,-.5],[.5,-.22],[.5,.22],[.36,.5],[-.36,.5],[-.5,.22]];
 for(let i=0;i<=stations;i++){
  const q=i/stations,t=.012+.976*q,taper=.18+.82*Math.pow(Math.max(0,Math.sin(Math.PI*q)),.38);
  const width=d.beamUnits*widthFactor*taper*(.94+.06*Math.sin(Math.PI*q)),thick=height*taper;
  const cy=keelY(d,t)+offsetY,z=(t-.5)*d.hullLengthUnits;
  for(const [x,y] of profile)positions.push(x*width,cy+y*thick,z);
 }
 for(let i=0;i<stations;i++)for(let j=0;j<ring;j++){
  const a=i*ring+j,b=i*ring+(j+1)%ring;
  indices.push(a,a+ring,b,b,a+ring,(i+1)*ring+(j+1)%ring);
 }
 for(const i of [0,stations]){
  const q=i/stations,t=.012+.976*q,c=positions.length/3;
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
 buildKeelMember(d,ctx,keel,'galleon-continuous-keel',.072,.42,-.18,materials.trim);
 const shoe=part('keel-shoe',keel);
 buildKeelMember(d,ctx,shoe,'galleon-false-keel-shoe',.043,.2,-.49,materials.lower);
 const keelson=part('keelson');
 buildKeelMember(d,ctx,keelson,'galleon-internal-keelson',.062,.25,.22,materials.plank);
 const stem=part('stem'),fore=[],aft=[];
 for(let i=0;i<=18;i++){
  const q=i/18,t=.085*(1-q),y=keelY(d,.085)*(1-q)+(deckY(d,.005)+.42)*q;
  fore.push(V(0,y,(t-.5)*d.hullLengthUnits-q*1.35));
  const ta=.895+.098*q,ya=keelY(d,.895)*(1-q)+(deckY(d,.995)+.2)*q;
  aft.push(V(0,ya,(ta-.5)*d.hullLengthUnits+q*.26));
 }
 tube(stem,fore,d.beamUnits*.019,materials.trim,'curved-forward-stem-post',36);
 tube(stem,aft,d.beamUnits*.02,materials.trim,'raked-aft-stern-post',36);
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
 const tiers=d.sternTiers||[],baseDeck=deckY(d,.9)+.16;
 let bottomY=baseDeck,baseZ=d.hullLengthUnits*.325;
 function addQuad(parent,name,points,material){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
  return mesh(parent,geometry,material,name);
 }
 function addCurvedTransom(parent,name,width,topWidth,height,lowY,aftZ,bulge){
  const across=28,rows=6,positions=[],indices=[];
  for(let row=0;row<=rows;row++){
   const v=row/rows;
   for(let col=0;col<=across;col++){
    const u=col/across*2-1,x=u*(width*.5*(1-(1-topWidth/width)*v));
    const y=lowY+height*v,z=aftZ+bulge*(1-u*u)-.08*v;
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
 tiers.forEach((tier,index)=>{
  const tierGroup=part('stern-tier-'+(index+1),stern);
  const width=d.beamUnits*tier.w,topWidth=width*(.91-index*.012),depth=d.hullLengthUnits*tier.d,height=tier.h*(4/3);
  const foreZ=baseZ-depth*.5,aftZ=baseZ+depth*.5,topY=bottomY+height,bulge=.24-index*.035;
  const floor=box(tierGroup,width+.28,.16,depth+.3,materials.deck,'sterncastle-tier-floor');
  floor.position.set(0,bottomY,baseZ);
  addCurvedTransom(tierGroup,'curved-transom-wall-'+(index+1),width,topWidth,height,bottomY,aftZ,bulge);
  const sideGroup=part('stern-tier-side-walls-'+(index+1),tierGroup);
  for(const side of [-1,1]){
   addQuad(sideGroup,'stern-quarter-wall-'+side,[
    [side*width*.5,bottomY,foreZ],
    [side*width*.5,bottomY,aftZ],
    [side*topWidth*.5,topY,aftZ-.1],
    [side*topWidth*.5,topY,foreZ+.16]
   ],materials.hull);
   addQuad(sideGroup,'stern-forward-wall-'+side,[
    [side*width*.5,bottomY,foreZ],
    [0,bottomY,foreZ-.08],
    [0,topY,foreZ+.08],
    [side*topWidth*.5,topY,foreZ+.16]
   ],materials.hull);
  }
  const cap=box(tierGroup,topWidth+.38,.16,depth+.38,materials.deck,'sterncastle-upper-deck');
  cap.position.set(0,topY+.08,baseZ+.04);
  const transomTrim=part('stern-transom-trim-'+(index+1),tierGroup);
  for(const y of [bottomY+.12,topY-.07]){
   const points=[];
   for(let i=0;i<=22;i++){
    const u=-1+2*i/22,x=u*width*.5*(y<bottomY+height*.5?1:.94);
    points.push(V(x,y,aftZ+bulge*(1-u*u)+.025));
   }
   tube(transomTrim,points,.045,materials.brass,'gilded-transom-moulding',24);
  }
  const tierWindows=part('stern-windows-tier-'+(index+1),windows);
  const count=Math.max(3,5-index),windowW=width/(count+1)*.48,windowH=height*.38,windowY=bottomY+height*.55;
  for(let n=0;n<count;n++){
   const x=-width*.35+width*.7*n/Math.max(1,count-1);
   const z=aftZ+bulge*(1-Math.pow(x/(width*.5),2))+.065;
   const pane=box(tierWindows,windowW,windowH,.065,materials.glass,'arched-stern-window-pane');
   pane.position.set(x,windowY,z);
   const frame=part('stern-window-frame-'+(index+1)+'-'+(n+1),tierWindows);
   const left=x-windowW*.55,right=x+windowW*.55,low=windowY-windowH*.5,high=windowY+windowH*.42;
   beam(frame,V(left,low,z+.055),V(right,low,z+.055),.032,materials.brass,'window-sill');
   beam(frame,V(left,low,z+.055),V(left,high,z+.055),.032,materials.brass,'window-left-jamb');
   beam(frame,V(right,low,z+.055),V(right,high,z+.055),.032,materials.brass,'window-right-jamb');
   const arch=[];
   for(let k=0;k<=10;k++){
    const a=Math.PI-k*Math.PI/10;
    arch.push(V(x+Math.cos(a)*windowW*.55,high+Math.sin(a)*windowW*.23,z+.055));
   }
   tube(frame,arch,.035,materials.brass,'arched-window-head',14);
   beam(frame,V(x,low+.06,z+.065),V(x,high-.02,z+.065),.018,materials.trim,'window-mullion');
   beam(frame,V(left+.03,windowY,z+.065),V(right-.03,windowY,z+.065),.018,materials.trim,'window-crossbar');
  }
  const galleryTier=part('stern-gallery-tier-'+(index+1),gallery);
  const galleryDeck=box(galleryTier,width*.97,.13,depth*.19,materials.deck,'stern-balcony-walkway');
  galleryDeck.position.set(0,topY+.22,aftZ+depth*.115);
  const railY=topY+.82,railPoints=[];
  for(let i=0;i<=16;i++){
   const u=-1+2*i/16,x=u*width*.47;
   const z=aftZ+depth*.2+bulge*(1-u*u);
   railPoints.push(V(x,railY,z));
   if(i%2===0)beam(galleryTier,V(x,topY+.25,z),V(x,railY,z),.034,materials.brass,'gallery-baluster');
  }
  tube(galleryTier,railPoints,.052,materials.trim,'curved-stern-gallery-handrail',36);
  for(const side of [-1,1]){
   const quarter=part('quarter-gallery-'+(index+1)+'-'+side,galleryTier);
   const wing=box(quarter,.72,.12,depth*.48,materials.deck,'projecting-quarter-gallery');
   wing.position.set(side*(width*.5+.28),topY+.22,baseZ+depth*.08);
   for(let j=0;j<=4;j++){
    const z=baseZ-depth*.12+j*depth*.12,x=side*(width*.5+.62);
    beam(quarter,V(x,topY+.28,z),V(x,topY+.78,z),.032,materials.brass,'quarter-gallery-baluster');
   }
   tube(quarter,[
    V(side*(width*.5+.62),topY+.78,baseZ-depth*.12),
    V(side*(width*.5+.62),topY+.78,baseZ+depth*.36)
   ],.045,materials.trim,'quarter-gallery-rail',18);
   beam(quarter,V(side*width*.48,topY-.08,baseZ),V(side*(width*.5+.28),topY+.12,baseZ+depth*.18),.075,materials.trim,'gallery-support-knee');
  }
  if(index===0){
   const ornament=part('stern-escutcheon',stern);
   const medallion=mesh(ornament,new THREE.CylinderGeometry(.38,.38,.075,24),materials.brass,'gilded-stern-medallion');
   medallion.rotation.x=Math.PI/2;medallion.position.set(0,bottomY+height*.18,aftZ+bulge+.09);
   const ring=mesh(ornament,new THREE.TorusGeometry(.46,.045,8,28),materials.trim,'stern-medallion-ring');
   ring.rotation.x=Math.PI/2;ring.position.set(0,bottomY+height*.18,aftZ+bulge+.14);
   for(let ray=0;ray<8;ray++){
    const a=ray*Math.PI/4;
    beam(ornament,V(Math.cos(a)*.18,bottomY+height*.18+Math.sin(a)*.18,aftZ+bulge+.18),
      V(Math.cos(a)*.31,bottomY+height*.18+Math.sin(a)*.31,aftZ+bulge+.18),.018,materials.trim,'stern-ornament-ray');
   }
  }
  if(index===tiers.length-1){
   const lanterns=part('stern-lanterns',stern);
   for(const side of [-1,1]){
    const x=side*topWidth*.43,z=aftZ+bulge*.55+.24,y=topY+.42;
    const glass=box(lanterns,.32,.48,.32,materials.glass,'stern-lantern-glass');
    glass.position.set(x,y,z);
    for(const yy of [y-.26,y+.26]){const cap=box(lanterns,.4,.055,.4,materials.brass,'stern-lantern-cap');cap.position.set(x,yy,z);}
    for(const xx of [-1,1]){
     const post=box(lanterns,.035,.5,.035,materials.trim,'stern-lantern-frame');
     post.position.set(x+xx*.17,y,z);
    }
   }
  }
  bottomY=topY+.2;
  baseZ+=depth*.075;
 });
}

function buildBow(d,ctx){
 const {part,beam,tube,box,materials,V,THREE}=ctx;
 const bow=part('bowworks'),bowsprit=part('bowsprit');
 const tip=-d.hullLengthUnits*.5,base=deckY(d,.045)+d.deckHeightUnits*.16;
 const platformLength=d.hullLengthUnits*.17,forecastle=part('raised-forecastle',bow);
 const stations=18,across=18,pos=[],faces=[];
 for(let i=0;i<=stations;i++){
  const q=i/stations,t=.025+q*.17,half=halfBreadth(d,t)*deckBreadthRatio(d)*.97;
  for(let j=0;j<=across;j++){
   const u=j/across*2-1;
   pos.push(u*half,deckY(d,t)+.72+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);
  }
 }
 for(let i=0;i<stations;i++)for(let j=0;j<across;j++){
  const a=i*(across+1)+j;
  faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
 }
 const forecastleGeo=new THREE.BufferGeometry();
 forecastleGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 forecastleGeo.setIndex(faces);forecastleGeo.computeVertexNormals();
 ctx.mesh(forecastle,forecastleGeo,materials.deck,'raised-forecastle-deck');
 const bulwarks=part('forecastle-bulwarks',bow);
 for(const side of [-1,1]){
  const top=[],lower=[];
  for(let i=0;i<=20;i++){
   const t=.035+.145*i/20,x=side*halfBreadth(d,t)*deckBreadthRatio(d)*.97;
   const z=(t-.5)*d.hullLengthUnits,y=deckY(d,t)+.72;
   lower.push(V(x,y,z));top.push(V(x,y+.58,z));
   if(i%2===0)beam(bulwarks,lower[lower.length-1],top[top.length-1],.045,materials.trim,'forecastle-bulwark-stanchion');
  }
  tube(bulwarks,top,.055,materials.trim,'forecastle-top-rail',32);
  tube(bulwarks,lower,.04,materials.trim,'forecastle-sheer-rail',32);
 }
 const beakhead=part('galleon-beakhead',bow),length=d.beamUnits*.9;
 beam(beakhead,V(0,base,tip+d.hullLengthUnits*.055),V(0,base+d.deckHeightUnits*.35,tip-length),d.beamUnits*.035,materials.trim,'beakhead-stem');
 const grating=box(beakhead,d.beamUnits*.39,.13,length*.82,materials.deck,'beakhead-grating-platform');
 grating.position.set(0,base+d.deckHeightUnits*.19,tip-length*.47);
 for(const side of [-1,1]){
  beam(beakhead,V(0,base+d.deckHeightUnits*.19,tip-length*.9),V(side*d.beamUnits*.22,base+d.deckHeightUnits*.19,tip),.055,materials.trim,'beakhead-cheek');
  beam(beakhead,V(side*d.beamUnits*.16,base+d.deckHeightUnits*.19,tip-length*.82),V(side*d.beamUnits*.16,base+d.deckHeightUnits*.38,tip-length*.08),.035,materials.brass,'beakhead-headrail');
 }
 const bowspritBase=V(0,base+d.deckHeightUnits*.22,tip+d.beamUnits*.13);
 const bowspritTip=V(0,base+d.deckHeightUnits*.68,tip-d.beamUnits*1.05);
 beam(bowsprit,bowspritBase,bowspritTip,Math.max(.11,d.beamUnits*.027),materials.trim,'main-bowsprit',12);
 const jibboomBase=bowspritBase.clone().lerp(bowspritTip,.66),jibboomTip=bowspritTip.clone().add(V(0,.12,-d.beamUnits*.72));
 beam(bowsprit,jibboomBase,jibboomTip,Math.max(.07,d.beamUnits*.016),materials.trim,'jib-boom-extension',10);
 const cap=box(bowsprit,d.beamUnits*.12,.18,.3,materials.brass,'bowsprit-cap');
 cap.position.copy(bowspritBase);
 const spritsail=part('spritsail-yard',bowsprit),yardY=bowspritBase.y+.32,yardZ=tip-d.beamUnits*.28;
 beam(spritsail,V(-d.beamUnits*.48,yardY,yardZ),V(d.beamUnits*.48,yardY,yardZ),.055,materials.trim,'spritsail-yard',12);
 const stays=part('bowsprit-standing-rigging',bowsprit);
 tube(stays,[bowspritTip,V(0,deckY(d,.25)+.3,-d.hullLengthUnits*.23),V(0,deckY(d,.48)+.3,-d.hullLengthUnits*.025)],.022,materials.rope,'bowsprit-forestay',34);
 tube(stays,[jibboomTip,V(0,deckY(d,.18)+.35,-d.hullLengthUnits*.31),V(0,deckY(d,.42)+.4,-d.hullLengthUnits*.08)],.016,materials.rope,'jib-boom-stay',30);
 const bowspritCollar=part('bowsprit-gammoning',bow);
 for(let i=0;i<5;i++){
  const f=i/4,p=bowspritBase.clone().lerp(bowspritTip,.08+f*.08);
  tube(bowspritCollar,[
   V(-.16,p.y-.12,p.z-.09),V(-.08,p.y+.12,p.z+.09),
   V(.08,p.y+.12,p.z-.09),V(.16,p.y-.12,p.z+.09)
  ],.014,materials.rope,'bowsprit-gammoning-turn',16);
 }
 const figurehead=part('galleon-figurehead',bow);
 const pedestal=box(figurehead,.42,.34,.62,materials.brass,'figurehead-pedestal');
 pedestal.position.set(0,base+.08,tip-.12);
 const finial=ctx.mesh(figurehead,new THREE.SphereGeometry(.19,12,10),materials.brass,'figurehead-finial');
 finial.position.set(0,base+.52,tip-.23);
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
 for(let level=0;level<2;level++)for(let side of [-1,1])for(let i=0;i<12;i++){
  const t=.14+i/11*.72,x=side*halfBreadth(d,t)*.8,z=(t-.5)*d.hullLengthUnits;
  const y=deckY(d,t)-.36-level*d.deckHeightUnits*.24;
  const portHole=box(fittings,.34,.28,.08,materials.lower,'gunport-'+level+'-'+side+'-'+i);
  portHole.position.set(x,y,z);
  const cannon=part('deck-gun-'+level+'-'+side+'-'+i,fittings);
  beam(cannon,V(x,y+.02,z),V(x+side*.48,y+.02,z),.068,materials.iron,'cannon-barrel',12);
  for(let wheel=0;wheel<2;wheel++){
   const w=ctx.mesh(cannon,new ctx.THREE.CylinderGeometry(.1,.1,.055,10),materials.trim,'gun-carriage-wheel');
   w.rotation.z=Math.PI/2;w.position.set(x+side*.15,y-.12,z+(wheel-.5)*.2);
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

function buildCanvasSail(ctx,name,mastId,corners,fullness=.11,parent=ctx.root,axis='z'){
 const {part,mesh,tube,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const rows=26,columns=32,positions=[],indices=[];
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let column=0;column<=columns;column++){
   const u=column/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const point=lower.lerp(upper,v);
   const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),.82);
   const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),.88);
   const bias=1+.12*(2*u-1);
   const belly=fullness*chord*vertical*bias;
   const twist=.026*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
   if(axis==='x'){point.x+=belly;point.z+=twist;}
   else{point.z+=belly;point.x+=twist;}
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
 mesh(cloth,geometry,materials.sail,'galleon-full-curved-canvas');
 const seamGroup=part('sail-seams-'+name,control);
 for(let uIndex=1;uIndex<=5;uIndex++){
  const u=uIndex/6,line=[];
  for(let k=0;k<=20;k++){
   const v=k/20,low=points[0].clone().lerp(points[3],u),high=points[1].clone().lerp(points[2],u);
   const p=low.lerp(high,v);
   if(axis==='x')p.x+=.012;else p.z+=.012;
   line.push(p);
  }
  tube(seamGroup,line,.009,materials.sailShade,'vertical-canvas-panel-seam',22);
 }
 for(const v of [.28,.56,.82]){
  const line=[];
  for(let k=0;k<=28;k++){
   const u=k/28,low=points[0].clone().lerp(points[3],u),high=points[1].clone().lerp(points[2],u);
   const p=low.lerp(high,v);
   if(axis==='x')p.x+=.016;else p.z+=.016;
   line.push(p);
  }
  tube(seamGroup,line,.008,materials.sailShade,'horizontal-canvas-panel-seam',30);
 }
 const boltRope=part('sail-bolt-rope-'+name,control),edge=points.map(p=>p.clone());
 edge.push(points[0].clone());
 tube(boltRope,edge,.025,materials.rope,'reinforced-sail-perimeter',100);
 return control;
}

function buildRig(d,ctx){
 const {part,beam,tube,materials,V,THREE}=ctx;
 const head=part('head-sails');
 const mastPositions=Object.fromEntries(d.masts.map(m=>[m.id,m.z*d.hullLengthUnits]));
 for(const mast of d.masts){
  const z=mastPositions[mast.id],baseT=.5+mast.z*.45,baseY=deckY(d,baseT)+.16;
  const totalHeight=mast.height*1.22,lowerHeight=totalHeight*.64,topmastHeight=totalHeight-lowerHeight;
  const topY=baseY+totalHeight,group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const radius=d.beamUnits*(mast.id==='main'?.021:mast.id==='fore'?.019:.016);
  const step=part('mast-step-'+mast.id);
  beam(step,V(-.46,baseY-.24,z),V(.46,baseY-.24,z),.14,materials.trim,'mast-partner-crossbeam');
  beam(step,V(-.37,baseY-.26,z-.18),V(-.37,baseY-.26,z+.18),.12,materials.trim,'mast-partner-side');
  beam(step,V(.37,baseY-.26,z-.18),V(.37,baseY-.26,z+.18),.12,materials.trim,'mast-partner-side');
  const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group);
  beam(lower,V(0,0,0),V(0,lowerHeight,0),radius,materials.trim,'tapered-lower-mast');
  beam(topmast,V(0,lowerHeight-.1,0),V(0,totalHeight,0),radius*.62,materials.trim,'topmast');
  const cap=part('mast-cap-'+mast.id,group);
  const capDisk=ctx.mesh(cap,new THREE.CylinderGeometry(radius*1.45,radius*1.55,.22,12),materials.trim,'mast-cap-collar');
  capDisk.position.y=lowerHeight-.12;
  const truck=part('mast-truck-'+mast.id,group);
  const truckBox=ctx.box(truck,radius*1.65,.34,radius*1.65,materials.trim,'masthead-truck');
  truckBox.position.y=totalHeight+.02;
  const platformY=lowerHeight*.91;
  const top=part('fighting-top-'+mast.id,group);
  const topDeck=ctx.box(top,d.beamUnits*.33,.13,d.beamUnits*.25,materials.deck,'fighting-top-platform');
  topDeck.position.y=platformY;
  for(const side of [-1,1]){
   beam(top,V(side*d.beamUnits*.165,platformY,0),V(side*d.beamUnits*.165,platformY+.54,0),.035,materials.trim,'fighting-top-stanchion');
   beam(top,V(side*d.beamUnits*.165,platformY+.54,-d.beamUnits*.12),V(side*d.beamUnits*.165,platformY+.54,d.beamUnits*.12),.025,materials.trim,'fighting-top-rail');
  }
  const standing=part('standing-rigging-'+mast.id),shrouds=part('shrouds-'+mast.id,standing);
  const ratlines=part('ratlines-'+mast.id,standing),stays=part('mast-stays-'+mast.id,standing);
  const running=part('running-rigging-'+mast.id),braces=part('running-braces-'+mast.id,running);
  const railX=halfBreadth(d,baseT)*.88,pairs=d.structure.shroudPairs??4;
  const spread=Math.max(1.2,d.beamUnits*.22);
  for(const side of [-1,1]){
   const shroudAnchors=[];
   for(let pair=0;pair<pairs;pair++){
    const f=pairs===1?0:pair/(pairs-1)-.5;
    const anchorT=Math.max(.08,Math.min(.94,baseT+f*.08));
    const anchorZ=(anchorT-.5)*d.hullLengthUnits;
    const anchorX=side*halfBreadth(d,anchorT)*.91;
    const anchorY=deckY(d,anchorT)+.25;
    const points=[
     V(side*radius*.8,baseY+totalHeight*.99,z),
     V(side*(radius+spread*.18),baseY+lowerHeight*.7,z+f*spread*.18),
     V(anchorX,anchorY,anchorZ)
    ];
    tube(shrouds,points,.021,materials.rope,'standing-shroud-'+side+'-'+pair,28);
    shroudAnchors.push({x:anchorX,y:anchorY,z:anchorZ});
   }
   for(let r=1;r<=12;r++){
    const h=lowerHeight*r/13;
    const a=shroudAnchors[0],b=shroudAnchors[shroudAnchors.length-1];
    const u=h/lowerHeight;
    const za=a.z+(z-a.z)*u,zb=b.z+(z-b.z)*u;
    const xa=a.x+(side*radius*.8-a.x)*u,xb=b.x+(side*radius*.8-b.x)*u;
    tube(ratlines,[V(xa,h+baseY,za),V(xb,h+baseY,zb)],.012,materials.rope,'shroud-ratline-'+side+'-'+r,12);
   }
  }
  const forestayTarget=V(0,deckY(d,.075)+.28,-d.hullLengthUnits*.52-d.beamUnits*.52);
  tube(stays,[V(0,topY,z),V(0,baseY+lowerHeight*.82,z-d.hullLengthUnits*.08),forestayTarget],.025,materials.rope,'heavy-forestay',46);
  const aftTarget=V(0,deckY(d,.94)+.25,(.94-.5)*d.hullLengthUnits);
  tube(stays,[V(0,topY,z),V(0,baseY+lowerHeight*.72,z+d.hullLengthUnits*.1),aftTarget],.022,materials.rope,'aft-backstay',38);
  const mainMast=mast.id==='main',foreMast=mast.id==='fore';
  if(mast.rig==='square'){
   const levels=[
    {id:'course',low:.075,high:.36,span:mainMast?1.7:1.52,full:.17},
    {id:'topsail',low:.43,high:.67,span:mainMast?1.4:1.27,full:.13},
    {id:'topgallant',low:.735,high:.94,span:mainMast?1.12:1.02,full:.095}
   ];
   for(const [index,level] of levels.entries()){
    const yard=part('yard-'+mast.id+'-'+level.id,group);
    const yardSpan=d.beamUnits*level.span*d.structure.yardSpread;
    const y0=totalHeight*level.low,y1=totalHeight*level.high;
    const half=yardSpan*.5;
    beam(yard,V(-half,y1,0),V(half,y1,0),Math.max(.055,radius*.52),materials.trim,'square-yard-'+level.id,12);
    beam(yard,V(-half*.97,y1,0),V(-half*.97,y1+.14,0),.035,materials.trim,'yardarm-lift-cleat');
    beam(yard,V(half*.97,y1,0),V(half*.97,y1+.14,0),.035,materials.trim,'yardarm-lift-cleat');
    buildCanvasSail(ctx,'sail-'+mast.id+'-'+level.id,mast.id,[
     V(-half*.94,y0,0),V(-half,y1,0),V(half,y1,0),V(half*.94,y0,0)
    ],level.full,group);
    const sheets=part('sheets-'+mast.id+'-'+level.id,group);
    for(const side of [-1,1]){
     tube(sheets,[V(side*half*.94,y0,0),V(side*half*.98,y0-.42,.06),V(side*half*.98,y0-.7,.12)],.018,materials.rope,'sail-sheet',18);
     tube(braces,[V(side*half,y1,0),V(side*half*.33,y1+.38,-d.beamUnits*.18)],.017,materials.rope,'yard-lift',18);
    }
    const reef=part('reef-points-'+mast.id+'-'+level.id,group);
    for(let reefRow=1;reefRow<=2;reefRow++){
     const y=y0+(y1-y0)*reefRow/3;
     for(let tie=0;tie<9;tie++){
      const x=-half*.72+half*1.44*tie/8;
      beam(reef,V(x,y-.11,-.03),V(x,y+.11,-.03),.012,materials.rope,'reef-point');
     }
    }
   }
   const topsailLift=part('yard-lifts-'+mast.id,group);
   tube(topsailLift,[V(-d.beamUnits*.52,totalHeight*.35,0),V(-d.beamUnits*.41,totalHeight*.51,0),V(-d.beamUnits*.31,totalHeight*.67,0)],.016,materials.rope,'mast-yard-lift',24);
   tube(topsailLift,[V(d.beamUnits*.52,totalHeight*.35,0),V(d.beamUnits*.41,totalHeight*.51,0),V(d.beamUnits*.31,totalHeight*.67,0)],.016,materials.rope,'mast-yard-lift',24);
  }else if(mast.rig==='lateen'){
   const span=d.hullLengthUnits*.57,lateen=part('lateen-yard-'+mast.id,group);
   const peak=V(0,totalHeight*.97,-span*.43),heel=V(0,totalHeight*.2,span*.77);
   beam(lateen,peak,heel,Math.max(.075,radius*.74),materials.trim,'long-diagonal-lateen-antenna',14);
   const sail=part('lateen-rig-details-'+mast.id,group);
   const footA=V(0,totalHeight*.13,span*.1),footB=V(0,totalHeight*.16,span*.78);
   buildCanvasSail(ctx,'sail-'+mast.id+'-lateen',mast.id,[footA,peak.clone(),heel.clone(),footB],.16,group,'x');
   tube(sail,[peak.clone(),V(0,totalHeight*.58,span*.05),footA.clone()],.018,materials.rope,'lateen-luff-rope',32);
   tube(sail,[heel.clone(),footB.clone()],.018,materials.rope,'lateen-foot-rope',24);
   tube(braces,[V(0,totalHeight*.8,0),V(0,totalHeight*.7,span*.46)],.016,materials.rope,'lateen-sheet',26);
  }
  const pennant=part('mast-pennant-'+mast.id,group);
  const pennantCloth=ctx.mesh(pennant,new THREE.BufferGeometry(),materials.flag,'mast-top-pennant');
  const pennantPoints=[
   V(0,totalHeight+.12,0),V(0,totalHeight+.12,-d.beamUnits*.72),
   V(0,totalHeight-.48,-d.beamUnits*.68)
  ];
  const pennantGeom=new THREE.BufferGeometry();
  pennantGeom.setAttribute('position',new THREE.Float32BufferAttribute(pennantPoints.flatMap(p=>[p.x,p.y,p.z]),3));
  pennantGeom.setIndex([0,1,2]);pennantGeom.computeVertexNormals();
  pennantCloth.geometry.dispose();pennantCloth.geometry=pennantGeom;
 }
 for(let i=0;i<d.headsails;i++){
  const mast=d.masts[0],mastZ=mast.z*d.hullLengthUnits,foreTop=deckY(d,.5+mast.z*.45)+mast.height*1.22;
  const bowZ=-d.hullLengthUnits*.5-d.beamUnits*.75,headZ=mastZ-d.hullLengthUnits*.09;
  const low=deckY(d,.05)+.55,scale=i===0?1:.73,offset=i===0?0:.13;
  const tack=V(0,low+offset,bowZ+ i*d.beamUnits*.42);
  const headPoint=V(0,foreTop*scale,headZ);
  const clew=V(0,low+1.05+offset,mastZ-d.hullLengthUnits*(.18+i*.07));
  buildCanvasSail(ctx,'sail-head-'+(i+1),mast.id,[tack,headPoint,clew,clew.clone().lerp(tack,.7)],.08,ctx.root,'x');
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
