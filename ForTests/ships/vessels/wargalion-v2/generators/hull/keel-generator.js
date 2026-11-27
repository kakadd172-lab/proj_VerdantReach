import { halfBreadth, keelY, hullLongitudinalZ } from '../../architecture/hull-surface.js';

export function buildKeel(d, ctx) {
  const { THREE, part, mesh, materials } = ctx;
  const keel = part('keel');
  const segments = 112;
  const corners = 4;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = 0.025 + 0.95 * i / segments;
    const halfWidth = Math.max(0.075, halfBreadth(d, t) * 0.075);
    const halfDepth = 0.16;
    const y = keelY(d, t) - 0.10;
    const z = hullLongitudinalZ(d, t, 0);
    positions.push(
      -halfWidth, y + halfDepth, z,
       halfWidth, y + halfDepth, z,
       halfWidth, y - halfDepth, z,
      -halfWidth, y - halfDepth, z
    );
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < corners; j++) {
      const a = i * corners + j;
      const b = i * corners + (j + 1) % corners;
      const c = (i + 1) * corners + j;
      const e = (i + 1) * corners + (j + 1) % corners;
      indices.push(a, c, b, b, c, e);
    }
  }
  for (let j = 1; j < corners - 1; j++) {
    indices.push(0, j, j + 1);
    const end = segments * corners;
    indices.push(end, end + j + 1, end + j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  mesh(keel, geometry, materials.lower, 'wargalion-v2-shaped-keel');
}
