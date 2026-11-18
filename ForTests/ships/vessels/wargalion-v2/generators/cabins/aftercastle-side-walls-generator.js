import { hullPoint, deckLevelY } from '../../architecture/hull-surface.js';

function makeSideWall(ctx, parent, name, positions, indices, side) {
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(parent, geometry, ctx.materials.hull, name);
}

export function buildAftercastleSideWall(d, ctx, parent, side, tier) {
  const along = 48, vertical = 10;
  const positions = [], indices = [];
  for (let row = 0; row <= along; row++) {
    const t = tier.t0 + (tier.t1 - tier.t0) * row / along;
    const half = Math.abs(hullPoint(d, t, 1, side).x) * tier.widthScale;
    const z = hullPoint(d, t, 1, side).z;
    const baseY = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset;
    for (let col = 0; col <= vertical; col++) {
      const v = col / vertical;
      positions.push(side * half * (1 - 0.035 * v), baseY + tier.wallHeight * v, z);
    }
  }
  const stride = vertical + 1;
  for (let row = 0; row < along; row++) {
    for (let col = 0; col < vertical; col++) {
      const a = row * stride + col, b = a + stride, c = a + 1, e = b + 1;
      if (side > 0) indices.push(a, c, b, c, e, b);
      else indices.push(a, b, c, b, e, c);
    }
  }
  makeSideWall(ctx, parent, 'aftercastle-tier-' + tier.id + '-side-planking-' + side,
    positions, indices, side);
}
