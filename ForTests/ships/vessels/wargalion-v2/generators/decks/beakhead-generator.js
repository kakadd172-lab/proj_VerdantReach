import { deckPoint, hullLongitudinalZ, V } from '../../architecture/hull-surface.js';

/**
 * Small open beakhead platform at the bow. This is a deck structure only:
 * no bowsprit, mast, sail or rigging is generated in the current stage.
 */
export function buildBeakhead(d, ctx) {
  const root = ctx.part('beakhead');
  const platform = ctx.part('beakhead-platform', root);
  const along = 28, across = 20;
  const positions = [], indices = [];
  const attachT = 0.045;
  const deckCentre = deckPoint(d, attachT, 0, 'forecastle');
  const deckPort = deckPoint(d, attachT, -1, 'forecastle');
  const deckStarboard = deckPoint(d, attachT, 1, 'forecastle');
  const baseHalf = Math.min(Math.abs(deckPort.x), Math.abs(deckStarboard.x)) * 0.66;
  const extension = d.hullLengthUnits * 0.038;
  const tipZ = hullLongitudinalZ(d, attachT, 1) - extension;

  for (let row = 0; row <= along; row++) {
    const u = row / along;
    const half = baseHalf * (1 - u) + 0.035;
    const z = deckCentre.z - extension * u;
    const y = deckCentre.y - 0.28 * u;
    for (let col = 0; col <= across; col++) {
      const a = -1 + 2 * col / across;
      const camber = 0.035 * (1 - a * a);
      positions.push(a * half, y + camber, z);
    }
  }
  const stride = across + 1;
  for (let row = 0; row < along; row++) for (let col = 0; col < across; col++) {
    const a = row * stride + col, b = a + stride, x = a + 1, y = b + 1;
    indices.push(a, b, x, b, y, x);
  }
  const geometry = new ctx.THREE.BufferGeometry();
  geometry.setAttribute('position', new ctx.THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  ctx.mesh(platform, geometry, ctx.materials.deck, 'wargalion-v2-beakhead-platform');

  for (const side of [-1, 1]) {
    const start = V(side * baseHalf * 0.82, deckCentre.y - 0.08, deckCentre.z);
    const end = V(side * 0.035, deckCentre.y - 0.30, tipZ);
    ctx.beam(root, start, end, 0.075, ctx.materials.trim,
      'wargalion-v2-beakhead-cheek-' + side);
  }
  root.userData.form = 'slender open beakhead platform projecting ahead of the stem';
  root.userData.riggingStage = 'deferred';
}
