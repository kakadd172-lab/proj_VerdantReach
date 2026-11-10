import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { getShipDesign, getVesselModule, createShipModel, disposeShipModel } from '../ships/index.js?v=0.8.30-reset-frame-registry';
import { deckY, keelY, hullPoint, stationZ, halfBreadth, hullShapeStation, sectionBreadth } from '../ships/vessels/sloop/architecture/hull-geometry.js';
 
function disposeAndRelease(ship) {
  if (!ship) return;
  disposeShipModel(ship);
  ship.clear();
  for (const key of Object.keys(ship.userData)) {
    if (typeof ship.userData[key] === 'function') delete ship.userData[key];
  }
  ship.userData.ownedGeometries = [];
  ship.userData.ownedMaterials = [];
  globalThis.gc?.();
}


test('Loguivy homardier keeps the dimensions and rig described by the 1866 sheet',()=>{
 const d=getShipDesign('sloop');
 assert.ok(Math.abs(d.hullLength-15.30)<0.01);
 assert.ok(Math.abs(d.beam-2.55)<0.01,'preview beam should be slightly fuller after proportion review');
 assert.ok(Math.abs(d.lengthBeamRatio-6.0)<0.02,'the rendered hull should no longer read excessively long and narrow');
 assert.ok(Math.abs(d.freeboard+d.draft-2.50)<0.01);
 assert.equal(d.masts.length,1);
 assert.equal(d.masts[0].rig,'gaff');
 assert.equal(d.headsails,2);
 assert.equal(d.masts[0].runningBraces,false,'the Sloop does not carry an extra yard-brace system');
 assert.ok(!d.partNames.includes('running-braces-single'),'the editor catalogue excludes the removed brace rigging');
 assert.equal(d.sternTiers.length,0,'source drawing has no raised aft cabin');
});

test('Plan-view offsets preserve a fine bow, full middle and broad natural stern',()=>{
 const d=getShipDesign('sloop');
 assert.ok(halfBreadth(d,0.03)<halfBreadth(d,0.30)*0.2);
 assert.ok(halfBreadth(d,0.58)>halfBreadth(d,0.30));
 assert.ok(halfBreadth(d,0.98)>halfBreadth(d,0.58)*0.72);
 assert.equal(hullShapeStation(d,1),1,'the entire aft run reaches the transom');
});

test('Body-plan sections flare above the bilge and close on the keel',()=>{
 const d=getShipDesign('sloop');
 assert.ok(sectionBreadth(d,0.5,0.78)>sectionBreadth(d,0.5,0.30));
 assert.ok(sectionBreadth(d,0.5,1)>sectionBreadth(d,0.5,0.78));
 const port=hullPoint(d,0.5,Math.PI),starboard=hullPoint(d,0.5,0),keel=hullPoint(d,0.5,Math.PI*1.5);
 assert.ok(port.x<0&&starboard.x>0);
 assert.ok(Math.abs(keel.x)<1e-5);
 assert.ok(keel.y<port.y&&keel.y<starboard.y);
});

test('The 1866 stern terminates at a flat transom plane without an artificial hull cut',()=>{
 const d=getShipDesign('sloop');
 const lowY=keelY(d,1),highY=deckY(d,1);
 const lowZ=stationZ(d,1,0),highZ=stationZ(d,1,1);
 const v=.5,midY=lowY+(highY-lowY)*v,midZ=stationZ(d,1,v);
 assert.ok(Math.abs((midY-lowY)/(highY-lowY)-(midZ-lowZ)/(highZ-lowZ))<1e-7);
 assert.ok(halfBreadth(d,1)>d.beamUnits*.30);
});

test('The fine bow, sheer and keel rocker are all continuous along the loft',()=>{
 const d=getShipDesign('sloop');
 assert.ok(stationZ(d,0.01,1)<stationZ(d,0.01,0));
 assert.ok(deckY(d,0.02)>deckY(d,0.50));
 assert.ok(deckY(d,0.98)>deckY(d,0.50));
 assert.ok(keelY(d,0.50)<keelY(d,0.02));
});

