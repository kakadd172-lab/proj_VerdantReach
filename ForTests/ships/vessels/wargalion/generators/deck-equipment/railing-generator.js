import { deckPoint, deckSurfaceY, deckY, V } from '../../architecture/hull-geometry.js';

export function buildRailings(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const root = part('railings');
  const liftAt = t => deckSurfaceY(d, t) - deckY(d, t);

  for (const [side, name] of [[-1, 'railings-port'], [1, 'railings-starboard']]) {
    const rail = part(name, root);
    const points = [];
    for (let i = 0; i <= 76; i++) {
      const t = 0.07 + 0.87 * i / 76;
      if (t < 0.225) continue;
      const edge = deckPoint(d, t, side * 0.992, liftAt(t));
      const top = V(edge.x, edge.y + 0.48, edge.z);
      points.push(top);
      if (i % 3 === 0) beam(rail, edge, top,
        0.026, materials.trim, 'bulwark-post');
    }
    tube(rail, points, 0.043, materials.trim, 'continuous-gunwale-rail', 84);
    const lower = points.map(p => V(p.x, p.y - 0.18, p.z));
    tube(rail, lower, 0.019, materials.trim, 'lower-rail', 84);
  }
}
