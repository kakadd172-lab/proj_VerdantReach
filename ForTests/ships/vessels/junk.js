/**
 * junk — standalone ship definition and independent geometry generator.
 * Owns this vessel's historical dimensions, hull lines, structure, bow/stern
 * geometry profile, keel and rudder configuration, rig plan and generator.
 */
import { defineVesselSpec, resolveVesselForGeneration } from '../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../shared/ship-editor-kit.js';

export const JunkDefinition = defineVesselSpec({
  id: 'junk',
  design: {
    id: 'junk', label: 'Chinese ocean junk', era: 'Historically varied; broad reference model',
    hullLength: 34.0, beam: 8.8, draft: 2.45, freeboard: 2.15,
    rig: 'Three heavy, largely unstayed masts with broad battened lug sails and independent sheet groups.',
    hullProfile: 'Broad, comparatively flat-bottomed hull with rocker, high bow and stern, and overhanging upper works.',
    reference: 'Original Verdant Reach reconstruction inspired by the Chinese Junk added to the reference game. The three-mast rig and hull family are supported by museum models; 34.0 × 8.8 m is a game-scale estimate, not a measurement of the game vessel.',
    sources: [
      { label: 'Royal Museums Greenwich — Chinese pole junk model', url: 'https://www.rmg.co.uk/collections/objects/rmgc-object-68643' },
      { label: 'Channel Islands Maritime Museum — Chinese Junk', url: 'https://maritime-museum.org/north-gallery/chinese-junk/' },
      { label: 'App Store — The Pirate: Plague of the Dead version history', url: 'https://apps.apple.com/in/app/the-pirate-plague-of-the-dead/id1242811938' },
    ],
    hull: { fullness: 0.84, entry: 0.52, stern: 'transom', sternWidth: 0.46, tumblehome: 0.035, sheer: 0.19, bowRise: 0.48, sternRise: 0.42, keelDepth: 0.045, deckCamber: 0.085 },
    sternwork: 'low-cabin',
    sternTiers: [{"w":0.42,"d":0.12,"h":1.3}], bowwork: 'none',
    keelDetails: {"pointOffset":0.02,"minimumRadius":0.04,"radiusFactor":0.006,"stemPosts":false,"label":"shallow-centre-keelson"},
    rudderDetails: {"pivotOffset":0.12,"yFactor":0.3,"breadthFactor":0.2,"depthFactor":1.12}, sailingSpeed: 7.4, handling: 0.84,
    masts: [
      { id: 'fore', z: -0.29, height: 20.5, rig: 'junk', span: 0.72 },
      { id: 'main', z: -0.015, height: 24.2, rig: 'junk', span: 0.78 },
      { id: 'mizzen', z: 0.29, height: 18.2, rig: 'junk', span: 0.66 },
    ],
    headsails: 0, oars: false,
  },
  structure: { frameCount: 32, beamStation: .5, forebody: .82, aftbody: .84, foreTip: .08, aftTip: .12, bottomFlat: .62, bilge: .09, flare: .035, tumble: .015, sheer: 1.24, lowerMastRatio: .7, shroudPairs: 0, ratlines: 0, yardSpread: 1.02 },
});


