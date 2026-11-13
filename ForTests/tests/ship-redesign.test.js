import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SLOOP_ROCKING_VERSION } from '../ships/vessels/sloop/animation/rocking-animation.js';

import {
  SHIP_DESIGNS,getShipDesign,setShipDesignOverrides,resetShipDesignOverrides,SHIP_DESIGN_MODULE_VERSION,
  getShipStructureBlueprint,setShipStructureOverrides,resetShipStructureOverrides,SHIP_STRUCTURE_MODULE_VERSION,
  createShipModel,disposeShipModel,SHIP_GENERATORS,VESSEL_IDS,VESSEL_MODULES,SHIP_MODEL_MODULE_VERSION,
  getVesselModule,
} from '../ships/index.js?v=0.8.35';
 
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


const ids = Object.keys(SHIP_DESIGNS).sort();

test('the editor uses 18 self-contained ForTests vessel modules', () => {
  assert.equal(SHIP_DESIGN_MODULE_VERSION, '0.8.9');
  assert.equal(SHIP_STRUCTURE_MODULE_VERSION, '0.8.9');
  assert.equal(SHIP_MODEL_MODULE_VERSION, '0.8.30');
  assert.equal(ids.length, 18);
  assert.deepEqual([...VESSEL_IDS].sort(), ids);
  assert.deepEqual(Object.keys(VESSEL_MODULES).sort(), ids);
  for (const id of ids) {
    const module = getVesselModule(id);
    assert.ok(module, id + ' ForTests ship module');
    assert.equal(module.id, id);
    assert.equal(typeof module.createModel, 'function', id + ' dedicated model creator');
    assert.equal(typeof module.generate, 'function', id + ' dedicated generator entry point');
    assert.equal(module.editorModulePath, 'ForTests/ships/vessels/' + id + '/' + id + '.js');
    assert.equal(typeof SHIP_GENERATORS[id], 'function', id + ' registered generator');
  }
});


test('Sloop V2 follows the supplied Maid of Endor pocket-cruiser specification',()=>{
  const design=getShipDesign('sloop-v2');
  assert.equal(design.hullLength,6.18);
  assert.equal(design.waterlineLength,5.64);
  assert.equal(design.beam,2.34);
  assert.equal(design.draft,1.02);
  assert.equal(design.sailAreaSquareFeet,333);
  assert.deepEqual(design.sailPlan,{mainsail:214,outerJib:60.5,innerStaysail:58.5});
  const ship=createShipModel('sloop-v2');
  try{
    assert.ok(ship.userData.getPart('cockpit-well'),'Maid of Endor has a separate aft cockpit well');
    assert.ok(ship.userData.getPart('stern-tier-1'),'Maid of Endor has its low trunk cabin');
    assert.ok(ship.userData.getPart('running-backstays-single'),'Maid of Endor cutter rig has running backstays');
    assert.equal(ship.userData.getPart('helm-wheel').userData.helmType,'aft-tiller');
    assert.equal(ship.userData.vesselProvenance.designName,'Maid of Endor');
  }finally{disposeAndRelease(ship);}
});

 
const modularIds = new Set(["barque","brig","brigantine","caravel","carrack","sloop","sloop-v2","schooner","snow","cutter","frigate","galleon","fluyt","xebec","junk","first-rate","pinnace","wargalion"]);

