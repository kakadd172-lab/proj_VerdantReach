import { deckSurfaceY, V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';

export function buildHeadSails(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const root = part('head-sails');
  const fore = d.masts[0];
  const mastZ = fore.z * d.hullLengthUnits;
  const baseY = deckSurfaceY(d, 0.04) + 0.34;
  const mastTop = baseY + fore.height * (4 / 3);
  const bowZ = -d.hullLengthUnits * 0.5 - d.beamUnits * 0.88;
  const bow = V(0, baseY + d.deckHeightUnits * 0.36, bowZ);
  const head = V(0, mastTop * 0.91, mastZ);
  const stay = part('forestay', root);
  tube(stay, [bow, head], 0.018, materials.rope, 'forestay-line', 36);
  for (let i = 0; i < d.headsails; i++) {
    const tack = bow.clone().lerp(head, 0.035 + i * 0.035);
    const peak = bow.clone().lerp(head, 0.96 - i * 0.10);
    const clew = bow.clone().lerp(head, 0.54 - i * 0.08);
    buildCanvasSail(ctx, 'sail-head-' + (i + 1), fore.id,
      [tack, peak, clew, tack], 0.075 - i * 0.006, root, 'x');
    beam(root, tack, clew, 0.012, materials.rope, 'headsail-sheet');
  }
}
