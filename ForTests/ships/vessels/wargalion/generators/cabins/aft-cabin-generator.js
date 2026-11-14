import { V } from '../../architecture/hull-geometry.js';

export function ensureSternTierComponents(d, ctx) {
  const { beam, materials, registry, tube } = ctx;
  const component = registry.get('stern-tier-1');
  if (!component) throw new Error('Wargalion requires its lower sterncastle side-wall section.');
  if (component.userData.roofRibsAdded) return;

  const metadata = component.userData.sternTier;
  const frames = metadata?.roofFrames;
  if (!Array.isArray(frames) || frames.length < 5) {
    throw new Error('Wargalion stern section is missing its roof-frame stations.');
  }

  component.userData.roofRibsAdded = true;
  for (const frame of frames) {
    const roofY = frame.baseY + frame.wallHeight + 0.03;
    const half = frame.halfWidth;
    beam(component, V(-half * 0.975, roofY - 0.16, frame.z),
      V(-half, roofY, frame.z), 0.021, materials.trim, 'folded-cabin-side-rib');
    beam(component, V(half, roofY, frame.z),
      V(half * 0.975, roofY - 0.16, frame.z),
      0.021, materials.trim, 'folded-cabin-side-rib');
    beam(component, V(-half, roofY, frame.z), V(half, roofY, frame.z),
      0.018, materials.trim, 'folded-cabin-cross-rib');
  }

  const crown = frames.map(frame =>
    V(0, frame.baseY + frame.wallHeight + 0.045, frame.z)
  );
  tube(component, crown, 0.021, materials.trim, 'stern-tier-roof-crown', 32);
}
