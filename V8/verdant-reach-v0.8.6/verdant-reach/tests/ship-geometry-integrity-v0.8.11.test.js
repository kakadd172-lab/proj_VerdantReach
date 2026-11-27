import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { VESSEL_IDS, createShip, disposeShipModel, getShipDesign } from '../src/world/ships/index.js?v=0.8.10';

const finiteVector = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

function inspectMesh(mesh, vesselId) {
  const geometry = mesh.geometry;
  assert.ok(geometry?.isBufferGeometry, vesselId + ': mesh must use BufferGeometry');
  const position = geometry.getAttribute('position');
  assert.ok(position && position.itemSize >= 3 && position.count >= 3,
    vesselId + '/' + mesh.name + ': valid XYZ positions are required');
  for (let i = 0; i < position.count; i += 1) {
    assert.ok(Number.isFinite(position.getX(i)) && Number.isFinite(position.getY(i)) && Number.isFinite(position.getZ(i)),
      vesselId + '/' + mesh.name + ': non-finite vertex ' + i);
  }
  const elementCount = geometry.index ? geometry.index.count : position.count;
  assert.equal(elementCount % 3, 0, vesselId + '/' + mesh.name + ': triangle count must be divisible by three');
  if (geometry.index) {
    for (let i = 0; i < geometry.index.count; i += 1) {
      const index = geometry.index.getX(i);
      assert.ok(Number.isInteger(index) && index >= 0 && index < position.count,
        vesselId + '/' + mesh.name + ': invalid index ' + index);
    }
  }
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  assert.ok(bounds && finiteVector(bounds.min) && finiteVector(bounds.max),
    vesselId + '/' + mesh.name + ': finite bounds are required');
  const size = bounds.getSize(new Vector3());
  assert.ok(size.x + size.y + size.z > 1e-8, vesselId + '/' + mesh.name + ': geometry bounds are empty');
}

test('all 16 runtime ships generate finite geometry and real registered stern components', () => {
  assert.equal(VESSEL_IDS.length, 16);
  for (const vesselId of VESSEL_IDS) {
    const ship = createShip(vesselId);
    try {
      assert.equal(ship.userData.shipType, vesselId);
      const names = ship.userData.partNames;
      assert.ok(names.includes('deck-fittings'), vesselId + ': deck fittings remain available');
      assert.ok(!names.some(name => /cannon|deck-gun|gun-carriage/i.test(name)),
        vesselId + ': vessel generator must not register embedded cannon components');
      const embeddedCannons = [];
      ship.traverse((object) => {
        if (/cannon|deck-gun|gun-carriage-wheel/i.test(object.name)) embeddedCannons.push(object.name);
      });
      assert.deepEqual(embeddedCannons, [], vesselId + ': no embedded cannon geometry is allowed');
      assert.ok(Array.isArray(names) && names.length > 10);
      assert.equal(new Set(names).size, names.length, vesselId + ': component names must be unique');

      let meshCount = 0;
      ship.traverse((object) => {
        if (!object.isMesh) return;
        meshCount += 1;
        inspectMesh(object, vesselId);
      });
      assert.ok(meshCount > 0, vesselId + ': ship must contain generated meshes');

      ship.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(ship);
      assert.ok(finiteVector(bounds.min) && finiteVector(bounds.max), vesselId + ': assembled bounds must be finite');
      const dimensions = bounds.getSize(new Vector3());
      assert.ok(dimensions.x > 1e-6 && dimensions.y > 1e-6 && dimensions.z > 1e-6,
        vesselId + ': assembled ship must have non-zero length, breadth and height');

      const stern = ship.userData.getPart('sternworks');
      assert.ok(stern, vesselId + ': sternworks component must be registered');
      let sternMeshes = 0;
      stern.traverse((object) => {
        if (object.isMesh) {
          inspectMesh(object, vesselId + '/sternworks');
          sternMeshes += 1;
        }
      });
      assert.ok(sternMeshes > 0, vesselId + ': sternworks must contain actual geometry');

      const design = getShipDesign(vesselId);
      const tierNames = names.filter((name) => /^stern-tier-\d+$/.test(name));
      assert.equal(tierNames.length, design.sternTiers.length,
        vesselId + ': generated tier count must match the vessel definition');
      for (const name of tierNames) {
        const tier = ship.userData.getPart(name);
        assert.ok(tier, vesselId + ': tier component not registered: ' + name);
        let tierMeshes = 0;
        tier.traverse((object) => {
          if (!object.isMesh) return;
          inspectMesh(object, vesselId + '/' + name);
          tierMeshes += 1;
        });
        assert.ok(tierMeshes > 0, vesselId + '/' + name + ': tier must contain real mesh geometry');
      }
    } finally {
      disposeShipModel(ship);
    }
  }
});
