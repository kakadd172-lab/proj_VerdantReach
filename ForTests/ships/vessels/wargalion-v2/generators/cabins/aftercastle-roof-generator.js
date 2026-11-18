import { hullPoint, deckLevelY } from '../../architecture/hull-surface.js';

export function buildAftercastleRoof(d, ctx, parent, tier) {
  const { THREE, mesh, materials, tube, V } = ctx;
  const along = 48, across = 16;
  const ridge = [];

  for (const side of [-1, 1]) {
    const positions = [], indices = [];
    for (let row = 0; row <= along; row++) {
      const t = tier.t0 + (tier.t1 - tier.t0) * row / along;
      const half = Math.abs(hullPoint(d, t, 1, side).x) * tier.widthScale;
      const z = hullPoint(d, t, 1, side).z;
      const baseY = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset + tier.wallHeight;
      for (let col = 0; col <= across; col++) {
        const u = col / across;
        positions.push(side * half * (1 - u), baseY + tier.roofRise * u, z);
      }
      if (side > 0) ridge.push(V(0, baseY + tier.roofRise, z));
    }
    const stride = across + 1;
    for (let row = 0; row < along; row++) {
      for (let col = 0; col < across; col++) {
        const a = row * stride + col, b = a + stride, c = a + 1, e = b + 1;
        if (side > 0) indices.push(a, c, b, c, e, b);
        else indices.push(a, b, c, b, e, c);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    mesh(parent, geometry, materials.deck, 'aftercastle-tier-' + tier.id + '-roof-surface-' + side);
  }
  tube(parent, ridge, 0.045, materials.trim, 'aftercastle-tier-' + tier.id + '-roof-ridge', 64);
}
