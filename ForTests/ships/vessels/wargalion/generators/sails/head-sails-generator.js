import { deckY, deckSurfaceY, halfBreadth, V } from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';

export function buildHeadSails(d, ctx) {
  const { part, beam, tube, materials, root, registry } = ctx;
  const assembly = part('head-sails');
  const fore = d.masts[0];
  const mastPart = registry.get('mast-' + fore.id);
  if (!mastPart) throw new Error('Wargalion headsails require the generated foremast.');

  root.updateMatrixWorld(true);
  const totalHeight = fore.height * (4 / 3);

  // The bowsprit tip uses the same endpoint as the bowsprit generator.
  const bowspritRootY = deckY(d, 0.035) + 0.30;
  const bowspritTip = V(
    0,
    bowspritRootY + d.deckHeightUnits * 0.44,
    -d.hullLengthUnits * 0.5 - d.beamUnits * 0.90
  );

  // A second stay is stepped lower on the foremast and terminates at a
  // separate foredeck fitting, creating a distinct inner staysail.
  const innerTackStation = 0.155;
  const innerTack = V(
    0,
    deckSurfaceY(d, innerTackStation) + 0.20,
    (innerTackStation - 0.5) * d.hullLengthUnits
  );

  const mastLocalToShip = point => root.worldToLocal(mastPart.localToWorld(point.clone()));
  const shipToMastLocal = point => mastPart.worldToLocal(root.localToWorld(point.clone()));

  const plans = [
    {
      id: 'outer-jib',
      tack: bowspritTip,
      peak: mastLocalToShip(V(0, totalHeight, 0)),
      clewStation: 0.245,
      fullness: 0.075
    },
    {
      id: 'inner-staysail',
      tack: innerTack,
      peak: mastLocalToShip(V(0, totalHeight * 0.84, 0)),
      clewStation: 0.315,
      fullness: 0.070
    }
  ];

  for (const [index, plan] of plans.entries()) {
    const clew = V(
      0,
      deckSurfaceY(d, plan.clewStation) + 0.20,
      (plan.clewStation - 0.5) * d.hullLengthUnits
    );

    // The sail's first column is the luff: tack to peak. Its opposite edge
    // tapers to the clew, keeping the canvas triangular but non-degenerate.
    buildCanvasSail(ctx, 'sail-head-' + (index + 1), fore.id,
      [plan.tack, plan.peak, clew, plan.tack], plan.fullness, assembly, 'x');

    // Keep a named, individually editable forestay per headsail. Its first
    // endpoint is attached to the foremast, its second endpoint is a fixed
    // hull/bowsprit fitting. The shared mast-step lifecycle updates the
    // masthead end in-place when the foremast leans.
    const stayGroup = part('head-stays-' + (index + 1), assembly);
    const stay = tube(stayGroup, [plan.peak, plan.tack], 0.014,
      materials.rope, plan.id + '-forestay', 36);
    const mastLocalPoints = [plan.peak, plan.tack].map(point =>
      shipToMastLocal(point).toArray()
    );
    stay.userData.dynamicMastStay = {
      mastId: fore.id,
      coordinateSpace: 'mast-group',
      points: mastLocalPoints,
      fixedEndIndex: 1,
      fixedPoint: mastLocalPoints[1],
      resolveAgainstChainplates: false,
      anchorRole: plan.id === 'outer-jib' ? 'bowsprit-tip' : 'foredeck-inner-stay',
      radius: 0.014,
      segments: 36,
      radialSegments: 7
    };

    // Lead each clew aft and outboard to separate port/starboard fairleads.
    const fairleadStation = Math.min(plan.clewStation + 0.12, 0.46);
    const fairleadZ = (fairleadStation - 0.5) * d.hullLengthUnits;
    const fairleadY = deckSurfaceY(d, fairleadStation) + 0.12;
    const fairleadX = halfBreadth(d, fairleadStation) * 0.80;
    for (const side of [-1, 1]) {
      const fairlead = V(side * fairleadX, fairleadY, fairleadZ);
      beam(assembly, clew, fairlead, 0.010, materials.rope,
        'headsail-sheet-' + (index + 1) + '-' + side);
    }
  }
}
