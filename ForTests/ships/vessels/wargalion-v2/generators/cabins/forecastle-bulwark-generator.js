import { deckPoint, V } from '../../architecture/hull-surface.js';

function sideWall(d, ctx, parent, side) {
  const along = 56, vertical = 10, positions = [], indices = [], rail = [];
  const height = 0.92;
  for (let row = 0; row <= along; row++) {
    const u = row / along;
    const t = 0.035 + 0.245 * u;
    const edge = deckPoint(d, t, side, 'forecastle');
    for (let col = 0; col <= vertical; col++) {
      const v = col / vertical;
      const topInset = 0.055 * v;
      const sheer = 0.045 * Math.sin(Math.PI * u) * v;
      positions.push(edge.x * (1 - topInset), edge.y + 0.045 + height * v + sheer,
        edge.z + 0.06 * v * (0.5 - u));
    }
    rail.push(V(edge.x * 0.945,
      edge.y + 0.045 + height + 0.045 * Math.sin(Math.PI * u),
      edge.z + 0.06 * (0.5 - u)));
  }

  const stride = vertical + 1;
  for (let r = 0; r < along; r++) for (let c = 0; c < vertical; c++) {
    const a = r * stride + c, b = a + stride, x = a + 1, y = b + 1;
    if (side > 0) indices.push(a, x, b, x, y, b);
    else indices.push(a, b, x, b, y, x);
  }
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(parent, geometry, ctx.materials.plank, 'forecastle-bulwark-side-' + side);
  ctx.tube(parent, rail, 0.055, ctx.materials.trim, 'forecastle-bulwark-rail-' + side, 12);

  for (let i = 0; i <= 10; i++) {
    const u = i / 10, t = 0.035 + 0.245 * u;
    const edge = deckPoint(d, t, side, 'forecastle');
    ctx.beam(parent, V(edge.x, edge.y + 0.045, edge.z),
      V(edge.x * 0.945, edge.y + 0.965, edge.z + 0.06 * (0.5 - u)),
      0.04, ctx.materials.trim, 'forecastle-bulwark-stanchion-' + side + '-' + i);
  }
}

export function buildForecastleBulwark(d, ctx) {
  const root = ctx.part('forecastle-bulwark');
  sideWall(d, ctx, ctx.part('forecastle-bulwark-port', root), -1);
  sideWall(d, ctx, ctx.part('forecastle-bulwark-starboard', root), 1);
  root.userData.form = 'raised, inward-tapered foredeck bulwarks following the bow sheer';
}