test('each vessel owns its own geometry-generation algorithms', () => {
  const hullAlgorithms = [];
  const sailAlgorithms = [];
  for (const id of ids) {
    const module = getVesselModule(id);
    const sourcePath = module.editorModulePath.replace(/^ForTests\//, '../');
    const facade = readFileSync(new URL(sourcePath, import.meta.url), 'utf8');
    assert.ok(facade.includes('createShipContext('), id + ' must construct its own context');
    assert.ok(facade.includes('finishShipModel('), id + ' must finish through editor support');
    assert.ok(!/createVesselModel|createShipModelFromVessel|ship-model-builder|hull-math/.test(facade),
      id + ' still calls the old shared geometry engine');

    let geometrySource = facade;
    let sailSource = facade;
    if (modularIds.has(id)) {
      const root = '../ships/vessels/' + id + '/';
      geometrySource = readFileSync(new URL(root + 'architecture/hull-geometry.js', import.meta.url), 'utf8');
      sailSource = readFileSync(new URL(root + 'generators/sails/sail-cloth-generator.js', import.meta.url), 'utf8');
      const architecture = readFileSync(new URL(root + 'architecture/layout.js', import.meta.url), 'utf8');
      assert.ok(architecture.includes('assemblyOrder') && architecture.includes('mastInstances'), id + ' architecture blueprint');
      assert.ok(facade.includes('ARCHITECTURE.assemblyOrder'), id + ' assembler follows its blueprint');
      for (const file of [
        'generators/hull/hull-generator.js','generators/hull/keel-generator.js','generators/hull/stem-generator.js',
        'generators/decks/deck-generator.js','generators/decks/deck-planking-generator.js',
        'generators/hull-structure/frame-generator.js','generators/hull-structure/hull-planking-generator.js',
        'generators/stern/stern-generator.js','generators/cabins/aft-cabin-generator.js',
        'generators/bow/bow-generator.js','generators/steering/rudder-generator.js','generators/steering/helm-generator.js',
        'generators/deck-equipment/railing-generator.js','generators/deck-equipment/fittings-generator.js',
        'generators/anchors/anchor-generator.js','generators/sails/sail-cloth-generator.js',
        'generators/sails/head-sails-generator.js','generators/masts/mast-frame-generator.js',
        'generators/rigging/standing-rigging-generator.js'
      ]) {
        assert.ok(existsSync(new URL(root + file, import.meta.url)), id + ' missing component generator ' + file);
      }
      assert.ok(facade.includes('../../shared/ship-editor-kit.js'), id + ' should resolve shared support from its folder depth');
      assert.ok(!facade.includes('../ships/vessels/' + id + '.js'), id + ' should not retain the flat generator');
    } else {
      for (const required of [
        'function halfBreadth(', 'function hullPoint(', 'function buildHull(',
        'function buildFramesAndPlanking(', 'function buildStern(', 'function buildBow(',
        'function buildRudderAndHelm(', 'function buildRailingsAndEquipment(',
        'function buildAnchors(', 'function buildCanvasSail(', 'function buildRig(',
      ]) assert.ok(facade.includes(required), id + ' must own ' + required);
    }
    const hull = geometrySource.match(/function halfBreadth\(d,t\)\s*\{([\s\S]*?)\}/);
    const sail = sailSource.match(/function buildCanvasSail\(ctx,[\s\S]*?\n\}/);
    assert.ok(hull, id + ' has a readable local hull breadth function');
    assert.ok(sail, id + ' has a readable local curved sail function');
    hullAlgorithms.push(hull[1].trim());
    sailAlgorithms.push(sail[0].trim());
  }
  assert.equal(new Set(hullAlgorithms).size, 18, 'All 18 ships must have different hull breadth algorithms');
  assert.equal(new Set(sailAlgorithms).size, 18, 'All 18 ships must have their own sail surface profiles');

  const kit = readFileSync(new URL('../ships/shared/ship-editor-kit.js', import.meta.url), 'utf8');
  for (const geometryRoutine of ['function halfBreadth(', 'function hullPoint(', 'function buildHull(', 'function buildCanvasSail(', 'function buildRig(']) {
    assert.ok(!kit.includes(geometryRoutine), 'Editor kit must not contain vessel geometry: ' + geometryRoutine);
  }
});

test('each vessel has an independent design, structure profile and generator', () => {
  for (const id of ids) {
    const design = getShipDesign(id);
    const structure = getShipStructureBlueprint(id);
    const module = getVesselModule(id);
    assert.ok(design, id + ' design');
    assert.ok(structure, id + ' structure');
    assert.equal(design.id, id);
    assert.ok(design.hullLength > 0 && design.beam > 0 && design.draft > 0, id + ' dimensions');
    assert.ok(Array.isArray(design.masts) && design.masts.length > 0, id + ' rig');
    assert.ok(Array.isArray(design.partNames) && design.partNames.length > 10, id + ' parts');
    assert.ok(structure.frameCount >= 12, id + ' frames');
    assert.equal(module.design.id, id, id + ' module design');
    assert.equal(module.structure.frameCount, structure.frameCount, id + ' module structure');
    assert.ok(Object.isFrozen(design), id + ' design is immutable');
    assert.ok(Object.isFrozen(structure), id + ' structure is immutable');
  }
});

test('all 18 independent ForTests generators build separate editable models', () => {
  for (const id of ids) {
    const module = getVesselModule(id);
    const ship = module.createModel();
    try {
      assert.equal(ship.userData.shipType, id, id + ' model type');
      assert.equal(ship.userData.shipGeneratorId, id, id + ' generator routing');
      assert.equal(
        ship.userData.shipDefinitionPath,
        module.editorModulePath,
        id + ' ForTests definition path',
      );
      assert.equal(
        ship.userData.shipEditorModulePath,
        module.editorModulePath,
        id + ' dedicated ForTests model/generator path',
      );
      assert.equal(ship.userData.shipGameDefinitionPath, 'src/world/ships/vessels/' + id + '.js');
      assert.equal(ship.userData.shipSourceVersion, 'ForTests-native');
      assert.ok(ship.userData.getPart('hull'), id + ' hull');
      assert.ok(ship.userData.getPart('deck'), id + ' deck');
      assert.ok(ship.userData.getPart('rudder'), id + ' rudder');
      assert.ok(ship.userData.getPart('deck-fittings'), id + ' deck fittings');
      assert.ok(!ship.userData.partNames.some(name => /cannon|deck-gun|gun-carriage/i.test(name)),
        id + ' must not embed vessel-specific cannon components');
      const embeddedCannons = [];
      ship.traverse(object => {
        if (/cannon|deck-gun|gun-carriage-wheel/i.test(object.name)) embeddedCannons.push(object.name);
      });
      assert.deepEqual(embeddedCannons, [], id + ' must leave cannon models to the shared vessel module');
      // Conventional standing rigging is articulated where the vessel has it.
      // Chinese junk masts use battened lug sails and are intentionally unstayed;
      // do not invent shrouds merely to satisfy the shared animation test.
      for(const mastDefinition of getShipDesign(id).masts){
        const mast=ship.userData.getPart('mast-'+mastDefinition.id);
        const pivot=mast?.userData.mastControl?.pivotGroup;
        assert.ok(mast&&pivot,id+' '+mastDefinition.id+' mast-step pivot');
        const supportLines=[];
        ship.traverse(object=>{
          if(object.isMesh&&object.userData.dynamicMastStay?.mastId===mastDefinition.id)supportLines.push(object);
        });
        if(mastDefinition.rig==='junk'){
          assert.equal(supportLines.length,0,id+' '+mastDefinition.id+' battened junk mast remains intentionally unstayed');
          assert.ok(ship.userData.getPart('junk-battens-'+mastDefinition.id),id+' '+mastDefinition.id+' retains its independent sail battens');
          const heelBefore=pivot.rotation.z;
          ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:30});
          ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:30});
          assert.ok(Math.abs(pivot.rotation.z-heelBefore)>1e-6,id+' '+mastDefinition.id+' unstayed mast still responds to wind');
          continue;
        }
        assert.ok(supportLines.length>0,id+' '+mastDefinition.id+' has articulated standing rigging');
        const sample=supportLines[0],metadata=sample.userData.dynamicMastStay;
        const geometryBefore=sample.geometry.uuid;
        const positionsBefore=new Float32Array(sample.geometry.attributes.position.array);
        const parent=sample.parent,Vector3Type=sample.position.constructor;
        ship.updateMatrixWorld(true);
        // Dynamic stays now declare their physical foot in hull-local space,
        // independent of the generator's original tube coordinate frame.
        const fixedFrame=ship.userData.getPart('hull')||ship;
        assert.ok(Array.isArray(metadata.fixedPointHull),id+' '+mastDefinition.id+' stay records a hull-local fitting');
        const fixedBefore=fixedFrame.localToWorld(new Vector3Type(...metadata.fixedPointHull));
        assert.equal(metadata.coordinateSpace,'mast-group',id+' '+mastDefinition.id+' standing stays use their mast component frame');
        assert.ok(Array.isArray(metadata.mastHeadPivotLocal),id+' '+mastDefinition.id+' stay records its moving masthead attachment');
        const attribute=sample.geometry.attributes.position,radial=metadata.radialSegments??7,stride=radial+1;
        const initialStartCenter=new Vector3Type();
        for(let i=0;i<=radial;i++){
          const offset=i;
          initialStartCenter.add(new Vector3Type(attribute.getX(offset),attribute.getY(offset),attribute.getZ(offset)));
        }
        initialStartCenter.multiplyScalar(1/(radial+1));
        const expectedHead=mast.userData.animationPivot.localToWorld(new Vector3Type(...metadata.mastHeadPivotLocal));
        assert.ok(sample.localToWorld(initialStartCenter.clone()).distanceTo(expectedHead)<.02,id+' '+mastDefinition.id+' stay starts at its moving masthead fitting');
        const initialEndCenter=new Vector3Type();
        for(let i=0;i<=radial;i++){
          const offset=metadata.segments*stride+i;
          initialEndCenter.add(new Vector3Type(attribute.getX(offset),attribute.getY(offset),attribute.getZ(offset)));
        }
        initialEndCenter.multiplyScalar(1/(radial+1));
        const initialFixed=sample.localToWorld(initialEndCenter.clone());
        const initialGap=initialFixed.distanceTo(fixedBefore);
        const anchorDiagnostic={
          vessel:id,mast:mastDefinition.id,stay:sample.name,coordinateSpace:metadata.coordinateSpace,
          parent:sample.parent?.name,fixedFrame:fixedFrame.name,
          fixedPoint:metadata.fixedPoint,endCenter:initialEndCenter.toArray(),
          fixedWorld:fixedBefore.toArray(),actualWorld:initialFixed.toArray(),
          gap:initialGap,
          samplePosition:sample.position.toArray(),
          parentPosition:sample.parent?.position.toArray(),
          mastPosition:mast.position.toArray(),
          sampleMatrixWorld:sample.matrixWorld.elements,
          mastMatrixWorld:mast.matrixWorld.elements
        };
        assert.ok(initialGap<.02,id+' '+mastDefinition.id+' stay starts at its declared hull fitting; diagnostic='+JSON.stringify(anchorDiagnostic));
        ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:30});
        ship.userData.animateShip(.05,{enabled:true,directionDeg:90,speedKnots:30});
        assert.equal(sample.geometry.uuid,geometryBefore,id+' '+mastDefinition.id+' standing rig reuses its tube geometry');
        assert.ok(sample.geometry.attributes.position.array.some((value,index)=>Math.abs(value-positionsBefore[index])>1e-6),id+' '+mastDefinition.id+' stay vertices respond to mast heel');
        const endCenter=new Vector3Type();
        for(let i=0;i<=radial;i++){
          const offset=metadata.segments*stride+i;
          endCenter.add(new Vector3Type(attribute.getX(offset),attribute.getY(offset),attribute.getZ(offset)));
        }
        endCenter.multiplyScalar(1/(radial+1));
        ship.updateMatrixWorld(true);
        const actualFixed=sample.localToWorld(endCenter);
        assert.ok(actualFixed.distanceTo(fixedBefore)<.02,id+' '+mastDefinition.id+' stay remains attached to its fixed hull fitting');
        const startAfter=new Vector3Type();
        for(let i=0;i<=radial;i++){
          const offset=i;
          startAfter.add(new Vector3Type(attribute.getX(offset),attribute.getY(offset),attribute.getZ(offset)));
        }
        startAfter.multiplyScalar(1/(radial+1));
        const expectedHeadAfter=mast.userData.animationPivot.localToWorld(new Vector3Type(...metadata.mastHeadPivotLocal));
        assert.ok(sample.localToWorld(startAfter).distanceTo(expectedHeadAfter)<.02,id+' '+mastDefinition.id+' stay remains attached to its moving masthead after wind');
      }
      if (id === 'sloop-v2') {
        const cabin = ship.userData.getPart('stern-tier-1');
        assert.ok(cabin, 'Maid of Endor should have its compact trunk cabin');
        let shellCount = 0;
        let coachroofCount = 0;
        let portlightCount = 0;
        cabin.traverse((object) => {
          if (object.isMesh && object.geometry?.type === 'ExtrudeGeometry') shellCount += 1;
          if (object.isMesh && object.name === 'coachroof-curved-top') coachroofCount += 1;
          if (object.isMesh && object.name === 'coachroof-portlight') portlightCount += 1;
        });
        assert.ok(shellCount > 0, 'Maid of Endor cabin should have a shaped low trunk shell');
        assert.ok(coachroofCount > 0, 'Maid of Endor cabin should have its compact coachroof');
        assert.ok(portlightCount >= 2, 'Maid of Endor cabin should expose separate portlights');
      } else if (id !== 'pinnace' && id !== 'sloop') {
        const cabin = ship.userData.getPart('stern-tier-1');
        assert.ok(cabin, id + ' should have a proportioned aft cabin');
        let foldedShells = 0;
        let foldDetails = 0;
        cabin.traverse((object) => {
          if (object.isMesh && object.geometry?.type === 'ExtrudeGeometry') foldedShells += 1;
          if (object.isMesh && (object.name === 'folded-cabin-side-rib' || object.name === 'folded-cabin-cross-rib')) foldDetails += 1;
        });
        assert.ok(foldedShells > 0, id + ' cabin should use a sculpted side-profile shell');
        assert.ok(foldDetails >= 8, id + ' cabin should show its backward-folded roof ribs');
      }

      if (id === 'schooner') {
        const deckhouse = ship.userData.getPart('deckhouse');
        let foldedDeckhouse = 0;
        deckhouse.traverse((object) => {
          if (object.isMesh && object.geometry?.type === 'ExtrudeGeometry') foldedDeckhouse += 1;
        });
        assert.ok(foldedDeckhouse > 0, 'schooner deckhouse should have a folded-back side silhouette');
      }
      const sails=ship.userData.partNames.map(name=>ship.userData.getPart(name)).filter(part=>part?.userData.sailControl);
      assert.ok(sails.length>0,id+' should expose independently editable sails');
      for(const sail of sails){
        const control=sail.userData.sailControl;
        const pivot=control.pivotGroup||sail.userData.animationPivot;
        const deployment=sail.getObjectByName(control.deploymentPart);
        const cloth=ship.userData.getPart(control.clothPart);
        assert.ok(pivot&&deployment&&cloth,id+' '+sail.name+' tack pivot and deployment group');
        assert.equal(deployment.parent,pivot,id+' '+sail.name+' deployment group is under its tack pivot');
        let canvas=null;cloth.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')canvas=object;});
        assert.ok(canvas?.userData.sailCloth?.rows>0&&canvas.userData.sailCloth?.columns>0,id+' '+sail.name+' wind-billow grid metadata');
        const furlFrame=deployment.getObjectByName('sail-furl-frame-'+sail.name);
        assert.ok(furlFrame?.userData.sailFurlEdge,id+' '+sail.name+' furl frame follows its authored support edge');
        assert.equal(cloth.parent,furlFrame,id+' '+sail.name+' cloth remains inside its furl frame');
        assert.equal(ship.userData.resetPartTransform(control.clothPart),true,id+' '+sail.name+' cloth component reset');
        assert.equal(cloth.parent,furlFrame,id+' '+sail.name+' component reset preserves the furl frame');
      }
      const furlSamples=sails.map(sail=>{
        const control=sail.userData.sailControl;
        const deployment=sail.getObjectByName(control.deploymentPart);
        const cloth=ship.userData.getPart(control.clothPart);
        let canvas=null;cloth.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')canvas=object;});
        const grid=canvas.userData.sailCloth,stride=grid.columns+1;
        const pointAt=index=>{
          const point=new THREE.Vector3().fromBufferAttribute(canvas.geometry.attributes.position,index);
          return canvas.localToWorld(point);
        };
        const distanceToSupport=(point,start,end)=>{
          const axis=end.clone().sub(start).normalize();
          const offset=point.clone().sub(start);
          return offset.addScaledVector(axis,-offset.dot(axis)).length();
        };
        ship.updateMatrixWorld(true);
        const supportStart=pointAt(0);
        const supportEnd=pointAt(grid.rows*stride);
        // A triangular jib's bottom outside corner is the tack itself, so
        // that one vertex correctly lies on the luff and has zero width.
        // Sample the middle and head ends of the opposite edge instead.
        const sampleIndices=[Math.ceil(grid.rows*.5)*stride+grid.columns,
          grid.rows*stride+grid.columns];
        const canvasSamples=sampleIndices.map(index=>{
          const point=pointAt(index);
          const distance=distanceToSupport(point,supportStart,supportEnd);
          assert.ok(distance>1e-4,id+' '+sail.name+' has measurable canvas width away from its support edge');
          return {index,point,distance};
        });
        return {
          sail,mastId:control.mastId,pointAt,distanceToSupport,grid,stride,
          supportStart,supportEnd,canvasSamples
        };
      });
      for(const mastId of new Set(furlSamples.map(sample=>sample.mastId))){
        const mastSamples=furlSamples.filter(sample=>sample.mastId===mastId);
        assert.equal(ship.userData.setSailDeployment(mastId,'reefed',0),true,id+' mast '+mastId+' reef command');
        ship.updateMatrixWorld(true);
        for(const sample of mastSamples){
          const supportStart=sample.pointAt(0);
          const supportEnd=sample.pointAt(sample.grid.rows*sample.stride);
          assert.ok(supportStart.distanceTo(sample.supportStart)<1e-4
            &&supportEnd.distanceTo(sample.supportEnd)<1e-4,id+' '+sample.sail.name+' reefing preserves its angled luff');
          for(const canvasSample of sample.canvasSamples){
            const distance=sample.distanceToSupport(sample.pointAt(canvasSample.index),supportStart,supportEnd);
            assert.ok(Math.abs(distance/canvasSample.distance-.48)<.015,
              id+' '+sample.sail.name+' reefing contracts perpendicular to its luff');
          }
        }
        assert.equal(ship.userData.setSailDeployment(mastId,'furled',0),true,id+' mast '+mastId+' furl command');
        ship.updateMatrixWorld(true);
        for(const sample of mastSamples){
          const supportStart=sample.pointAt(0);
          const supportEnd=sample.pointAt(sample.grid.rows*sample.stride);
          assert.ok(supportStart.distanceTo(sample.supportStart)<1e-4
            &&supportEnd.distanceTo(sample.supportEnd)<1e-4,id+' '+sample.sail.name+' furling keeps both luff endpoints fixed');
          for(const canvasSample of sample.canvasSamples){
            const distance=sample.distanceToSupport(sample.pointAt(canvasSample.index),supportStart,supportEnd);
            assert.ok(Math.abs(distance/canvasSample.distance-.001)<.002,
              id+' '+sample.sail.name+' furling gathers onto its angled luff');
          }
        }
        assert.equal(ship.userData.setSailDeployment(mastId,'full',0),true,id+' mast '+mastId+' full-sail command');
        ship.updateMatrixWorld(true);
        for(const sample of mastSamples){
          assert.ok(sample.pointAt(0).distanceTo(sample.supportStart)<1e-4
            &&sample.pointAt(sample.grid.rows*sample.stride).distanceTo(sample.supportEnd)<1e-4
            &&sample.canvasSamples.every(canvasSample=>
              sample.pointAt(canvasSample.index).distanceTo(canvasSample.point)<1e-4),
            id+' '+sample.sail.name+' full deployment restores its original geometry and angle');
        }
      }
      const sample=sails[0],sampleControl=sample.userData.sailControl;
      const sampleCloth=ship.userData.getPart(sampleControl.clothPart);
      let sampleCanvas=null;sampleCloth.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')sampleCanvas=object;});
      const canvasBefore=new Float32Array(sampleCanvas.geometry.attributes.position.array);
      ship.userData.animateShip(.05,{enabled:true,directionDeg:210,speedKnots:24});
      assert.ok(sampleCanvas.geometry.attributes.position.array.some((value,index)=>Math.abs(value-canvasBefore[index])>1e-6),id+' sail cloth responds to wind');
      if (getShipDesign(id).headsails > 0) {
        const headStayNames = ship.userData.partNames.filter(name => name.startsWith('head-stays-'));
        assert.ok(headStayNames.length >= getShipDesign(id).headsails,
          id + ' should generate an individually editable stay for every headsail');
        if (id === 'wargalion') {
          for (let index = 1; index <= getShipDesign(id).headsails; index++) {
            const stayGroup = ship.userData.getPart('head-stays-' + index);
            assert.ok(stayGroup, 'wargalion headsail ' + index + ' has its own forestay group');
            let stayMesh = null;
            stayGroup.traverse(object => {
              if (object.isMesh && object.userData.dynamicMastStay) stayMesh = object;
            });
            assert.ok(stayMesh, 'wargalion headsail ' + index + ' forestay is dynamically mast-anchored');
            assert.equal(stayMesh.userData.dynamicMastStay.mastId, 'fore',
              'wargalion headsail ' + index + ' forestay follows the foremast');
            assert.equal(stayMesh.userData.dynamicMastStay.coordinateSpace, 'mast-group',
              'wargalion headsail ' + index + ' uses the foremast reference frame');
            assert.ok(Array.isArray(stayMesh.userData.dynamicMastStay.fixedPoint)
              && stayMesh.userData.dynamicMastStay.fixedPoint.length === 3,
              'wargalion headsail ' + index + ' forestay retains a fixed lower fitting');
          }
        }
      }
      if (id === 'fluyt') {
        assert.ok(ship.userData.getPart('cargo-deck-details'), 'fluyt merchant cargo deck');
        assert.ok(ship.userData.getPart('cargo-hatch-forward'), 'fluyt forward cargo hatch');
        assert.ok(ship.userData.getPart('cargo-hatch-aft'), 'fluyt aft cargo hatch');
        assert.ok(ship.userData.getPart('fluyt-spritsail-rig'), 'fluyt spritsail assembly');
      }
      if (id === 'xebec') {
        assert.ok(ship.userData.getPart('xebec-oar-banks'), 'xebec oar banks');
        assert.ok(ship.userData.getPart('xebec-rowing-benches'), 'xebec rowing benches');
      }
      if (id === 'schooner') {
        assert.ok(ship.userData.getPart('deckhouse'), 'schooner low aft deckhouse');
      }
      if (id === 'snow') {
        assert.ok(ship.userData.getPart('snow-trysail-mast-horse'), 'snow auxiliary trysail mast supports');
      }
      if (['galleon','carrack','first-rate'].includes(id)) {
        const sternTier = ship.userData.getPart('stern-tier-1');
        let taperedSternMeshes = 0;
        sternTier.traverse((object) => {
          if (object.isMesh && object.geometry?.type === 'ExtrudeGeometry') taperedSternMeshes += 1;
        });
        assert.ok(taperedSternMeshes > 0, id + ' should use a tapered, bevelled stern-tier shell');
        const sideWindows = ship.userData.getPart('stern-side-windows');
        let framedSideWindows = 0;
        sideWindows.traverse((object) => {
          if (object.isMesh && object.name === 'stern-side-window') framedSideWindows += 1;
        });
        assert.ok(framedSideWindows >= 6, id + ' should have framed gallery windows visible from port and starboard');
        let galleryWalkways = 0;
        sternTier.traverse((object) => {
          if (object.isMesh && object.name === id + '-side-gallery-walkway') galleryWalkways += 1;
        });
        let gallerySupports = 0;
        ship.userData.getPart('stern-gallery').traverse((object) => {
          if (object.isMesh && object.name === 'gallery-cantilever-support') gallerySupports += 1;
        });
        assert.ok(galleryWalkways >= 2, id + ' should have separate port and starboard stern gallery walkways');
        assert.ok(gallerySupports >= 10, id + ' should support its stern galleries with visible corbels');

      }
      if (['galleon','carrack'].includes(id)) {
        assert.ok(ship.userData.getPart(id + '-forecastle'), id + ' raised forecastle assembly');
        assert.ok(ship.userData.getPart(id + '-forecastle-deck'), id + ' raised forecastle deck');
        assert.ok(ship.userData.getPart('forecastle-side-sheathing'), id + ' forecastle side sheathing');
      }

      const sailCloths = [];
      ship.traverse((object) => {
        if (!object.isMesh || object.name !== 'sail-shaped-cloth') return;
        const bounds = object.geometry.boundingBox;
        assert.ok(bounds, id + ' sail geometry should have calculated bounds');
        const dimensions = [
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y,
          bounds.max.z - bounds.min.z,
        ].sort((a, b) => a - b);
        assert.ok(dimensions[0] > .025, id + ' sail should have visible cloth fullness');
        assert.ok(dimensions[1] > .7, id + ' sail should have useful area in its second dimension');
        assert.ok(dimensions[2] > 1.2, id + ' sail should not collapse into a narrow strip');
        sailCloths.push(object);
      });
      assert.ok(sailCloths.length > 0, id + ' should generate sail cloth');
      for (const mast of getShipDesign(id).masts.filter((item) => item.rig === 'square' && (item.squares ?? 2) > 0)) {
        const course = ship.userData.getPart('sail-' + mast.id + '-course');
        assert.ok(course, id + ' ' + mast.id + ' should have its lower square course');
        let courseWidth = 0;
        let courseHeight = 0;
        course.traverse((object) => {
          if (!object.isMesh || object.name !== 'sail-shaped-cloth') return;
          const bounds = object.geometry.boundingBox;
          courseWidth = Math.max(courseWidth, bounds.max.x - bounds.min.x);
          courseHeight = Math.max(courseHeight, bounds.max.y - bounds.min.y);
        });
        assert.ok(courseWidth >= ship.userData.shipDimensionsUnits.length * .32,
          id + ' ' + mast.id + ' course yard/sail should be proportioned to hull length');
        assert.ok(courseHeight >= mast.height * .25,
          id + ' ' + mast.id + ' course should use a substantial part of the mast height');
      }
      assert.ok(ship.userData.partNames.some((name) => name.startsWith('panel-seams-sail-')), id + ' editable sail panel seams');
      for (const partName of getShipDesign(id).partNames) {
        assert.ok(ship.userData.getPart(partName), id + ' missing editable component ' + partName);
      }
      assert.equal(typeof ship.userData.getPartTransform, 'function');
      assert.equal(typeof ship.userData.applyShipState, 'function');
      assert.equal(typeof ship.userData.getShipState, 'function');

      ship.traverse((object) => {
        if (!object.isMesh) return;
        const position = object.geometry?.getAttribute('position');
        assert.ok(position && position.count > 0, id + ' mesh geometry ' + object.name);
        for (let i = 0; i < position.count; i += 1) {
          assert.ok(Number.isFinite(position.getX(i)), id + ' invalid x in ' + object.name);
          assert.ok(Number.isFinite(position.getY(i)), id + ' invalid y in ' + object.name);
          assert.ok(Number.isFinite(position.getZ(i)), id + ' invalid z in ' + object.name);
        }
      });
    } finally {
      disposeAndRelease(ship);
    }
  }
});

