import {
  aftercastleHalfWidth, aftercastleWallY, aftercastleWallZ, aftercastleTransomZ
} from './aftercastle-geometry.js';

export function buildAftercastleEndWall(d, ctx, parent, tier, t, direction) {
  const across = 48, vertical = 20, positions = [], indices = [];
  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    const half = aftercastleHalfWidth(d, t, tier, v);
    const wallY = aftercastleWallY(d, t, tier, v);
    for (let col = 0; col <= across; col++) {
      const u = -1 + 2 * col / across;
      const crown = tier.endCrown * (1 - u * u) * Math.pow(v, 3);
      const wallZ = direction > 0
        ? aftercastleTransomZ(d, tier, u, v)
        : aftercastleWallZ(d, t, tier, v) + direction * 0.018 * v;
      positions.push(u * half, wallY + crown, wallZ);
    }
  }

  const stride = across + 1;
  for (let r = 0; r < vertical; r++) for (let c = 0; c < across; c++) {
    const a = r * stride + c, b = a + stride, x = a + 1, y = b + 1;
    if (direction > 0) indices.push(a, x, b, x, y, b);
    else indices.push(a, b, x, x, b, y);
  }
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(parent, geometry, ctx.materials.plank,
    'aftercastle-tier-' + tier.id + (direction > 0 ? '-aft-wall' : '-forward-wall'));
}