test('The central vivier is an editable open-deck component, not a box placed on an uncut deck',()=>{
 const ship=createShipModel('sloop');
 try{
  const deck=ship.userData.getPart('deck'),vivier=ship.userData.getPart('vivier');
  assert.ok(deck&&vivier);
  const deckMesh=deck.children.find(object=>object.name==='loguivy-open-deck-plan');
  const hullMesh=ship.userData.getPart('hull').children.find(object=>object.name==='loguivy-1866-open-shell');
  assert.ok(deckMesh?.userData.vivierOpening,'deck must expose its real livewell opening');
  assert.ok(hullMesh?.userData.openSheerDeck,'hull shell must remain open across the gunwales');

  // Boards are meshes nested in the vivier interior group, not registered
  // editor components; the grate and each side's vents are registered groups.
  let bottomBoard=false,waterSurface=false,ventSides=0;
  vivier.traverse(object=>{
    if(object.name==='vivier-bottom-board')bottomBoard=true;
    if(object.name==='vivier-water-surface')waterSurface=true;
    if(object.name==='vivier-hull-vents-port'||object.name==='vivier-hull-vents-starboard')ventSides++;
  });
  assert.ok(bottomBoard,'vivier should have a physical bottom board');
  assert.ok(waterSurface,'vivier should have a water surface');
  assert.equal(ventSides,2,'vivier should have both port and starboard water-slot groups');
  assert.ok(ship.userData.getPart('vivier-grate'));
  assert.ok(ship.userData.partNames.includes('vivier'));
 }finally{disposeAndRelease(ship);}
});

test('The transom, rudder, anchors and expanded single-mast rig assemble as separate editable parts',()=>{
 const ship=createShipModel('sloop');
 try{
  assert.ok(ship.userData.getPart('sternworks'));
  assert.ok(ship.userData.getPart('rudder'));
  assert.ok(ship.userData.getPart('anchor-port'));
  assert.ok(ship.userData.getPart('anchor-starboard'));
  assert.ok(ship.userData.getPart('mast-single'));
  assert.ok(ship.userData.getPart('sail-single-gaff'));
  assert.ok(ship.userData.getPart('sail-single-gaff-topsail'));
  assert.ok(!ship.userData.getPart('topsail-jackyard-single'),'the gaff itself is the topsail foot; no spare jackyard is needed');
  assert.ok(ship.userData.getPart('gaff-halyards-single'));
  assert.ok(ship.userData.getPart('mast-stays-single'));
  assert.ok(ship.userData.getPart('backstays-single'));
  assert.ok(!ship.userData.getPart('running-braces-single'),'this gaff sloop has no unattached yard braces');
  assert.ok(!ship.userData.getPart('forestay-single'),'the forestay is registered with the head-sail standing rigging, not duplicated as a mast part');
  assert.equal(ship.userData.getPart('ratlines-single').children.length,18,'ratlines form two short ladders, one on each side');
  assert.ok(ship.userData.getPart('cloth-sail-head-1'));
  assert.ok(ship.userData.getPart('cloth-sail-head-2'));
 }finally{disposeAndRelease(ship);}
});

