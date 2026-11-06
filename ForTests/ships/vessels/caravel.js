/**
 * caravel — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, resolveVesselForGeneration } from '../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../shared/ship-editor-kit.js';

export const CaravelDefinition = defineVesselSpec({
  id: 'caravel',
  design: {
    id: 'caravel', label: 'Atlantic caravel redonda', era: '15th–16th century',
    hullLength: 19.81, beam: 7.01, draft: 2.4, freeboard: 1.6,
    rig: 'Four-masted late-15th-century Portuguese redonda reconstruction: square forward sails and lateen sails aft.',
    hullProfile: 'Rounded carvel-built hull, deep bow flare, modest freeboard and narrow transom.',
    reference: 'The Royal Museums Greenwich catalogue describes a later Portuguese caravel model (circa 1490) at 65 ft × 23 ft (19.81 × 7.01 m), with four masts, square forward canvas and lateen sails aft. This is a museum interpretation, not a surviving original lines plan.',
    sources: [{ label: 'Royal Museums Greenwich — Portuguese caravel (circa 1490)', url: 'https://www.rmg.co.uk/collections/objects/rmgc-object-66267' }, { label: 'Royal Museums Greenwich — Matthew caravel reconstruction', url: 'https://www.rmg.co.uk/collections/objects/rmgc-object-386365' }],
    hull: { fullness: 0.65, entry: 0.6, stern: 'round', sternWidth: 0.18, tumblehome: 0.08, sheer: 0.15, bowRise: 0.34, sternRise: 0.24, keelDepth: 0.14, deckCamber: 0.14 },
    sternwork: 'quarterdeck',
    sternTiers: [{"w":0.5,"d":0.145,"h":1.7},{"w":0.37,"d":0.12,"h":0.9}], bowwork: 'short-bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, modelScaleNote: 'Length and beam follow the Royal Museums Greenwich 65 × 23 ft Portuguese caravel model; the four-mast redonda rig is one late-15th-century interpretation, not a universal caravel standard.', sailingSpeed: 8.5, handling: 1.08,
    masts: [
      { id: 'fore', z: -0.31, height: 15.9, rig: 'square', squares: 2 },
      { id: 'main', z: -0.085, height: 18.2, rig: 'square', squares: 2 },
      { id: 'mizzen', z: 0.17, height: 14.4, rig: 'lateen', span: 0.38, squares: 0 },
      { id: 'bonaventure', z: 0.34, height: 11.8, rig: 'lateen', span: 0.30, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 26, beamStation: .49, forebody: .82, aftbody: 1.22, foreTip: .003, aftTip: .035, bottomFlat: .16, bilge: .1, flare: .18, tumble: .075, sheer: 1.2, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .92 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){const q=Math.max(0,Math.min(1,t)),edge=Math.abs(2*q-1);const sheer=Math.pow(edge,1.05),bow=Math.pow(Math.max(0,1-2*q),1.18),stern=Math.pow(Math.max(0,2*q-1),1.4);return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*sheer*d.structure.sheer+d.hull.bowRise*d.deckHeightUnits*bow+d.hull.sternRise*d.deckHeightUnits*stern;}
function keelY(d,t){const q=Math.max(0,Math.min(1,t)),mid=Math.pow(Math.max(0,Math.sin(Math.PI*q)),0.84);const depth=0.78+(1-0.78)*mid+d.hull.keelDepth*0.07*mid*(1-mid);return -d.draftUnits*Math.min(1,depth);}
function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),fore=.9+.1*Math.pow(t,.8),aft=.82+.18*Math.pow(1-t,.6);return d.beamUnits*.5*Math.pow(mid,.83)*fore*aft*(1+.04*Math.sin(3*Math.PI*t));}
function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const transition=0.63,lowerT=Math.max(0,Math.min(1,v/transition)),upperT=Math.max(0,Math.min(1,(v-transition)/(1-transition)));const lower=0.04+(1-0.04)*Math.pow(Math.sin(lowerT*Math.PI*.5),0.5)*(1+(d.structure.bilge||0)*.18*Math.sin(Math.PI*lowerT));const smooth=upperT*upperT*(3-2*upperT);const deckRatio=Math.max(.58,Math.min(.99,0.88-d.hull.tumblehome*0.34-d.structure.tumble*.25-0.015+d.structure.flare*0.3));const upper=1+(deckRatio-1)*Math.pow(smooth,1);const section=v<=transition?lower:upper;return V(Math.cos(a)*halfBreadth(d,t)*section,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
function buildHull(d,ctx){
 const {THREE,part,mesh,materials,V}=ctx,hullGroup=part('hull'),stations=92,rings=36,positions=[],indices=[];
 for(let i=0;i<=stations;i++){const t=i/stations;for(let j=0;j<=rings;j++){const q=hullPoint(d,t,j/rings*Math.PI*2);positions.push(q.x,q.y,q.z);}}
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 for(const i of [0,stations]){const t=i/stations,c=positions.length/3;positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(c,a,a+1);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(hullGroup,geometry,materials.hull,'caravel-individual-hull-loft');
 const deck=part('deck'),along=76,across=20,pos=[],faces=[];
 for(let i=0;i<=along;i++){const t=i/along,half=halfBreadth(d,t)*0.93;for(let j=0;j<=across;j++){const u=j/across*2-1;pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);}}
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){const u=(j+.5)/across*2-1;const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
 const deckGeo=new THREE.BufferGeometry();deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));deckGeo.setIndex(faces);deckGeo.computeVertexNormals();mesh(deck,deckGeo,materials.deck,'caravel-independent-deck-plan');
 const keel=part('keel'),keelLine=[];for(let i=0;i<=26;i++){const t=i/26;keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
 ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,d.keelDetails.label,64);
 const stem=part('stem');if(d.keelDetails.stemPosts){ctx.beam(stem,V(0,keelY(d,.012),-d.hullLengthUnits*.5),V(0,deckY(d,.012)+.2,-d.hullLengthUnits*.5),Math.max(.08,d.beamUnits*.023),materials.trim,'caravel-stem-post');
 }
}
function buildFramesAndPlanking(d,ctx){
 const {part,tube,materials,V}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){const t=0.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
  const pieces=44;for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,j/pieces*Math.PI*2));tube(frame,line,Math.max(.035,d.beamUnits*.006),materials.trim,'caravel-frame-rising',pieces);
 }
 const strakes=part('hull-strakes'),rows=8;
 for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.12+row*.76/Math.max(1,rows-1),line=[];
  for(let i=0;i<=68;i++){const t=.018+.964*i/68,a=Math.acos(2*level-1),q=hullPoint(d,t,side<0?-a:a);q.x=Math.abs(q.x)*side;q.y+=.018;line.push(q);}
  tube(strakes,line,Math.max(.015,d.beamUnits*.0032),row===0?materials.lower:materials.plank,'caravel-strake-'+side+'-'+row,72);
 }
 const seams=part('deck-planks');for(let line=-9;line<=9;line++){const u=line/10,points=[];for(let i=0;i<=42;i++){const t=.04+.92*i/42,half=halfBreadth(d,t)*.9;points.push(V(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+.025,(t-.5)*d.hullLengthUnits));}tube(seams,points,.012,materials.plank,'caravel-deck-seam-'+line,48);}
}
function buildStern(d,ctx){
 const {part,box,beam,materials,V}=ctx,stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern),baseZ=d.hullLengthUnits*.355,deck=deckY(d,.94),tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{const tierGroup=part('stern-tier-'+(index+1),stern),width=d.beamUnits*tier.w*(1-index*.055),depth=d.hullLengthUnits*tier.d*(1-index*.035),height=tier.h*(4/3),body=box(tierGroup,width,height,depth,materials.hull,'caravel-stern-castle-tier');body.position.set(0,deck+tiers.slice(0,index).reduce((sum,item)=>sum+item.h*(4/3)+.08,0)+height*.5,baseZ+index*depth*.22);const cap=box(tierGroup,width*1.04,.11,depth*1.04,materials.trim,'castle-tier-cap');cap.position.set(0,body.position.y+height*.53,body.position.z);const count=Math.max(2,Math.round(width/1.3));for(let n=0;n<count;n++){const x=-width*.34+width*.68*n/Math.max(1,count-1),y=body.position.y+height*.12,z=body.position.z+depth*.52,pane=box(windows,Math.max(.22,width*.065),Math.max(.24,height*.19),.035,materials.glass,'stern-window');pane.position.set(x,y,z);}for(const side of [-1,1]){const rx=side*width*.53,ry=body.position.y+height*.5;beam(gallery,V(rx,ry,body.position.z-depth*.48),V(rx,ry,body.position.z+depth*.48),.045,materials.trim,'stern-balustrade');for(let j=0;j<4;j++){const zz=body.position.z-depth*.42+j*depth*.28;beam(gallery,V(rx,ry-.42,zz),V(rx,ry+.03,zz),.025,materials.trim,'stern-baluster');}}});
}
function buildBow(d,ctx){const {part,beam,box,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit'),base=deckY(d,.045)+d.deckHeightUnits*.18,tip=-d.hullLengthUnits*.5;
const length=d.beamUnits*.92;beam(bowsprit,V(0,base,tip+d.hullLengthUnits*.12),V(0,base+d.deckHeightUnits*.32,tip-length),Math.max(.065,d.beamUnits*.02),materials.trim,'caravel-bowsprit');for(let side of [-1,1])beam(bow,V(side*.1,base+.1,tip+d.hullLengthUnits*.1),V(side*d.beamUnits*.18,base-.18,tip-d.beamUnits*.12),.035,materials.trim,'headrail');
if(d.headsails>0){const lashing=part('bowsprit-gammoning',bow);beam(lashing,V(0,base+.12,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.28,tip-d.beamUnits*.5),.026,materials.rope,'gammoning-line');}}
function buildRudderAndHelm(d,ctx){const {part,box,beam,materials,V}=ctx,rudder=part('rudder'),config=d.rudderDetails,stern=d.hullLengthUnits*.47;rudder.position.set(0,0,stern+config.pivotOffset);const width=d.beamUnits*config.breadthFactor*1,height=d.draftUnits*config.depthFactor,blade=box(rudder,width,height,.22,materials.trim,'caravel-rudder-blade');blade.position.set(0,-d.draftUnits*config.yFactor,0);beam(rudder,V(0,-d.draftUnits*.4,-.02),V(0,deckY(d,.97)+.22,0),Math.max(.045,d.beamUnits*.014),materials.trim,'rudder-stock');const helm=part('helm'),wheel=part('helm-wheel'),y=deckY(d,.83),z=d.hullLengthUnits*.31;beam(helm,V(0,y+.18,z),V(0,y+.9,z),.065,materials.trim,'helm-post');const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.44,.045,8,20),materials.trim,'helm-wheel-ring');ring.position.set(0,y+1.02,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y+1.02,z),V(Math.cos(a)*.44,y+1.02+Math.sin(a)*.44,z),.022,materials.trim,'helm-spoke');}}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx,rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){const points=[];for(let i=0;i<=42;i++){const t=.08+.84*i/42,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+.56,z=(t-.5)*d.hullLengthUnits;points.push(V(x,y,z));if(i%4===0)beam(group,V(x,y-.48,z),V(x,y+.02,z),.035,materials.trim,'rail-post-'+i);}tube(group,points,.052,materials.trim,'caravel-gunwale-rail',64);}
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 
 
}

function buildCanvasSail(ctx,name,mastId,corners,fullness=.075,parent=ctx.root,axis='z'){
 const {part,mesh,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const rows=16,columns=19,positions=[],indices=[];
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let column=0;column<=columns;column++){
   const u=column/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const point=lower.lerp(upper,v);
   const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),1.2);
   const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),0.92);
   const bias=1+0.19*(u-.5)*2;
   const belly=fullness*chord*vertical*bias;
   const twist=0.0304*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
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
 mesh(cloth,geometry,materials.sail,'caravel-individually-shaped-cloth');
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
  const x=side*d.beamUnits*.46,y=deckY(d,.1)-.35,z=-d.hullLengthUnits*.38,span=d.beamUnits*.105*1.12;
  beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),Math.max(.04,d.beamUnits*.014*1.12),materials.iron,'caravel-anchor-shank');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),Math.max(.04,d.beamUnits*.016*1.12),materials.iron,'caravel-anchor-stock');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-port');
  beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-starboard');
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x,y-.28,z-.24),V(x*.92,y-.52,z-.44)],.022,materials.iron,'caravel-anchor-rode',18);
 }
}

function ensureSternTierComponents(d,ctx){
 const {part,box,materials}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.95;
  const height=Math.max(.18,tier.h*0.95);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const shell=box(component,width,height,depth,materials.hull,'caravel-independent-stern-tier');
  shell.position.set(0,deckY(d,.94)+height*(.44+index*.08),d.hullLengthUnits*(.405+index*.014));
  const cap=box(component,width*1.04,.09,depth*1.04,materials.trim,'stern-tier-cap');
  cap.position.set(0,shell.position.y+height*.52,shell.position.z);
 });
}


function generateCaravelGeometry(vessel,componentTransforms={},savedState={}){
 const ctx=createShipContext(vessel,{"hull":7359794,"plank":10253387,"deck":11900522,"sail":15261385});
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

export function createCaravelModel(componentTransforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(CaravelDefinition);
  return generateCaravelGeometry(vessel, componentTransforms, savedState);
}
export function generateCaravel(componentTransforms = {}, savedState = {}) {
  return createCaravelModel(componentTransforms, savedState);
}
export const Caravel = Object.freeze({
  id: CaravelDefinition.id,
  definition: CaravelDefinition,
  design: CaravelDefinition.design,
  structure: CaravelDefinition.structure,
  editorModulePath: CaravelDefinition.editorModulePath,
  createModel: createCaravelModel,
  generate: generateCaravel,
});
export const id = Caravel.id;
export const design = Caravel.design;
export const structure = Caravel.structure;
export const createModel = Caravel.createModel;
export const generate = Caravel.generate;
export default Caravel;
