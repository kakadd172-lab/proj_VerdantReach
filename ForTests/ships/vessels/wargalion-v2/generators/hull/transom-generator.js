import { hullPointAcross } from '../../architecture/hull-surface.js';

export function buildTransom(d, ctx) {
  const transom = ctx.part('stern-transom');
  const acrossSteps = 48, verticalSteps = 40;
  const positions = [], indices = [];

  for (let row = 0; row <= verticalSteps; row++) {
    const v = row / verticalSteps;
    for (let col = 0; col <= acrossSteps; col++) {
      const across = -1 + 2 * col / acrossSteps;
      const point = hullPointAcross(d, 1, v, across);
      positions.push(point.x, point.y, point.z);
    }
  }
  const stride = acrossSteps + 1;
  for (let row = 0; row < verticalSteps; row++) {
    for (let col = 0; col < acrossSteps; col++) {
      const a = row * stride + col, b = a + stride, c = a + 1, e = b + 1;
      // The transom faces aft (+Z).
      indices.push(a, c, b, c, e, b);
    }
  }
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(transom, geometry, ctx.materials.hull, 'wargalion-v2-transom-skin');
  transom.userData.surfaceAuthority = 'architecture/hull-surface.js';
}