test('The gaff mainsail remains intact and the topsail plus two distinct headsails are generated',()=>{
 const ship=createShipModel('sloop');
 try{
  const sail=ship.userData.getPart('cloth-sail-single-gaff');
  assert.ok(sail);
  let cloth=null;
  sail.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')cloth=object;});
  assert.ok(cloth);
  cloth.geometry.computeBoundingBox();
  const size=cloth.geometry.boundingBox.getSize(new Vector3());
  assert.ok(size.y>4.5);
  assert.ok(size.z>3.0);
  assert.ok(ship.userData.getPart('cloth-sail-head-1'));
  assert.ok(ship.userData.getPart('cloth-sail-head-2'));
  const topsail=ship.userData.getPart('cloth-sail-single-gaff-topsail');
  assert.ok(topsail);
  let topsailMesh=null;
  topsail.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')topsailMesh=object;});
  assert.ok(topsailMesh,'gaff topsail should have separate curved canvas');
  topsailMesh.geometry.computeBoundingBox();
  const topsailSize=topsailMesh.geometry.boundingBox.getSize(new Vector3());
  assert.ok(topsailSize.y>3.5&&topsailSize.z>3.0,'topsail should be a broad triangle from the gaff throat to the masthead and gaff peak');
  assert.ok(!ship.userData.getPart('topsail-jackyard-single'),'the topsail has no floating diagonal jackyard');
  for(const [name,minY,minZ] of [['cloth-sail-head-1',7.5,11.0],['cloth-sail-head-2',4.5,7.5]]){
   const headSail=ship.userData.getPart(name);assert.ok(headSail,name+' should have a distinct editable sail');
   let mesh=null;headSail.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')mesh=object;});
   assert.ok(mesh,name+' should contain real canvas geometry');mesh.geometry.computeBoundingBox();
   const bounds=mesh.geometry.boundingBox,size=bounds.getSize(new Vector3());
   assert.ok(size.y>minY,name+' should not collapse into a slim strip');
   assert.ok(size.z>minZ,name+' should have a broad fore-and-aft footprint');
  }
  const canvasFor=name=>{
   let result=null;ship.userData.getPart(name).traverse(object=>{
    if(object.isMesh&&object.name==='sail-shaped-cloth')result=object;
   });
   assert.ok(result,name+' canvas should exist');result.geometry.computeBoundingBox();return result;
  };
  const jibCanvas=canvasFor('cloth-sail-head-1');
  const staysailCanvas=canvasFor('cloth-sail-head-2');
  assert.ok(
   staysailCanvas.geometry.boundingBox.max.z>jibCanvas.geometry.boundingBox.max.z+.15,
   'inner staysail should sit slightly aft of the outer jib instead of sharing its fore-and-aft plane'
  );
  const jibSheet=ship.userData.getPart('head-sheets-outer-jib');
  const staysailSheet=ship.userData.getPart('head-sheets-inner-staysail');
  assert.equal(jibSheet.children.length,2,'the jib has port and starboard sheets');
  assert.equal(staysailSheet.children.length,2,'the staysail has port and starboard sheets');
  assert.deepEqual(
   jibSheet.children.map(line=>line.userData.sheetSide).sort(),
   ['port','starboard'],
   'the jib sheets must lead to both quarters'
  );
  assert.deepEqual(
   staysailSheet.children.map(line=>line.userData.sheetSide).sort(),
   ['port','starboard'],
   'the staysail sheets must lead to both quarters'
  );
  assert.ok(ship.userData.getPart('head-stays-1').children.some(line=>line.name==='outer-jib-forestay'));
  assert.ok(ship.userData.getPart('head-stays-2').children.some(line=>line.name==='inner-staysail-stay'));
  assert.ok(ship.userData.getPart('head-halyards-outer-jib').children.some(line=>line.name==='outer-jib-halyard-fall'));
  assert.ok(ship.userData.getPart('head-halyards-inner-staysail').children.some(line=>line.name==='inner-staysail-halyard-fall'));
  for(const name of ['cloth-sail-head-1','cloth-sail-head-2']){
   let sailMesh=null;ship.userData.getPart(name).traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')sailMesh=object;});
   assert.ok(sailMesh,name+' canvas is present');sailMesh.geometry.computeBoundingBox();
   assert.ok(sailMesh.geometry.boundingBox.min.x>=-1e-5,name+' should sit on the vessel centreline, not be displaced to port');
  }
 }finally{disposeAndRelease(ship);}
});


