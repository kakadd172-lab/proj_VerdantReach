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
 const v=1-Math.pow(Math.max(0,Math.sin(a)),1.38),deck=deckY(d,t),keel=keelY(d,t);
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

function buildBow(d,ctx){const {part,beam,box,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit'),base=deckY(d,.045)+d.deckHeightUnits*.18,tip=-d.hullLengthUnits*.5;
const beakhead=part('galleon-beakhead',bow),length=d.beamUnits*.78;beam(beakhead,V(0,base,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.42,tip-length),d.beamUnits*.04,materials.trim,'beakhead-stem');const platform=box(beakhead,d.beamUnits*.34,.14,length*.82,materials.deck,'beakhead-platform');platform.position.set(0,base+d.deckHeightUnits*.24,tip-length*.52);for(const side of [-1,1])beam(beakhead,V(0,base+d.deckHeightUnits*.24,tip-length*.9),V(side*d.beamUnits*.19,base+d.deckHeightUnits*.2,tip),.035,materials.trim,'beakhead-cheek');
if(d.headsails>0){const lashing=part('bowsprit-gammoning',bow);beam(lashing,V(0,base+.12,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.28,tip-d.beamUnits*.5),.026,materials.rope,'gammoning-line');}}
function buildRudderAndHelm(d,ctx){const {part,box,beam,materials,V}=ctx,rudder=part('rudder'),config=d.rudderDetails,stern=d.hullLengthUnits*.47;rudder.position.set(0,0,stern+config.pivotOffset);const width=d.beamUnits*config.breadthFactor*1,height=d.draftUnits*config.depthFactor,blade=box(rudder,width,height,.22,materials.trim,'galleon-rudder-blade');blade.position.set(0,-d.draftUnits*config.yFactor,0);beam(rudder,V(0,-d.draftUnits*.4,-.02),V(0,deckY(d,.97)+.22,0),Math.max(.045,d.beamUnits*.014),materials.trim,'rudder-stock');const helm=part('helm'),wheel=part('helm-wheel'),y=deckY(d,.83),z=d.hullLengthUnits*.31;beam(helm,V(0,y+.18,z),V(0,y+.9,z),.065,materials.trim,'helm-post');const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.44,.045,8,20),materials.trim,'helm-wheel-ring');ring.position.set(0,y+1.02,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y+1.02,z),V(Math.cos(a)*.44,y+1.02+Math.sin(a)*.44,z),.022,materials.trim,'helm-spoke');}}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx,rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){const points=[];for(let i=0;i<=42;i++){const t=.08+.84*i/42,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+.56,z=(t-.5)*d.hullLengthUnits;points.push(V(x,y,z));if(i%4===0)beam(group,V(x,y-.48,z),V(x,y+.02,z),.035,materials.trim,'rail-post-'+i);}tube(group,points,.052,materials.trim,'galleon-gunwale-rail',64);}
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 for(let level=0;level<2;level++)for(let side of [-1,1])for(let i=0;i<12;i++){const t=.14+i/Math.max(1,12-1)*.72,x=side*halfBreadth(d,t)*.8,z=(t-.5)*d.hullLengthUnits,y=deckY(d,t)-.36-level*d.deckHeightUnits*.24,portHole=box(fittings,.34,.28,.08,materials.lower,'gunport-'+level+'-'+side+'-'+i);portHole.position.set(x,y,z);const cannon=part('deck-gun-'+level+'-'+side+'-'+i,fittings);beam(cannon,V(x,y+.02,z),V(x+side*.48,y+.02,z),.068,materials.iron,'cannon-barrel',12);for(let wheel=0;wheel<2;wheel++){const w=ctx.mesh(cannon,new ctx.THREE.CylinderGeometry(.1,.1,.055,10),materials.trim,'gun-carriage-wheel');w.rotation.z=Math.PI/2;w.position.set(x+side*.15,y-.12,z+(wheel-.5)*.2);}}
 
}

