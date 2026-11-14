import { deckSurfaceY, halfBreadth, hullLongitudinalZ, sectionBreadthRatio, V } from '../../architecture/hull-geometry.js';

export function buildAnchors(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const group = part('anchors');

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'port' : 'starboard';
    const anchor = part('anchor-' + suffix, group);
    const station = 0.14;
    const x = side * halfBreadth(d, station) * sectionBreadthRatio(d, station, 1) * 0.92;
    const y = deckSurfaceY(d, station) + 0.36;
    const z = hullLongitudinalZ(d, station, 1);

    beam(anchor, V(x, y + 0.54, z), V(x, y - 0.24, z),
      0.034, materials.iron, 'anchor-shank');
    beam(anchor, V(x - side * 0.28, y - 0.19, z), V(x + side * 0.28, y - 0.19, z),
      0.038, materials.iron, 'anchor-stock');
    beam(anchor, V(x - side * 0.28, y - 0.19, z), V(x - side * 0.40, y - 0.47, z),
      0.043, materials.iron, 'anchor-fluke');
    beam(anchor, V(x + side * 0.28, y - 0.19, z), V(x + side * 0.40, y - 0.47, z),
      0.043, materials.iron, 'anchor-fluke');

    const chain = part('anchor-chain-' + suffix, group);
    tube(chain, [
      V(x, y, z),
      V(x, y - 0.25, z - 0.20),
      V(x * 0.94, y - 0.48, z - 0.42)
    ], 0.017, materials.iron, 'anchor-rode', 22);
  }
}
