import { V } from '../../architecture/hull-geometry.js';

export function ensureSternTierComponents(d, ctx) {
  const { beam, materials, registry } = ctx;
  const component = registry.get('stern-tier-1');
  if (!component) throw new Error('Wargalion requires its lower sterncastle side-wall section.');
  if (component.userData.roofRibsAdded) return;

  const metadata = component.userData.sternTier;
  const frames = metadata?.roofFrames;
  if (!Array.isArray(frames) || frames.length < 5) {
    throw new Error('Wargalion stern section is missing its fair roof-frame stations.');
  }

  component.userData.roofRibsAdded = true;
  for (const frame of frames) {
    const roofY = frame.baseY + frame.wallHeight + 0.04;
    const half = frame.halfWidth;

    // Each transverse frame follows the same loft station as the continuous
    // outer shell, preserving the side curvature and the taper at the stern.
    beam(component,
      V(-half * 0.965, roofY - 0.20, frame.z),
      V(-half, roofY, frame.z),
      0.026, materials.trim, 'folded-cabin-side-rib');
    beam(component,
      V(half, roofY, frame.z),
      V(half * 0.965, roofY - 0.20, frame.z),
      0.026, materials.trim, 'folded-cabin-side-rib');
    beam(component,
      V(-half, roofY, frame.z),
      V(half, roofY, frame.z),
      0.023, materials.trim, 'folded-cabin-cross-rib');
  }
}
