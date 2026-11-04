import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIP_DESIGNS, getShipDesign, setShipDesignOverrides } from '../ship-designs.js?v=0.8.5';
import { getHullHalfBeam,getSheerPoint,getShipStructureBlueprint,setShipStructureOverrides } from '../ship-structures.js?v=0.8.5';
import { cubicBezierScalar,getCrossSectionHalfBreadthRatio,getKeelLineHeight,getOpenHullPoint,getParametricHullPoint } from '../ship-hull-parameterization.js?v=0.8.5';
import { createShipModel,disposeShipModel } from '../ship-models.js?v=0.8.5';
const ids=Object.keys(SHIP_DESIGNS);
function meshNamed(root,name){let found=null;root.traverse(o=>{if(o.isMesh&&o.name===name)found=o;});return found;}

test('all 16 candidate vessels have matching profiles and valid dimensions',()=>{
 assert.equal(ids.length,16);
 for(const id of ids){const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id);
  assert.ok(p,id+' profile');assert.ok(d.hullLength>0&&d.beam>0&&d.draft>0,id+' dimensions');
  assert.ok(d.masts.length>0,id+' masts');assert.ok(d.partNames.includes('raised-decks'),id+' declared raised deck');
 }
});
test('Bezier planform endpoints and longitudinal half-beam remain bounded and monotonic',()=>{
 assert.equal(cubicBezierScalar(2,4,6,8,0),2);assert.equal(cubicBezierScalar(2,4,6,8,1),8);
 for(const id of ids){const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id),half=d.beamUnits*.5;
  assert.ok(Math.abs(getHullHalfBeam(d,0)-half*p.foreTip)<1e-6,id+' bow tip');
  assert.ok(Math.abs(getHullHalfBeam(d,p.beamStation)-half)<1e-6,id+' max beam');
  assert.ok(Math.abs(getHullHalfBeam(d,1)-half*p.aftTip)<1e-6,id+' stern tip');
  let previous=getHullHalfBeam(d,0);
  for(let i=1;i<=100;i++){const t=i/100,current=getHullHalfBeam(d,t);
   assert.ok(Number.isFinite(current)&&current>0,id+' station '+t);
   if(t<=p.beamStation)assert.ok(current+1e-6>=previous,id+' forebody monotonic');
   else assert.ok(current<=previous+1e-6,id+' aftbody monotonic');previous=current;
  }
 }
});
test('cross-sections are finite and never exceed specified moulded beam',()=>{
 for(const id of ids){const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id);let maximum=0;
  for(let i=0;i<=80;i++){const t=i/80,half=getHullHalfBeam(d,t);
   for(let j=0;j<=40;j++){const breadth=getCrossSectionHalfBreadthRatio(d,p,j/40);
    assert.ok(Number.isFinite(breadth)&&breadth>0,id+' breadth');maximum=Math.max(maximum,half*breadth);
   }
  }
  assert.ok(maximum<=d.beamUnits*.5+1e-6,id+' breadth exceeds beam');
 }
});
test('exact 2π seam is port-side and mirrored with starboard',()=>{
 for(const id of ids){const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id);
  for(const t of [0,.1,p.beamStation,.9,1]){
   const s=getParametricHullPoint(d,p,t,0,d.deckHeightUnits),q=getParametricHullPoint(d,p,t,Math.PI*2,d.deckHeightUnits);
   assert.ok(s.x>0&&q.x<0,id+' seam signs');assert.ok(Math.abs(s.x+q.x)<1e-6,id+' seam x');
   assert.ok(Math.abs(s.y-q.y)<1e-6&&Math.abs(s.z-q.z)<1e-6,id+' seam closure');
  }
 }
});
test('keel midbody datum and bow/stern rocker remain valid',()=>{
 for(const id of ids){const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id);
  const mid=getKeelLineHeight(d,p,.5),bow=getKeelLineHeight(d,p,0),stern=getKeelLineHeight(d,p,1);
  assert.ok(Math.abs(mid+d.draftUnits)<1e-6,id+' keel datum');assert.ok(bow>mid&&stern>mid,id+' rocker');
 }
});
test('sheer helper matches both port and starboard open hull surface',()=>{
 for(const id of ids){const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id);
  for(const t of [0,.03,.12,.35,p.beamStation,.75,.94,1])for(const side of [-1,1]){
   const edge=getSheerPoint(d,t,side),expected=getOpenHullPoint(d,p,t,1,side,edge.y);
   assert.ok(Math.abs(edge.x-expected.x)<1e-6&&Math.abs(edge.y-expected.y)<1e-6&&Math.abs(edge.z-expected.z)<1e-6,id+' sheer '+t);
  }
 }
});
test('all 16 models build with every declared part and finite mesh coordinates',()=>{
 for(const id of ids){const ship=createShipModel(id);
  try{const missing=SHIP_DESIGNS[id].partNames.filter(n=>!ship.userData.getPart(n));assert.deepEqual(missing,[],id+' missing component');
   ship.traverse(o=>{if(!o.isMesh)return;const a=o.geometry?.getAttribute('position');
    assert.ok(a&&a.count>0,id+' empty mesh '+o.name);
    for(let i=0;i<a.count;i++)assert.ok(Number.isFinite(a.getX(i))&&Number.isFinite(a.getY(i))&&Number.isFinite(a.getZ(i)),id+' invalid vertex '+o.name);
    const idx=o.geometry.getIndex();if(idx)for(const v of idx.array)assert.ok(v>=0&&v<a.count,id+' invalid index');
   });
  }finally{disposeShipModel(ship);}
 }
});
test('actual galleon deck and hull edges meet at bow, midbody and stern',()=>{
 const ship=createShipModel('galleon');
 try{const hull=meshNamed(ship,'lofted-hull-shell'),deck=meshNamed(ship,'cambered-weather-deck');
  const hp=hull.geometry.getAttribute('position'),dp=deck.geometry.getAttribute('position'),ring=41,stride=21;
  for(const i of [0,4,12,24,36,48,60,72,84,92,96]){const t=i/96,hr=i*ring,dr=Math.round(t*72)*stride;
   const star=getSheerPoint(SHIP_DESIGNS.galleon,t,1),port=getSheerPoint(SHIP_DESIGNS.galleon,t,-1);
   assert.ok(Math.abs(hp.getX(hr)-star.x)<1e-5&&Math.abs(hp.getY(hr)-star.y)<1e-5&&Math.abs(hp.getZ(hr)-star.z)<1e-5,'starboard hull '+t);
   assert.ok(Math.abs(hp.getX(hr+40)-port.x)<1e-5&&Math.abs(hp.getY(hr+40)-port.y)<1e-5&&Math.abs(hp.getZ(hr+40)-port.z)<1e-5,'port hull '+t);
   assert.ok(Math.abs(dp.getX(dr)-port.x)<1e-5&&Math.abs(dp.getX(dr+20)-star.x)<1e-5,'deck X '+t);
   assert.ok(Math.abs(dp.getZ(dr)-port.z)<1e-5&&Math.abs(dp.getZ(dr+20)-star.z)<1e-5,'deck Z '+t);
  }
 }finally{disposeShipModel(ship);}
});
test('rake and additive mast lean work for each vessel family',()=>{
 for(const id of ids){const ship=createShipModel(id);
  try{const d=SHIP_DESIGNS[id],p=getShipStructureBlueprint(id),mast=d.masts[0];
   const expected=Number.isFinite(mast.rake)?mast.rake:(p.mastRakeDeg??0)*Math.PI/180;
   const group=ship.userData.getPart('mast-'+mast.id);
   assert.ok(Math.abs(group.rotation.x-expected)<1e-8,id+' mast rake');
   assert.equal(ship.userData.setMastLean(mast.id,.04),true);
   assert.ok(Math.abs(group.rotation.x-(expected+.04))<1e-8,id+' lean');
  }finally{disposeShipModel(ship);}
 }
});
test('raised decks are compatible with the editable part API',()=>{
 const ship=createShipModel('galleon');
 try{const p=ship.userData.getPart('raised-decks');assert.ok(p);
  assert.equal(ship.userData.setPartVisible('raised-decks',false),true);assert.equal(p.visible,false);
  assert.equal(ship.userData.setPartVisible('raised-decks',true),true);
  assert.equal(ship.userData.detachPart('raised-decks'),true);assert.equal(ship.userData.relinkPart('raised-decks'),true);
 }finally{disposeShipModel(ship);}
});
test('raked hull end caps are present',()=>{
 const ship=createShipModel('galleon');
 try{const hull=meshNamed(ship,'lofted-hull-shell'),pos=hull.geometry.getAttribute('position');
  assert.equal(pos.count,(96+1)*(40+1)+2);assert.ok(hull.geometry.getIndex().count>96*40*6);
 }finally{disposeShipModel(ship);}
});