test('all vessels expose mast-step, rudder-stock and helm-axle pivots with linked steering',()=>{
  for(const id of ids){
    const design=getShipDesign(id),ship=createShipModel(id);
    try{
      for(const definition of design.masts){
        const mast=ship.userData.getPart('mast-'+definition.id);
        assert.ok(mast?.userData.mastControl?.pivotGroup,id+' '+definition.id+' mast-step pivot');
        assert.equal(mast.userData.mastControl.pivotGroup.parent,mast,id+' mast pivot stays inside editable component');
      }
      const rudder=ship.userData.getPart('rudder'),wheel=ship.userData.getPart('helm-wheel');
      assert.ok(rudder?.userData.steeringControl?.pivotGroup,id+' rudder stock pivot');
      assert.ok(wheel?.userData.steeringControl?.pivotGroup,id+' helm axle pivot');
      const rudderPose=ship.userData.getPartTransform('rudder');
      const angle=.2;
      ship.userData.setRudderAngle(angle);
      const rudderControl=rudder.userData.steeringControl,wheelControl=wheel.userData.steeringControl;
      const axisProperty=axis=>({x:'x',y:'y',z:'z'})[axis]||'z';
      const rudderAxis=axisProperty(rudderControl.axis||'y');
      const helmAxis=axisProperty(wheelControl.axis||'z');
      assert.ok(Math.abs(rudderControl.pivotGroup.rotation[rudderAxis]-angle)<1e-6,id+' rudder rotation on declared axis');
      assert.ok(Math.abs(wheelControl.pivotGroup.rotation[helmAxis]-angle*(wheelControl.ratio??4.5))<1e-6,
        id+' helm control follows rudder ratio on its declared axis');
      assert.deepEqual(ship.userData.getPartTransform('rudder'),rudderPose,id+' steering stays outside saved editor transforms');
    }finally{disposeAndRelease(ship);}
  }
});

