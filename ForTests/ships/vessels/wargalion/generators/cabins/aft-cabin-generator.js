import { V } from '../../architecture/hull-geometry.js';

export function ensureSternTierComponents(d, ctx) {
  const { beam, materials, registry, tube } = ctx;

  for (const tierId of [1, 2, 3]) {
    const component = registry.get('stern-tier-' + tierId);
    if (!component) {
      throw new Error('Wargalion requires aftercastle section ' + tierId + '.');
    }
    if (component.userData.roofRibsAdded) continue;

    const frames = component.userData.sternTier?.roofFrames;
    if (!Array.isArray(frames) || frames.length < 6) {
      throw new Error('Wargalion stern section ' + tierId + ' is missing its roof-frame stations.');
    }

    component.userData.roofRibsAdded = true;
    for (const frame of frames) {
      const roofY = frame.baseY + (frame.baseOffset ?? 0) + frame.wallHeight + 0.035;
      const half = frame.halfWidth;

      beam(component, V(-half * 0.975, roofY - 0.17, frame.z),
        V(-half, roofY, frame.z),
        0.023, materials.trim, 'folded-cabin-side-rib');
      beam(component, V(half, roofY, frame.z),
        V(half * 0.975, roofY - 0.17, frame.z),
        0.023, materials.trim, 'folded-cabin-side-rib');
      beam(component, V(-half, roofY, frame.z), V(half, roofY, frame.z),
        0.020, materials.trim, 'folded-cabin-cross-rib');
      beam(component, V(0, roofY - 0.13, frame.z),
        V(0, roofY + 0.045, frame.z),
        0.017, materials.trim, 'stern-roof-king-post');
    }

    const crown = frames.map(frame =>
      V(0, frame.baseY + (frame.baseOffset ?? 0) + frame.wallHeight + 0.055, frame.z)
    );
    tube(component, crown, 0.023, materials.trim, 'stern-tier-roof-crown', 40);
  }
}
