import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import {
 createCannonModel, CANNON_PROFILES, CANNON_PART_NAMES, CANNON_ASSEMBLY_ORDER
} from '../ships/vessels/cannons/index.js';

function inspectMesh(mesh, profileId) {
 const geometry=mesh.geometry;
 assert.ok(geometry?.isBufferGeometry,profileId+'/'+mesh.name+' uses BufferGeometry');
 const position=geometry.getAttribute('position');
 assert.ok(position&&position.itemSize>=3&&position.count>=3,profileId+'/'+mesh.name+' has vertices');
 for(let i=0;i<position.count;i++){
  assert.ok(Number.isFinite(position.getX(i))&&Number.isFinite(position.getY(i))&&Number.isFinite(position.getZ(i)),
   profileId+'/'+mesh.name+' has finite vertex '+i);
 }
 const elements=geometry.index?geometry.index.count:position.count;
 assert.equal(elements%3,0,profileId+'/'+mesh.name+' triangulates cleanly');
 if(geometry.index){
  for(let i=0;i<geometry.index.count;i++){
   const value=geometry.index.getX(i);
   assert.ok(Number.isInteger(value)&&value>=0&&value<position.count,
    profileId+'/'+mesh.name+' has valid index '+value);
  }
 }
 geometry.computeBoundingBox();
 const bounds=geometry.boundingBox;
 assert.ok(bounds&&!bounds.isEmpty(),profileId+'/'+mesh.name+' has a non-empty bounding box');
 const size=bounds.getSize(new Vector3());
 assert.ok(size.x+size.y+size.z>1e-8,profileId+'/'+mesh.name+' has non-zero geometry');
}

test('shared cannon generator provides all three blueprint size variants',()=>{
 assert.deepEqual(Object.keys(CANNON_PROFILES).sort(),['18-pounder','36-pounder','9-pounder']);
 assert.ok(CANNON_ASSEMBLY_ORDER.length>=10);
 for(const id of Object.keys(CANNON_PROFILES)){
  const model=createCannonModel(id);
  try{
   assert.equal(model.userData.shipType,'cannon');
   assert.equal(model.userData.cannonId,id);
   assert.equal(model.userData.cannonNonFunctionalVisualOnly,true);
   assert.equal(model.userData.muzzleSealed,true);
   assert.equal(model.userData.firingMechanism,false);
   assert.deepEqual(model.userData.partNames,CANNON_PART_NAMES);
   assert.equal(new Set(model.userData.partNames).size,model.userData.partNames.length);
   for(const name of CANNON_PART_NAMES){
    const part=model.userData.getPart(name);
    assert.ok(part,id+' has independent editable '+name+' component');
    assert.equal(part.parent,model,id+' '+name+' remains a top-level editor component');
   }
   let meshes=0;
   model.traverse(object=>{
    if(!object.isMesh)return;
    meshes++;
    inspectMesh(object,id);
   });
   assert.ok(meshes>=40,id+' has detailed generated geometry');
   const bounds=new Box3().setFromObject(model);
   assert.ok(!bounds.isEmpty(),id+' assembled display model has bounds');
   const size=bounds.getSize(new Vector3());
   assert.ok(size.x>0&&size.y>0&&size.z>0,id+' spans width, height and length');
   assert.equal(model.userData.getPart('muzzle-face').userData.noBore,true);
   assert.equal(model.userData.getPart('barrel-body').userData.solidMuzzle,true);
   assert.equal(model.userData.getPart('muzzle-face').getObjectByName('solid-sealed-muzzle-face').userData.solidCap,true);
   const portPin=model.userData.getPart('trunnion-port').getObjectByName('trunnion-port-solid-stud');
   const starboardPin=model.userData.getPart('trunnion-starboard').getObjectByName('trunnion-starboard-solid-stud');
   assert.ok(portPin.position.x<0&&starboardPin.position.x>0,id+' trunnions sit on opposite barrel sides');
   assert.ok(Math.abs(Math.abs(portPin.position.x)-Math.abs(starboardPin.position.x))<1e-8,
    id+' port and starboard trunnions are symmetric about the centreline');
   assert.equal(model.userData.getPart('wheel-port-fore').userData.cannonComponent,'fixed-wood-wheel');
  }finally{
   model.userData.dispose();
  }
 }
});

test('blueprint barrel profiles preserve the three published external reference dimensions',()=>{
 const large=CANNON_PROFILES['36-pounder'];
 const medium=CANNON_PROFILES['18-pounder'];
 const small=CANNON_PROFILES['9-pounder'];
 assert.equal(large.calibreMm,174);
 assert.equal(medium.calibreMm,138);
 assert.equal(small.calibreMm,106);
 assert.deepEqual([large.weightLb,medium.weightLb,small.weightLb],[7450,4000,2450]);
 assert.deepEqual([large.weightKg,medium.weightKg,small.weightKg],[3643,1956,1198]);
 assert.equal(large.barrelLengthMetres,2.925);
 assert.equal(medium.barrelLengthMetres,2.600);
 assert.equal(small.barrelLengthMetres,2.221);
 assert.ok(large.barrelLengthMetres>medium.barrelLengthMetres&&medium.barrelLengthMetres>small.barrelLengthMetres);
});

test('cannon components support ordinary editor transform, visibility and relink operations',()=>{
 const model=createCannonModel('18-pounder');
 try{
  const barrel=model.userData.getPart('barrel-body');
  const baseline=model.userData.getPartTransform('barrel-body');
  assert.ok(baseline);
  assert.equal(model.userData.setPartVisible('barrel-body',false),true);
  assert.equal(barrel.visible,false);
  assert.equal(model.userData.setPartVisible('barrel-body',true),true);
  assert.equal(model.userData.detachPart('barrel-body'),true);
  assert.equal(barrel.parent.name,'unlinked-parts');
  assert.equal(model.userData.relinkPart('barrel-body'),true);
  assert.equal(barrel.parent,model);
  assert.equal(model.userData.resetPartTransform('barrel-body'),true);
  assert.ok(barrel.position.length()<1e-8,'reset returns component to its authored position');
 }finally{
  model.userData.dispose();
 }
});
