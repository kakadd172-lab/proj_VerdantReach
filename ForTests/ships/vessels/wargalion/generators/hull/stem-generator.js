import { deckY, keelY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildStem(d, ctx) {
  const { part, tube, materials } = ctx;
  const group = part('stem');
  const bow = [], stern = [];
  for (let i = 0; i <= 24; i++) {
    const v = i / 24;
    const bowY = keelY(d, 0.018) + (deckY(d, 0.018) - keelY(d, 0.018)) * v;
    const sternY = keelY(d, 0.995) + (deckY(d, 0.995) - keelY(d, 0.995)) * v;
    bow.push(V(0, bowY + 0.04, -d.hullLengthUnits * 0.5 - 0.05 * v));
    stern.push(V(0, sternY + 0.02, d.hullLengthUnits * 0.5 + 0.015));
  }
  tube(group, bow, d.beamUnits * 0.025, materials.trim, 'curved-raked-stem-post', 36);
  tube(group, stern, d.beamUnits * 0.022, materials.trim, 'sternpost', 36);
  const transom = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18 * 2 - 1;
    const width = halfBreadth(d, 0.995) * 0.94;
    transom.push(V(u * width, deckY(d, 0.995) - (i === 0 || i === 18 ? 0.08 : 0), d.hullLengthUnits * 0.495));
  }
  tube(group, transom, d.beamUnits * 0.014, materials.trim, 'curved-transom-rim', 28);
}
