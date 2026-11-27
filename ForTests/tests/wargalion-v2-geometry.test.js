import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { createShipModel, disposeShipModel, getShipDesign } from '../ships/index.js';
import { WARGALION_V2_SOURCE, WARGALION_V2_HULL_STATIONS, WARGALION_V2_SECTION, WARGALION_V2_CASTLE_TIERS } from '../ships/vessels/wargalion-v2/architecture/blueprint-data.js';
import { aftercastleWallY, aftercastleWallZ, aftercastleTransomZ } from '../ships/vessels/wargalion-v2/generators/cabins/aftercastle-geometry.js';
import {
  halfBreadth, sectionBreadthRatio, hullPoint, keelY, deckY, deckLevelY, hullLongitudinalZ, sampleStationCurve,
  sampleWaterlineCurve, sampleButtockCurve
} from '../ships/vessels/wargalion-v2/architecture/hull-surface.js';

test('Wargalion V2 preserves conflicting dimension and offset evidence',()=>{
  assert.equal(WARGALION_V2_SOURCE.primaryWorkingDimensions.length,39);
  assert.equal(WARGALION_V2_SOURCE.primaryWorkingDimensions.beam,11.7);
  assert.equal(WARGALION_V2_SOURCE.alternativePublishedDimensions.length,35.24);
  assert.equal(WARGALION_V2_SOURCE.alternativePublishedDimensions.beam,10.51);
  assert.equal(WARGALION_V2_SOURCE.alternativePublishedDimensions.mouldedDepth,5.60);
  assert.equal(WARGALION_V2_SOURCE.derivedWorkingMouldedDepth.metres,6.20);
  assert.equal(WARGALION_V2_SOURCE.offsetsStatus,'reconstruction-estimates-not-calibrated');
  assert.ok(WARGALION_V2_HULL_STATIONS.every(x=>x.sourceState==='visual-estimate'));
});

test('Wargalion V2 hull shell meets the keel datum and bow/stern sheer rake outward',()=>{
  const d=getShipDesign('wargalion-v2');
  for(const t of [.08,.25,.5,.75,.92]) {
    assert.ok(Math.abs(hullPoint(d,t,0,1).y-keelY(d,t))<1e-8,'lower hull meets keel datum');
  }
  assert.ok(hullPoint(d,.015,1,1).z<hullPoint(d,.015,0,1).z,'bow upper stem rakes forward');
  assert.ok(hullPoint(d,.985,1,1).z>hullPoint(d,.985,0,1).z,'stern upper counter rakes aft');
});

test('Wargalion V2 side profile has a visible rising keel and stronger end sheer',()=>{
  const d=getShipDesign('wargalion-v2');
  assert.ok(deckY(d,0)-deckY(d,.5)>1.0,'fore stem has pronounced deck sheer');
  assert.ok(deckY(d,1)-deckY(d,.5)>1.0,'aft counter has pronounced deck sheer');
  assert.ok(keelY(d,0)-keelY(d,.5)>1.0,'fore keel rises toward the stem');
  assert.ok(keelY(d,1)-keelY(d,.5)>1.0,'aft keel rises toward the sternpost');
});

test('Wargalion V2 moulded depth and widest section follow the scaled San Martín proportions',()=>{
  const d=getShipDesign('wargalion-v2');
  const midshipDepth=d.deckHeightUnits+d.draftUnits*0.72;
  assert.ok(Math.abs(midshipDepth-6.20*(4/3))<1e-6,
    'keel-to-main-deck depth equals the proportionally scaled 6.20 m estimate');
  const waterlineFraction=(d.draftUnits*0.72)/midshipDepth;
  const midship=WARGALION_V2_HULL_STATIONS.find(station=>station.station===0.5);
  assert.ok(Math.abs(midship.maxBreadthHeight-waterlineFraction)<0.002,
    'midship maximum breadth occurs at the waterline');
  assert.ok(midship.deckRatio<0.82,
    'upper sides draw inward from the waterline towards the narrower deck edge');
});

test('Wargalion V2 aftercastle tiers rise aft, rake inward and form a curved stern face',()=>{
  const d=getShipDesign('wargalion-v2');
  for(const tier of WARGALION_V2_CASTLE_TIERS){
    const forwardTop=aftercastleWallY(d,tier.t0,tier,1)-deckLevelY(d,tier.t0,'quarterdeck');
    const aftTop=aftercastleWallY(d,tier.t1,tier,1)-deckLevelY(d,tier.t1,'quarterdeck');
    assert.ok(aftTop-forwardTop>0.55,'each castle tier rises visibly toward the stern');

    const forwardRake=aftercastleWallZ(d,tier.t0,tier,1)-hullLongitudinalZ(d,tier.t0,1);
    const aftRake=hullLongitudinalZ(d,tier.t1,1)-aftercastleWallZ(d,tier.t1,tier,1);
    assert.ok(forwardRake>0.45,'forward wall top rakes toward the stern');
    assert.ok(aftRake>0.45,'aft wall top rakes toward the bow');

    const sternCentre=aftercastleTransomZ(d,tier,0,0.5);
    const sternQuarter=aftercastleTransomZ(d,tier,0.75,0.5);
    assert.ok(sternCentre>sternQuarter,'stern face bows outward at its centre');
  }
});

test('Wargalion V2 PCHIP hull breadth remains monotone fore and aft',()=>{
  const d=getShipDesign('wargalion-v2');
  let previous=halfBreadth(d,0);
  for(let i=1;i<=250;i++){
    const value=i/500,current=halfBreadth(d,value);
    assert.ok(Number.isFinite(current));
    assert.ok(current>=previous-1e-7,'forebody does not reverse before master frame');
    previous=current;
  }
  previous=halfBreadth(d,.5);
  for(let i=1;i<=250;i++){
    const value=.5+i/500,current=halfBreadth(d,value);
    assert.ok(Number.isFinite(current));
    assert.ok(current<=previous+1e-7,'afterbody does not reverse after master frame');
    previous=current;
  }
});

