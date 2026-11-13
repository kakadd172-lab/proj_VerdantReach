import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShipModel } from '../ships/index.js';
import { SloopV2Definition } from '../ships/vessels/sloop-v2/sloop-v2.js';
import { resolveVesselForGeneration } from '../ships/shared/vessel-definition.js';
import { disposeShipModel } from '../ships/shared/ship-editor-kit.js';
import { deckY,halfBreadth,hullPoint,sectionBreadth,stationZ } from '../ships/vessels/sloop-v2/architecture/hull-geometry.js';

const DESIGN=resolveVesselForGeneration(SloopV2Definition).design;

function firstMesh(part){
 let result=null;part?.traverse(object=>{if(object.isMesh&&!result)result=object;});return result;
}
function ringCenter(attribute,ring,segments,radialSegments){
 const stride=radialSegments+1,offset=ring*stride*3,center=new THREE.Vector3();
 for(let i=0;i<=radialSegments;i++){
  const index=offset+i*3;
  center.add(new THREE.Vector3(attribute.array[index],attribute.array[index+1],attribute.array[index+2]));
 }
 return center.multiplyScalar(1/stride);
}

test('Sloop V2 port and starboard sheer edges seat directly on the deck',()=>{
 const ship=createShipModel('sloop-v2');
 try{
  const hull=firstMesh(ship.userData.getPart('hull')),deck=firstMesh(ship.userData.getPart('deck'));
  assert.ok(hull?.geometry?.attributes?.position,'independent hull loft exists');
  assert.ok(deck?.geometry?.attributes?.position,'separate deck surface exists');
  const hp=hull.geometry.attributes.position,dp=deck.geometry.attributes.position;
  const rings=48,across=48,hullStation=66,deckStation=80,t=.5;
  for(const [side,hr,dr] of [['port',0,0],['starboard',rings,across]]){
   const hi=(hullStation*(rings+1)+hr)*3,di=(deckStation*(across+1)+dr)*3;
   const h=new THREE.Vector3(hp.array[hi],hp.array[hi+1],hp.array[hi+2]);
   const d=new THREE.Vector3(dp.array[di],dp.array[di+1],dp.array[di+2]);
   assert.ok(Math.abs(h.y-deckY(DESIGN,t))<1e-5,side+' hull sheer is at deck height');
   assert.ok(Math.abs(d.y-h.y)<1e-4,side+' deck edge and hull sheer share the same height');
   assert.ok(Math.abs(d.z-h.z)<1e-4,side+' deck edge and hull sheer share the same station');
   assert.ok(Math.abs(d.x-h.x)<.03,side+' deck overlaps the hull edge by only a small seating margin');
   const expected=hullPoint(DESIGN,t,side==='port'?0:Math.PI*2);
   assert.ok(h.distanceTo(expected)<1e-4,side+' hull mesh follows the open-top section');
  }
  const port=hullPoint(DESIGN,t,0),keel=hullPoint(DESIGN,t,Math.PI),
   starboard=hullPoint(DESIGN,t,Math.PI*2);
  assert.ok(port.x<-.9&&starboard.x>.9,'sheer edges remain separated across the full beam');
  assert.ok(Math.abs(port.x+starboard.x)<1e-6,'the section is symmetric');
  assert.ok(Math.abs(port.y-starboard.y)<1e-6,'both sheer edges share a common deck level');
  assert.ok(keel.y<port.y-.5,'the section falls continuously from sheer to keel');
 }finally{disposeShipModel(ship);}
});

