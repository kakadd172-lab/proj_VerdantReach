import { deckPoint, halfBreadth, deckY, V } from '../../architecture/hull-geometry.js';

function surface(d, ctx, name, t0, t1, lift, tint = 'deck') {
  const { THREE, part, mesh, materials } = ctx;
  const group = part(name), along = 54, across = 24, positions = [], indices = [];
  for (let i = 0; i <= along; i++) {
    const t = t0 + (t1 - t0) * i / along;
    for (let j = 0; j <= across; j++) {
      const u = -0.96 + 1.92 * j / across;
      const p = deckPoint(d, t, u, lift);
      positions.push(p.x, p.y, p.z);
    }
  }
  const stride = across + 1;
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * stride + j;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(group, geometry, materials[tint], name + '-cambered-plank-surface');
  return group;
}

export function buildDeck(d, ctx) {
  const { part, tube, materials } = ctx;
  surface(d, ctx, 'deck', 0.035, 0.985, 0, 'deck');
  surface(d, ctx, 'deck-forecastle', 0.045, 0.225, d.hull.forecastleRise * (4 / 3), 'deck');
  surface(d, ctx, 'deck-quarter', 0.745, 0.965, d.hull.quarterdeckRise * (4 / 3), 'deck');
  const edge = part('deck-edge-trim');
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= 74; i++) {
      const t = 0.045 + 0.93 * i / 74;
      const p = deckPoint(d, t, side * 0.99, 0.025);
      points.push(V(p.x, p.y, p.z));
    }
    tube(edge, points, d.beamUnits * 0.006, materials.trim, 'continuous-sheer-strake', 78);
  }
}