test('design overrides rebuild only the selected vessel and can be reset', () => {
  const original = getShipDesign('sloop');
  try {
    assert.equal(setShipDesignOverrides('sloop', { beam: original.beam + 1.25 }), true);
    const changed = getShipDesign('sloop');
    assert.ok(Math.abs(changed.beam - (original.beam + 1.25)) < 1e-9);
    assert.ok(Math.abs(changed.beamUnits - (original.beam + 1.25) * (4 / 3)) < 1e-9);
    assert.equal(getShipDesign('galleon').beam, SHIP_DESIGNS.galleon.beam);

    const ship = createShipModel('sloop');
    try {
      assert.ok(Math.abs(ship.userData.shipDimensions.beam - (original.beam + 1.25)) < 1e-9);
    } finally {
      disposeAndRelease(ship);
    }
  } finally {
    resetShipDesignOverrides('sloop');
  }
  assert.equal(getShipDesign('sloop').beam, original.beam);
});

test('structure overrides change the selected vessel frame layout and can be reset', () => {
  const original = getShipStructureBlueprint('sloop');
  try {
    assert.equal(setShipStructureOverrides('sloop', { frameCount: original.frameCount + 2 }), true);
    assert.equal(getShipStructureBlueprint('sloop').frameCount, original.frameCount + 2);
    const ship = createShipModel('sloop');
    try {
      assert.ok(ship.userData.getPart('frame-' + String(original.frameCount + 2).padStart(2, '0')));
    } finally {
      disposeAndRelease(ship);
    }
  } finally {
    resetShipStructureOverrides('sloop');
  }
  assert.equal(getShipStructureBlueprint('sloop').frameCount, original.frameCount);
});

