import { deckPoint, deckSurfaceY, deckY, V } from '../../architecture/hull-geometry.js';

function buildDeckSurface(d, ctx, name, t0, t1, lift = 0) {
  const { THREE, part, mesh, materials } = ctx;
  const group = part(name);
  const along = 76, across = 32;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = t0 + (t1 - t0) * i / along;
    const localLift = typeof lift === 'function' ? lift(t) : lift;
    for (let j = 0; j <= across; j++) {
      const u = -1 + 2 * j / across;
      const p = deckPoint(d, t, u, localLift);
      positions.push(p.x, p.y, p.z);
    }
  }

  const stride = across + 1;
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * stride + j;
      // z-direction crossed with x-direction gives an upward-facing deck.
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh(group, geometry, materials.deck, name + '-cambered-deck-planking');
  return group;
}

export function buildDeck(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const liftAt = t => deckSurfaceY(d, t) - deckY(d, t);

  buildDeckSurface(d, ctx, 'deck', 0.000, 1.000, liftAt);
  buildDeckSurface(d, ctx, 'deck-forecastle', 0.045, 0.255,
    t => liftAt(t) + 0.018);
  buildDeckSurface(d, ctx, 'deck-quarter', 0.705, 0.955,
    t => liftAt(t) + 0.022);
  buildDeckSurface(d, ctx, 'deck-poop', 0.865, 0.990,
    t => liftAt(t) + 0.028);

  const edgeTrim = part('deck-edge-trim');
  const deckBeams = part('deck-beams');
  for (const side of [-1, 1]) {
    const line = [];
    for (let i = 0; i <= 84; i++) {
      const t = 0.035 + 0.95 * i / 84;
      const p = deckPoint(d, t, side * 0.995, liftAt(t) + 0.035);
      line.push(V(p.x, p.y, p.z));
    }
    tube(edgeTrim, line, Math.max(0.035, d.beamUnits * 0.0055),
      materials.trim, 'continuous-sheer-rail', 90);
  }

  for (let i = 0; i < 22; i++) {
    const t = 0.075 + 0.85 * (i + 0.5) / 22;
    const left = deckPoint(d, t, -0.90, liftAt(t) - 0.055);
    const right = deckPoint(d, t, 0.90, liftAt(t) - 0.055);
    beam(deckBeams, left, right, 0.035, materials.lower, 'transverse-deck-beam');
  }
}
