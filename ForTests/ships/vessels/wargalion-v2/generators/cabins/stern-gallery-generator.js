import { V } from '../../architecture/hull-surface.js';
import { aftercastleHalfWidth, aftercastleWallY, aftercastleWallZ } from './aftercastle-geometry.js';

export function buildSternGallery(d, ctx, parent, tier) {
  const { THREE, mesh, tube, beam, materials } = ctx;
  const acrossSteps = 40, depthSteps = 12;
  const positions = [], indices = [], rail = [];
  const half = aftercastleHalfWidth(d, tier.t1, tier, 1);
  const wallZ = aftercastleWallZ(d, tier.t1, tier, 1) + 0.09;
  const wallY = aftercastleWallY(d, tier.t1, tier, 1);

  for (let row = 0; row <= acrossSteps; row++) {
    const u = -1 + 2 * row / acrossSteps;
    const lift = tier.roofStyle === 'cap'
      ? tier.roofRise * (1 - Math.abs(u))
      : tier.roofRise * (1 - u * u);
    const deckY = wallY + lift + 0.025;
    for (let col = 0; col <= depthSteps; col++) {
      const q = col / depthSteps;
      const x = u * half * (1 + 0.10 * q);
      const z = wallZ + tier.galleryDepth * q * (1 - u * u);
      positions.push(x, deckY + 0.025 * q, z);
    }
    rail.push(V(u * half * 1.10, deckY + 0.48,
      wallZ + tier.galleryDepth * (1 - u * u)));
  }

  const stride = depthSteps + 1;
  for (let r = 0; r < acrossSteps; r++) for (let c = 0; c < depthSteps; c++) {
    const a = r * stride + c, b = a + stride, x = a + 1, y = b + 1;
    indices.push(a, x, b, x, y, b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  mesh(parent, geometry, materials.deck, 'stern-gallery-tier-' + tier.id + '-walkway');
  tube(parent, rail, 0.045, materials.trim,
    'stern-gallery-tier-' + tier.id + '-outer-rail', 12);

  for (let i = 0; i <= 10; i++) {
    const u = -1 + 2 * i / 10;
    const lift = tier.roofStyle === 'cap'
      ? tier.roofRise * (1 - Math.abs(u))
      : tier.roofRise * (1 - u * u);
    const y = wallY + lift + 0.05;
    const x = u * half;
    const z0 = wallZ + 0.03;
    const z1 = wallZ + tier.galleryDepth * (1 - u * u);
    beam(parent, V(x, y, z0), V(x * 1.1, y + 0.02, z1),
      0.045, materials.trim, 'stern-gallery-tier-' + tier.id + '-bracket');
    beam(parent, V(x * 1.1, y + 0.04, z1), V(x * 1.1, y + 0.50, z1),
      0.035, materials.trim, 'stern-gallery-tier-' + tier.id + '-baluster');
  }

  parent.userData.tier = tier.id;
  parent.userData.form = 'projecting aft gallery shaped to the tapered upper transom';
}
