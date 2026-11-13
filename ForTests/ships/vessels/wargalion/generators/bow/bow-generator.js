import { deckY, deckSurfaceY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildBow(d, ctx) {
  const { part, beam, tube, box, materials } = ctx;
  const bow = part('bowworks');
  const beakhead = part('beakhead', bow);
  const baseY = deckSurfaceY(d, 0.045) + 0.30;
  const bowZ = -d.hullLengthUnits * 0.5;
  const bowspritTipZ = bowZ - d.beamUnits * 0.90;

  // The bowsprit is a first-class editable spar assembly.
  const bowsprit = part('bowsprit');
  const sparRoot = V(0, deckY(d, 0.035) + 0.34, bowZ + 0.50);
  const sparMid = V(0, sparRoot.y + d.deckHeightUnits * 0.19, bowZ - d.beamUnits * 0.28);
  const sparTip = V(0, sparRoot.y + d.deckHeightUnits * 0.44, bowspritTipZ);
  beam(bowsprit, sparRoot, sparMid, d.beamUnits * 0.032, materials.trim, 'bowsprit-inboard');
  beam(bowsprit, sparMid, sparTip, d.beamUnits * 0.025, materials.trim, 'main-bowsprit');
  beam(bowsprit,
    V(0, sparRoot.y + d.deckHeightUnits * 0.10, bowZ + 0.18),
    V(0, sparRoot.y + d.deckHeightUnits * 0.38, bowspritTipZ + 0.24),
    d.beamUnits * 0.016, materials.trim, 'dolphin-striker');

  const gammoning = part('bowsprit-gammoning', bow);
  for (let i = 0; i < 5; i++) {
    const f = i / 4;
    const z = bowZ + 0.35 - d.beamUnits * 0.12 * f;
    const y = sparRoot.y + d.deckHeightUnits * (0.12 + 0.07 * f);
    tube(gammoning, [
      V(-0.22, y, z), V(0, y + 0.12, z - 0.10), V(0.22, y, z)
    ], 0.018, materials.rope, 'bowsprit-gammoning-turn', 12);
  }

  const platform = box(beakhead, d.beamUnits * 0.32, 0.12, d.beamUnits * 0.68,
    materials.deck, 'beakhead-platform');
  platform.position.set(0, baseY + d.deckHeightUnits * 0.18, bowZ - d.beamUnits * 0.28);

  for (const side of [-1, 1]) {
    const rail = [];
    const lowerRail = [];
    for (let i = 0; i <= 18; i++) {
      const f = i / 18;
      const z = bowZ - d.beamUnits * 0.62 * f;
      const x = side * d.beamUnits * (0.095 + 0.105 * f);
      const y = baseY + d.deckHeightUnits * (0.20 + 0.025 * Math.sin(Math.PI * f));
      rail.push(V(x, y + 0.34, z));
      lowerRail.push(V(x, y + 0.12, z));
      if (i % 3 === 0) {
        beam(beakhead, V(x, y, z), V(x, y + 0.34, z),
          0.030, materials.trim, 'beakhead-stanchion');
      }
    }
    tube(beakhead, rail, 0.040, materials.trim, 'beakhead-top-rail', 24);
    tube(beakhead, lowerRail, 0.026, materials.trim, 'beakhead-lower-rail', 24);
  }

  const forecastle = part('forecastle-bulwarks', bow);
  for (const side of [-1, 1]) {
    const capRail = [];
    for (let i = 0; i <= 26; i++) {
      const t = 0.035 + 0.20 * i / 26;
      const x = side * halfBreadth(d, t) * 0.84;
      const z = (t - 0.5) * d.hullLengthUnits;
      const y = deckSurfaceY(d, t) + 0.43;
      capRail.push(V(x, y, z));
      if (i % 2 === 0) {
        beam(forecastle, V(x, y - 0.42, z), V(x, y, z),
          0.032, materials.trim, 'forecastle-bulwark-stanchion');
      }
    }
    tube(forecastle, capRail, 0.047, materials.trim, 'forecastle-cap-rail', 32);
  }
}