test('The Sloop rig has continuous, correctly led standing and running rigging',()=>{
 const ship=createShipModel('sloop');
 try{
  const defaults=getVesselModule('sloop').editorDefaults.componentState.partTransforms;
  const standing=ship.userData.getPart('standing-rigging-single');
  const mast=ship.userData.getPart('mast-single');
  const hull=ship.userData.getPart('hull');
  const migratedChainplates=ship.userData.getPart('chainplates-single');
  const migratedBackstayChainplates=ship.userData.getPart('backstay-chainplates-single');
  ship.updateMatrixWorld(true);
  assert.equal(standing.parent,ship,'standing rigging is migrated out of the mast into the ship frame');
  assert.equal(migratedChainplates.parent,hull,'shroud chainplates are attached to the hull frame');
  assert.equal(migratedBackstayChainplates.parent,hull,'backstay chainplates are attached to the hull frame');
  // The old saved transform was authored in mast-local space. Its world pose
  // must survive migration even though its equivalent local delta changes.
  const authored=defaults['standing-rigging-single'];
  const authoredLocal=new THREE.Matrix4().compose(
   new THREE.Vector3(authored.x,authored.y,authored.z),
   new THREE.Quaternion().setFromEuler(new THREE.Euler(authored.rx,authored.ry,authored.rz,'XYZ')),
   new THREE.Vector3(authored.sx,authored.sy,authored.sz));
  const expectedWorld=mast.matrixWorld.clone().multiply(authoredLocal);
  const actualWorld=standing.matrixWorld.clone();
  for(let i=0;i<16;i++)assert.ok(Math.abs(actualWorld.elements[i]-expectedWorld.elements[i])<1e-5,'standing rigging world matrix survives parent migration at element '+i);
  const migratedTransform=ship.userData.getPartTransform('standing-rigging-single');
  assert.ok(Object.values(migratedTransform).every(Number.isFinite),'migrated transform remains finite');
  assert.deepEqual(ship.userData.getPartTransform('shrouds-single'),defaults['shrouds-single'],'nested shroud transform remains unchanged during migration');
  const forwardStay=ship.userData.getPart('shrouds-single').getObjectByName('standing-shroud-port-forward');
  const stayMeta=forwardStay.userData.dynamicMastStay;
  const fixedWorld=hull.localToWorld(new THREE.Vector3(...stayMeta.fixedPointHull));
  let nearestChainplateDistance=Infinity;
  migratedChainplates.traverse(object=>{
   if(!object.isMesh||!object.geometry)return;
   object.geometry.computeBoundingBox();
   const bounds=object.geometry.boundingBox;
   const a=object.localToWorld(new THREE.Vector3(0,bounds.min.y,0));
   const b=object.localToWorld(new THREE.Vector3(0,bounds.max.y,0));
   const segment=b.clone().sub(a);
   const t=THREE.MathUtils.clamp(fixedWorld.clone().sub(a).dot(segment)/Math.max(segment.lengthSq(),1e-12),0,1);
   nearestChainplateDistance=Math.min(nearestChainplateDistance,fixedWorld.distanceTo(a.addScaledVector(segment,t)));
  });
  assert.ok(nearestChainplateDistance<.05,'standing stay foot remains physically aligned with a chainplate centreline; gap='+nearestChainplateDistance);
  const outerJibHalyards=ship.userData.getPart('head-halyards-outer-jib');
  assert.equal(outerJibHalyards.userData.servesSail,'outer-jib');
  assert.equal(outerJibHalyards.userData.sailControl,undefined,'halyard metadata must not register a rope group as an editable sail');
  const beforeRelink=standing.matrixWorld.clone();
  assert.ok(ship.userData.detachPart('standing-rigging-single'));
  assert.ok(ship.userData.relinkPart('standing-rigging-single'));
  ship.updateMatrixWorld(true);
  assert.equal(standing.parent,ship,'relink restores the migrated standing-rigging parent');
  for(let i=0;i<16;i++)assert.ok(Math.abs(standing.matrixWorld.elements[i]-beforeRelink.elements[i])<1e-5,'relink preserves world pose at element '+i);
  assert.deepEqual(ship.userData.getPartTransform('standing-rigging-single'),migratedTransform,'relink preserves the converted parent-frame transform');
  const shrouds=ship.userData.getPart('shrouds-single');
  const ratlines=ship.userData.getPart('ratlines-single');
  const backstays=ship.userData.getPart('backstays-single');
  const chainplates=ship.userData.getPart('chainplates-single');
  const bowspritRig=ship.userData.getPart('bowsprit-standing-rigging');
  const mastRunning=ship.userData.getPart('running-rigging-single');
  const boomRunning=ship.userData.getPart('boom-running-rigging-single');
  assert.ok(shrouds&&ratlines&&backstays&&chainplates&&bowspritRig&&mastRunning&&boomRunning);
  assert.equal(shrouds.children.length,4,'two shrouds on each side support the mast');
  assert.equal(ratlines.children.length,18,'nine ratlines form each port and starboard ladder');
  assert.equal(backstays.children.length,2,'one backstay leads to each quarter');
  assert.equal(chainplates.children.length,4,'each lower shroud has its own chainplate');
  assert.ok(bowspritRig.children.some(group=>group.name==='bowsprit-side-guys'));
  assert.ok(bowspritRig.children.some(group=>group.name==='bowsprit-heel-lashings'));
  assert.ok(bowspritRig.children.some(line=>line.name==='bowsprit-bobstay'));
  assert.ok(mastRunning.getObjectByName('gaff-throat-halyard'));
  assert.ok(mastRunning.getObjectByName('gaff-peak-halyard'));
  assert.ok(boomRunning.getObjectByName('boom-topping-lift'));
  assert.ok(boomRunning.getObjectByName('mainsheet'));
  assert.ok(boomRunning.getObjectByName('mainsheet-tail'));
  assert.ok(boomRunning.getObjectByName('boom-vang'));
  for(const name of [
   'bowsprit-bobstay',
   'standing-shroud-port-forward',
   'standing-shroud-starboard-after',
   'backstay-port',
   'backstay-starboard',
   'gaff-throat-halyard',
   'gaff-peak-halyard',
   'boom-topping-lift',
   'mainsheet',
   'boom-vang'
  ]){
   let line=null;ship.traverse(object=>{if(object.name===name)line=object;});
   assert.ok(line?.geometry,'rigging line '+name+' must have real tube geometry');
   line.geometry.computeBoundingBox();
   const size=line.geometry.boundingBox.getSize(new Vector3());
   assert.ok(size.length()>.25,'rigging line '+name+' must span between distinct fittings');
  }
 }finally{disposeAndRelease(ship);}
});