test('component transforms support scale and persist when a model is rebuilt',()=>{
 const first=createShipModel('sloop');
 let saved={};
 try{
  assert.equal(first.userData.setPartTransform('mast-single',{x:.4,ry:.2,sx:1.25,sy:1.1,sz:.9}),true);
  saved={'mast-single':first.userData.getPartTransform('mast-single')};
  const state=saved['mast-single'];
  assert.ok(Math.abs(state.x-.4)<1e-8&&Math.abs(state.ry-.2)<1e-8&&Math.abs(state.sx-1.25)<1e-8);
 }finally{disposeShipModel(first);}
 const second=createShipModel('sloop',saved);
 try{
  const state=second.userData.getPartTransform('mast-single');
  assert.ok(Math.abs(state.x-.4)<1e-8&&Math.abs(state.ry-.2)<1e-8&&Math.abs(state.sx-1.25)<1e-8);
 }finally{disposeShipModel(second);}
});

test('live design and structure overrides feed the parametric model helpers',()=>{
 const base=getShipDesign('sloop');
 try{
  assert.equal(setShipDesignOverrides('sloop',{beam:5.2,hull:{fullness:.72}}),true);
  assert.equal(setShipStructureOverrides('sloop',{beamStation:.42}),true);
  const edited=getShipDesign('sloop');
  const profile=getShipStructureBlueprint('sloop');
  assert.ok(Math.abs(edited.beam-5.2)<1e-9);
  assert.ok(Math.abs(edited.hull.fullness-.72)<1e-9);
  assert.ok(Math.abs(edited.beamUnits-5.2*4/3)<1e-9);
  assert.ok(Math.abs(profile.beamStation-.42)<1e-9);
  assert.ok(Math.abs(getHullHalfBeam(edited,.42)-edited.beamUnits*.5)<1e-6);
 }finally{
  setShipDesignOverrides('sloop',{});
  setShipStructureOverrides('sloop',{});
 }
 assert.ok(Math.abs(getShipDesign('sloop').beam-base.beam)<1e-9);
});

