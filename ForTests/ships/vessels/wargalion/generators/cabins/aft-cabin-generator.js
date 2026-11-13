import { deckSurfaceY, V } from '../../architecture/hull-geometry.js';

export function ensureSternTierComponents(d, ctx) {
  const tiers = d.sternTiers || [];
  const { part, box, beam, materials, registry } = ctx;
  tiers.forEach((tier, index) => {
    const name = 'stern-tier-' + (index + 1);
    let component = registry.get(name);
    if (!component) {
      component = part(name);
      const width = d.beamUnits * tier.w * 1.04;
      const height = Math.max(0.18, tier.h * 1.15);
      const depth = Math.max(0.16, d.hullLengthUnits * tier.d);
      const shell = box(component, width, height, depth, materials.hull, 'wargalion-stern-tier-shell');
      shell.position.set(0, deckSurfaceY(d, 0.94) + height * (0.44 + index * 0.08),
        d.hullLengthUnits * (0.405 + index * 0.014));
      const cap = box(component, width * 1.04, 0.09, depth * 1.04, materials.trim, 'stern-tier-cap');
      cap.position.set(0, shell.position.y + height * 0.52, shell.position.z);
    }
    if (index !== 0 || component.userData.roofRibsAdded) return;
    component.userData.roofRibsAdded = true;
    const width = d.beamUnits * tier.w;
    const depth = d.hullLengthUnits * tier.d;
    const height = tier.h * (4 / 3);
    const baseY = deckSurfaceY(d, 0.94);
    const aftZ = d.hullLengthUnits * 0.455;
    const z0 = aftZ - depth * 0.5;
    // Separate curved roof framing is kept editable as named structural parts.
    for (let i = 0; i < 5; i++) {
      const f = 0.10 + i * 0.19;
      const z = z0 + depth * f;
      const roofY = baseY + height * (0.97 - f * 0.16);
      const half = width * (0.48 - f * 0.012);
      for (const side of [-1, 1]) {
        beam(component,
          V(side * half, roofY, z),
          V(side * (half - width * 0.07), roofY - height * 0.12, z + depth * 0.025),
          0.027, materials.trim, 'folded-cabin-side-rib');
      }
      beam(component, V(-half, roofY, z), V(half, roofY, z),
        0.022, materials.trim, 'folded-cabin-cross-rib');
    }
    // Aft transom and roof crown receive light mouldings.
    beam(component, V(-width * 0.47, baseY + height * 0.98, aftZ + depth * 0.45),
      V(width * 0.47, baseY + height * 0.98, aftZ + depth * 0.45),
      0.035, materials.trim, 'stern-tier-roof-crown');
  });
}