test('component move, rotation, scale and live gizmo values persist in ship state', () => {
  const ship = createShipModel('sloop');
  try {
    const mast = ship.userData.getPart('mast-single');
    assert.ok(mast);
    const initialTransform = ship.userData.getPartTransform('mast-single');
    mast.position.x += 0.75;
    mast.rotation.y += 0.12;
    mast.scale.z *= 1.15;

    const transform = ship.userData.getPartTransform('mast-single');
    assert.ok(Math.abs(transform.x - 0.75) < 1e-8);
    assert.ok(Math.abs(transform.ry - 0.12) < 1e-8);
    assert.ok(Math.abs(transform.sz - initialTransform.sz * 1.15) < 1e-8);

    const state = ship.userData.getShipState();
    assert.ok(Math.abs(state.partTransforms['mast-single'].x - 0.75) < 1e-8);
    assert.ok(Math.abs(state.partTransforms['mast-single'].ry - 0.12) < 1e-8);
    assert.ok(Math.abs(state.partTransforms['mast-single'].sz - initialTransform.sz * 1.15) < 1e-8);

    const restored = createShipModel('sloop', state.partTransforms, state);
    try {
      const result = restored.userData.getPartTransform('mast-single');
      assert.ok(Math.abs(result.x - 0.75) < 1e-8);
      assert.ok(Math.abs(result.ry - 0.12) < 1e-8);
      assert.ok(Math.abs(result.sz - initialTransform.sz * 1.15) < 1e-8);
    } finally {
      disposeAndRelease(restored);
    }
  } finally {
    disposeAndRelease(ship);
  }
});