test('Sloop rigging transforms survive a save/reload across coordinate-frame versions',()=>{
 const first=createShipModel('sloop');
 let restored=null,detached=null;
 try{
  first.userData.setRudderAngle(.17);
  const saved=first.userData.getShipState();
  assert.equal(saved.transformFrameVersion,2,'the editor exports the migrated coordinate-frame version');
  assert.ok(Math.abs(saved.rudderAngle-.17)<1e-8,'the save contains the current steering state');
  first.updateMatrixWorld(true);
  const names=['mast-single','hull','standing-rigging-single','chainplates-single','backstay-chainplates-single'];
  const expected=Object.fromEntries(names.map(name=>[name,first.userData.getPart(name).matrixWorld.clone()]));
  restored=createShipModel('sloop',saved.partTransforms,saved);
  restored.updateMatrixWorld(true);
  assert.ok(Math.abs(restored.userData.getShipState().rudderAngle-.17)<1e-8,'partial rigging transform application does not reset steering');
  for(const name of names){
   const actual=restored.userData.getPart(name).matrixWorld;
   for(let i=0;i<16;i++)assert.ok(Math.abs(actual.elements[i]-expected[name].elements[i])<1e-5,
    name+' world transform survives save/reload at matrix element '+i);
  }
  const firstStay=first.userData.getPart('shrouds-single').getObjectByName('standing-shroud-port-forward');
  const secondStay=restored.userData.getPart('shrouds-single').getObjectByName('standing-shroud-port-forward');
  assert.deepEqual(Array.from(secondStay.geometry.attributes.position.array),Array.from(firstStay.geometry.attributes.position.array),
   'standing stay geometry is identical after save/reload');
  const detachedState={...saved,unlinkedParts:[...saved.unlinkedParts,'standing-rigging-single']};
  detached=createShipModel('sloop',detachedState.partTransforms,detachedState);
  const detachedStanding=detached.userData.getPart('standing-rigging-single');
  assert.equal(detachedStanding.parent.name,'unlinked-parts','saved detached standing rigging remains detached');
  assert.equal(detached.userData.getPart('chainplates-single').parent,detached.userData.getPart('hull'),
   'hull chainplates are extracted even when their original standing group is detached');
  assert.equal(detached.userData.getPart('backstay-chainplates-single').parent,detached.userData.getPart('hull'),
   'backstay chainplates remain hull-mounted when standing rigging is detached');
 }finally{
  disposeAndRelease(first);
  if(restored)disposeAndRelease(restored);
  if(detached)disposeAndRelease(detached);
 }
});

