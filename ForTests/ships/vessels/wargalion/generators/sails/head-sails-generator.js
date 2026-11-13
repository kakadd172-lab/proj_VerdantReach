import { deckSurfaceY, halfBreadth, V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';

export function buildHeadSails(d, ctx) {
  const { part, beam, tube, materials } = ctx;
  const root = part('head-sails');
  const fore = d.masts[0];
  const mastZ = fore.z * d.hullLengthUnits;
  const mastStation = 0.5 + fore.z;
  const mastBaseY = deckSurfaceY(d, mastStation) + 0.18;
  const mastTopY = mastBaseY + fore.height * (4 / 3) + 0.06;

  // Match the outer bowsprit fitting and the foremast head rather than
  // estimating a shorter line below the masthead.
  const bowspritRootY = deckSurfaceY(d, 0.035) + 0.30;
  const bowZ = -d.hullLengthUnits * 0.5 - d.beamUnits * 0.90;
  const bow = V(0, bowspritRootY + d.deckHeightUnits * 0.44, bowZ);
  const head = V(0, mastTopY - 0.28, mastZ);

  const forestay = part('forestay', root);
  tube(forestay, [bow, head], 0.018, materials.rope, 'forestay-line', 36);

  for (let i = 0; i < d.headsails; i++) {
    const tackFraction = 0.035 + i * 0.035;
    const peakFraction = 0.96 - i * 0.10;
    const tack = bow.clone().lerp(head, tackFraction);
    const peak = bow.clone().lerp(head, peakFraction);

    // The clew must not be interpolated along the forestay: that makes all
    // three triangle corners collinear and collapses the sail to a line.
    // Put each clew aft and down on the raised foredeck to create real cloth
    // area while keeping the first grid column on the authored forestay/luff.
    const clewStation = 0.105 + i * 0.035;
    const clew = V(
      0,
      deckSurfaceY(d, clewStation) + 0.20,
      (clewStation - 0.5) * d.hullLengthUnits
    );

    buildCanvasSail(ctx, 'sail-head-' + (i + 1), fore.id,
      [tack, peak, clew, tack], 0.075 - i * 0.006, root, 'x');

    // The tack-to-clew edge is the sail foot. Separate sheets lead aft and
    // outboard from the clew to the foredeck instead of duplicating that edge.
    beam(root, tack, clew, 0.012, materials.rope, 'headsail-foot-line');
    const sheetLeadStation = Math.min(clewStation + 0.12, 0.34);
    const sheetLead = V(
      halfBreadth(d, sheetLeadStation) * 0.80,
      deckSurfaceY(d, sheetLeadStation) + 0.16,
      (sheetLeadStation - 0.5) * d.hullLengthUnits
    );
    for (const side of [-1, 1]) {
      const lead = sheetLead.clone();
      lead.x *= side;
      beam(root, clew, lead, 0.010, materials.rope,
        'headsail-sheet-' + (i + 1) + '-' + side);
    }
  }
}
