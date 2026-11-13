import { hullPoint } from '../../architecture/hull-geometry.js';

export function buildHull(d, ctx) {
  const { THREE, part, mesh, materials } = ctx;
  const group = part('hull');
  const stations = 128, sections = 38;
  const positions = [], indices = [];
  for (const side of [-1, 1]) {
    const offset = positions.length / 3;
    for (let i = 0; i <= stations; i++) {
      const t = i / stations;
      for (let j = 0; j <= sections; j++) {
        const p = hullPoint(d, t, j / sections, side);
        positions.push(p.x, p.y, p.z);
      }
    }
    const stride = sections + 1;
    for (let i = 0; i < stations; i++) {
      for (let j = 0; j < sections; j++) {
        const a = offset + i * stride + j;
        const b = a + stride;
        if (side > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh(group, geometry, materials.hull, 'wargalion-rounded-double-hull-loft');
}
