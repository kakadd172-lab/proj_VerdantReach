import { hullPoint, deckLevelY } from '../../architecture/hull-surface.js';

export function buildQuarterGallery(d, ctx, parent, side, tier) {
  const { THREE, mesh, beam, tube, materials, V } = ctx;
  const along = 36, positions = [], indices = [], outerRail = [];
  for (let i = 0; i <= along; i++) {
    const t = 0.805 + 0.165 * i / along;
    const half = Math.abs(hullPoint(d, t, 1, side).x) * tier.widthScale;
    const z = hullPoint(d, t, 1, side).z;
    const y = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset + 0.08;
    positions.push(side * half, y, z, side * (half + 0.38), y, z);
    outerRail.push(V(side * (half + 0.38), y + 0.39, z));
    if (i % 4 === 0) {
      beam(parent, V(side * (half + 0.04), y - 0.28, z),
        V(side * (half + 0.38), y, z), 0.045, materials.trim, 'quarter-gallery-bracket');
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
}