test('Sloop V2 hull stations and deck sheer remain finite and smooth',()=>{
 const ship=createShipModel('sloop-v2');
 try{
  let previousY=null;
  for(let i=0;i<=100;i++){
   const t=i/100,port=hullPoint(DESIGN,t,0),starboard=hullPoint(DESIGN,t,Math.PI*2),
    keel=hullPoint(DESIGN,t,Math.PI);
   for(const p of [port,starboard,keel])assert.ok([p.x,p.y,p.z].every(Number.isFinite));
   assert.ok(Math.abs(port.x+starboard.x)<1e-6,'beam symmetry at station '+i);
   assert.ok(Math.abs(port.y-deckY(DESIGN,t))<1e-6,'sheer matches deck at station '+i);
   assert.ok(Math.abs(port.z-stationZ(DESIGN,t,1))<1e-6,'sheer matches deck station '+i);
   assert.ok(keel.y<port.y,'keel remains below sheer at station '+i);
   if(previousY!==null)assert.ok(Math.abs(port.y-previousY)<.10,'sheer has no abrupt vertical kink');
   previousY=port.y;
  }
  assert.ok(halfBreadth(DESIGN,.5)>halfBreadth(DESIGN,.05)*4,'midbody is fuller than bow entrance');
  assert.ok(sectionBreadth(DESIGN,.5,.5)>.7,'midsection retains rounded bilges');
 }finally{disposeShipModel(ship);}
});

test('Sloop V2 aft transom follows the hull from keel to deck',()=>{
 const ship=createShipModel('sloop-v2');
 try{
  const transom=firstMesh(ship.userData.getPart('sternworks'));
  assert.ok(transom?.geometry?.attributes?.position,'transom mesh exists');
  const p=transom.geometry.attributes.position,across=32,vertical=24;
  const leftTop=(vertical*(across+1))*3,rightTop=(vertical*(across+1)+across)*3;
  const left=new THREE.Vector3(p.array[leftTop],p.array[leftTop+1],p.array[leftTop+2]);
  const right=new THREE.Vector3(p.array[rightTop],p.array[rightTop+1],p.array[rightTop+2]);
  assert.ok(left.distanceTo(hullPoint(DESIGN,1,0))<1e-4,'port transom top meets port sheer');
  assert.ok(right.distanceTo(hullPoint(DESIGN,1,Math.PI*2))<1e-4,'starboard transom top meets starboard sheer');
  assert.ok(Math.abs(left.x+right.x)<1e-6,'transom is symmetrical');
 }finally{disposeShipModel(ship);}
});

test('Sloop V2 standing stays are taut and all three sails share natural canvas',()=>{
 const ship=createShipModel('sloop-v2');
 try{
  const shroud=ship.getObjectByName('maid-of-endor-forward-shroud--1');
  const backstay=ship.getObjectByName('standing-backstay--1');
  assert.ok(shroud?.geometry?.attributes?.position,'forward shroud mesh exists');
  assert.ok(backstay?.geometry?.attributes?.position,'standing backstay mesh exists');
  for(const stay of [shroud,backstay]){
   const meta=stay.userData.dynamicMastStay;
   assert.ok(meta&&meta.points.length===2,'standing stay is authored as a direct span');
   const attr=stay.geometry.attributes.position,segments=meta.segments,radial=meta.radialSegments??7;
   const first=ringCenter(attr,0,segments,radial),last=ringCenter(attr,segments,segments,radial);
   const axis=last.clone().sub(first),lengthSq=axis.lengthSq();
   for(let ring=0;ring<=segments;ring++){
    const center=ringCenter(attr,ring,segments,radial);
    const alpha=THREE.MathUtils.clamp(center.clone().sub(first).dot(axis)/lengthSq,0,1);
    assert.ok(center.distanceTo(first.clone().addScaledVector(axis,alpha))<1e-4,
     'stay centreline remains straight at ring '+ring);
   }
  }
  for(const name of ['cloth-sail-single-gaff','cloth-sail-head-1','cloth-sail-head-2']){
   const canvas=firstMesh(ship.userData.getPart(name));
   assert.ok(canvas?.material?.color,'sail canvas mesh is present');
   assert.equal(canvas.material.color.getHex(),0xe9e2d1,'all sails use natural canvas');
  }
 }finally{disposeShipModel(ship);}
});
