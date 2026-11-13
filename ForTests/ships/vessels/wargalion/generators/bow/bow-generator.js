import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildBow(d, ctx) {
  const { part, beam, tube, box, materials } = ctx;
  const bow = part('bowworks');
  const beak = part('beakhead', bow);
  const baseY = deckY(d, 0.035) + 0.30;
  const bowZ = -d.hullLengthUnits * 0.5;
  const spritEnd = bowZ - d.beamUnits * 0.90;
  beam(beak, V(0, baseY, bowZ + 0.45), V(0, baseY + d.deckHeightUnits * 0.44, spritEnd),
    d.beamUnits * 0.028, materials.trim, 'bowsprit');
  beam(beak, V(0, baseY + d.deckHeightUnits * 0.12, bowZ + 0.2),
    V(0, baseY + d.deckHeightUnits * 0.38, spritEnd + 0.22),
    d.beamUnits * 0.018, materials.trim, 'dolphin-striker');
  const platform = box(beak, d.beamUnits * 0.34, 0.12, d.beamUnits * 0.72,
    materials.deck, 'beakhead-platform');
  platform.position.set(0, baseY + d.deckHeightUnits * 0.18, bowZ - d.beamUnits * 0.30);
  for (const side of [-1, 1]) {
    const rail = [];
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      rail.push(V(side * d.beamUnits * (0.10 + 0.12 * f),
        baseY + d.deckHeightUnits * 0.20, bowZ - d.beamUnits * 0.65 * f));
    }
    tube(beak, rail, 0.035, materials.trim, 'beakhead-rail', 18);
    beam(beak, V(0, baseY + d.deckHeightUnits * 0.08, bowZ - d.beamUnits * 0.64),
      V(side * d.beamUnits * 0.21, baseY + d.deckHeightUnits * 0.08, bowZ + 0.15),
      0.045, materials.trim, 'beakhead-cheek');
  }
  const forecastle = part('forecastle-bulwarks', bow);
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= 22; i++) {
      const t = 0.035 + 0.19 * i / 22;
      const x = side * halfBreadth(d, t) * 0.87;
      const z = (t - 0.5) * d.hullLengthUnits;
      const y = deckY(d, t) + d.hull.forecastleRise * (4 / 3) + 0.42;
      points.push(V(x, y, z));
      if (i % 2 === 0) beam(forecastle, V(x, y - 0.44, z), V(x, y, z),
        0.035, materials.trim, 'forecastle-stanchion');
    }
    tube(forecastle, points, 0.05, materials.trim, 'forecastle-cap-rail', 28);
  }
}