test('Wargalion V2 sections expand through the bilge and return through tumblehome',()=>{
  for(const t of [.12,.25,.5,.75,.92]){
    let previous=sectionBreadthRatio(t,0);
    for(let i=1;i<=100;i++){
      const value=sectionBreadthRatio(t,WARGALION_V2_SECTION.floorBand*i/100);
      assert.ok(value>=previous-1e-7,'floor expands toward bilge');
      previous=value;
    }
    previous=sectionBreadthRatio(t,WARGALION_V2_SECTION.bilgeEnd);
    for(let i=1;i<=100;i++){
      const v=WARGALION_V2_SECTION.bilgeEnd+(1-WARGALION_V2_SECTION.bilgeEnd)*i/100;
      const value=sectionBreadthRatio(t,v);
      assert.ok(value<=previous+1e-7,'upper hull returns inward through tumblehome');
      previous=value;
    }
  }
});

test('Wargalion V2 stations, waterlines and buttocks sample the same surface',()=>{
  const d=getShipDesign('wargalion-v2');
  const station=sampleStationCurve(d,.5,1,48);
  assert.equal(station.length,49);
  station.forEach((point,i)=>assert.ok(point.distanceTo(hullPoint(d,.5,i/48,1))<1e-9));

  const waterline=sampleWaterlineCurve(d,0,1,120);
  assert.ok(waterline.length>40,'waterline crosses a substantial hull length');
  for(const point of waterline)assert.ok(Math.abs(point.y)<1e-6);

  const x=d.beamUnits*.47;
  for(const branch of ['lower','upper']){
    const buttock=sampleButtockCurve(d,x,1,branch,120);
    assert.ok(buttock.length>20,branch+' buttock crosses the broad midbody');
    for(const point of buttock)assert.ok(Math.abs(point.x-x)<1e-5);
  }
  const port=hullPoint(d,.5,.58,-1),starboard=hullPoint(d,.5,.58,1);
  assert.ok(Math.abs(port.x+starboard.x)<1e-9);
  assert.ok(Math.abs(port.y-starboard.y)<1e-9);
  assert.ok(Math.abs(port.z-starboard.z)<1e-9);
});

test('Wargalion V2 creates independently editable hull, bow, deck and cabin assemblies',()=>{
  const ship=createShipModel('wargalion-v2');
  try{
    for(const name of [
      'hull','hull-skin-port','hull-skin-starboard','hull-wales','keel','stem','sternpost','stern-transom',
      'deck','main-deck','forecastle-deck','quarterdeck','beakhead','beakhead-platform',
      'forecastle-bulwark','forecastle-bulwark-port','forecastle-bulwark-starboard','aftercastle',
      'aftercastle-tier-1','aftercastle-tier-2','aftercastle-tier-3',
      'aftercastle-windows','quarter-gallery-port','quarter-gallery-starboard',
      'stern-gallery-tier-1','stern-gallery-tier-2','stern-gallery-tier-3'
    ])assert.ok(ship.userData.getPart(name),'missing V2 assembly '+name);
    assert.equal(ship.userData.getPart('hull-skin-port').parent,ship.userData.getPart('hull'));
    assert.equal(ship.userData.getPart('hull-skin-starboard').parent,ship.userData.getPart('hull'));

    const beakheadBounds=new Box3().setFromObject(ship.userData.getPart('beakhead'));
    const stemBounds=new Box3().setFromObject(ship.userData.getPart('stem'));
    assert.ok(beakheadBounds.min.z<stemBounds.min.z,
      'the open beakhead projects forward beyond the stem');

    const tierOneRoof=ship.userData.getPart('aftercastle-roof-tier-1');
    const tierOnePortWall=ship.userData.getPart('aftercastle-side-port-tier-1');
    assert.ok(tierOneRoof&&tierOnePortWall,'castle deck and wall assemblies exist');
    const upperRail=tierOnePortWall.getObjectByName('aftercastle-tier-1-upper-string-course--1');
    const roofEave=tierOneRoof.getObjectByName('aftercastle-tier-1-port-eave');
    assert.ok(upperRail&&roofEave,'castle wall top rail and roof eave are independently addressable');
    const railBounds=new Box3().setFromObject(upperRail);
    const eaveBounds=new Box3().setFromObject(roofEave);
    assert.ok(Math.abs(Math.abs(railBounds.min.x)-Math.abs(eaveBounds.min.x))<0.12,
      'roof eave follows the actual tapered wall top, not the wider wall foot');
    assert.ok(Math.abs(railBounds.max.y-eaveBounds.max.y)<0.12,
      'roof edge sits at the wall top instead of floating above it');

    assert.equal(ship.userData.hullStage,'hull-and-cabins');
    assert.equal(ship.userData.shipArchitecture.surfaceAuthority,'./architecture/hull-surface.js');
    assert.equal(getShipDesign('wargalion-v2').masts.length,0);
    let meshCount=0;
    ship.traverse(object=>{
      if(!object.isMesh)return;
      meshCount++;
      const attr=object.geometry?.getAttribute('position');
      assert.ok(attr&&attr.count>0,'mesh has vertices: '+object.name);
      for(let i=0;i<attr.count;i++){
        assert.ok(Number.isFinite(attr.getX(i)));
        assert.ok(Number.isFinite(attr.getY(i)));
        assert.ok(Number.isFinite(attr.getZ(i)));
      }
    });
    assert.ok(meshCount>=20,'V2 builds substantial hull, deck and cabin meshes');
  }finally{disposeShipModel(ship);}
});
