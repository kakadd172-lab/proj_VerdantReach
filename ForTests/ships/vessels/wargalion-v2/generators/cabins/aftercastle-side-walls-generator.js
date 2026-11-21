import { hullPoint, V } from '../../architecture/hull-surface.js';
import {
  aftercastleHalfWidth, aftercastleWallY, aftercastleWallZ
} from './aftercastle-geometry.js';

function makeSideWall(ctx, parent, positions, indices, side, tier) {
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(parent, geometry, ctx.materials.plank,
    'aftercastle-tier-' + tier.id + '-side-planking-' + side);
}

export function buildAftercastleSideWall(d, ctx, parent, side, tier) {
  const along = 64, vertical = 16, positions = [], indices = [];
  const baseRail = [], topRail = [];

  for (let row = 0; row <= along; row++) {
    const u = row / along;
    const t = tier.t0 + (tier.t1 - tier.t0) * u;
    const hull = hullPoint(d, t, 1, side);
    const baseHalf = aftercastleHalfWidth(d, t, tier, 0);
    const topHalf = aftercastleHalfWidth(d, t, tier, 1);
    const baseY = aftercastleWallY(d, t, tier, 0);
    const topY = aftercastleWallY(d, t, tier, 1);
    const baseZ = aftercastleWallZ(d, t, tier, 0);
    const topZ = aftercastleWallZ(d, t, tier, 1);

    for (let col = 0; col <= vertical; col++) {
      const v = col / vertical;
      const half = baseHalf + (topHalf - baseHalf) * v;
      const y = baseY + (topY - baseY) * v;
      const z = baseZ + (topZ - baseZ) * v;
      positions.push(side * half, y, z);
    }
    baseRail.push(V(side * baseHalf, baseY + 0.025, baseZ));
    topRail.push(V(side * topHalf, topY, topZ));
    if (!Number.isFinite(hull.x)) throw new Error('Invalid aftercastle hull station ' + t);
  }

  const stride = vertical + 1;
  for (let r = 0; r < along; r++) for (let c = 0; c < vertical; c++) {
    const a = r * stride + c, b = a + stride, x = a + 1, y = b + 1;
    if (side > 0) indices.push(a, x, b, x, y, b);
    else indices.push(a, b, x, b, y, x);
  }

  makeSideWall(ctx, parent, positions, indices, side, tier);
  ctx.tube(parent, baseRail, 0.055, ctx.materials.trim,
    'aftercastle-tier-' + tier.id + '-lower-string-course-' + side, 10);
  ctx.tube(parent, topRail, 0.045, ctx.materials.trim,
    'aftercastle-tier-' + tier.id + '-upper-string-course-' + side, 10);

  for (let i = 0; i <= 8; i++) {
    const t = tier.t0 + (tier.t1 - tier.t0) * i / 8;
    const baseHalf = aftercastleHalfWidth(d, t, tier, 0);
    const topHalf = aftercastleHalfWidth(d, t, tier, 1);
    const baseY = aftercastleWallY(d, t, tier, 0);
    const topY = aftercastleWallY(d, t, tier, 1);
    const baseZ = aftercastleWallZ(d, t, tier, 0);
    const topZ = aftercastleWallZ(d, t, tier, 1);
    ctx.beam(parent, V(side * baseHalf, baseY + 0.05, baseZ),
      V(side * topHalf, topY, topZ), 0.045, ctx.materials.trim,
      'aftercastle-tier-' + tier.id + '-timber-frame-' + side + '-' + i);
  }

  parent.userData.upperEdgeHalfWidths = Object.freeze(topRail.map(point => Math.abs(point.x)));
}