test('reset component restores its original hierarchy, transform and visibility', () => {
  const ship = createShipModel('sloop');
  try {
    const part = ship.userData.getPart('mast-single');
    const originalParent = part.parent;
    const originalPosition = part.position.clone();
    const originalRotation = part.rotation.clone();
    const originalScale = part.scale.clone();

    assert.equal(ship.userData.setPartTransform('mast-single', {
      x: 1.25, y: 0.4, z: -0.6, rx: 0.2, ry: -0.15, rz: 0.1, sx: 1.4, sy: 1.2, sz: 0.8,
    }), true);
    assert.equal(ship.userData.setPartVisible('mast-single', false), true);
    assert.equal(ship.userData.detachPart('mast-single'), true);
    assert.equal(part.visible, false);
    assert.notEqual(part.parent, originalParent);

    assert.equal(ship.userData.resetPartTransform('mast-single'), true);
    assert.equal(part.parent, originalParent);
    assert.equal(part.visible, true);
    assert.ok(part.position.distanceTo(originalPosition) < 1e-8);
    assert.ok(part.scale.distanceTo(originalScale) < 1e-8);
    assert.ok(Math.abs(part.rotation.x - originalRotation.x) < 1e-8);
    assert.ok(Math.abs(part.rotation.y - originalRotation.y) < 1e-8);
    assert.ok(Math.abs(part.rotation.z - originalRotation.z) < 1e-8);
    assert.deepEqual(ship.userData.getShipState().unlinkedParts, []);
    assert.deepEqual(ship.userData.getShipState().hiddenParts, {});
  } finally {
    disposeAndRelease(ship);
  }
});


