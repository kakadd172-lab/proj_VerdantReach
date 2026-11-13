import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildRailings(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const root = part('railings');
  for (const [side, name] of [[-1, 'railings-port'], [1, 'railings-starboard']]) {
    const rail = part(name, root), points = [];
    for (let i = 0; i <= 64; i++) {
      const t = 0.07 + 0.87 * i / 64;
      const x = side * halfBreadth(d, t) * 0.90;
      const y = deckY(d, t) + 0.55;
      const z = (t - 0.5) * d.hullLengthUnits;
      points.push(V(x, y, z));
      if (i % 3 === 0) beam(rail, V(x, y - 0.48, z), V(x, y, z),
        0.032, materials.trim, 'bulwark-post');
    }
    tube(rail, points, 0.052, materials.trim, 'continuous-gunwale-rail', 72);
    const lower = points.map(p => V(p.x, p.y - 0.20, p.z));
    tube(rail, lower, 0.022, materials.trim, 'lower-rail', 72);
  }
}
