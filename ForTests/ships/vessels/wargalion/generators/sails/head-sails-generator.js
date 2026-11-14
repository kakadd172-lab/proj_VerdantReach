import {
  deckY, deckSurfaceY, halfBreadth, hullLongitudinalZ, V
} from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';

export function buildHeadSails(d, ctx) {
  const { part, beam, materials, root, registry, tube } = ctx;
  const assembly = part('head-sails');
  const fore = d.masts[0];
  const mastPart = registry.get('mast-' + fore.id);
  if (!mastPart) throw new Error('Wargalion headsails require the generated foremast.');

  root.updateMatrixWorld(true);
  const totalHeight = fore.height * (4 / 3);

  // These endpoints exactly mirror bow-generator.js.
  const bowspritRootY = deckSurfaceY(d, 0.035) + 0.26;
  const bowspritBaseZ = hullLongitudinalZ(d, 0.025, 1);
  const bowspritTip = V(
    0,
    bowspritRootY + d.deckHeightUnits * 0.37,
    bowspritBaseZ - d.beamUnits * 0.82
  );

  const innerTackStation = 0.155;
  const innerTack = V(
    0,
    deckSurfaceY(d, innerTackStation) + 0.16,
    hullLongitudinalZ(d, innerTackStation, 1)
  );

  const mastLocalToShip = point => root.worldToLocal(mastPart.localToWorld(point.clone()));
  const shipToMastLocal = point => mastPart.worldToLocal(root.localToWorld(point.clone()));

  const plans = [
    {
      id: 'outer-jib',
      tack: bowspritTip,
      peak: mastLocalToShip(V(0, totalHeight * 0.94, 0)),
      clewStation: 0.245,
      fullness: 0.082
    },
    {
      id: 'inner-staysail',
      tack: innerTack,
      peak: mastLocalToShip(V(0, totalHeight * 0.80, 0)),
      clewStation: 0.315,
      fullness: 0.078
    }
  ];

  for (const [index, plan] of plans.entries()) {
    const clew = V(
      0,
      deckSurfaceY(d, plan.clewStation) + 0.16,
      hullLongitudinalZ(d, plan.clewStation, 1)
    );

    buildCanvasSail(ctx, 'sail-head-' + (index + 1), fore.id,
      [plan.tack, plan.peak, clew, plan.tack], plan.fullness, assembly, 'x');

    const stayGroup = part('head-stays-' + (index + 1), assembly);
    const stay = tube(stayGroup, [plan.peak, plan.tack], 0.012,
      materials.rope, plan.id + '-forestay', 40);
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
      radius: 0.012,
      segments: 40,
      radialSegments: 7
    };

    const fairleadStation = Math.min(plan.clewStation + 0.12, 0.46);
    const fairleadZ = hullLongitudinalZ(d, fairleadStation, 1);
    const fairleadY = deckSurfaceY(d, fairleadStation) + 0.10;
    const fairleadX = halfBreadth(d, fairleadStation) * 0.80;
    for (const side of [-1, 1]) {
      const fairlead = V(side * fairleadX, fairleadY, fairleadZ);
      beam(assembly, clew, fairlead, 0.009, materials.rope,
        'headsail-sheet-' + (index + 1) + '-' + side);
    }
  }
}
