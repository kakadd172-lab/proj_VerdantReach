import { deckPoint } from '../../architecture/hull-surface.js';

function createDeckMesh(d, ctx, parent, name, start, end, level, longitudinalSteps, acrossSteps) {
  const { THREE, mesh, materials } = ctx;
  const positions = [];
  const indices = [];
  for (let row = 0; row <= longitudinalSteps; row++) {
    const t = start + (end - start) * row / longitudinalSteps;
    for (let col = 0; col <= acrossSteps; col++) {
      const across = -1 + 2 * col / acrossSteps;
      const p = deckPoint(d, t, across, level);
      positions.push(p.x, p.y, p.z);
    }
  }
  const stride = acrossSteps + 1;
  for (let row = 0; row < longitudinalSteps; row++) {
    for (let col = 0; col < acrossSteps; col++) {
      const a = row * stride + col;
      const b = a + stride;
      const c = a + 1;
      const e = b + 1;
      indices.push(a, b, c, b, e, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  mesh(parent, geometry, materials.deck, name);
}

export function buildDeck(d, ctx) {
  const deck = ctx.part('deck');
  const main = ctx.part('main-deck', deck);
  const forecastle = ctx.part('forecastle-deck', deck);
  const quarterdeck = ctx.part('quarterdeck', deck);

  createDeckMesh(d, ctx, main, 'wargalion-v2-main-deck-surface', 0.012, 0.995, 'main', 128, 30);
  createDeckMesh(d, ctx, forecastle, 'wargalion-v2-raised-forecastle-platform', 0.035, 0.275, 'forecastle', 40, 22);
  createDeckMesh(d, ctx, quarterdeck, 'wargalion-v2-raised-quarterdeck-platform', 0.675, 0.985, 'quarterdeck', 48, 26);

  main.userData.surfaceAuthority = 'architecture/hull-surface.js';
  forecastle.userData.deckLevel = 'forecastle';
  quarterdeck.userData.deckLevel = 'quarterdeck';
}