test('Rudder and helm wheel rotate around their pivots and remain mechanically linked',()=>{
 const ship=createShipModel('sloop');
 try{
  const rudder=ship.userData.getPart('rudder'),wheel=ship.userData.getPart('helm-wheel');
  const rudderPivot=rudder.userData.steeringControl.pivotGroup,wheelPivot=wheel.userData.steeringControl.pivotGroup;
  assert.equal(rudder.userData.steeringControl.axis,'y');
  assert.equal(rudder.userData.steeringControl.rotationSign,1);
  assert.equal(wheel.userData.steeringControl.axis,'z');
  assert.equal(wheel.userData.steeringControl.ratio,4.5);
  assert.ok(rudderPivot&&wheelPivot,'steering axes are nested under the editable component roots');
  const rudderEditorTransform=ship.userData.getPartTransform('rudder');
  ship.userData.setRudderAngle(.30);
  assert.ok(Math.abs(rudderPivot.rotation.y-.30)<1e-6);
  assert.ok(Math.abs(wheelPivot.rotation.z-1.35)<1e-6);
  assert.deepEqual(ship.userData.getPartTransform('rudder'),rudderEditorTransform,'steering animation must not alter saved rudder transforms');
  ship.userData.setRudderAngle(2);
  assert.ok(Math.abs(ship.userData.getShipState().rudderAngle-.62)<1e-6);
  ship.userData.setRudderAngle(0);
  assert.ok(Math.abs(wheelPivot.rotation.z)<1e-6);
  ship.userData.setRudderAngle(.42);
  assert.ok(Math.abs(rudderPivot.rotation.y)>.4);
  assert.ok(ship.userData.resetPartTransform('rudder'));
  assert.ok(Math.abs(rudderPivot.rotation.y)<1e-8,'reset clears the nested rudder stock pose');
  assert.ok(Math.abs(wheelPivot.rotation.z)<1e-8,'reset also clears the mechanically linked wheel pose');
  assert.equal(ship.userData.getShipState().rudderAngle,0);
  assert.deepEqual(ship.userData.getPartTransform('rudder'),rudderEditorTransform,'reset preserves the saved rudder component baseline');
 }finally{disposeAndRelease(ship);}
});

function shroudsForTest(ship,name){
 let result=null;ship.traverse(object=>{if(object.name===name)result=object;});
 assert.ok(result,'missing dynamic stay '+name);return result;
}

