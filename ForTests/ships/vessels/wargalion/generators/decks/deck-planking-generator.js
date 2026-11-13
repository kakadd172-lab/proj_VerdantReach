import { deckPoint, V } from '../../architecture/hull-geometry.js';

export function buildDeckPlanking(d, ctx) {
  const { part, tube, materials } = ctx;
  const seams = part('deck-planks');
  for (let line = -10; line <= 10; line++) {
    const u = line / 11, points = [];
    for (let i = 0; i <= 56; i++) {
      const t = 0.055 + 0.90 * i / 56;
      points.push(deckPoint(d, t, u, 0.018));
    }
    tube(seams, points, 0.009, materials.plank, 'deck-longitudinal-seam-' + line, 60);
  }
  for (let row = 0; row < 22; row++) {
    const t = 0.075 + row * 0.039;
    const points = [];
    for (let i = 0; i <= 18; i++) {
      const u = -0.88 + 1.76 * i / 18;
      points.push(deckPoint(d, t, u, 0.02));
    }
    tube(seams, points, 0.006, materials.plank, 'deck-butt-joint-' + row, 20);
  }
}
