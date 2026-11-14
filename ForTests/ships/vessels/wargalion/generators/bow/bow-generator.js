import {
  deckY, deckSurfaceY, halfBreadth, hullLongitudinalZ,
  sectionBreadthRatio, V
} from '../../architecture/hull-geometry.js';

export function buildBow(d, ctx) {
  const { THREE, part, beam, tube, box, mesh, materials } = ctx;
  const bow = part('bowworks');
  const beakhead = part('beakhead', bow);
  const baseY = deckSurfaceY(d, 0.045) + 0.22;
  const bowZ = hullLongitudinalZ(d, 0.025, 1);
  const bowspritTipZ = bowZ - d.beamUnits * 0.82;

  // Bowsprit remains a top-level editable component to preserve the
  // independently registered ForTests transform contract.
  const bowsprit = part('bowsprit');
  const sparRoot = V(0, deckSurfaceY(d, 0.035) + 0.26, bowZ + 0.48);
  const sparMid = V(0, sparRoot.y + d.deckHeightUnits * 0.16, bowZ - d.beamUnits * 0.22);
  const sparTip = V(0, sparRoot.y + d.deckHeightUnits * 0.37, bowspritTipZ);
  beam(bowsprit, sparRoot, sparMid, d.beamUnits * 0.026, materials.trim, 'bowsprit-inboard');
  beam(bowsprit, sparMid, sparTip, d.beamUnits * 0.020, materials.trim, 'main-bowsprit');
  beam(bowsprit,
    V(0, sparRoot.y + d.deckHeightUnits * 0.08, bowZ + 0.16),
    V(0, sparRoot.y + d.deckHeightUnits * 0.32, bowspritTipZ + 0.22),
    d.beamUnits * 0.013, materials.trim, 'dolphin-striker');

  const gammoning = part('bowsprit-gammoning', bow);
  for (let i = 0; i < 5; i++) {
    const f = i / 4;
    const z = bowZ + 0.32 - d.beamUnits * 0.105 * f;
    const y = sparRoot.y + d.deckHeightUnits * (0.10 + 0.06 * f);
    tube(gammoning, [
      V(-0.18, y, z), V(0, y + 0.09, z - 0.075), V(0.18, y, z)
    ], 0.014, materials.rope, 'bowsprit-gammoning-turn', 12);
  }

  // A tapered beakhead platform replaces the blunt rectangular block.
  const halfAft = d.beamUnits * 0.15;
  const halfFore = d.beamUnits * 0.07;
  const depth = d.beamUnits * 0.58;
  const shape = new THREE.Shape();
  shape.moveTo(-halfAft, 0);
  shape.lineTo(halfAft, 0);
  shape.lineTo(halfFore, -depth);
  shape.lineTo(-halfFore, -depth);
  shape.closePath();
  const platformGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12, bevelEnabled: true, bevelSegments: 2,
    bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 8
  });
  platformGeometry.rotateX(Math.PI / 2);
  platformGeometry.translate(0, baseY + 0.10, bowZ + 0.30);
  platformGeometry.computeVertexNormals();
  platformGeometry.computeBoundingBox();
  platformGeometry.computeBoundingSphere();
  mesh(beakhead, platformGeometry, materials.deck, 'beakhead-tapered-platform');

  for (const side of [-1, 1]) {
    const rail = [];
    const lowerRail = [];
    for (let i = 0; i <= 22; i++) {
      const f = i / 22;
      const z = bowZ + 0.22 - d.beamUnits * 0.60 * f;
      const x = side * d.beamUnits * (0.082 + 0.080 * f);
      const y = baseY + d.deckHeightUnits * (0.14 + 0.02 * Math.sin(Math.PI * f));
      rail.push(V(x, y + 0.28, z));
      lowerRail.push(V(x, y + 0.10, z));
      if (i % 3 === 0) {
        beam(beakhead, V(x, y, z), V(x, y + 0.28, z),
          0.023, materials.trim, 'beakhead-stanchion');
      }
    }
    tube(beakhead, rail, 0.032, materials.trim, 'beakhead-top-rail', 28);
    tube(beakhead, lowerRail, 0.020, materials.trim, 'beakhead-lower-rail', 28);
  }

  const forecastle = part('forecastle-bulwarks', bow);
  for (const side of [-1, 1]) {
    const capRail = [];
    for (let i = 0; i <= 32; i++) {
      const t = 0.035 + 0.20 * i / 32;
      const edge = halfBreadth(d, t) * sectionBreadthRatio(d, t, 1) * 0.985;
      const x = side * edge;
      const z = hullLongitudinalZ(d, t, 1);
      const y = deckSurfaceY(d, t) + 0.36;
      capRail.push(V(x, y, z));
      if (i % 2 === 0) {
        beam(forecastle, V(x, y - 0.34, z), V(x, y, z),
          0.025, materials.trim, 'forecastle-bulwark-stanchion');
      }
    }
    tube(forecastle, capRail, 0.036, materials.trim, 'forecastle-cap-rail', 38);
  }
}
