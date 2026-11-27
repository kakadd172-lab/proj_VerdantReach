import { deckSurfaceY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

export function buildHelm(d, ctx) {
  const { part, beam, materials, THREE, mesh } = ctx;
  const helm = part('helm');
  const wheel = part('helm-wheel', helm);
  const station = 0.83;
  const z = hullLongitudinalZ(d, station, 1);
  const deck = deckSurfaceY(d, station);
  const y = deck + 0.78;
  const radius = d.beamUnits * 0.052;

  // A shaped pedestal, broad foot and axle support make the wheel sit on the
  // afterdeck rather than appearing as a loose ring above the deck surface.
  beam(helm, V(0, deck + 0.06, z), V(0, y - radius * 0.32, z),
    0.085, materials.trim, 'helm-pedestal');
  beam(helm, V(-0.42, deck + 0.13, z), V(0.42, deck + 0.13, z),
    0.060, materials.lower, 'helm-foot');
  beam(helm, V(-0.30, y - 0.06, z), V(0.30, y - 0.06, z),
    0.050, materials.trim, 'helm-axle-support');

  const ring = mesh(wheel,
    new THREE.TorusGeometry(radius, 0.034, 10, 40),
    materials.trim, 'helm-wheel-ring');
  ring.position.set(0, y, z);

  const hub = mesh(wheel,
    new THREE.SphereGeometry(0.092, 16, 10),
    materials.brass, 'helm-wheel-hub');
  hub.position.set(0, y, z);

  beam(wheel, V(-radius * 1.08, y, z), V(radius * 1.08, y, z),
    0.035, materials.trim, 'helm-axle');

  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI * 2 / 10;
    const x = Math.cos(angle) * radius * 0.94;
    const vertical = Math.sin(angle) * radius * 0.94;
    beam(wheel, V(0, y, z), V(x, y + vertical, z),
      0.018, materials.trim, 'helm-spoke');
    const grip = mesh(wheel,
      new THREE.SphereGeometry(0.042, 10, 8),
      materials.lower, 'helm-spoke-grip');
    grip.position.set(x, y + vertical, z);
  }

  const handrail = [];
  for (let i = 0; i <= 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    handrail.push(V(
      Math.cos(angle) * radius * 0.98,
      y + Math.sin(angle) * radius * 0.98,
      z
    ));
  }
  ctx.tube(wheel, handrail, 0.015, materials.plank, 'helm-wheel-grip-rail', 48);
}