test('sail fullness reverses to the lee side as wind direction changes', () => {
  const ship = createShipModel('sloop');
  try {
    const sail = ship.userData.partNames
      .map(name => ship.userData.getPart(name))
      .find(part => part?.userData.sailControl?.sailType === 'gaff-mainsail');
    assert.ok(sail, 'Sloop gaff mainsail control');
    const cloth = ship.userData.getPart(sail.userData.sailControl.clothPart);
    let canvas = null;
    cloth?.traverse(object => {
      if (object.isMesh && object.name === 'sail-shaped-cloth') canvas = object;
    });
    assert.ok(canvas?.geometry?.attributes?.position, 'Mainsail canvas mesh');
    const metadata = canvas.userData.sailCloth;
    const position = canvas.geometry.attributes.position;
    const columns = metadata.columns, rows = metadata.rows, stride = columns + 1;
    const axis = metadata.axis === 'x' ? 0 : 2;
    const center = Math.floor(rows / 2) * stride + Math.floor(columns / 2);
    const getAxis = () => position.getComponent(center, axis);
    const flat = () => {
      const rest = position;
      const c0 = rest.getComponent(0, axis);
      const c1 = rest.getComponent(columns, axis);
      const c2 = rest.getComponent(rows * stride, axis);
      const c3 = rest.getComponent(rows * stride + columns, axis);
      const u = .5, v = .5;
      return THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(c0, c1, u),
        THREE.MathUtils.lerp(c2, c3, u), v
      );
    };
    const neutral = flat();

    ship.userData.animateShip(.05, { enabled: true, directionDeg: 90, speedKnots: 30 });
    const starboardWind = getAxis() - neutral;
    assert.ok(starboardWind < -1e-5,
      'Wind from starboard must push the mainsail fullness toward port');

    ship.userData.animateShip(.05, { enabled: true, directionDeg: 270, speedKnots: 30 });
    const portWind = getAxis() - neutral;
    assert.ok(portWind > 1e-5,
      'Wind from port must reverse the mainsail fullness toward starboard');

    const calmShip = createShipModel('sloop');
    try {
      const calmSail = calmShip.userData.partNames
        .map(name => calmShip.userData.getPart(name))
        .find(part => part?.userData.sailControl?.sailType === 'gaff-mainsail');
      const calmCloth = calmShip.userData.getPart(calmSail.userData.sailControl.clothPart);
      let calmCanvas = null;
      calmCloth.traverse(object => {
        if (object.isMesh && object.name === 'sail-shaped-cloth') calmCanvas = object;
      });
      const calmPosition = calmCanvas.geometry.attributes.position;
      const calmMetadata = calmCanvas.userData.sailCloth;
      const calmStride = calmMetadata.columns + 1;
      const calmCenter = Math.floor(calmMetadata.rows / 2) * calmStride + Math.floor(calmMetadata.columns / 2);
      const calmAxis = calmMetadata.axis === 'x' ? 0 : 2;
      const c0 = calmPosition.getComponent(0, calmAxis);
      const c1 = calmPosition.getComponent(calmMetadata.columns, calmAxis);
      const c2 = calmPosition.getComponent(calmMetadata.rows * calmStride, calmAxis);
      const c3 = calmPosition.getComponent(calmMetadata.rows * calmStride + calmMetadata.columns, calmAxis);
      const neutral = THREE.MathUtils.lerp(THREE.MathUtils.lerp(c0, c1, .5), THREE.MathUtils.lerp(c2, c3, .5), .5);
      calmShip.userData.animateShip(.05, { enabled: false, directionDeg: 90, speedKnots: 0 });
      assert.ok(Math.abs(calmPosition.getComponent(calmCenter, calmAxis) - neutral) < 1e-8,
        'A calm sail must relax to its neutral, flat reference surface');
    } finally {
      disposeAndRelease(calmShip);
    }
  } finally {
    disposeAndRelease(ship);
  }
});


