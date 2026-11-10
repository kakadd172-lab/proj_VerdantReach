import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { getShipDesign, createShipModel, disposeShipModel } from '../ships/index.js?v=0.8.9-persistent-vessel-authoring';
import { deckY, keelY, hullPoint, stationZ, halfBreadth, hullShapeStation, sectionBreadth } from '../ships/vessels/sloop/architecture/hull-geometry.js';

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
 }finally{disposeShipModel(ship);}
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
  assert.ok(!ship.userData.getPart('forestay-single'),'the outer-jib luff already provides the forestay');
  assert.equal(ship.userData.getPart('ratlines-single').children.length,18,'ratlines form two short ladders, one on each side');
  assert.ok(ship.userData.getPart('cloth-sail-head-1'));
  assert.ok(ship.userData.getPart('cloth-sail-head-2'));
 }finally{disposeShipModel(ship);}
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
  assert.equal(jibSheet.children.length,1,'the jib gets one clean working sheet');
  assert.equal(staysailSheet.children.length,1,'the staysail gets one clean working sheet');
  for(const name of ['cloth-sail-head-1','cloth-sail-head-2']){
   let sailMesh=null;ship.userData.getPart(name).traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')sailMesh=object;});
   assert.ok(sailMesh,name+' canvas is present');sailMesh.geometry.computeBoundingBox();
   assert.ok(sailMesh.geometry.boundingBox.min.x>=-1e-5,name+' should sit on the vessel centreline, not be displaced to port');
  }
 }finally{disposeShipModel(ship);}
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
  assert.ok(wheel.children.some(object=>object.name==='helm-wheel-hub'));
  assert.ok(wheel.children.filter(object=>object.name.startsWith('helm-spoke-')).length===8);
 }finally{disposeShipModel(ship);}
});
