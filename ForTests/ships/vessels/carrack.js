/**
 * carrack — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, resolveVesselForGeneration } from '../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../shared/ship-editor-kit.js';

export const CarrackDefinition = defineVesselSpec({
  id: 'carrack',
  design: {
    id: 'carrack', label: 'Iberian carrack / nao', era: '15th–16th century',
    hullLength: 32.3, beam: 10.5, draft: 4.0, freeboard: 2.55,
    rig: 'Three masts: square fore and main; lateen mizzen.',
    hullProfile: 'Broad, deep bulbous hull, narrow upper works, high forecastle and tall aftercastle.',
    reference: 'Carrack c. 1480 model at the German Historical Museum: 32.3 m × 10.5 m; the Mariners’ Museum describes the wide, deep cargo hull and mixed square/lateen three-mast rig.',
    sources: [{ label: 'Deutsches Historisches Museum — Carrack', url: 'https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/07-carrack/' }, { label: 'The Mariners’ Museum — Carrack / Nao', url: 'https://exploration.marinersmuseum.org/watercraft/carrack-nao/' }],
    hull: { fullness: 0.92, entry: 0.44, stern: 'transom', sternWidth: 0.42, tumblehome: 0.1, sheer: 0.18, bowRise: 0.44, sternRise: 0.5, keelDepth: 0.16, deckCamber: 0.2 },
    sternwork: 'high-aftercastle',
    sternTiers: [{"w":0.58,"d":0.16,"h":2.2},{"w":0.46,"d":0.14,"h":1.55},{"w":0.34,"d":0.12,"h":1.25}], bowwork: 'high-forecastle',
    keelDetails: {"pointOffset":0.06,"minimumRadius":0.08,"radiusFactor":0.018,"stemPosts":true,"label":"keelson-and-keel"},
    rudderDetails: {"pivotOffset":0.22,"yFactor":0.38,"breadthFactor":0.12,"depthFactor":0.8}, sailingSpeed: 6.5, handling: 0.55,
    masts: [
      { id: 'fore', z: -0.27, height: 22.8, rig: 'square', squares: 3 },
      { id: 'main', z: -0.035, height: 25.8, rig: 'square', squares: 3 },
      { id: 'mizzen', z: 0.29, height: 19.6, rig: 'lateen', span: 0.34, squares: 0 },
    ],
    headsails: 1, oars: false,
  },
  structure: { frameCount: 34, beamStation: .53, forebody: .76, aftbody: .78, foreTip: .006, aftTip: .17, bottomFlat: .45, bilge: .29, flare: .15, tumble: .08, sheer: 1.33, lowerMastRatio: .62, shroudPairs: 3, ratlines: 10, yardSpread: 1.12 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}
function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}
function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),belly=.93+.13*Math.exp(-Math.pow((t-.54)*3.4,2)),bow=.75+.25*Math.min(1,t*4.3),stern=.86+.14*Math.min(1,(1-t)*3.6);return d.beamUnits*.5*Math.pow(mid,.55)*belly*bow*stern;}
function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const lower=.78+.22*Math.sqrt(Math.max(0,v)),upper=1-d.structure.tumble*(Math.max(0,v-.58)/.42),bilge=1+.12*Math.sin(Math.PI*v);return V(Math.cos(a)*halfBreadth(d,t)*lower*upper*bilge,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
function buildHull(d,ctx){
 const {THREE,part,mesh,materials,V}=ctx,hullGroup=part('hull'),stations=100,rings=36,positions=[],indices=[];
 for(let i=0;i<=stations;i++){const t=i/stations;for(let j=0;j<=rings;j++){const q=hullPoint(d,t,j/rings*Math.PI*2);positions.push(q.x,q.y,q.z);}}
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 for(const i of [0,stations]){const t=i/stations,c=positions.length/3;positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(c,a,a+1);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(hullGroup,geometry,materials.hull,'carrack-individual-hull-loft');
 const deck=part('deck'),along=76,across=20,pos=[],faces=[];
 for(let i=0;i<=along;i++){const t=i/along,half=halfBreadth(d,t)*0.93;for(let j=0;j<=across;j++){const u=j/across*2-1;pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);}}
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){const u=(j+.5)/across*2-1;const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
 const deckGeo=new THREE.BufferGeometry();deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));deckGeo.setIndex(faces);deckGeo.computeVertexNormals();mesh(deck,deckGeo,materials.deck,'carrack-independent-deck-plan');
 const keel=part('keel'),keelLine=[];for(let i=0;i<=26;i++){const t=i/26;keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
 ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,d.keelDetails.label,64);
 const stem=part('stem');if(d.keelDetails.stemPosts){ctx.beam(stem,V(0,keelY(d,.012),-d.hullLengthUnits*.5),V(0,deckY(d,.012)+.2,-d.hullLengthUnits*.5),Math.max(.08,d.beamUnits*.023),materials.trim,'carrack-stem-post');
 ctx.beam(stem,V(0,keelY(d,.985),d.hullLengthUnits*.49),V(0,deckY(d,.985)+.18,d.hullLengthUnits*.49),d.beamUnits*.024,materials.trim,'aft-stern-post');}
}
function buildFramesAndPlanking(d,ctx){
 const {part,tube,materials,V}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){const t=0.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
  const pieces=44;for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,j/pieces*Math.PI*2));tube(frame,line,Math.max(.035,d.beamUnits*.006),materials.trim,'carrack-frame-rising',pieces);
 }
 const strakes=part('hull-strakes'),rows=8;
 for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.12+row*.76/Math.max(1,rows-1),line=[];
  for(let i=0;i<=68;i++){const t=.018+.964*i/68,a=Math.acos(2*level-1),q=hullPoint(d,t,side<0?-a:a);q.x=Math.abs(q.x)*side;q.y+=.018;line.push(q);}
  tube(strakes,line,Math.max(.015,d.beamUnits*.0032),row===0?materials.lower:materials.plank,'carrack-strake-'+side+'-'+row,72);
 }
 const seams=part('deck-planks');for(let line=-9;line<=9;line++){const u=line/10,points=[];for(let i=0;i<=42;i++){const t=.04+.92*i/42,half=halfBreadth(d,t)*.9;points.push(V(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+.025,(t-.5)*d.hullLengthUnits));}tube(seams,points,.012,materials.plank,'carrack-deck-seam-'+line,48);}
}
function buildStern(d,ctx){
 const {part,box,beam,materials,V}=ctx,stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern),baseZ=d.hullLengthUnits*0.355,deck=deckY(d,.94),tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const tierGroup=part('stern-tier-'+(index+1),stern),width=d.beamUnits*tier.w*(1-index*.055)*1.04,depth=d.hullLengthUnits*tier.d*(1-index*.035),height=tier.h*(4/3);
  const baseY=deck+tiers.slice(0,index).reduce((sum,item)=>sum+item.h*(4/3)+.08,0),centerZ=baseZ+index*depth*.22;
  const profile=new ctx.THREE.Shape();
  profile.moveTo(-width*.5,0);profile.lineTo(width*.5,0);profile.lineTo(width*0.45,height*.62);
  profile.quadraticCurveTo(width*0.43650,height*.82,width*0.36,height);
  profile.lineTo(-width*0.36,height);
  profile.quadraticCurveTo(-width*0.43650,height*.82,-width*0.45,height*.62);
  profile.closePath();
  const bevel=Math.max(.025,Math.min(width,height,depth)*.018);
  const geometry=new ctx.THREE.ExtrudeGeometry(profile,{depth,steps:1,curveSegments:8,bevelEnabled:true,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel});
  geometry.translate(0,0,-depth*.5);
  const body=ctx.mesh(tierGroup,geometry,materials.hull,'carrack-tapered-stern-tier');body.position.set(0,baseY,centerZ);
  const cap=box(tierGroup,width*1.035,.12,depth*1.06,materials.trim,'carrack-tier-cornice');cap.position.set(0,baseY+height+.035,centerZ);
  const bandY=baseY+height*.13,bandZ=centerZ+depth*.515;
  beam(gallery,V(-width*.455,bandY,bandZ),V(width*.455,bandY,bandZ),.032,materials.trim,'stern-moulding');
  const count=Math.max(2,Math.round(width/1.25)),paneW=Math.max(.22,width*.052),paneH=Math.max(.24,height*.17),windowY=baseY+height*.47,faceZ=centerZ+depth*.5+bevel*.8;
  for(let n=0;n<count;n++){
   const x=-width*.32+width*.64*n/Math.max(1,count-1),pane=box(windows,paneW,paneH,.045,materials.glass,'stern-window');pane.position.set(x,windowY,faceZ);
   const fx=paneW*.62,fy=paneH*.62,fz=faceZ+.028;
   beam(windows,V(x-fx,windowY-fy,fz),V(x+fx,windowY-fy,fz),.018,materials.brass,'stern-window-sill');
   beam(windows,V(x-fx,windowY+fy,fz),V(x+fx,windowY+fy,fz),.018,materials.brass,'stern-window-head');
   beam(windows,V(x-fx,windowY-fy,fz),V(x-fx,windowY+fy,fz),.018,materials.trim,'stern-window-jamb');
   beam(windows,V(x+fx,windowY-fy,fz),V(x+fx,windowY+fy,fz),.018,materials.trim,'stern-window-jamb');
   beam(windows,V(x,windowY-fy*.9,fz+.008),V(x,windowY+fy*.9,fz+.008),.012,materials.trim,'stern-window-mullion');
  }
  for(const side of [-1,1]){
   const railX=side*width*.49,railY=baseY+height*.22;
   beam(gallery,V(railX,railY,centerZ-depth*.42),V(railX,railY,centerZ+depth*.62),.035,materials.trim,'quarter-gallery-rail');
   beam(gallery,V(railX,railY-.12,centerZ-depth*.42),V(railX,railY-.12,centerZ+depth*.62),.025,materials.trim,'quarter-gallery-lower-rail');
   for(let post=0;post<5;post++){const z=centerZ-depth*.38+post*depth*.245;beam(gallery,V(railX,railY-.16,z),V(railX,railY+.035,z),.022,materials.trim,'quarter-gallery-baluster');}
  }
  const balcony=box(tierGroup,width*1.12,.09,depth*1.18,materials.deck,'carrack-stern-gallery-balcony');balcony.position.set(0,baseY+height*.11,centerZ+depth*.22);
  beam(gallery,V(-width*.55,baseY+height*.17,centerZ+depth*.78),V(width*.55,baseY+height*.17,centerZ+depth*.78),.035,materials.trim,'aft-balcony-rail');
  for(let post=-2;post<=2;post++){const x=post*width*.22;beam(gallery,V(x,baseY+height*.1,centerZ+depth*.78),V(x,baseY+height*.2,centerZ+depth*.78),.022,materials.trim,'aft-balcony-post');}
 });
}
function buildBow(d,ctx){const {part,beam,box,tube,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit'),base=deckY(d,.045)+d.deckHeightUnits*.18,tip=-d.hullLengthUnits*.5;
 const forecastle=part('carrack-forecastle',bow),forecastleDeck=part('carrack-forecastle-deck',forecastle),along=20,across=18,positions=[],faces=[];
 for(let i=0;i<=along;i++){const t=.045+.175*i/along,half=halfBreadth(d,t)*.86,z=(t-.5)*d.hullLengthUnits;for(let j=0;j<=across;j++){const u=j/across*2-1,camber=d.hull.deckCamber*d.deckHeightUnits*(1-u*u);positions.push(u*half,deckY(d,t)+d.deckHeightUnits*0.26+camber,z);}}
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
 const deckGeometry=new ctx.THREE.BufferGeometry();deckGeometry.setAttribute('position',new ctx.THREE.Float32BufferAttribute(positions,3));deckGeometry.setIndex(faces);deckGeometry.computeVertexNormals();
 ctx.mesh(forecastleDeck,deckGeometry,materials.deck,'carrack-raised-forecastle-platform');
 for(const side of [-1,1]){
  const railLine=[];
  for(let i=0;i<=20;i++){const t=.045+.175*i/20,x=side*halfBreadth(d,t)*.86,y=deckY(d,t)+d.deckHeightUnits*0.26+.34,z=(t-.5)*d.hullLengthUnits;railLine.push(V(x,y,z));if(i%4===0)beam(forecastle,V(x,y-.28,z),V(x,y+.04,z),.042,materials.trim,'forecastle-bulwark-stanchion');}
  tube(forecastle,railLine,.048,materials.trim,'forecastle-top-rail',48);tube(forecastle,railLine.map(p=>V(p.x,p.y-.16,p.z)),.026,materials.trim,'forecastle-lower-rail',48);
 }
 const aftZ=(.22-.5)*d.hullLengthUnits,aftHalf=halfBreadth(d,.22)*.82,aftY=deckY(d,.22)+d.deckHeightUnits*0.26;beam(forecastle,V(-aftHalf,aftY+.08,aftZ),V(aftHalf,aftY+.08,aftZ),.045,materials.trim,'forecastle-aft-cross-rail');
 const beakhead=part('carrack-beakhead',bow),length=d.beamUnits*.78;
 beam(beakhead,V(0,base,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.42,tip-length),d.beamUnits*.04,materials.trim,'beakhead-stem');
 const platform=box(beakhead,d.beamUnits*.34,.14,length*.82,materials.deck,'beakhead-platform');platform.position.set(0,base+d.deckHeightUnits*.24,tip-length*.52);
 for(const side of [-1,1])beam(beakhead,V(0,base+d.deckHeightUnits*.24,tip-length*.9),V(side*d.beamUnits*.19,base+d.deckHeightUnits*.2,tip),.035,materials.trim,'beakhead-cheek');
 if(d.headsails>0){const lashing=part('bowsprit-gammoning',bow);beam(lashing,V(0,base+.12,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.28,tip-d.beamUnits*.5),.026,materials.rope,'gammoning-line');}
}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx,rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){const points=[];for(let i=0;i<=42;i++){const t=.08+.84*i/42,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+.56,z=(t-.5)*d.hullLengthUnits;points.push(V(x,y,z));if(i%4===0)beam(group,V(x,y-.48,z),V(x,y+.02,z),.035,materials.trim,'gunwale-rail-post-'+i);}tube(group,points,.052,materials.trim,'carrack-gunwale-rail',64);}
 const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 const gunLevels=[0.75,0.53];
 for(let level=0;level<gunLevels.length;level++)for(let side of [-1,1]){const count=12;for(let i=0;i<count;i++){
  const t=.16+i/Math.max(1,count-1)*.68,point=hullPoint(d,t,Math.asin(2*gunLevels[level]-1)),x=side*(Math.abs(point.x)+.065),y=point.y,z=point.z;
  const portHole=box(fittings,.07,.34,.42,materials.lower,'gunport-'+level+'-'+side+'-'+i);portHole.position.set(x,y,z);
  const frameX=side*(Math.abs(point.x)+.11);
  beam(fittings,V(frameX,y-.19,z-.23),V(frameX,y-.19,z+.23),.024,materials.trim,'gunport-sill');
  beam(fittings,V(frameX,y+.19,z-.23),V(frameX,y+.19,z+.23),.024,materials.trim,'gunport-lintel');
  beam(fittings,V(frameX,y-.19,z-.23),V(frameX,y+.19,z-.23),.024,materials.trim,'gunport-jamb');
  beam(fittings,V(frameX,y-.19,z+.23),V(frameX,y+.19,z+.23),.024,materials.trim,'gunport-jamb');
  const cannon=part('deck-gun-'+level+'-'+side+'-'+i,fittings);
  beam(cannon,V(frameX+side*.01,y,z),V(frameX+side*.43,y,z),.058,materials.iron,'cannon-barrel',12);
  for(let wheel=0;wheel<2;wheel++){const w=ctx.mesh(cannon,new ctx.THREE.CylinderGeometry(.085,.085,.055,10),materials.trim,'gun-carriage-wheel');w.rotation.z=Math.PI/2;w.position.set(frameX+side*.14,y-.13,z+(wheel-.5)*.28);}
 }}
}
function buildCanvasSail(ctx,name,mastId,corners,fullness=.075,parent=ctx.root,axis='z'){
 const {part,mesh,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const rows=19,columns=21,positions=[],indices=[];
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let column=0;column<=columns;column++){
   const u=column/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const point=lower.lerp(upper,v);
   const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),1.14);
   const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),1.2);
   const bias=1+0.22*(u-.5)*2;
   const belly=fullness*chord*vertical*bias;
   const twist=0.0352*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
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
 mesh(cloth,geometry,materials.sail,'carrack-individually-shaped-cloth');

 const panelSeams=part('panel-seams-'+name,control);
 const vertexAt=(u,v)=>{
  const gx=THREE.MathUtils.clamp(u,0,1)*columns,gy=THREE.MathUtils.clamp(v,0,1)*rows;
  const x0=Math.floor(gx),x1=Math.min(columns,x0+1),y0=Math.floor(gy),y1=Math.min(rows,y0+1),fx=gx-x0,fy=gy-y0;
  const read=(x,y)=>new THREE.Vector3(positions[(y*stride+x)*3],positions[(y*stride+x)*3+1],positions[(y*stride+x)*3+2]);
  const p=read(x0,y0).lerp(read(x1,y0),fx).lerp(read(x0,y1).lerp(read(x1,y1),fx),fy);
  if(axis==='x')p.x+=.004;else p.z+=.004;
  return p;
 };
 const drawSeam=(label,fixed,alongU)=>{
  const line=[];for(let i=0;i<=18;i++){const t=i/18;line.push(vertexAt(alongU?t:fixed,alongU?fixed:t));}
  ctx.tube(panelSeams,line,.006,materials.sailShade,'sail-stitch-'+label,24);
 };
 for(let i=1;i<=3;i++)drawSeam('reef-'+i,i/4,true);
 for(let i=1;i<=2;i++)drawSeam('panel-'+i,i/3,false);

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
   levels.forEach((level,index)=>{const width=d.beamUnits*(.58+index*.07)*d.structure.yardSpread*1.18,y0=lowerHeight*.3+index*lowerHeight*.2,y1=Math.min(topY-baseY-.45,y0+lowerHeight*.19),yard=part('yard-'+mast.id+'-'+level,group);
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
  const x=side*d.beamUnits*.46,y=deckY(d,.1)-.35,z=-d.hullLengthUnits*.38,span=d.beamUnits*.105*1.18;
  beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),Math.max(.04,d.beamUnits*.014*1.18),materials.iron,'carrack-anchor-shank');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),Math.max(.04,d.beamUnits*.016*1.18),materials.iron,'carrack-anchor-stock');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-port');
  beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-starboard');
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x,y-.28,z-.24),V(x*.92,y-.52,z-.44)],.022,materials.iron,'carrack-anchor-rode',18);
 }
}

function ensureSternTierComponents(d,ctx){
 const {part,box,materials}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*1.02;
  const height=Math.max(.18,tier.h*1.02);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const shell=box(component,width,height,depth,materials.hull,'carrack-independent-stern-tier');
  shell.position.set(0,deckY(d,.94)+height*(.44+index*.08),d.hullLengthUnits*(.405+index*.014));
  const cap=box(component,width*1.04,.09,depth*1.04,materials.trim,'stern-tier-cap');
  cap.position.set(0,shell.position.y+height*.52,shell.position.z);
 });
}


function generateCarrackGeometry(vessel,componentTransforms={},savedState={}){
 const ctx=createShipContext(vessel,{"hull":6636334,"plank":9529922,"deck":11701600,"sail":15261126});
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

export function createCarrackModel(componentTransforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(CarrackDefinition);
  return generateCarrackGeometry(vessel, componentTransforms, savedState);
}
export function generateCarrack(componentTransforms = {}, savedState = {}) {
  return createCarrackModel(componentTransforms, savedState);
}
export const Carrack = Object.freeze({
  id: CarrackDefinition.id,
  definition: CarrackDefinition,
  design: CarrackDefinition.design,
  structure: CarrackDefinition.structure,
  editorModulePath: CarrackDefinition.editorModulePath,
  createModel: createCarrackModel,
  generate: generateCarrack,
});
export const id = Carrack.id;
export const design = Carrack.design;
export const structure = Carrack.structure;
export const createModel = Carrack.createModel;
export const generate = Carrack.generate;
export default Carrack;
