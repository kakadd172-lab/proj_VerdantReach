import { hullPoint, deckLevelY } from '../../architecture/hull-surface.js';

export function buildAftercastleEndWall(d, ctx, parent, tier, t, direction) {
  const across = 28, vertical = 12;
  const positions = [], indices = [];
  const baseY = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset;
  const half = Math.abs(hullPoint(d, t, 1, 1).x) * tier.widthScale;
  const z = hullPoint(d, t, 1, 1).z + direction * 0.025;

  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    for (let col = 0; col <= across; col++) {
      const u = -1 + 2 * col / across;
      const taper = 1 - 0.035 * v;
      const gable = tier.roofRise * 0.55 * (1 - Math.abs(u));
      const crown = 0.075 * (1 - u * u);
      positions.push(u * half * taper, baseY + tier.wallHeight * v + (gable + crown) * v, z);
    }
  }
  const stride = across + 1;
  for (let row = 0; row < vertical; row++) {
    for (let col = 0; col < across; col++) {
      const a = row * stride + col, b = a + stride, c = a + 1, e = b + 1;
      if (direction > 0) indices.push(a, c, b, c, e, b);
      else indices.push(a, b, c, c, b, e);
    }
  }
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(parent, geometry, ctx.materials.hull,
    'aftercastle-tier-' + tier.id + (direction > 0 ? '-aft-wall' : '-forward-wall'));
}
