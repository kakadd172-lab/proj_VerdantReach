import { deckSurfaceY, keelY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

function createRudderBlade(d, ctx, parent, topY, bottomY, chord, thickness) {
  const { THREE, mesh, materials } = ctx;
  const profile = [
    [0, topY],
    [chord * 0.62, topY - 0.10],
    [chord, bottomY + 0.36],
    [chord * 0.42, bottomY]
  ];
  const half = thickness * 0.5;
  const positions = [];
  for (const x of [ -half, half ]) {
    for (const [z, y] of profile) positions.push(x, y, z);
  }
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return mesh(parent, geometry, materials.lower, 'broad-rudder-blade');
}

export function buildRudder(d, ctx) {
  const { part, beam, materials } = ctx;
  const rudder = part('rudder');
  const station = 0.995;
  const baseZ = hullLongitudinalZ(d, station, 0.55) + 0.16;
  rudder.position.set(0, 0, baseZ);

  const topY = deckSurfaceY(d, 0.975) * 0.46;
  const bottomY = keelY(d, 0.995) + 0.34;
  const chord = d.beamUnits * 0.095;
  const thickness = Math.max(0.10, d.beamUnits * 0.009);
  createRudderBlade(d, ctx, rudder, topY, bottomY, chord, thickness);

  // A slender stock and a few narrow pintle straps visually connect the leaf
  // to the sternpost without turning the aft assembly into a large black block.
  beam(rudder, V(0, bottomY - 0.12, 0.02), V(0, topY + 0.12, 0.02),
    Math.max(0.055, d.beamUnits * 0.0065), materials.trim, 'rudder-stock');

  for (const y of [bottomY + 0.72, bottomY + 2.05, bottomY + 3.35]) {
    beam(rudder, V(-thickness * 0.70, y, chord * 0.48),
      V(thickness * 0.70, y, chord * 0.48),
      0.022, materials.iron, 'rudder-pintle-strap');
  }

  // The tiller is a compact head fitting on the stock, not a full-width beam.
  beam(rudder, V(0, topY + 0.10, 0.04),
    V(0, topY + 0.24, -d.beamUnits * 0.11),
    Math.max(0.035, d.beamUnits * 0.0038), materials.trim, 'rudder-tiller');
}
