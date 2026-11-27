import { deckLevelY, V } from '../../architecture/hull-surface.js';
import { aftercastleHalfWidth, aftercastleWallZ } from './aftercastle-geometry.js';

export function buildQuarterGallery(d, ctx, parent, side, tier) {
  const { THREE, mesh, beam, tube, materials } = ctx;
  const along = 36, positions = [], indices = [], outerRail = [];
  for (let i = 0; i <= along; i++) {
    const t = 0.805 + 0.165 * i / along;
    const half = aftercastleHalfWidth(d, t, tier, 0);
    const z = aftercastleWallZ(d, t, tier, 0);
    const y = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset + 0.10;
    positions.push(side * half, y, z, side * (half + 0.34), y, z);
    outerRail.push(V(side * (half + 0.34), y + 0.42, z));
    if (i % 4 === 0) {
      beam(parent, V(side * (half + 0.035), y - 0.28, z),
        V(side * (half + 0.34), y, z), 0.045, materials.trim, 'quarter-gallery-bracket');
    }
  }
  for (let i = 0; i < along; i++) {
    const a = i * 2;
    if (side > 0) indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    else indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  mesh(parent, geometry, materials.deck, 'quarter-gallery-walkway-' + side);
  tube(parent, outerRail, 0.035, materials.trim, 'quarter-gallery-handrail-' + side, 48);
  parent.userData.form = 'narrowing side gallery following the stepped aft works';
}
