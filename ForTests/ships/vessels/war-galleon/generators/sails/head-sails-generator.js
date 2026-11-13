import { deckY, V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';

export function buildHeadSails(d, ctx) {
  const { part, tube, materials } = ctx;
  const head = part('head-sails');
  const fore = d.masts[0];
  const foreZ = fore.z * d.hullLengthUnits;
  const foreBase = deckY(d, 0.5 + fore.z * 0.45) + 0.12;
  const foreTop = foreBase + fore.height * (4 / 3);
  const bowZ = -d.hullLengthUnits * 0.5 - d.beamUnits * 0.68;
  const bowY = deckY(d, 0.035) + 0.42;
  const staySpan = foreZ - bowZ;

  for (let i = 0; i < d.headsails; i++) {
    const tackFraction = 0.015 + i * 0.022;
    const peakFraction = 0.96 - i * 0.085;
    const clewFraction = 0.53 - i * 0.065;

    const tack = V(0, bowY, bowZ + staySpan * tackFraction);
    const peak = V(
      0,
      bowY + (foreTop - bowY) * peakFraction,
      bowZ + staySpan * peakFraction
    );
    const clew = V(0, bowY + 0.18, bowZ + staySpan * clewFraction);

    // The sail is a triangular staysail with a shared tack/luff origin.
    buildCanvasSail(
      ctx,
      'sail-head-' + (i + 1),
      fore.id,
      [tack, peak, clew, tack],
      0.085 - i * 0.006,
      head,
      'x'
    );

    // Keep the luff and clew support lines as separately editable parts.
    const stays = part('head-stays-' + (i + 1), head);
    tube(stays, [tack, peak], 0.014, materials.rope, 'headstay-' + (i + 1), 28);
    tube(stays, [tack, clew], 0.011, materials.rope, 'headsail-clew-line-' + (i + 1), 24);
  }
}