function buildCanvasSail(ctx,name,mastId,corners,fullness=.075,parent=ctx.root,axis='z'){
 const {part,mesh,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const rows=20,columns=22,positions=[],indices=[];
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let column=0;column<=columns;column++){
   const u=column/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const point=lower.lerp(upper,v);
   const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),1.28);
   const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),1.08);
   const bias=1+0.24*(u-.5)*2;
   const belly=fullness*chord*vertical*bias;
   const twist=0.0384*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
   if(axis==='x'){point.x+=belly;point.z+=twist;}else{point.z+=belly;point.x+=twist;}
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
 mesh(cloth,geometry,materials.sail,'galleon-individually-shaped-cloth');
 return control;
}


function buildRig(d,ctx){
 const {part,beam,tube,materials,V}=ctx,head=part('head-sails');
 for(const mast of d.masts){
  const z=mast.z*d.hullLengthUnits,baseY=deckY(d,.5+mast.z*.45)+.12,topY=baseY+mast.height*(4/3),group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const lowerHeight=(topY-baseY)*(d.structure.lowerMastRatio??.64),radius=d.beamUnits*(mast.rig==='junk'?.027:.018)*1.18;
  const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
  beam(step,V(-.33,baseY-.18,z),V(.33,baseY-.18,z),.11,materials.trim,'mast-step-crossbeam');
  beam(lower,V(0,0,0),V(0,lowerHeight,0),Math.max(.12,radius),materials.trim,'lower-mast');
  beam(topmast,V(0,lowerHeight-.12,0),V(0,topY-baseY,0),Math.max(.075,radius*.7),materials.trim,'topmast');
  if(mast.rig==='junk'){
   const yard=part('junk-yard-'+mast.id,group),span=d.hullLengthUnits*(mast.span??.72)*.36;
   beam(yard,V(0,topY-baseY-.12,-.08),V(0,topY-baseY-.2,span),Math.max(.08,radius*1.3),materials.trim,'junk-lug-yard');
   buildCanvasSail(ctx,'sail-'+mast.id+'-junk',mast.id,[V(0,.2,0),V(0,topY-baseY-.22,-.06),V(0,topY-baseY-.3,span),V(0,.2,span)],.13,group,'x');
   const battens=part('junk-battens-'+mast.id,group);
   for(let i=1;i<=7;i++){const f=i/8,y=.2+(topY-baseY-.45)*f,reach=span*(1-.07*f),batten=part('batten-'+mast.id+'-'+i,battens);beam(batten,V(0,y,0),V(0,y-.04,reach),Math.max(.025,radius*.3),materials.trim,'bamboo-batten');}
   const sheets=part('junk-sheets-'+mast.id,group);tube(sheets,[V(.12,.35,span*.2),V(.22,.28,span*.7),V(.16,.25,span)],.016,materials.rope,'junk-sheet-lines',22);continue;
  }
  const standing=part('standing-rigging-'+mast.id),shrouds=part('shrouds-'+mast.id,standing),ratlines=part('ratlines-'+mast.id,standing),stays=part('mast-stays-'+mast.id,standing),running=part('running-rigging-'+mast.id),braces=part('running-braces-'+mast.id,running);
  const railX=halfBreadth(d,.5+mast.z*.2)*.82,pairs=d.structure.shroudPairs??2;
  for(let side of [-1,1])for(let pair=0;pair<pairs;pair++){const spread=pairs<=1?0:pair/(pairs-1)-.5,attachZ=z+spread*d.beamUnits*.25;
   tube(shrouds,[V(side*.08,topY-baseY-.1,0),V(side*.21,lowerHeight*.58,spread*d.beamUnits*.08),V(side*railX,deckY(d,.5+mast.z*.45)-baseY+.28,attachZ-z)],.019,materials.rope,'standing-shroud-'+side+'-'+pair,20);}
  for(let r=0;r<(d.structure.ratlines??8);r++){const y=lowerHeight*(r+1)/((d.structure.ratlines??8)+1),half=railX*.5;beam(ratlines,V(-half,y,0),V(half,y,0),.012,materials.rope,'ratline-'+r);}
  tube(stays,[V(0,topY-baseY,0),V(0,.18,-d.hullLengthUnits*.43-z)],.018,materials.rope,'mast-stay',26);
  for(let side of [-1,1])tube(braces,[V(0,topY-baseY*.12,0),V(side*d.beamUnits*.42,topY-baseY*.14,d.hullLengthUnits*.055)],.014,materials.rope,'yard-brace-'+side,20);
  if(mast.rig==='square'||mast.rig==='brigantine'){
   if((mast.rig==='square'&&mast.squares>0)||mast.rig==='brigantine'){const platform=part('mast-platform-'+mast.id,group),disk=ctx.mesh(platform,new ctx.THREE.CylinderGeometry(.56,.64,.12,12),materials.trim,'top-platform');disk.position.set(0,lowerHeight*.84,0);}
   const levels=mast.rig==='square'?['course','topsail','topgallant'].slice(0,mast.squares??2):['topsail'];
   levels.forEach((level,index)=>{const width=d.beamUnits*(1.48-index*.13)*d.structure.yardSpread*1.18,y0=lowerHeight*.3+index*lowerHeight*.2,y1=Math.min(topY-baseY-.45,y0+lowerHeight*.19),yard=part('yard-'+mast.id+'-'+level,group);
    beam(yard,V(-width*.5,y1,0),V(width*.5,y1,0),Math.max(.045,radius*.7),materials.trim,'square-yard');
    buildCanvasSail(ctx,'sail-'+mast.id+'-'+level,mast.id,[V(-width*.48,y0,0),V(-width*.43,y1,0),V(width*.43,y1,0),V(width*.48,y0,0)],.08+index*.012,group);
    const sheets=part('sheets-'+mast.id+'-'+level,group);for(let side of [-1,1])beam(sheets,V(side*width*.45,y0,0),V(side*width*.45,y0-.28,.18),.016,materials.rope,'sail-sheet');
   });
  }
  if(mast.rig==='gaff'||mast.rig==='trysail'||mast.rig==='brigantine'||mast.spanker){
   const type=mast.rig==='trysail'?'trysail':mast.spanker?'spanker':'gaff',run=d.hullLengthUnits*(mast.span??.38),low=lowerHeight*.14,high=lowerHeight*.82,gaff=part('gaff-spar-'+mast.id,group),boom=part('boom-'+mast.id,group);
   beam(gaff,V(0,high,-.12),V(0,high+.08,run),.062,materials.trim,'gaff-spar');beam(boom,V(0,low,0),V(0,low,run*1.02),.068,materials.trim,'boom-spar');
   buildCanvasSail(ctx,'sail-'+mast.id+'-'+type,mast.id,[V(0,low,0),V(0,high,-.12),V(0,high+.08,run),V(0,low,run*1.02)],.095,group,'x');
  }else if(mast.rig==='lateen'){
   const span=d.hullLengthUnits*(mast.span??.42)*.65,yard=part('lateen-yard-'+mast.id,group);
   beam(yard,V(0,topY-baseY-.3,-span*.45),V(0,.3,span),.075,materials.trim,'lateen-yard');
   buildCanvasSail(ctx,'sail-'+mast.id+'-lateen',mast.id,[V(0,.25,0),V(0,topY-baseY-.3,-span*.45),V(0,.3,span),V(0,.2,span*.92)],.1,group,'x');
  }
 }
 for(let i=0;i<d.headsails;i++){const f=(i+1)/(d.headsails+1),fore=d.masts[0],foreTop=deckY(d,.35)+fore.height*(4/3),bowZ=-d.hullLengthUnits*.5-d.beamUnits*.72,aftZ=-d.hullLengthUnits*(.43-f*.12),low=deckY(d,.04)+.3+i*.1;
  const control=part('sail-head-'+(i+1),head);control.userData.sailControl={mastId:fore.id,clothPart:'cloth-sail-head-'+(i+1)};const cloth=part('cloth-sail-head-'+(i+1),control);
  const geom=new ctx.THREE.BufferGeometry();geom.setAttribute('position',new ctx.THREE.Float32BufferAttribute([0,0,0,0,foreTop*(1-f*.08)-low,aftZ-bowZ,0,foreTop*.66-low,-d.beamUnits*.1],3));geom.setIndex([0,1,2]);geom.computeVertexNormals();ctx.mesh(cloth,geom,materials.sail,'triangular-head-sail');
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
