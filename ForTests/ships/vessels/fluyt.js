/**
 * fluyt — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, resolveVesselForGeneration } from '../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../shared/ship-editor-kit.js';

export const FluytDefinition = defineVesselSpec({
  id: 'fluyt',
  design: {
    id: 'fluyt', label: 'Dutch fluyt merchantman', era: '17th century Atlantic trade',
    hullLength: 32.75, beam: 6.7, draft: 2.5, freeboard: 1.75,
    rig: 'Three-masted early fluit reconstruction: square-rigged fore and main masts, a lateen mizzen and a spritsail arrangement; exact sail plan is reconstructed.',
    hullProfile: 'Long, narrow early-fluit cargo hull with a full but fine-ended lower body, rounded bilges, a pinched-in upper deck and rounded stern; less box-like than several later fluits.',
    signatureFeatures: ["Cargo boom","Narrow cargo hatch coamings","Rounded stern deckhouse","Cargo winch"],
    detailParts: ["fluyt-cargo-boom","fluyt-hatch-coamings","fluyt-stern-deckhouse","fluyt-winch"],
    reference: 'Based directly on the early fluit Witte Swaen, built in 1636: archaeological survey estimates 32.75 ± 2% m length between stem and sternpost and 6.7 ± 2% m breadth (length-to-breadth ratio about 4.88 ± 0.14). The wreck preserves evidence for a three-mast arrangement.',
    sources: [{ label: 'Archaeological survey — Witte Swaen (1636), 2024', url: 'https://doi.org/10.1080/10572414.2024.2413068' }, { label: 'Deutsches Historisches Museum — Fluyt', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/09-fluyt/' }],
    hull: { fullness: 0.96, entry: 0.5, stern: 'round', sternWidth: 0.26, tumblehome: 0.25, sheer: 0.08, bowRise: 0.18, sternRise: 0.17, keelDepth: 0.04, deckCamber: 0.12 },
    sternwork: 'fluyt-roundhouse',
    sternTiers: [{"w":0.52,"d":0.15,"h":1.55},{"w":0.35,"d":0.12,"h":0.85}], bowwork: 'spritsail-platform',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, modelScaleNote: 'Length and breadth use the archaeological estimate for Witte Swaen (1636), each with about ±2% uncertainty; the detailed offsets, draft, sheer and sail plan are parametric reconstructions.', sailingSpeed: 5.8, handling: 0.62,
    masts: [
      { id: 'fore', z: -0.32, height: 19.0, rig: 'square', squares: 2 },
      { id: 'main', z: -0.035, height: 22.5, rig: 'square', squares: 2 },
      { id: 'mizzen', z: 0.30, height: 15.4, rig: 'lateen', span: 0.26, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 34, strakeRows: 11, deckSeamCount: 12, beamStation: .54, forebody: .68, aftbody: .75, foreTip: .01, aftTip: .08, bottomFlat: .51, bilge: .36, flare: .035, tumble: .27, sheer: .82, lowerMastRatio: .65, shroudPairs: 2, ratlines: 9, yardSpread: .94 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){const q=Math.max(0,Math.min(1,t)),edge=Math.abs(2*q-1);const sheer=Math.pow(edge,1.55),bow=Math.pow(Math.max(0,1-2*q),1.34),stern=Math.pow(Math.max(0,2*q-1),1.28);return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*sheer*d.structure.sheer+d.hull.bowRise*d.deckHeightUnits*bow+d.hull.sternRise*d.deckHeightUnits*stern;}
function keelY(d,t){const q=Math.max(0,Math.min(1,t)),mid=Math.pow(Math.max(0,Math.sin(Math.PI*q)),0.38);const depth=0.9+(1-0.9)*mid+d.hull.keelDepth*0.08*mid*(1-mid);return -d.draftUnits*Math.min(1,depth);}
function deckBreadthRatio(d){return Math.max(.58,Math.min(.99,0.96-d.hull.tumblehome*0.4-d.structure.tumble*.25-0.005+d.structure.flare*0.1));}
function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),bulge=1+.18*Math.exp(-Math.pow((t-.5)*3.5,2)),entry=.72+.28*Math.min(1,t*3.5),run=.88+.12*Math.min(1,(1-t)*3);return d.beamUnits*.5*Math.pow(mid,.48)*bulge*entry*run;}
function hullPoint(d,t,a){const v=1-Math.pow(Math.max(0,Math.sin(a)),1.18),deck=deckY(d,t),keel=keelY(d,t);const transition=0.68,lowerT=Math.max(0,Math.min(1,v/transition)),upperT=Math.max(0,Math.min(1,(v-transition)/(1-transition)));const lower=0.1+(1-0.1)*Math.pow(Math.sin(lowerT*Math.PI*.5),0.32)*(1+(d.structure.bilge||0)*.18*Math.sin(Math.PI*lowerT));const smooth=upperT*upperT*(3-2*upperT);const deckRatio=Math.max(.58,Math.min(.99,0.96-d.hull.tumblehome*0.4-d.structure.tumble*.25-0.005+d.structure.flare*0.1));const upper=1+(deckRatio-1)*Math.pow(smooth,1.12);const section=v<=transition?lower:upper;return V(Math.cos(a)*halfBreadth(d,t)*section,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
function buildHull(d,ctx){
 const {THREE,part,mesh,materials,V}=ctx,hullGroup=part('hull'),stations=104,rings=36,positions=[],indices=[];
 for(let i=0;i<=stations;i++){const t=i/stations;for(let j=0;j<=rings;j++){const q=hullPoint(d,t,j/rings*Math.PI*2);positions.push(q.x,q.y,q.z);}}
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 for(const i of [0,stations]){const t=i/stations,c=positions.length/3;positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(c,a,a+1);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(hullGroup,geometry,materials.hull,'fluyt-individual-hull-loft');
 const deck=part('deck'),along=76,across=20,pos=[],faces=[];
 for(let i=0;i<=along;i++){const t=i/along,half=halfBreadth(d,t)*deckBreadthRatio(d);for(let j=0;j<=across;j++){const u=j/across*2-1;pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);}}
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){const u=(j+.5)/across*2-1;const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
 const deckGeo=new THREE.BufferGeometry();deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));deckGeo.setIndex(faces);deckGeo.computeVertexNormals();mesh(deck,deckGeo,materials.deck,'fluyt-independent-deck-plan');
 const keel=part('keel'),keelLine=[];for(let i=0;i<=26;i++){const t=i/26;keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
 ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,d.keelDetails.label,64);
 const stem=part('stem');if(d.keelDetails.stemPosts){ctx.beam(stem,V(0,keelY(d,.012),-d.hullLengthUnits*.5),V(0,deckY(d,.012)+.2,-d.hullLengthUnits*.5),Math.max(.08,d.beamUnits*.023),materials.trim,'fluyt-stem-post');
 }
}
function buildFramesAndPlanking(d,ctx){
 const {part,tube,materials,V}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){const t=0.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
  const pieces=44;for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,j/pieces*Math.PI*2));tube(frame,line,Math.max(.035,d.beamUnits*.006),materials.trim,'fluyt-frame-rising',pieces);
 }
 const strakes=part('hull-strakes'),rows=d.structure.strakeRows??8;
 for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.12+row*.76/Math.max(1,rows-1),line=[];
  for(let i=0;i<=68;i++){const t=.018+.964*i/68,a=Math.acos(2*level-1),q=hullPoint(d,t,side<0?-a:a);q.x=Math.abs(q.x)*side;q.y+=.018;line.push(q);}
  tube(strakes,line,Math.max(.015,d.beamUnits*.0032),row===0?materials.lower:materials.plank,'fluyt-strake-'+side+'-'+row,72);
 }
 const seams=part('deck-planks'),seamCount=d.structure.deckSeamCount??9;for(let line=-seamCount;line<=seamCount;line++){const u=line/(seamCount+1),points=[];for(let i=0;i<=42;i++){const t=.04+.92*i/42,half=halfBreadth(d,t)*deckBreadthRatio(d)*.96;points.push(V(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+.025,(t-.5)*d.hullLengthUnits));}tube(seams,points,.012,materials.plank,'fluyt-deck-seam-'+line,48);}
}
function buildStern(d,ctx){const {THREE,part,mesh,box,beam,materials,V}=ctx,stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern),y=deckY(d,.95),z=d.hullLengthUnits*.385,w=d.beamUnits*.54,h=d.deckHeightUnits*.72,shell=part('fluyt-round-stern',stern);const dome=mesh(shell,new THREE.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI*.58),materials.hull,'rounded-fluyt-afterbody');dome.scale.set(w*.5,h,w*.42);dome.position.set(0,y+h*.28,z);const counter=box(shell,w*.72,h*.24,d.beamUnits*.08,materials.trim,'narrow-stern-counter');counter.position.set(0,y+h*.6,z+d.hullLengthUnits*.035);for(const side of [-1,1])beam(gallery,V(side*w*.43,y+h*.6,z-.5),V(side*w*.43,y+h*.6,z+.8),.035,materials.trim,'round-stern-rail');}
function buildBow(d,ctx){const {part,beam,box,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit'),base=deckY(d,.045)+d.deckHeightUnits*.18,tip=-d.hullLengthUnits*.5;
const length=d.beamUnits*.92;beam(bowsprit,V(0,base,tip+d.hullLengthUnits*.12),V(0,base+d.deckHeightUnits*.32,tip-length),Math.max(.065,d.beamUnits*.02),materials.trim,'fluyt-bowsprit');for(let side of [-1,1])beam(bow,V(side*.1,base+.1,tip+d.hullLengthUnits*.1),V(side*d.beamUnits*.18,base-.18,tip-d.beamUnits*.12),.035,materials.trim,'headrail');
if(d.headsails>0){const lashing=part('bowsprit-gammoning',bow);beam(lashing,V(0,base+.12,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.28,tip-d.beamUnits*.5),.026,materials.rope,'gammoning-line');}}
function buildRudderAndHelm(d,ctx){const {part,box,beam,materials,V}=ctx,rudder=part('rudder'),config=d.rudderDetails,stern=d.hullLengthUnits*.47;rudder.position.set(0,0,stern+config.pivotOffset);const width=d.beamUnits*config.breadthFactor*1,height=d.draftUnits*config.depthFactor,blade=box(rudder,width,height,.22,materials.trim,'fluyt-rudder-blade');blade.position.set(0,-d.draftUnits*config.yFactor,0);beam(rudder,V(0,-d.draftUnits*.4,-.02),V(0,deckY(d,.97)+.22,0),Math.max(.045,d.beamUnits*.014),materials.trim,'rudder-stock');const helm=part('helm'),wheel=part('helm-wheel'),y=deckY(d,.83),z=d.hullLengthUnits*.31;beam(helm,V(0,y+.18,z),V(0,y+.9,z),.065,materials.trim,'helm-post');const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.44,.045,8,20),materials.trim,'helm-wheel-ring');ring.position.set(0,y+1.02,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y+1.02,z),V(Math.cos(a)*.44,y+1.02+Math.sin(a)*.44,z),.022,materials.trim,'helm-spoke');}}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx,rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){const points=[];for(let i=0;i<=42;i++){const t=.08+.84*i/42,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+.56,z=(t-.5)*d.hullLengthUnits;points.push(V(x,y,z));if(i%4===0)beam(group,V(x,y-.48,z),V(x,y+.02,z),.035,materials.trim,'rail-post-'+i);}tube(group,points,.052,materials.trim,'fluyt-gunwale-rail',64);}
 const fittings=part('deck-fittings');
 for(let h=0;h<4;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.28,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 
 
}

function buildSignatureDeckFeatures(d,ctx){
 const {part,beam,box,mesh,materials,V,THREE}=ctx;
 const hatches=part('fluyt-hatch-coamings');for(let i=0;i<4;i++){const t=.32+i*.13,z=(t-.5)*d.hullLengthUnits,w=d.beamUnits*(i===1||i===2?.38:.31),depth=d.hullLengthUnits*.064,y=deckY(d,t),rim=box(hatches,w,.13,depth,materials.trim,'narrow-hold-coaming');rim.position.set(0,y+.065,z);for(let side of [-1,1]){const cleat=box(hatches,.09,.1,.16,materials.hull,'cargo-cleat');cleat.position.set(side*w*.54,y+.09,z);}}
 const house=part('fluyt-stern-deckhouse'),hy=deckY(d,.88),hz=d.hullLengthUnits*.38,hw=d.beamUnits*.32,hh=.5,hd=d.hullLengthUnits*.045,body=box(house,hw,hh,hd,materials.hull,'roundhouse-body');body.position.set(0,hy+hh*.5,hz);
 const roof=mesh(house,new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.52),materials.trim,'rounded-roof');roof.scale.set(hw*.55,.16,hd*.8);roof.position.set(0,hy+hh,hz);
 const winch=part('fluyt-winch'),wy=deckY(d,.52),wz=-d.hullLengthUnits*.03;for(let side of [-1,1]){const post=box(winch,.1,.42,.11,materials.trim,'winch-post');post.position.set(side*.37,wy+.21,wz);}
 beam(winch,V(-.42,wy+.43,wz),V(.42,wy+.43,wz),.06,materials.trim,'winch-axle');
 const drum=mesh(winch,new THREE.CylinderGeometry(.13,.13,.68,12),materials.hull,'winch-drum');drum.rotation.z=Math.PI/2;drum.position.set(0,wy+.43,wz);
 const boom=part('fluyt-cargo-boom'),mast=d.masts[1],mz=mast.z*d.hullLengthUnits,by=deckY(d,.5+mast.z*.45);
 beam(boom,V(0,by+1.25,mz),V(d.beamUnits*.48,by+1.5,mz+d.hullLengthUnits*.12),.07,materials.trim,'cargo-boom');
 ctx.tube(boom,[V(0,by+1.25,mz),V(d.beamUnits*.25,by+.3,mz+d.hullLengthUnits*.06),V(d.beamUnits*.48,by+1.5,mz+d.hullLengthUnits*.12)],.016,materials.rope,'cargo-boom-tackle',18);
}
function buildCanvasSail(ctx,name,mastId,corners,fullness=.075,parent=ctx.root,axis='z'){
 const {part,mesh,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const rows=18,columns=20,positions=[],indices=[];
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let column=0;column<=columns;column++){
   const u=column/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const point=lower.lerp(upper,v);
   const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),0.88);
   const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),1.26);
   const bias=1+0.2*(u-.5)*2;
   const belly=fullness*chord*vertical*bias;
   const twist=0.032*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
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
 mesh(cloth,geometry,materials.sail,'fluyt-individually-shaped-cloth');
 return control;
}


function buildRig(d,ctx){
 const {part,beam,tube,materials,V}=ctx,head=part('head-sails');
 for(const mast of d.masts){
  const z=mast.z*d.hullLengthUnits,baseY=deckY(d,.5+mast.z*.45)+.12,topY=baseY+mast.height*(4/3),group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const lowerHeight=(topY-baseY)*(d.structure.lowerMastRatio??.64),radius=d.beamUnits*(mast.rig==='junk'?.027:.018)*1;
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
   levels.forEach((level,index)=>{const width=d.beamUnits*(1.48-index*.13)*d.structure.yardSpread*1,y0=lowerHeight*.3+index*lowerHeight*.2,y1=Math.min(topY-baseY-.45,y0+lowerHeight*.19),yard=part('yard-'+mast.id+'-'+level,group);
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
  const x=side*d.beamUnits*.46,y=deckY(d,.1)-.35,z=-d.hullLengthUnits*.38,span=d.beamUnits*.105*1.06;
  beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),Math.max(.04,d.beamUnits*.014*1.06),materials.iron,'fluyt-anchor-shank');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),Math.max(.04,d.beamUnits*.016*1.06),materials.iron,'fluyt-anchor-stock');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-port');
  beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-starboard');
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x,y-.28,z-.24),V(x*.92,y-.52,z-.44)],.022,materials.iron,'fluyt-anchor-rode',18);
 }
}

function ensureSternTierComponents(d,ctx){
 const {part,box,materials}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.7;
  const height=Math.max(.18,tier.h*0.7);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const shell=box(component,width,height,depth,materials.hull,'fluyt-independent-stern-tier');
  shell.position.set(0,deckY(d,.94)+height*(.44+index*.08),d.hullLengthUnits*(.405+index*.014));
  const cap=box(component,width*1.04,.09,depth*1.04,materials.trim,'stern-tier-cap');
  cap.position.set(0,shell.position.y+height*.52,shell.position.z);
 });
}


function generateFluytGeometry(vessel,componentTransforms={},savedState={}){
 const ctx=createShipContext(vessel,{"hull":7033661,"plank":9993049,"deck":12165500,"sail":15065039});
 buildHull(ctx.design,ctx);
 buildFramesAndPlanking(ctx.design,ctx);
 buildStern(ctx.design,ctx);
 ensureSternTierComponents(ctx.design,ctx);
 buildBow(ctx.design,ctx);
 buildRudderAndHelm(ctx.design,ctx);
 buildRailingsAndEquipment(ctx.design,ctx);
 buildSignatureDeckFeatures(ctx.design,ctx);
 buildAnchors(ctx.design,ctx);
 buildRig(ctx.design,ctx);
 return finishShipModel(ctx,componentTransforms,savedState);
}

export function createFluytModel(componentTransforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(FluytDefinition);
  return generateFluytGeometry(vessel, componentTransforms, savedState);
}
export function generateFluyt(componentTransforms = {}, savedState = {}) {
  return createFluytModel(componentTransforms, savedState);
}
export const Fluyt = Object.freeze({
  id: FluytDefinition.id,
  definition: FluytDefinition,
  design: FluytDefinition.design,
  structure: FluytDefinition.structure,
  editorModulePath: FluytDefinition.editorModulePath,
  createModel: createFluytModel,
  generate: generateFluyt,
});
export const id = Fluyt.id;
export const design = Fluyt.design;
export const structure = Fluyt.structure;
export const createModel = Fluyt.createModel;
export const generate = Fluyt.generate;
export default Fluyt;
