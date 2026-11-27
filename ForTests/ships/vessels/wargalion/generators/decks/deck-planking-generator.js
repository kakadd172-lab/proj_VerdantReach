import { deckPoint, deckSurfaceY, deckY } from '../../architecture/hull-geometry.js';

export function buildDeckPlanking(d, ctx) {
  const { part, tube, materials } = ctx;
  const seams = part('deck-planks');
  const liftAt = t => deckSurfaceY(d, t) - deckY(d, t);

  // More restrained longitudinal seams; the deck mesh itself carries camber.
  for (let line = -9; line <= 9; line++) {
    const u = line / 10;
    const points = [];
    for (let i = 0; i <= 84; i++) {
      const t = 0.025 + 0.95 * i / 84;
      points.push(deckPoint(d, t, u, liftAt(t) + 0.010));
    }
    tube(seams, points, 0.0038, materials.lower,
      'deck-longitudinal-seam-' + line, 88);
  }

  // Staggered butt joints remain small and recessed-looking, not raised ropes.
  for (let row = 0; row < 24; row++) {
    const t = 0.045 + row * 0.038;
    const offset = row % 2 ? 0.05 : 0;
    for (let board = 0; board < 8; board++) {
      const u0 = -0.88 + board * 0.22 + offset;
      const u1 = Math.min(0.88, u0 + 0.16);
      if (u0 >= 0.88) continue;
      const points = [];
      for (let i = 0; i <= 4; i++) {
        const u = u0 + (u1 - u0) * i / 4;
        points.push(deckPoint(d, t, u, liftAt(t) + 0.012));
      }
      tube(seams, points, 0.0028, materials.lower,
        'deck-butt-joint-' + row + '-' + board, 8);
    }
  }
}