test('Wind drives boom trim, sail rotation, cloth billow and restrained mast flex without dirtying editor transforms',()=>{
 const ship=createShipModel('sloop');
 try{
  const mast=ship.userData.getPart('mast-single'),boom=ship.userData.getPart('boom-single');
  const mainsail=ship.userData.getPart('sail-single-gaff'),jib=ship.userData.getPart('sail-head-1');
  let clothMesh=null;mainsail.traverse(object=>{if(object.isMesh&&object.userData.sailCloth)clothMesh=object;});
  assert.ok(mast&&boom&&mainsail&&jib&&clothMesh);
  const clothRestPositions=new Float32Array(clothMesh.geometry.attributes.position.array);
  assert.ok(boom.userData.pivotPoint);
  assert.ok(mainsail.userData.sailControl.windPivot);
  const mastPivot=mast.userData.mastControl.pivotGroup;
  const mastEditorTransform=ship.userData.getPartTransform('mast-single');
  const chainplates=ship.userData.getPart('chainplates-single');
  const anchoredShroud=shroudsForTest(ship,'standing-shroud-port-forward');
  const chainplateWorldBefore=chainplates.getWorldPosition(new Vector3()).clone();
  const shroudGeometryBefore=anchoredShroud.geometry.uuid;
  const shroudPositionsBefore=new Float32Array(anchoredShroud.geometry.attributes.position.array);
  const before=ship.userData.getPartTransform('boom-single');
  const boomPivot=boom.userData.animationPivot;
  const mainPivot=mainsail.userData.sailControl.pivotGroup;
  const jibPivot=jib.userData.sailControl.pivotGroup;
  ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:24});
  ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:24});
  assert.ok(boomPivot.rotation.y<-.05);
  assert.ok(Math.abs(mainPivot.rotation.y)>.05,'gaff mainsail should rotate under wind pressure');
  assert.ok(Math.abs(jibPivot.rotation.y)<1e-8,'forward triangular headsails intentionally retain their orientation; directional billow is tested separately');
  assert.ok(mastPivot.rotation.z>.0001,'mast rotates around its mast-step pivot under wind');
  assert.equal(chainplates.parent,ship.userData.getPart('hull'),'chainplates remain attached to the hull, outside mast articulation');
  mast.updateMatrixWorld(true);
  assert.ok(chainplates.getWorldPosition(new Vector3()).distanceTo(chainplateWorldBefore)<1e-8,'chainplates remain fixed while the mast heels');
  assert.equal(anchoredShroud.geometry.uuid,shroudGeometryBefore,'shroud tube geometry is reused during mast motion');
  assert.ok(anchoredShroud.geometry.attributes.position.array.some((value,index)=>Math.abs(value-shroudPositionsBefore[index])>1e-6),'shroud vertices adjust as the masthead end moves');
  assert.deepEqual(ship.userData.getPartTransform('mast-single'),mastEditorTransform,'wind does not modify the mast editor transform');
  for(let frame=0;frame<55;frame++)ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:30});
  const fullHeel=mast.userData.mastControl.pivotGroup.rotation.z;
  assert.ok(fullHeel>0.03&&fullHeel<=2.5*Math.PI/180+1e-5,'mast heel is bounded to its configured range');
  for(let frame=0;frame<55;frame++)ship.userData.animateShip(.05,{enabled:true,directionDeg:270,speedKnots:30});
  assert.ok(mast.userData.mastControl.pivotGroup.rotation.z<-.03,'reversing wind reverses mast heel');
  for(let frame=0;frame<55;frame++)ship.userData.animateShip(.05,{enabled:false,directionDeg:270,speedKnots:0});
  assert.ok(Math.abs(mast.userData.mastControl.pivotGroup.rotation.z)<.001,'mast returns towards neutral when wind stops');
  assert.ok(Math.abs(ship.userData.getPartTransform('boom-single').ry-before.ry)<1e-8);
  assert.ok(ship.userData.resetPartTransform('boom-single'));
  assert.ok(Math.abs(boomPivot.rotation.x)+Math.abs(boomPivot.rotation.y)+Math.abs(boomPivot.rotation.z)<1e-8,'component reset clears wind-driven boom pivot rotation');
  assert.deepEqual(ship.userData.getPartTransform('boom-single'),before,'component reset restores the original component transform');
  const attribute=clothMesh.geometry.attributes.position;
  let displaced=false;
  for(let i=0;i<attribute.array.length;i++)if(Math.abs(attribute.array[i]-clothRestPositions[i])>1e-5){displaced=true;break;}
  assert.ok(displaced);
 }finally{disposeAndRelease(ship);}
});

