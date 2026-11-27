import { hullLongitudinalZ, V } from '../../architecture/hull-surface.js';
import { aftercastleHalfWidth, aftercastleWallY, aftercastleWallZ } from './aftercastle-geometry.js';

/**
 * The roof edges now sit directly on the tapered side-wall top rails.
 * Only a small physical eave is added; it no longer overhangs the cabin like
 * a large rectangular lid. Longitudinal raking follows the wall surfaces.
 */
export function buildAftercastleRoof(d, ctx, parent, tier) {
  const { THREE, mesh, materials, tube } = ctx;
  const along = 56, across = 32;
  const positions = [], indices = [], portEdge = [], starboardEdge = [], ridge = [];

  for (let row = 0; row <= along; row++) {
    const u = row / along;
    const t = tier.t0 + (tier.t1 - tier.t0) * u;
    const edgeHalf = aftercastleHalfWidth(d, t, tier, 1, 0.055);
    const wallTopY = aftercastleWallY(d, t, tier, 1);
    const wallTopZ = aftercastleWallZ(d, t, tier, 1);
    for (let col = 0; col <= across; col++) {
      const q = col / across;
      const a = -1 + 2 * q;
      const lift = tier.roofStyle === 'cap'
        ? tier.roofRise * (1 - Math.abs(a))
        : tier.roofRise * (1 - a * a);
      const point = V(a * edgeHalf, wallTopY + lift, wallTopZ);
      positions.push(point.x, point.y, point.z);
      if (col === 0) portEdge.push(point);
      if (col === across) starboardEdge.push(point);
      if (col === across / 2) ridge.push(point);
    }
  }

  const stride = across + 1;
  for (let r = 0; r < along; r++) for (let c = 0; c < across; c++) {
    const a = r * stride + c, b = a + stride, x = a + 1, y = b + 1;
    indices.push(a, b, x, b, y, x);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  mesh(parent, geometry, materials.deck,
    'aftercastle-tier-' + tier.id + (tier.roofStyle === 'cap' ? '-upper-roof-cap' : '-raised-deck-level'));
  tube(parent, portEdge, 0.045, materials.trim, 'aftercastle-tier-' + tier.id + '-port-eave', 10);
  tube(parent, starboardEdge, 0.045, materials.trim, 'aftercastle-tier-' + tier.id + '-starboard-eave', 10);
  if (tier.roofStyle === 'cap') {
    tube(parent, ridge, 0.04, materials.trim, 'aftercastle-tier-' + tier.id + '-roof-ridge', 10);
  }
  parent.userData.wallTopAlignment = 'shared aftercastle-geometry.js top-edge evaluator';
}
