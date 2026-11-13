import { deckSurfaceY, V } from '../../architecture/hull-geometry.js';

export function buildAnchors(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const group = part('anchors');
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'port' : 'starboard';
    const anchor = part('anchor-' + suffix, group);
    const x = side * d.beamUnits * 0.43;
    const y = deckSurfaceY(d, 0.14) + 0.48;
    const z = -d.hullLengthUnits * 0.36;

    beam(anchor, V(x, y + 0.65, z), V(x, y - 0.28, z),
      0.045, materials.iron, 'anchor-shank');
    beam(anchor, V(x - side * 0.34, y - 0.22, z), V(x + side * 0.34, y - 0.22, z),
      0.05, materials.iron, 'anchor-stock');
    beam(anchor, V(x - side * 0.34, y - 0.22, z), V(x - side * 0.47, y - 0.55, z),
      0.06, materials.iron, 'anchor-fluke');
    beam(anchor, V(x + side * 0.34, y - 0.22, z), V(x + side * 0.47, y - 0.55, z),
      0.06, materials.iron, 'anchor-fluke');

    // Chains remain separately selectable and editable, matching the shared
    // vessel component contract used by the other full-sized ship generators.
    const chain = part('anchor-chain-' + suffix, group);
    tube(chain, [
      V(x, y, z),
      V(x, y - 0.28, z - 0.24),
      V(x * 0.92, y - 0.52, z - 0.44)
    ], 0.022, materials.iron, 'anchor-rode', 18);
  }
}