test('Sails reef and furl the full canvas assembly towards their tack',()=>{
 const ship=createShipModel('sloop');
 try{
  const sail=ship.userData.getPart('sail-single-gaff');
  const cloth=ship.userData.getPart('cloth-sail-single-gaff');
  const seams=ship.userData.getPart('panel-seams-sail-single-gaff');
  const pivotGroup=sail.userData.sailControl.pivotGroup;
  const deployment=pivotGroup?.children.find(child=>child.name===sail.userData.sailControl.deploymentPart);
  const tackY=sail.userData.sailControl.pivotPoint[1];
  assert.ok(cloth&&seams&&deployment);
  const furlFrame=deployment.children.find(child=>child.name==='sail-furl-frame-sail-single-gaff');
  assert.ok(furlFrame,'deployment assembly should contain its luff-aligned furl frame');
  assert.ok(cloth.parent===furlFrame,'canvas group must be parented under the luff-aligned furl frame');
  assert.ok(seams.parent===furlFrame,'panel seams and boltropes must share the canvas furl frame');
  assert.ok(furlFrame.parent===deployment,'furl frame must remain inside the deployment assembly');
  assert.ok(Math.abs(deployment.scale.y-1)<1e-8);
  const seamLine=seams.children.find(child=>child.geometry);
  assert.ok(seamLine,'sail edge ropes exist inside the deployment group');
  assert.equal(ship.userData.setSailDeployment('single','reefed',0),true);
  assert.ok(Math.abs(deployment.scale.y-.48)<1e-8);
  assert.ok(Math.abs(deployment.position.y+tackY*.48)<1e-8,'reefing scales around the tack rather than the keel origin');
  assert.equal(ship.userData.setSailDeployment('single','furled',.5),true);
  for(let frame=0;frame<5;frame++)ship.userData.animateShip(.05,{enabled:false});
  assert.ok(deployment.scale.y<.48&&deployment.scale.y>.001,'furling interpolates smoothly');
  for(let frame=0;frame<8;frame++)ship.userData.animateShip(.05,{enabled:false});
  assert.ok(Math.abs(deployment.scale.y-.001)<1e-8);
  assert.ok(Math.abs(deployment.position.y+tackY*.001)<1e-8);
  assert.ok(Math.abs(deployment.scale.y-.001)<1e-8,'boltrope and panel seams receive the same furl scale as the cloth');
  assert.equal(seamLine.parent,seams,'edge rope stays inside the shared deployment assembly');
  assert.equal(ship.userData.getShipState().sailDeployment.single,'furled');
  ship.userData.resetPartTransform('sail-single-gaff');
  assert.ok(Math.abs(deployment.scale.y-1)<1e-8,'reset restores the full canvas assembly');
 }finally{disposeAndRelease(ship);}
});
test('Aft helm is compact, clear of the aft locker and mounted at the aft quarter',()=>{
 const ship=createShipModel('sloop');
 try{
  const helm=ship.userData.getPart('helm');
  const wheel=ship.userData.getPart('helm-wheel');
  const locker=ship.userData.getPart('aft-locker');
  assert.ok(helm&&wheel&&locker);
  assert.ok(helm.userData.helmStation>locker.userData.station+0.10,'helm must sit aft of the locker, not on its lid');
  assert.ok(helm.userData.helmStation<=0.89,'helm should be nudged slightly forward while remaining in the aft quarter');
  assert.ok(helm.userData.wheelRadius<=0.35,'wheel should be scaled for a small fishing vessel');
  assert.equal(wheel.userData.helmStation,helm.userData.helmStation);
  const axlePivot=wheel.userData.steeringControl?.pivotGroup;
  assert.ok(axlePivot,'the wheel has a nested axle pivot');
  assert.ok(axlePivot.children.some(object=>object.name==='helm-wheel-hub'));
  assert.equal(axlePivot.children.filter(object=>object.name.startsWith('helm-spoke-')).length,8);
 }finally{disposeAndRelease(ship);}
});