test('resetPartTransform restores the true original parent, visibility and transform',()=>{
 const ship=createShipModel('sloop');
 try{
  const part=ship.userData.getPart('mast-single');
  const originalParent=part.parent;
  const originalPosition=part.position.clone();
  const originalRotation=part.rotation.clone();
  const originalScale=part.scale.clone();
  assert.equal(ship.userData.setPartTransform('mast-single',{x:1.25,y:.4,z:-.6,rx:.2,ry:-.15,rz:.1,sx:1.4,sy:1.2,sz:.8}),true);
  assert.equal(ship.userData.setPartVisible('mast-single',false),true);
  assert.equal(ship.userData.detachPart('mast-single'),true);
  assert.notEqual(part.parent,originalParent);
  assert.equal(part.visible,false);
  assert.equal(ship.userData.resetPartTransform('mast-single'),true);
  assert.equal(part.parent,originalParent);
  assert.equal(part.visible,true);
  assert.ok(part.position.distanceTo(originalPosition)<1e-8);
  assert.ok(Math.abs(part.rotation.x-originalRotation.x)<1e-8);
  assert.ok(Math.abs(part.rotation.y-originalRotation.y)<1e-8);
  assert.ok(Math.abs(part.rotation.z-originalRotation.z)<1e-8);
  assert.ok(part.scale.distanceTo(originalScale)<1e-8);
  const offset=ship.userData.getPartTransform('mast-single');
  assert.ok(Math.abs(offset.x)<1e-8&&Math.abs(offset.y)<1e-8&&Math.abs(offset.z)<1e-8);
  assert.ok(Math.abs(offset.sx-1)<1e-8&&Math.abs(offset.sy-1)<1e-8&&Math.abs(offset.sz-1)<1e-8);
  assert.deepEqual(ship.userData.getShipState().unlinkedParts,[]);
 }finally{disposeShipModel(ship);}
});
test('getShipState captures live Object3D changes made by the transform gizmo',()=>{
 const ship=createShipModel('sloop');
 try{
  const mast=ship.userData.getPart('mast-single');
  mast.position.x+=.75;
  mast.rotation.y+=.12;
  mast.scale.z*=1.15;
  const saved=ship.userData.getShipState().partTransforms['mast-single'];
  assert.ok(saved);
  assert.ok(Math.abs(saved.x-.75)<1e-8);
  assert.ok(Math.abs(saved.ry-.12)<1e-8);
  assert.ok(Math.abs(saved.sz-1.15)<1e-8);
  const restored=createShipModel('sloop',ship.userData.getShipState().partTransforms);
  try{
   const value=restored.userData.getPartTransform('mast-single');
   assert.ok(Math.abs(value.x-.75)<1e-8&&Math.abs(value.ry-.12)<1e-8&&Math.abs(value.sz-1.15)<1e-8);
  }finally{disposeShipModel(restored);}
 }finally{disposeShipModel(ship);}
});
