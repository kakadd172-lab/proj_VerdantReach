import { deckY, keelY, halfBreadth, hullPoint, V } from '../../architecture/hull-geometry.js';

export function buildHull(design, context) {
  const { THREE, part, mesh, materials } = context;
  const hullGroup = part('hull');
  const stations = 112;
  const rings = 40;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= stations; i += 1) {
    const station = i / stations;
    for (let j = 0; j <= rings; j += 1) {
      const point = hullPoint(design, station, (j / rings) * Math.PI * 2);
      positions.push(point.x, point.y, point.z);
    }
  }

  const stride = rings + 1;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < rings; j += 1) {
      const a = i * stride + j;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }

  for (const stationIndex of [0, stations]) {
    const station = stationIndex / stations;
    const center = positions.length / 3;
    positions.push(
      0,
      (deckY(design, station) + keelY(design, station)) * 0.5,
      (station - 0.5) * design.hullLengthUnits
    );
    for (let j = 0; j < rings; j += 1) {
      const a = stationIndex * stride + j;
      indices.push(center, a, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(hullGroup, geometry, materials.hull, 'war-galleon-2-independent-hull-loft');
}
