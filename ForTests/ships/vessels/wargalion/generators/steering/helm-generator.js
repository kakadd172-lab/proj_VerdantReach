import { deckY, V } from '../../architecture/hull-geometry.js';

export function buildHelm(d, ctx) {
  const { part, beam, materials, THREE, mesh } = ctx;
  const group = part('helm');
  const z = d.hullLengthUnits * 0.29;
  const y = deckY(d, 0.83) + 0.62;
  const wheel = part('helm-wheel', group);
  const radius = d.beamUnits * 0.042;
  const ring = mesh(wheel, new THREE.TorusGeometry(radius, 0.035, 8, 28), materials.trim, 'helm-wheel-ring');
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, y, z);
  const hub = mesh(wheel, new THREE.SphereGeometry(0.09, 12, 8), materials.brass, 'helm-wheel-hub');
  hub.position.set(0, y, z);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    beam(wheel, V(0, y, z), V(Math.cos(angle) * radius, y, z + Math.sin(angle) * radius),
      0.018, materials.trim, 'helm-spoke');
  }
}
