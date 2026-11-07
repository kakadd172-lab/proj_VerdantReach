/**
 * cutter — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, resolveVesselForGeneration } from '../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../shared/ship-editor-kit.js';

export const CutterDefinition = defineVesselSpec({
  id: 'cutter',
  design: {
    id: 'cutter', label: 'Caribbean cutter', era: '18th century coastal service',
    hullLength: 16.8, beam: 5.1, draft: 2.0, freeboard: 1.35,
    rig: 'Single tall gaff mast with a large headsail spread from a long bowsprit.',
    hullProfile: 'Fine entry, full forefoot, low freeboard, compact counter stern.',
    reference: 'Representative cutter reconstruction; dimensions and mast height are game-design estimates for a period coastal vessel.',
    sources: [{ label: 'Royal Museums Greenwich — historical cutter collection records', url: 'https://www.rmg.co.uk/collections/objects/search/main' }],
    hull: { fullness: 0.6, entry: 0.72, stern: 'counter', sternWidth: 0.27, tumblehome: 0.04, sheer: 0.11, bowRise: 0.22, sternRise: 0.22, keelDepth: 0.08, deckCamber: 0.1 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'long-bowsprit',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 9.6, handling: 1.42,
    masts: [{ id: 'single', z: -0.03, height: 16.1, rig: 'gaff', span: 0.5, squares: 0 }],
    headsails: 4, oars: false,
  },
  structure: { frameCount: 21, beamStation: .47, forebody: .69, aftbody: 1.04, foreTip: .003, aftTip: .045, bottomFlat: .16, bilge: .09, flare: .17, tumble: .025, sheer: 1.14, lowerMastRatio: .61, shroudPairs: 2, ratlines: 8, yardSpread: .96 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}
function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}
function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),bow=1-.42*Math.pow(1-t,1.35);return d.beamUnits*.5*Math.pow(mid,.88)*bow*(.96+.04*t);}
function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const section=Math.pow(Math.max(.015,1-Math.pow(Math.abs(2*v-1),2.1)),.58),flare=1+d.structure.flare*Math.pow(v,1.6),bilge=1-.06*Math.sin(Math.PI*v);return V(Math.cos(a)*halfBreadth(d,t)*section*flare*bilge,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
function buildHull(d,ctx){
 const {THREE,part,mesh,materials,V}=ctx,hullGroup=part('hull'),stations=84,rings=36,positions=[],indices=[];
 for(let i=0;i<=stations;i++){const t=i/stations;for(let j=0;j<=rings;j++){const q=hullPoint(d,t,j/rings*Math.PI*2);positions.push(q.x,q.y,q.z);}}
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 for(const i of [0,stations]){const t=i/stations,c=positions.length/3;positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(c,a,a+1);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(hullGroup,geometry,materials.hull,'cutter-individual-hull-loft');
 const deck=part('deck'),along=76,across=20,pos=[],faces=[];
 for(let i=0;i<=along;i++){const t=i/along,half=halfBreadth(d,t)*0.93;for(let j=0;j<=across;j++){const u=j/across*2-1;pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);}}
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){const u=(j+.5)/across*2-1;const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
 const deckGeo=new THREE.BufferGeometry();deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));deckGeo.setIndex(faces);deckGeo.computeVertexNormals();mesh(deck,deckGeo,materials.deck,'cutter-independent-deck-plan');
 const keel=part('keel'),keelLine=[];for(let i=0;i<=26;i++){const t=i/26;keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
 ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,d.keelDetails.label,64);
 const stem=part('stem');if(d.keelDetails.stemPosts){ctx.beam(stem,V(0,keelY(d,.012),-d.hullLengthUnits*.5),V(0,deckY(d,.012)+.2,-d.hullLengthUnits*.5),Math.max(.08,d.beamUnits*.023),materials.trim,'cutter-stem-post');
 }
}
function buildFramesAndPlanking(d,ctx){
 const {part,tube,materials,V}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){const t=0.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
  const pieces=44;for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,j/pieces*Math.PI*2));tube(frame,line,Math.max(.035,d.beamUnits*.006),materials.trim,'cutter-frame-rising',pieces);
 }
 const strakes=part('hull-strakes'),rows=8;
 for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.12+row*.76/Math.max(1,rows-1),line=[];
  for(let i=0;i<=68;i++){const t=.018+.964*i/68,a=Math.acos(2*level-1),q=hullPoint(d,t,side<0?-a:a);q.x=Math.abs(q.x)*side;q.y+=.018;line.push(q);}
  tube(strakes,line,Math.max(.015,d.beamUnits*.0032),row===0?materials.lower:materials.plank,'cutter-strake-'+side+'-'+row,72);
 }
 const seams=part('deck-planks');for(let line=-9;line<=9;line++){const u=line/10,points=[];for(let i=0;i<=42;i++){const t=.04+.92*i/42,half=halfBreadth(d,t)*.9;points.push(V(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+.025,(t-.5)*d.hullLengthUnits));}tube(seams,points,.012,materials.plank,'cutter-deck-seam-'+line,48);}
}
function buildStern(d,ctx){
 const {part,box,beam,materials,V}=ctx,stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern),baseZ=d.hullLengthUnits*.405,deck=deckY(d,.94),tiers=d.sternTiers||[];
 const width=d.beamUnits*.56,height=d.deckHeightUnits*.62,depth=d.hullLengthUnits*.06,transom=box(stern,width,height,depth,materials.hull,'cutter-counter-transom');transom.position.set(0,deck+height*.44,baseZ);for(let side of [-1,1]){beam(gallery,V(side*width*.5,deck+.12,baseZ-depth),V(side*width*.5,deck+height*.72,baseZ+depth*.6),.045,materials.trim,'quarter-gallery-rail');for(let p=0;p<3;p++)beam(gallery,V(side*width*.5,deck+.12,baseZ-depth+p*depth*.7),V(side*width*.5,deck+height*.68,baseZ-depth+p*depth*.7),.026,materials.trim,'gallery-baluster');}for(let n=0;n<4;n++){const x=-width*.3+n*width*.2,pane=box(windows,.28,.32,.035,materials.glass,'counter-window');pane.position.set(x,deck+height*.52,baseZ+depth*.52);}
}
function buildBow(d,ctx){const {part,beam,box,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit'),base=deckY(d,.045)+d.deckHeightUnits*.18,tip=-d.hullLengthUnits*.5;
const length=d.beamUnits*1.42;beam(bowsprit,V(0,base,tip+d.hullLengthUnits*.12),V(0,base+d.deckHeightUnits*.32,tip-length),Math.max(.065,d.beamUnits*.02),materials.trim,'cutter-bowsprit');for(let side of [-1,1])beam(bow,V(side*.1,base+.1,tip+d.hullLengthUnits*.1),V(side*d.beamUnits*.18,base-.18,tip-d.beamUnits*.12),.035,materials.trim,'headrail');
if(d.headsails>0){const lashing=part('bowsprit-gammoning',bow);beam(lashing,V(0,base+.12,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.28,tip-d.beamUnits*.5),.026,materials.rope,'gammoning-line');}}
function buildRudderAndHelm(d,ctx){const {part,box,beam,materials,V}=ctx,rudder=part('rudder'),config=d.rudderDetails,stern=d.hullLengthUnits*.47;rudder.position.set(0,0,stern+config.pivotOffset);const width=d.beamUnits*config.breadthFactor*1,height=d.draftUnits*config.depthFactor,blade=box(rudder,width,height,.22,materials.trim,'cutter-rudder-blade');blade.position.set(0,-d.draftUnits*config.yFactor,0);beam(rudder,V(0,-d.draftUnits*.4,-.02),V(0,deckY(d,.97)+.22,0),Math.max(.045,d.beamUnits*.014),materials.trim,'rudder-stock');const helm=part('helm'),wheel=part('helm-wheel'),y=deckY(d,.83),z=d.hullLengthUnits*.31;beam(helm,V(0,y+.18,z),V(0,y+.9,z),.065,materials.trim,'helm-post');const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.44,.045,8,20),materials.trim,'helm-wheel-ring');ring.position.set(0,y+1.02,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y+1.02,z),V(Math.cos(a)*.44,y+1.02+Math.sin(a)*.44,z),.022,materials.trim,'helm-spoke');}}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx,rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){const points=[];for(let i=0;i<=42;i++){const t=.08+.84*i/42,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+.56,z=(t-.5)*d.hullLengthUnits;points.push(V(x,y,z));if(i%4===0)beam(group,V(x,y-.48,z),V(x,y+.02,z),.035,materials.trim,'rail-post-'+i);}tube(group,points,.052,materials.trim,'cutter-gunwale-rail',64);}
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 
 
}

function buildCanvasSail(ctx,name,mastId,corners,fullness=.09,parent=ctx.root,axis='z'){
 const {part,mesh,materials,THREE}=ctx;
 const control=part(name,parent);control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control),points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const span=(points[0].distanceTo(points[3])+points[1].distanceTo(points[2]))*.5;
 const height=(points[0].distanceTo(points[1])+points[3].distanceTo(points[2]))*.5;
 const sailProfile={camberScale:0.88,chordPower:1.3,verticalPower:0.91,leechBias:0.07,twistFactor:0.014};
 const reference=Math.max(.35,span,height*.52),camber=reference*THREE.MathUtils.clamp(fullness,.035,.15)*sailProfile.camberScale;
 const rows=18,columns=24,positions=[],indices=[];
 for(let row=0;row<=rows;row++){const v=row/rows;for(let col=0;col<=columns;col++){
  const u=col/columns,lower=points[0].clone().lerp(points[3],u),upper=points[1].clone().lerp(points[2],u),p=lower.lerp(upper,v);
  const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),sailProfile.chordPower),vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),sailProfile.verticalPower);
  const belly=camber*chord*vertical*(1+sailProfile.leechBias*(1-2*u)),twist=reference*sailProfile.twistFactor*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
  if(axis==='x'){p.x+=belly;p.z+=twist;}else{p.z+=belly;p.x+=twist;}
  positions.push(p.x,p.y,p.z);
 }}
 const stride=columns+1;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*stride+col;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 mesh(cloth,geometry,materials.sail,'sail-shaped-cloth');
 const seams=part('panel-seams-'+name,control);
 const vertexAt=(u,v)=>{const gx=THREE.MathUtils.clamp(u,0,1)*columns,gy=THREE.MathUtils.clamp(v,0,1)*rows,x0=Math.floor(gx),x1=Math.min(columns,x0+1),y0=Math.floor(gy),y1=Math.min(rows,y0+1),fx=gx-x0,fy=gy-y0;
  const read=(x,y)=>new THREE.Vector3(positions[(y*stride+x)*3],positions[(y*stride+x)*3+1],positions[(y*stride+x)*3+2]),p=read(x0,y0).lerp(read(x1,y0),fx).lerp(read(x0,y1).lerp(read(x1,y1),fx),fy);
  if(axis==='x')p.x+=.004;else p.z+=.004;return p;};
 const seam=(label,fixed,alongU)=>{const line=[];for(let i=0;i<=24;i++){const t=i/24;line.push(vertexAt(alongU?t:fixed,alongU?fixed:t));}ctx.tube(seams,line,.006,materials.sailShade,'sail-stitch-'+label,28);};
 for(let i=1;i<=3;i++)seam('reef-'+i,i/4,true);for(let i=1;i<=2;i++)seam('panel-'+i,i/3,false);
 return control;
}
function buildRig(d,ctx){
 const {THREE,part,beam,tube,materials,V}=ctx,head=part('head-sails');
 for(const mast of d.masts){
  const z=mast.z*d.hullLengthUnits,baseY=deckY(d,.5+mast.z*.45)+.12,totalHeight=mast.height*(4/3),topY=baseY+totalHeight,group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const lowerHeight=totalHeight*(d.structure.lowerMastRatio??.64),radius=d.beamUnits*(mast.rig==='junk'?.026:.018);
  const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
  beam(step,V(-.33,baseY-.18,z),V(.33,baseY-.18,z),.11,materials.trim,'mast-step-crossbeam');
  const lowerBase=Math.max(.12,radius*1.35),lowerTop=Math.max(.075,radius*.68);
  const lowerSpar=ctx.mesh(lower,new THREE.CylinderGeometry(lowerTop,lowerBase,lowerHeight,12,1),materials.trim,'lower-mast');lowerSpar.position.y=lowerHeight*.5;
  const topStart=lowerHeight-.12,topLength=totalHeight-topStart;
  const topSpar=ctx.mesh(topmast,new THREE.CylinderGeometry(Math.max(.035,radius*.34),Math.max(.055,radius*.68),topLength,10,1),materials.trim,'topmast');topSpar.position.y=topStart+topLength*.5;
  if(mast.rig==='junk'){
   const span=d.hullLengthUnits*(mast.span??.72)*.52,low=totalHeight*.09,high=totalHeight*.88;
   const yard=part('junk-yard-'+mast.id,group),boom=part('junk-boom-'+mast.id,group);
   const topForward=V(0,high,span*.06),topAft=V(0,high*.96,span*.90),bottomForward=V(0,low,0),bottomAft=V(0,low,span);
   beam(yard,topForward,topAft,Math.max(.08,radius*1.25),materials.trim,'junk-lug-yard');
   beam(boom,bottomForward,bottomAft,Math.max(.07,radius*1.05),materials.trim,'junk-lug-boom');
   buildCanvasSail(ctx,'sail-'+mast.id+'-junk',mast.id,[bottomForward,topForward,topAft,bottomAft],.095,group,'x');
   const battens=part('junk-battens-'+mast.id,group);
   for(let i=1;i<=9;i++){const f=i/10,y=low+(high-low)*f,left=span*(.035+.025*f),right=span*(.965-.065*f),batten=part('batten-'+mast.id+'-'+i,battens);beam(batten,V(0,y,left),V(0,y-.025,right),Math.max(.024,radius*.30),materials.trim,'bamboo-batten');}
   const sheets=part('junk-sheets-'+mast.id,group);tube(sheets,[V(.12,low+.18,span*.22),V(.22,low+.12,span*.7),V(.16,low+.1,span*.96)],.016,materials.rope,'junk-sheet-lines',24);
   continue;
  }
  const standing=part('standing-rigging-'+mast.id),shrouds=part('shrouds-'+mast.id,standing),ratlines=part('ratlines-'+mast.id,standing),stays=part('mast-stays-'+mast.id,standing),running=part('running-rigging-'+mast.id),braces=part('running-braces-'+mast.id,running);
  const railX=halfBreadth(d,.5+mast.z*.2)*.82,pairs=d.structure.shroudPairs??2;
  for(let side of [-1,1])for(let pair=0;pair<pairs;pair++){const spread=pairs<=1?0:pair/(pairs-1)-.5,attachZ=spread*d.beamUnits*.25;
   tube(shrouds,[V(side*.08,totalHeight-.1,0),V(side*.21,lowerHeight*.58,spread*d.beamUnits*.08),V(side*railX,deckY(d,.5+mast.z*.45)-baseY+.28,attachZ)],.019,materials.rope,'standing-shroud-'+side+'-'+pair,24);}
  for(let r=0;r<(d.structure.ratlines??8);r++){const y=lowerHeight*(r+1)/((d.structure.ratlines??8)+1),half=railX*.5;beam(ratlines,V(-half,y,0),V(half,y,0),.012,materials.rope,'ratline-'+r);}
  tube(stays,[V(0,totalHeight,0),V(0,.18,-d.hullLengthUnits*.43-z)],.018,materials.rope,'mast-stay',28);
  for(let side of [-1,1])tube(braces,[V(0,totalHeight*.88,0),V(side*d.beamUnits*.42,totalHeight*.83,d.hullLengthUnits*.055)],.014,materials.rope,'yard-brace-'+side,22);
  if(mast.rig==='square'||mast.rig==='brigantine'){
   if((mast.rig==='square'&&(mast.squares??2)>0)||mast.rig==='brigantine'){
    const platform=part('mast-platform-'+mast.id,group),disk=ctx.mesh(platform,new THREE.CylinderGeometry(Math.max(.40,d.beamUnits*.055),Math.max(.46,d.beamUnits*.062),.12,16),materials.trim,'top-platform');disk.position.set(0,lowerHeight*.86,0);}
   const levels=mast.rig==='square'?['course','topsail','topgallant'].slice(0,mast.squares??2):['topsail'],widths=[.40,.33,.26],starts=[.08,.31,.54];
   levels.forEach((level,index)=>{
    const width=d.hullLengthUnits*(mast.rig==='brigantine'?.32:(widths[index]??.24))*(d.structure.yardSpread??1)*(mast.yardScale??1);
    const y0=totalHeight*(mast.rig==='brigantine'?.48:starts[index]),y1=y0+totalHeight*(mast.rig==='brigantine'?.20:.22),yard=part('yard-'+mast.id+'-'+level,group);
    beam(yard,V(-width*.5,y1,0),V(width*.5,y1,0),Math.max(.055,radius*.72),materials.trim,'square-yard');
    buildCanvasSail(ctx,'sail-'+mast.id+'-'+level,mast.id,[V(-width*.49,y0,0),V(-width*.45,y1,0),V(width*.45,y1,0),V(width*.49,y0,0)],.09-index*.012,group);
    const sheets=part('sheets-'+mast.id+'-'+level,group);for(let side of [-1,1])beam(sheets,V(side*width*.46,y0,0),V(side*width*.46,y0-.24,.16),.016,materials.rope,'sail-sheet');
   });
  }
  if(mast.rig==='gaff'||mast.rig==='trysail'||mast.rig==='brigantine'||mast.spanker){
   const type=mast.rig==='trysail'?'trysail':mast.spanker?'spanker':'gaff',run=d.hullLengthUnits*(mast.span??.38)*1.16,low=totalHeight*.12,high=totalHeight*.82,headRun=run*.80,gaff=part('gaff-spar-'+mast.id,group),boom=part('boom-'+mast.id,group);
   beam(gaff,V(0,high,-.12),V(0,high+.05,headRun),.062,materials.trim,'gaff-spar');beam(boom,V(0,low,0),V(0,low,run),.068,materials.trim,'boom-spar');
   buildCanvasSail(ctx,'sail-'+mast.id+'-'+type,mast.id,[V(0,low,0),V(0,high,-.12),V(0,high+.05,headRun),V(0,low,run)],.10,group,'x');
  }else if(mast.rig==='lateen'){
   const span=d.hullLengthUnits*(mast.span??.42)*.94,low=totalHeight*.09,peak=totalHeight*.90,yard=part('lateen-yard-'+mast.id,group);
   beam(yard,V(0,peak,-span*.30),V(0,low,span),.075,materials.trim,'lateen-yard');
   buildCanvasSail(ctx,'sail-'+mast.id+'-lateen',mast.id,[V(0,low,0),V(0,peak,-span*.30),V(0,low,span),V(0,low+.12,span*.92)],.10,group,'x');
  }
 }
 for(let i=0;i<d.headsails;i++){
  const fore=d.masts[0],foreZ=fore.z*d.hullLengthUnits,foreBase=deckY(d,.5+fore.z*.45)+.12,foreTop=foreBase+fore.height*(4/3);
  const bowZ=-d.hullLengthUnits*.5-d.beamUnits*.68,bowY=deckY(d,.035)+.42,staySpan=foreZ-bowZ;
  const tackFraction=.015+i*.022,peakFraction=.96-i*.085,clewFraction=.53-i*.065;
  const tack=V(0,bowY,bowZ+staySpan*tackFraction),peak=V(0,bowY+(foreTop-bowY)*peakFraction,bowZ+staySpan*peakFraction),clew=V(0,bowY+.18,bowZ+staySpan*clewFraction);
  buildCanvasSail(ctx,'sail-head-'+(i+1),fore.id,[tack,peak,clew,tack],.085-i*.006,head,'x');
  const stays=part('head-stays-'+(i+1),head);tube(stays,[tack,peak],.014,materials.rope,'headstay-'+(i+1),28);tube(stays,[tack,clew],.011,materials.rope,'headsail-clew-line-'+(i+1),24);
 }
}
function buildAnchors(d,ctx){
 const {part,beam,tube,materials,V}=ctx,anchors=part('anchors');
 for(const side of [-1,1]){
  const suffix=side<0?'port':'starboard',anchor=part('anchor-'+suffix,anchors);
  const x=side*d.beamUnits*.46,y=deckY(d,.1)-.35,z=-d.hullLengthUnits*.38,span=d.beamUnits*.105*0.92;
  beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),Math.max(.04,d.beamUnits*.014*0.92),materials.iron,'cutter-anchor-shank');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),Math.max(.04,d.beamUnits*.016*0.92),materials.iron,'cutter-anchor-stock');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-port');
  beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-starboard');
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x,y-.28,z-.24),V(x*.92,y-.52,z-.44)],.022,materials.iron,'cutter-anchor-rode',18);
 }
}

function ensureSternTierComponents(d,ctx){
 const {part,box,materials,beam,V}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.62;
  const height=Math.max(.18,tier.h*0.62);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const centerY=deckY(d,.94)+height*(.44+index*.08),baseY=centerY-height*.5;
  const centerZ=d.hullLengthUnits*(.405+index*.014),z0=centerZ-depth*.5;
  const profile=new ctx.THREE.Shape();
  profile.moveTo(0,0);
  profile.lineTo(0,height*.68);
  profile.quadraticCurveTo(depth*.04,height*.96,depth*.14,height*.98);
  profile.lineTo(depth*.27,height*.93);
  profile.lineTo(depth*.40,height*.81);
  profile.lineTo(depth*.53,height*.67);
  profile.lineTo(depth*.66,height*.55);
  profile.lineTo(depth*.80,height*.43);
  profile.lineTo(depth*.92,height*.34);
  profile.lineTo(depth,height*.28);
  profile.lineTo(depth,0);
  profile.closePath();
  const bevel=Math.min(.032,width*.009,height*.024);
  const geometry=new ctx.THREE.ExtrudeGeometry(profile,{depth:width,steps:1,curveSegments:6,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
  geometry.rotateY(-Math.PI/2);
  geometry.translate(width*.5,baseY,z0);
  geometry.computeVertexNormals();
  ctx.mesh(component,geometry,materials.hull,'cutter-folded-aft-cabin-shell');
  const foldStations=[[0,.68],[.14,.98],[.27,.93],[.40,.81],[.53,.67],[.66,.55],[.80,.43],[.92,.34],[1,.28]];
  const ribRadius=Math.max(.017,d.beamUnits*.0023);
  for(let fold=0;fold<foldStations.length;fold++){
   const [along,rise]=foldStations[fold],z=z0+depth*along,y=baseY+height*rise;
   if(fold>0){
    const [prevAlong,prevRise]=foldStations[fold-1],prevZ=z0+depth*prevAlong,prevY=baseY+height*prevRise;
    for(const side of [-1,1])beam(component,V(side*width*.505,prevY,prevZ),V(side*width*.505,y,z),ribRadius,materials.trim,'folded-cabin-side-rib');
   }
   if(fold>0&&fold<foldStations.length-1)beam(component,V(-width*.51,y,z),V(width*.51,y,z),ribRadius*.8,materials.trim,'folded-cabin-cross-rib');
  }
  const paneW=Math.max(.18,depth*.12),paneH=Math.max(.15,height*.17),paneY=baseY+height*.34,paneZ=z0+depth*.17;
  for(const side of [-1,1]){
   const x=side*(width*.5+.018),pane=box(component,.035,paneH,paneW,materials.glass,'cabin-side-window');pane.position.set(x,paneY,paneZ);
   const fx=side*(width*.5+.041),y0=paneY-paneH*.58,y1=paneY+paneH*.58,zA=paneZ-paneW*.58,zB=paneZ+paneW*.58;
   beam(component,V(fx,y0,zA),V(fx,y0,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y1,zA),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zA),V(fx,y1,zA),ribRadius*.8,materials.trim,'cabin-window-frame');
   beam(component,V(fx,y0,zB),V(fx,y1,zB),ribRadius*.8,materials.trim,'cabin-window-frame');
  }
 });
}


function generateCutterGeometry(vessel,componentTransforms={},savedState={}){
 const ctx=createShipContext(vessel,{"hull":7754298,"plank":10846041,"deck":12690556,"sail":15787990});
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

export function createCutterModel(componentTransforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(CutterDefinition);
  return generateCutterGeometry(vessel, componentTransforms, savedState);
}
export function generateCutter(componentTransforms = {}, savedState = {}) {
  return createCutterModel(componentTransforms, savedState);
}
export const Cutter = Object.freeze({
  id: CutterDefinition.id,
  definition: CutterDefinition,
  design: CutterDefinition.design,
  structure: CutterDefinition.structure,
  editorModulePath: CutterDefinition.editorModulePath,
  createModel: createCutterModel,
  generate: generateCutter,
});
export const id = Cutter.id;
export const design = Cutter.design;
export const structure = Cutter.structure;
export const createModel = Cutter.createModel;
export const generate = Cutter.generate;
export default Cutter;
