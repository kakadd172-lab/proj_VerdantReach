import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import {
  SHIP_DESIGNS,getShipDesign,setShipDesignOverrides,resetShipDesignOverrides,SHIP_DESIGN_MODULE_VERSION,
  getShipStructureBlueprint,setShipStructureOverrides,resetShipStructureOverrides,SHIP_STRUCTURE_MODULE_VERSION,
  createShipModel,disposeShipModel,SHIP_GENERATORS,VESSEL_IDS,VESSEL_MODULES,SHIP_MODEL_MODULE_VERSION,
  getVesselModule,
} from '../ships/index.js?v=0.8.25-staged-rigging-migration';

const ids = Object.keys(SHIP_DESIGNS).sort();

test('the editor uses 16 self-contained ForTests vessel modules', () => {
  assert.equal(SHIP_DESIGN_MODULE_VERSION, '0.8.9');
  assert.equal(SHIP_STRUCTURE_MODULE_VERSION, '0.8.9');
  assert.equal(SHIP_MODEL_MODULE_VERSION, '0.8.25');
  assert.equal(ids.length, 16);
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


const modularIds = new Set(["barque","brig","brigantine","caravel","carrack","sloop","schooner","snow","cutter","frigate","galleon","fluyt","xebec","junk","first-rate","pinnace"]);

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
  assert.equal(new Set(hullAlgorithms).size, 16, 'All 16 ships must have different hull breadth algorithms');
  assert.equal(new Set(sailAlgorithms).size, 16, 'All 16 ships must have their own sail surface profiles');

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

test('all 16 independent ForTests generators build separate editable models', () => {
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
      if (id !== 'pinnace' && id !== 'sloop') {
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
      }
      const sample=sails[0],sampleControl=sample.userData.sailControl;
      const sampleDeployment=sample.getObjectByName(sampleControl.deploymentPart);
      const sampleCloth=ship.userData.getPart(sampleControl.clothPart);
      let sampleCanvas=null;sampleCloth.traverse(object=>{if(object.isMesh&&object.name==='sail-shaped-cloth')sampleCanvas=object;});
      const canvasBefore=new Float32Array(sampleCanvas.geometry.attributes.position.array);
      assert.equal(ship.userData.setSailDeployment(sampleControl.mastId,'furled',0),true);
      assert.ok(Math.abs(sampleDeployment.scale.y-.001)<1e-8,id+' sail furl command');
      assert.equal(ship.userData.setSailDeployment(sampleControl.mastId,'full',0),true);
      ship.userData.animateShip(.05,{enabled:true,directionDeg:210,speedKnots:24});
      assert.ok(sampleCanvas.geometry.attributes.position.array.some((value,index)=>Math.abs(value-canvasBefore[index])>1e-6),id+' sail cloth responds to wind');
      if (getShipDesign(id).headsails > 0) {
        assert.ok(ship.userData.partNames.some((name) => name.startsWith('head-stays-')), id + ' should generate correctly anchored headsails');
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
      disposeShipModel(ship);
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
      assert.ok(Math.abs(rudder.userData.steeringControl.pivotGroup.rotation.y-angle)<1e-6,id+' rudder rotation');
      assert.ok(Math.abs(wheel.userData.steeringControl.pivotGroup.rotation.z-angle*(wheel.userData.steeringControl.ratio??4.5))<1e-6,id+' wheel follows rudder ratio');
      assert.deepEqual(ship.userData.getPartTransform('rudder'),rudderPose,id+' steering stays outside saved editor transforms');
    }finally{disposeShipModel(ship);}
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
      disposeShipModel(ship);
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
      disposeShipModel(ship);
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
      disposeShipModel(restored);
    }
  } finally {
    disposeShipModel(ship);
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
    disposeShipModel(ship);
  }
});
