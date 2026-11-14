import { deckSurfaceY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

export function buildHelm(d, ctx) {
  const { part, beam, materials, THREE, mesh } = ctx;
  const group = part('helm');
  const station = 0.83;
  const z = hullLongitudinalZ(d, station, 1);
  const deck = deckSurfaceY(d, station);
  const y = deck + 0.56;
  const wheel = part('helm-wheel', group);
  const radius = d.beamUnits * 0.034;

  // Timber pedestal keeps the wheel visibly attached to the quarterdeck.
  beam(group, V(0, deck + 0.06, z), V(0, y - radius * 0.34, z),
    0.075, materials.trim, 'helm-pedestal');
  beam(group, V(-0.30, deck + 0.12, z), V(0.30, deck + 0.12, z),
    0.055, materials.lower, 'helm-foot');

  const ring = mesh(wheel, new THREE.TorusGeometry(radius, 0.026, 8, 32),
    materials.trim, 'helm-wheel-ring');
  ring.position.set(0, y, z);
  const hub = mesh(wheel, new THREE.SphereGeometry(0.075, 12, 8),
    materials.brass, 'helm-wheel-hub');
  hub.position.set(0, y, z);
  beam(wheel, V(-radius * 1.12, y, z), V(radius * 1.12, y, z),
    0.030, materials.trim, 'helm-axle');
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    beam(wheel, V(0, y, z), V(Math.cos(angle) * radius, y + Math.sin(angle) * radius, z),
      0.014, materials.trim, 'helm-spoke');
  }
}