import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}
function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}
function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),boxy=1+.09*Math.cos(2*Math.PI*t),fore=.88+.12*Math.min(1,t*2.8),aft=.94+.06*Math.min(1,(1-t)*2.8);return d.beamUnits*.5*Math.pow(mid,.39)*boxy*fore*aft;}
function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const side=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.24),chine=v<.25?.82+.18*v/.25:1-.07*(v-.25),flat=1-.04*Math.pow(1-v,2);return V(side*halfBreadth(d,t)*chine*flat,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
function buildHull(d,ctx){
 const {THREE,part,mesh,materials,V}=ctx,hullGroup=part('hull'),stations=84,rings=36,positions=[],indices=[];
 for(let i=0;i<=stations;i++){const t=i/stations;for(let j=0;j<=rings;j++){const q=hullPoint(d,t,j/rings*Math.PI*2);positions.push(q.x,q.y,q.z);}}
 const stride=rings+1;
 for(let i=0;i<stations;i++)for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
 for(const i of [0,stations]){const t=i/stations,c=positions.length/3;positions.push(0,(deckY(d,t)+keelY(d,t))*.5,(t-.5)*d.hullLengthUnits);for(let j=0;j<rings;j++){const a=i*stride+j;indices.push(c,a,a+1);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh(hullGroup,geometry,materials.hull,'junk-individual-hull-loft');
 const deck=part('deck'),along=76,across=20,pos=[],faces=[];
 for(let i=0;i<=along;i++){const t=i/along,half=halfBreadth(d,t)*0.91;for(let j=0;j<=across;j++){const u=j/across*2-1;pos.push(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u),(t-.5)*d.hullLengthUnits);}}
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){const u=(j+.5)/across*2-1;const a=i*(across+1)+j;faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
 const deckGeo=new THREE.BufferGeometry();deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));deckGeo.setIndex(faces);deckGeo.computeVertexNormals();mesh(deck,deckGeo,materials.deck,'junk-independent-deck-plan');
 const keel=part('keel'),keelLine=[];for(let i=0;i<=26;i++){const t=i/26;keelLine.push(V(0,keelY(d,t)-d.keelDetails.pointOffset,(t-.5)*d.hullLengthUnits));}
 ctx.tube(keel,keelLine,Math.max(d.keelDetails.minimumRadius,d.beamUnits*d.keelDetails.radiusFactor),materials.trim,d.keelDetails.label,64);
 const stem=part('stem');if(d.keelDetails.stemPosts){ctx.beam(stem,V(0,keelY(d,.012),-d.hullLengthUnits*.5),V(0,deckY(d,.012)+.2,-d.hullLengthUnits*.5),Math.max(.08,d.beamUnits*.023),materials.trim,'junk-stem-post');
 }
}
function buildFramesAndPlanking(d,ctx){
 const {part,tube,materials,V}=ctx;
 for(let i=0;i<d.structure.frameCount;i++){const t=0.025+.95*i/Math.max(1,d.structure.frameCount-1),frame=part('frame-'+String(i+1).padStart(2,'0')),line=[];
  const pieces=44;for(let j=0;j<=pieces;j++)line.push(hullPoint(d,t,j/pieces*Math.PI*2));tube(frame,line,Math.max(.035,d.beamUnits*.006),materials.trim,'junk-frame-rising',pieces);
 }
 const strakes=part('hull-strakes'),rows=5;
 for(const side of [-1,1])for(let row=0;row<rows;row++){const level=.12+row*.76/Math.max(1,rows-1),line=[];
  for(let i=0;i<=68;i++){const t=.018+.964*i/68,a=Math.acos(2*level-1),q=hullPoint(d,t,side<0?-a:a);q.x=Math.abs(q.x)*side;q.y+=.018;line.push(q);}
  tube(strakes,line,Math.max(.015,d.beamUnits*.0032),row===0?materials.lower:materials.plank,'junk-strake-'+side+'-'+row,72);
 }
 const seams=part('deck-planks');for(let line=-9;line<=9;line++){const u=line/10,points=[];for(let i=0;i<=42;i++){const t=.04+.92*i/42,half=halfBreadth(d,t)*.9;points.push(V(u*half,deckY(d,t)+d.hull.deckCamber*d.deckHeightUnits*(1-u*u)+.025,(t-.5)*d.hullLengthUnits));}tube(seams,points,.012,materials.plank,'junk-deck-seam-'+line,48);}
}
function buildStern(d,ctx){
 const {part,box,beam,materials,V}=ctx,stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern),baseZ=d.hullLengthUnits*.405,deck=deckY(d,.94),tiers=d.sternTiers||[];
 const width=d.beamUnits*.56,height=d.deckHeightUnits*.62,depth=d.hullLengthUnits*.06,transom=box(stern,width,height,depth,materials.hull,'junk-counter-transom');transom.position.set(0,deck+height*.44,baseZ);for(let side of [-1,1]){beam(gallery,V(side*width*.5,deck+.12,baseZ-depth),V(side*width*.5,deck+height*.72,baseZ+depth*.6),.045,materials.trim,'quarter-gallery-rail');for(let p=0;p<3;p++)beam(gallery,V(side*width*.5,deck+.12,baseZ-depth+p*depth*.7),V(side*width*.5,deck+height*.68,baseZ-depth+p*depth*.7),.026,materials.trim,'gallery-baluster');}for(let n=0;n<4;n++){const x=-width*.3+n*width*.2,pane=box(windows,.28,.32,.035,materials.glass,'counter-window');pane.position.set(x,deck+height*.52,baseZ+depth*.52);}
}
function buildBow(d,ctx){const {part,box,materials}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit');}
function buildRudderAndHelm(d,ctx){const {part,box,beam,materials,V}=ctx,rudder=part('rudder'),config=d.rudderDetails,stern=d.hullLengthUnits*.47;rudder.position.set(0,0,stern+config.pivotOffset);const width=d.beamUnits*config.breadthFactor*1.4,height=d.draftUnits*config.depthFactor,blade=box(rudder,width,height,.22,materials.trim,'junk-rudder-blade');blade.position.set(0,-d.draftUnits*config.yFactor,0);beam(rudder,V(0,-d.draftUnits*.4,-.02),V(0,deckY(d,.97)+.22,0),Math.max(.045,d.beamUnits*.014),materials.trim,'rudder-stock');const helm=part('helm'),wheel=part('helm-wheel'),y=deckY(d,.83),z=d.hullLengthUnits*.31;beam(helm,V(0,y+.18,z),V(0,y+.9,z),.065,materials.trim,'helm-post');const ring=ctx.mesh(wheel,new ctx.THREE.TorusGeometry(.44,.045,8,20),materials.trim,'helm-wheel-ring');ring.position.set(0,y+1.02,z);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,V(0,y+1.02,z),V(Math.cos(a)*.44,y+1.02+Math.sin(a)*.44,z),.022,materials.trim,'helm-spoke');}}
function buildRailingsAndEquipment(d,ctx){
 const {part,beam,tube,box,materials,V}=ctx,rail=part('railings'),port=part('railings-port',rail),starboard=part('railings-starboard',rail);
 for(const [side,group] of [[-1,port],[1,starboard]]){const points=[];for(let i=0;i<=42;i++){const t=.08+.84*i/42,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+.56,z=(t-.5)*d.hullLengthUnits;points.push(V(x,y,z));if(i%4===0)beam(group,V(x,y-.48,z),V(x,y+.02,z),.035,materials.trim,'rail-post-'+i);}tube(group,points,.052,materials.trim,'junk-gunwale-rail',64);}
 const fittings=part('deck-fittings');
 for(let h=0;h<3;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 
 
}
function buildRig(d,ctx){
 const {part,beam,tube,sail,materials,V}=ctx,head=part('head-sails');
 for(const mast of d.masts){
  const z=mast.z*d.hullLengthUnits,baseY=deckY(d,.5+mast.z*.45)+.12,topY=baseY+mast.height*(4/3),group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);group.userData.mastControl={mastId:mast.id};
  const lowerHeight=(topY-baseY)*.76,radius=d.beamUnits*(mast.rig==='junk'?.027:.018)*1;
  const lower=part('mast-lower-'+mast.id,group),topmast=part('mast-topmast-'+mast.id,group),step=part('mast-step-'+mast.id);
  beam(step,V(-.33,baseY-.18,z),V(.33,baseY-.18,z),.11,materials.trim,'mast-step-crossbeam');
  beam(lower,V(0,0,0),V(0,lowerHeight,0),Math.max(.12,radius),materials.trim,'lower-mast');
  beam(topmast,V(0,lowerHeight-.12,0),V(0,topY-baseY,0),Math.max(.075,radius*.7),materials.trim,'topmast');
  if(mast.rig==='junk'){
   const runningLines=part('running-rigging-'+mast.id);
   const yard=part('junk-yard-'+mast.id,group),span=d.hullLengthUnits*(mast.span??.72)*.36;
   beam(yard,V(0,topY-baseY-.12,-.08),V(0,topY-baseY-.2,span),Math.max(.08,radius*1.3),materials.trim,'junk-lug-yard');
   sail('sail-'+mast.id+'-junk',mast.id,[V(0,.2,0),V(0,topY-baseY-.22,-.06),V(0,topY-baseY-.3,span),V(0,.2,span)],.13,group,'x');
   const battens=part('junk-battens-'+mast.id,group);
   for(let i=1;i<=7;i++){const f=i/8,y=.2+(topY-baseY-.45)*f,reach=span*(1-.07*f),batten=part('batten-'+mast.id+'-'+i,battens);beam(batten,V(0,y,0),V(0,y-.04,reach),Math.max(.025,radius*.3),materials.trim,'bamboo-batten');}
   const sheets=part('junk-sheets-'+mast.id,group);tube(sheets,[V(.12,.35,span*.2),V(.22,.28,span*.7),V(.16,.25,span)],.016,materials.rope,'junk-sheet-lines',22);continue;
  }
  const standing=part('standing-rigging-'+mast.id),shrouds=part('shrouds-'+mast.id,standing),ratlines=part('ratlines-'+mast.id,standing),stays=part('mast-stays-'+mast.id,standing),running=part('running-rigging-'+mast.id),braces=part('running-braces-'+mast.id,running);
  const railX=halfBreadth(d,.5+mast.z*.2)*.82,pairs=d.structure.shroudPairs??2;
  for(let side of [-1,1])for(let pair=0;pair<pairs;pair++){const spread=pairs<=1?0:pair/(pairs-1)-.5,attachZ=z+spread*d.beamUnits*.25;
   tube(shrouds,[V(side*.08,topY-base-.1,0),V(side*.21,lowerHeight*.58,spread*d.beamUnits*.08),V(side*railX,deckY(d,.5+mast.z*.45)-baseY+.28,attachZ-z)],.019,materials.rope,'standing-shroud-'+side+'-'+pair,20);}
  for(let r=0;r<(d.structure.ratlines??8);r++){const y=lowerHeight*(r+1)/((d.structure.ratlines??8)+1),half=railX*.5;beam(ratlines,V(-half,y,0),V(half,y,0),.012,materials.rope,'ratline-'+r);}
  tube(stays,[V(0,topY-baseY,0),V(0,.18,-d.hullLengthUnits*.43-z)],.018,materials.rope,'mast-stay',26);
  for(let side of [-1,1])tube(braces,[V(0,topY-baseY*.12,0),V(side*d.beamUnits*.42,topY-baseY*.14,d.hullLengthUnits*.055)],.014,materials.rope,'yard-brace-'+side,20);
  if(mast.rig==='square'||mast.rig==='brigantine'){
   if(mast.rig==='square'&&mast.squares>0){const platform=part('mast-platform-'+mast.id,group),disk=ctx.mesh(platform,new ctx.THREE.CylinderGeometry(.56,.64,.12,12),materials.trim,'top-platform');disk.position.set(0,lowerHeight*.84,0);}
   const levels=mast.rig==='square'?['course','topsail','topgallant'].slice(0,mast.squares??2):['topsail'];
   levels.forEach((level,index)=>{const width=d.beamUnits*(.58+index*.07)*d.structure.yardSpread*1,y0=lowerHeight*.3+index*lowerHeight*.2,y1=Math.min(topY-baseY-.45,y0+lowerHeight*.19),yard=part('yard-'+mast.id+'-'+level,group);
    beam(yard,V(-width*.5,y1,0),V(width*.5,y1,0),Math.max(.045,radius*.7),materials.trim,'square-yard');
    sail('sail-'+mast.id+'-'+level,mast.id,[V(-width*.48,y0,0),V(-width*.43,y1,0),V(width*.43,y1,0),V(width*.48,y0,0)],.08+index*.012,group);
    const sheets=part('sheets-'+mast.id+'-'+level,group);for(let side of [-1,1])beam(sheets,V(side*width*.45,y0,0),V(side*width*.45,y0-.28,.18),.016,materials.rope,'sail-sheet');
   });
  }
  if(mast.rig==='gaff'||mast.rig==='trysail'||mast.rig==='brigantine'||mast.spanker){
   const type=mast.rig==='trysail'?'trysail':mast.spanker?'spanker':'gaff',run=d.hullLengthUnits*(mast.span??.38),low=lowerHeight*.14,high=lowerHeight*.82,gaff=part('gaff-spar-'+mast.id,group),boom=part('boom-'+mast.id,group);
   beam(gaff,V(0,high,-.12),V(0,high+.08,run),.062,materials.trim,'gaff-spar');beam(boom,V(0,low,0),V(0,low,run*1.02),.068,materials.trim,'boom-spar');
   sail('sail-'+mast.id+'-'+type,mast.id,[V(0,low,0),V(0,high,-.12),V(0,high+.08,run),V(0,low,run*1.02)],.095,group,'x');
  }else if(mast.rig==='lateen'){
   const span=d.hullLengthUnits*(mast.span??.42)*.65,yard=part('lateen-yard-'+mast.id,group);
   beam(yard,V(0,topY-baseY-.3,-span*.45),V(0,.3,span),.075,materials.trim,'lateen-yard');
   sail('sail-'+mast.id+'-lateen',mast.id,[V(0,.25,0),V(0,topY-baseY-.3,-span*.45),V(0,.3,span),V(0,.2,span*.92)],.1,group,'x');
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
  const x=side*d.beamUnits*.46,y=deckY(d,.1)-.35,z=-d.hullLengthUnits*.38,span=d.beamUnits*.105*1.1;
  beam(anchor,V(x,y,z),V(x,y-d.draftUnits*.42,z),Math.max(.04,d.beamUnits*.014*1.1),materials.iron,'junk-anchor-shank');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x+span,y-d.draftUnits*.35,z),Math.max(.04,d.beamUnits*.016*1.1),materials.iron,'junk-anchor-stock');
  beam(anchor,V(x-span,y-d.draftUnits*.35,z),V(x-span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-port');
  beam(anchor,V(x+span,y-d.draftUnits*.35,z),V(x+span*.42,y-d.draftUnits*.58,z),Math.max(.03,d.beamUnits*.012),materials.iron,'anchor-fluke-starboard');
  const chain=part('anchor-chain-'+suffix,anchors);
  tube(chain,[V(x,y,z),V(x,y-.28,z-.24),V(x*.92,y-.52,z-.44)],.022,materials.iron,'junk-anchor-rode',18);
 }
}
function generateJunkGeometry(vessel,componentTransforms={},savedState={}){
 const ctx=createShipContext(vessel,{"hull":5981751,"plank":9203277,"deck":11111011,"sail":14271906,"flag":10370866});
 buildHull(ctx.design,ctx);
 buildFramesAndPlanking(ctx.design,ctx);
 buildStern(ctx.design,ctx);
 buildBow(ctx.design,ctx);
 buildRudderAndHelm(ctx.design,ctx);
 buildRailingsAndEquipment(ctx.design,ctx);
 buildRig(ctx.design,ctx);
 return finishShipModel(ctx,componentTransforms,savedState);
}

export function createJunkModel(componentTransforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(JunkDefinition);
  return generateJunkGeometry(vessel, componentTransforms, savedState);
}
export function generateJunk(componentTransforms = {}, savedState = {}) {
  return createJunkModel(componentTransforms, savedState);
}
export const Junk = Object.freeze({
  id: JunkDefinition.id,
  definition: JunkDefinition,
  design: JunkDefinition.design,
  structure: JunkDefinition.structure,
  editorModulePath: JunkDefinition.editorModulePath,
  createModel: createJunkModel,
  generate: generateJunk,
});
export const id = Junk.id;
export const design = Junk.design;
export const structure = Junk.structure;
export const createModel = Junk.createModel;
export const generate = Junk.generate;
export default Junk;