test('the first two forward triangular sails keep their orientation while retaining directional billow', () => {
  const ship = createShipModel('sloop');
  try {
    const forwardSails = ['sail-head-1', 'sail-head-2'].map(name => {
      const part = ship.userData.getPart(name);
      assert.ok(part, name + ' forward triangular sail');
      const pivot = part.userData.sailControl?.pivotGroup;
      assert.ok(pivot, name + ' animation pivot');
      const clothPart = ship.userData.getPart(part.userData.sailControl.clothPart);
      let canvas = null;
      clothPart?.traverse(object => {
        if (object.isMesh && object.name === 'sail-shaped-cloth') canvas = object;
      });
      assert.ok(canvas?.geometry?.attributes?.position, name + ' cloth mesh');
      const metadata = canvas.userData.sailCloth;
      const position = canvas.geometry.attributes.position;
      const stride = metadata.columns + 1;
      const axis = metadata.axis === 'x' ? 0 : 2;
      const center = Math.floor(metadata.rows / 2) * stride + Math.floor(metadata.columns / 2);
      const flat = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(position.getComponent(0, axis), position.getComponent(metadata.columns, axis), .5),
        THREE.MathUtils.lerp(position.getComponent(metadata.rows * stride, axis),
          position.getComponent(metadata.rows * stride + metadata.columns, axis), .5), .5
      );
      return { name, pivot, canvas, axis, center, flat };
    });
    const foreMainsail = ship.userData.partNames
      .map(name => ship.userData.getPart(name))
      .find(part => part?.userData.sailControl?.sailType === 'gaff-mainsail');
    assert.ok(foreMainsail, 'Foremast gaff mainsail');
    const mastPivot = foreMainsail.userData.sailControl.pivotGroup;
    assert.ok(mastPivot, 'Foremast mainsail animation pivot');

    const initialHeadRotations = forwardSails.map(sail => sail.pivot.rotation.y);
    const initialMastRotation = mastPivot.rotation.y;
    ship.userData.animateShip(.05, { enabled: true, directionDeg: 90, speedKnots: 30 });

    forwardSails.forEach((sail, index) => {
      assert.ok(Math.abs(sail.pivot.rotation.y - initialHeadRotations[index]) < 1e-8,
        sail.name + ' must not rotate with wind');
    });
    assert.ok(Math.abs(mastPivot.rotation.y - initialMastRotation) > 1e-5,
      'Mast-mounted gaff sail must retain its wind-driven rotation');

    const firstWindOffsets = forwardSails.map(sail =>
      sail.canvas.geometry.attributes.position.getComponent(sail.center, sail.axis) - sail.flat
    );
    assert.ok(firstWindOffsets.every(offset => Math.abs(offset) > 1e-5),
      'Both forward triangular sails must retain wind-driven cloth fullness');

    ship.userData.animateShip(.05, { enabled: true, directionDeg: 270, speedKnots: 30 });
    forwardSails.forEach((sail, index) => {
      assert.ok(Math.abs(sail.pivot.rotation.y - initialHeadRotations[index]) < 1e-8,
        sail.name + ' must remain fixed when the wind reverses');
      const reversedOffset =
        sail.canvas.geometry.attributes.position.getComponent(sail.center, sail.axis) - sail.flat;
      assert.ok(firstWindOffsets[index] * reversedOffset < 0,
        sail.name + ' directional billow must reverse with the wind');
    });
  } finally {
    disposeAndRelease(ship);
  }
});


test('Sloop rocking responds to sea direction and height, then settles smoothly', () => {
  const ship = createShipModel('sloop');
  try {
    const rocking = ship.userData.sloopRocking;
    assert.ok(rocking, 'Sloop-specific rocking state is attached');
    assert.equal(rocking.version, SLOOP_ROCKING_VERSION);
    assert.equal(rocking.pivot, 'design-waterline-at-amidships');

    const basePosition = ship.position.clone();
    const baseRotation = ship.rotation.clone();

    // No sea input means no unintended root motion.
    ship.userData.animateShip(.05, { enabled: false, directionDeg: 90, speedKnots: 0,
      sea: { enabled: false, directionDeg: 90, heightMeters: 0, periodSeconds: 5 } });
    assert.ok(ship.position.distanceTo(basePosition) < 1e-10, 'Calm sea preserves root position');
    assert.ok(Math.abs(ship.rotation.x - baseRotation.x) < 1e-10, 'Calm sea preserves pitch');
    assert.ok(Math.abs(ship.rotation.z - baseRotation.z) < 1e-10, 'Calm sea preserves roll');

    let maximumRoll = -Infinity, minimumRoll = Infinity, maximumHeave = -Infinity, minimumHeave = Infinity;
    for (let frame = 0; frame < 100; frame++) {
      ship.userData.animateShip(.05, {
        enabled: false,
        sea: { enabled: true, directionDeg: 90, heightMeters: 1.5, periodSeconds: 5 }
      });
      maximumRoll = Math.max(maximumRoll, ship.rotation.z - baseRotation.z);
      minimumRoll = Math.min(minimumRoll, ship.rotation.z - baseRotation.z);
      maximumHeave = Math.max(maximumHeave, ship.position.y - basePosition.y);
      minimumHeave = Math.min(minimumHeave, ship.position.y - basePosition.y);
    }
    assert.ok(maximumRoll > THREE.MathUtils.degToRad(1), 'Starboard beam seas produce measurable roll');
    assert.ok(minimumRoll < THREE.MathUtils.degToRad(-1), 'Roll oscillates through both sides');
    assert.ok(maximumHeave > .05 && minimumHeave < -.05, 'Wave response includes vertical heave');
    assert.ok(Math.abs(rocking.pitchRadians) < 1e-8, 'Beam seas do not create head-on pitch');

    let maximumHeadPitch = 0;
    for (let frame = 0; frame < 100; frame++) {
      ship.userData.animateShip(.05, {
        enabled: false,
        sea: { enabled: true, directionDeg: 0, heightMeters: 1.5, periodSeconds: 5 }
      });
      maximumHeadPitch = Math.max(maximumHeadPitch, Math.abs(ship.rotation.x - baseRotation.x));
    }
    assert.ok(maximumHeadPitch > THREE.MathUtils.degToRad(.4),
      'Head seas produce measurable pitch');

    // Disabling waves fades the motion back to the original authored transform.
    for (let frame = 0; frame < 240; frame++) {
      ship.userData.animateShip(.05, {
        enabled: false,
        sea: { enabled: false, directionDeg: 0, heightMeters: 0, periodSeconds: 5 }
      });
    }
    assert.ok(ship.position.distanceTo(basePosition) < 1e-7, 'Sloop returns to its original position');
    assert.ok(Math.abs(ship.rotation.x - baseRotation.x) < 1e-7, 'Sloop returns to its original pitch');
    assert.ok(Math.abs(ship.rotation.z - baseRotation.z) < 1e-7, 'Sloop returns to its original roll');
    assert.equal(rocking.enabled, false);
  } finally {
    disposeAndRelease(ship);
  }
});


test('sea rocking is isolated to the Sloop and does not alter other vessel roots', () => {
  const ship = createShipModel('galleon');
  try {
    const position = ship.position.clone();
    const rotation = ship.rotation.clone();
    assert.equal(ship.userData.sloopRocking, undefined);
    ship.userData.animateShip(.05, {
      enabled: false,
      sea: { enabled: true, directionDeg: 90, heightMeters: 3, periodSeconds: 4 }
    });
    assert.ok(ship.position.distanceTo(position) < 1e-10, 'Galleon root position remains unchanged');
    assert.ok(Math.abs(ship.rotation.x - rotation.x) < 1e-10, 'Galleon pitch remains unchanged');
    assert.ok(Math.abs(ship.rotation.z - rotation.z) < 1e-10, 'Galleon roll remains unchanged');
  } finally {
    disposeAndRelease(ship);
  }
});
