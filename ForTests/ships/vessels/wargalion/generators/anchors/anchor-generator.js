import { V } from '../../architecture/hull-geometry.js';

export function buildAnchors(d, ctx) {
  const { part, beam, materials } = ctx;
  const group = part('anchors');
  for (const side of [-1, 1]) {
    const anchor = part(side < 0 ? 'anchor-port' : 'anchor-starboard', group);
    const x = side * d.beamUnits * 0.43, y = d.deckHeightUnits * 0.78;
    const z = -d.hullLengthUnits * 0.36;
    beam(anchor, V(x, y + 0.65, z), V(x, y - 0.28, z), 0.045, materials.iron, 'anchor-shank');
    beam(anchor, V(x - side * 0.34, y - 0.22, z), V(x + side * 0.34, y - 0.22, z),
      0.05, materials.iron, 'anchor-stock');
    beam(anchor, V(x - side * 0.34, y - 0.22, z), V(x - side * 0.47, y - 0.55, z),
      0.06, materials.iron, 'anchor-fluke');
    beam(anchor, V(x + side * 0.34, y - 0.22, z), V(x + side * 0.47, y - 0.55, z),
      0.06, materials.iron, 'anchor-fluke');
  }
}
