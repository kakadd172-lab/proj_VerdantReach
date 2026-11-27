import { deckSurfaceY, keelY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

function createRudderBlade(d, ctx, parent, topY, bottomY, chord, thickness) {
  const { THREE, mesh, materials } = ctx;
  const sections = [
    { y: topY, front: 0.00, chord: chord * 0.34, thickness: 0.78 },
    { y: topY - (topY - bottomY) * 0.24, front: 0.015, chord: chord * 0.78, thickness: 0.94 },
    { y: topY - (topY - bottomY) * 0.52, front: 0.035, chord, thickness: 1.00 },
    { y: topY - (topY - bottomY) * 0.78, front: 0.055, chord: chord * 0.88, thickness: 0.90 },
    { y: bottomY, front: 0.075, chord: chord * 0.45, thickness: 0.70 }
  ];
  const positions = [];
  const indices = [];
  const ringSize = 4;

  // One closed, vertically lofted leaf with tapered head, heel and aft edge.
  for (const section of sections) {
    const half = thickness * section.thickness * 0.5;
    positions.push(
      -half, section.y, section.front,
       half, section.y, section.front,
       half, section.y, section.front + section.chord,
      -half, section.y, section.front + section.chord
    );
  }

  for (let row = 0; row < sections.length - 1; row++) {
    for (let edge = 0; edge < ringSize; edge++) {
      const next = (edge + 1) % ringSize;
      const a = row * ringSize + edge;
      const b = row * ringSize + next;
      const c = (row + 1) * ringSize + edge;
      const d0 = (row + 1) * ringSize + next;
      indices.push(a, c, b, b, c, d0);
    }
  }
  for (let edge = 1; edge < ringSize - 1; edge++) {
    indices.push(0, edge + 1, edge);
    const base = (sections.length - 1) * ringSize;
    indices.push(base, base + edge, base + edge + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const blade = mesh(parent, geometry, materials.lower, 'broad-rudder-blade');
  blade.userData.rudderBlade = {
    sections: sections.length,
    form: 'closed-tapered-vertical-loft'
  };
  return blade;
}

function installStockPivot(rudder, THREE, pivotY) {
  const pivot = new THREE.Group();
  pivot.name = 'rudder-stock-pivot';
  pivot.position.set(0, pivotY, 0);
  rudder.add(pivot);
  rudder.updateMatrixWorld(true);

  // Reparent all previously authored pieces without changing their rest pose.
  for (const child of [...rudder.children]) {
    if (child !== pivot) pivot.attach(child);
  }

  rudder.userData.steeringControl = {
    axis: 'y',
    rotationSign: 1,
    maxAngle: 0.62,
    pivotGroup: pivot
  };
}

export function buildRudder(d, ctx) {
  const { THREE, part, beam, materials } = ctx;
  const rudder = part('rudder');
  const station = 0.995;
  const baseZ = hullLongitudinalZ(d, station, 0.55) + 0.18;
  rudder.position.set(0, 0, baseZ);

  const topY = deckSurfaceY(d, 0.972) * 0.48;
  const bottomY = keelY(d, 0.995) + 0.28;
  const chord = d.beamUnits * 0.096;
  const thickness = Math.max(0.12, d.beamUnits * 0.010);

  createRudderBlade(d, ctx, rudder, topY, bottomY, chord, thickness);

  beam(rudder, V(0, bottomY - 0.16, 0.035), V(0, topY + 0.16, 0.035),
    Math.max(0.060, d.beamUnits * 0.0067), materials.trim, 'rudder-stock');

  for (const fraction of [0.18, 0.46, 0.74]) {
    const y = bottomY + (topY - bottomY) * fraction;
    beam(rudder, V(-thickness * 0.72, y, chord * 0.50),
      V(thickness * 0.72, y, chord * 0.50),
      0.023, materials.iron, 'rudder-pintle-strap');
  }

  beam(rudder, V(0, topY + 0.12, 0.08),
    V(0, topY + 0.26, -d.beamUnits * 0.12),
    Math.max(0.040, d.beamUnits * 0.0039), materials.trim, 'rudder-tiller');

  installStockPivot(rudder, THREE, topY);
  rudder.userData.rudderArchitecture = {
    stockAxis: 'y',
    pivotHeight: topY,
    bladeSections: 5,
    bladeForm: 'tapered-lofted-aft-leaf'
  };
}
