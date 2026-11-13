import { deckY, V } from '../../architecture/hull-geometry.js';

/**
 * Adds local roof framing to the first aftercastle tier. The shell itself is
 * generated in this vessel's stern module; this file owns the separate
 * moulded roof ribs and transverse framing around that shell.
 */
export function ensureSternTierComponents(d, ctx) {
  const tier = ctx.registry.get('stern-tier-1');
  if (!tier) throw new Error('Wargalion aft-cabin detailing requires stern-tier-1.');
  const spec = d.sternTiers[0];
  const width = d.beamUnits * spec.w;
  const depth = d.hullLengthUnits * spec.d;
  const height = spec.h * (4 / 3);
  const baseY = deckY(d, 0.94);
  const aftZ = d.hullLengthUnits * 0.455;
  const z0 = aftZ - depth * 0.5;
  const { beam, materials } = ctx;

  for (let i = 0; i < 5; i++) {
    const f = 0.12 + i * 0.18;
    const z = z0 + depth * f;
    const roofY = baseY + height * (0.99 - f * 0.28);
    const sideHalf = width * (0.49 - f * 0.015);
    for (const side of [-1, 1]) {
      beam(tier,
        V(side * sideHalf, roofY, z),
        V(side * (sideHalf - width * 0.08), roofY - height * 0.13, z + depth * 0.035),
        0.027, materials.trim, 'folded-cabin-side-rib');
    }
    beam(tier,
      V(-sideHalf, roofY, z),
      V(sideHalf, roofY, z),
      0.022, materials.trim, 'folded-cabin-cross-rib');
  }
}
