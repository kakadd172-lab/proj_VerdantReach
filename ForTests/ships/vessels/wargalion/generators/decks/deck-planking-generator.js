import { deckPoint, deckSurfaceY, deckY, V } from '../../architecture/hull-geometry.js';

export function buildDeckPlanking(d, ctx) {
  const { part, tube, materials } = ctx;
  const seams = part('deck-planks');
  const liftAt = t => deckSurfaceY(d, t) - deckY(d, t);

  // Longitudinal planks remain continuous over the stepped deck elevations.
  for (let line = -11; line <= 11; line++) {
    const u = line / 12;
    const points = [];
    for (let i = 0; i <= 72; i++) {
      const t = 0.035 + 0.93 * i / 72;
      points.push(deckPoint(d, t, u, liftAt(t) + 0.018));
    }
    tube(seams, points, 0.0085, materials.plank,
      'deck-longitudinal-seam-' + line, 76);
  }

  // Staggered butt joints are broken into shorter runs like individual boards.
  for (let row = 0; row < 28; row++) {
    const t = 0.045 + row * 0.033;
    const offset = row % 2 ? 0.045 : 0;
    for (let board = 0; board < 8; board++) {
      const u0 = -0.88 + board * 0.22 + offset;
      const u1 = Math.min(0.88, u0 + 0.17);
      if (u0 >= 0.88) continue;
      const points = [];
      for (let i = 0; i <= 4; i++) {
        const u = u0 + (u1 - u0) * i / 4;
        points.push(deckPoint(d, t, u, liftAt(t) + 0.022));
      }
      tube(seams, points, 0.0055, materials.plank,
        'deck-butt-joint-' + row + '-' + board, 8);
    }
  }
}
