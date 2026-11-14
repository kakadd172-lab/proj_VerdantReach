import { deckSurfaceY, keelY, halfBreadth, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

export function buildStem(d, ctx) {
  const { part, tube, materials } = ctx;
  const group = part('stem');
  const bow = [];
  const stern = [];

  for (let i = 0; i <= 36; i++) {
    const v = i / 36;
    const bowY = keelY(d, 0.012) + (deckSurfaceY(d, 0.012) - keelY(d, 0.012)) * v;
    const sternY = keelY(d, 0.992) + (deckSurfaceY(d, 0.992) - keelY(d, 0.992)) * v;
    bow.push(V(0, bowY + 0.025,
      hullLongitudinalZ(d, 0.012, v)));
    stern.push(V(0, sternY + 0.015,
      hullLongitudinalZ(d, 0.992, v)));
  }

  tube(group, bow, Math.max(0.11, d.beamUnits * 0.012),
    materials.trim, 'tapered-raked-stempost', 48);
  tube(group, stern, Math.max(0.10, d.beamUnits * 0.0105),
    materials.trim, 'tapered-sternpost', 48);

  const transom = [];
  const station = 0.995;
  const width = halfBreadth(d, station) * 0.94;
  const z = hullLongitudinalZ(d, station, 1);
  const y = deckSurfaceY(d, station);
  for (let i = 0; i <= 32; i++) {
    const u = -1 + 2 * i / 32;
    const crown = 0.075 * (1 - u * u);
    transom.push(V(u * width, y + crown, z));
  }
  tube(group, transom, Math.max(0.075, d.beamUnits * 0.008),
    materials.trim, 'crowned-transom-rim', 40);
}
