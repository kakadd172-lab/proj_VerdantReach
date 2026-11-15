import {
  deckSurfaceY, halfBreadth, hullLongitudinalZ, V
} from '../../architecture/hull-geometry.js';
import { buildCanvasSail } from './sail-cloth-generator.js';

export function buildHeadSails(d, ctx) {
  const { part, beam, materials, root, registry, tube } = ctx;
  const assembly = part('head-sails');
  const fore = d.masts.find(item => item.id === 'fore') || d.masts[0];
  const mastPart = registry.get('mast-' + fore.id);
  if (!mastPart) throw new Error('Wargalion headsails require the generated foremast.');

  root.updateMatrixWorld(true);
  const totalHeight = fore.height * (4 / 3);

  const bowspritRootY = deckSurfaceY(d, 0.035) + 0.26;
  const bowspritBaseZ = hullLongitudinalZ(d, 0.025, 1);
  const bowspritTip = V(
    0,
    bowspritRootY + d.deckHeightUnits * 0.37,
    bowspritBaseZ - d.beamUnits * 0.82
  );

  const mastLocalToShip = point => root.worldToLocal(mastPart.localToWorld(point.clone()));
  const shipToMastLocal = point => mastPart.worldToLocal(root.localToWorld(point.clone()));

  const innerTackStation = 0.105;
  const innerTack = V(
    0,
    deckSurfaceY(d, innerTackStation) + 0.18,
    hullLongitudinalZ(d, innerTackStation, 1)
  );

  const plans = [
    {
      id: 'outer-jib',
      tack: bowspritTip,
      peak: mastLocalToShip(V(0, totalHeight * 0.72, 0)),
      clewStation: 0.190,
      fullness: 0.056
    },
    {
      id: 'inner-staysail',
      tack: innerTack,
      peak: mastLocalToShip(V(0, totalHeight * 0.56, 0)),
      clewStation: 0.225,
      fullness: 0.060
    }
  ];

  for (const [index, plan] of plans.entries()) {
    const clew = V(
      0,
      deckSurfaceY(d, plan.clewStation) + 0.18,
      hullLongitudinalZ(d, plan.clewStation, 1)
    );

    buildCanvasSail(ctx, 'sail-head-' + (index + 1), fore.id,
      [plan.tack, plan.peak, clew, plan.tack],
      plan.fullness, assembly, 'x');

    const stayGroup = part('head-stays-' + (index + 1), assembly);
    const stay = tube(stayGroup, [plan.peak, plan.tack], 0.013,
      materials.rope, plan.id + '-forestay', 44);
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
      radius: 0.013,
      segments: 44,
      radialSegments: 7
    };

    const fairleadStation = Math.min(plan.clewStation + 0.07, 0.43);
    const fairleadZ = hullLongitudinalZ(d, fairleadStation, 1);
    const fairleadY = deckSurfaceY(d, fairleadStation) + 0.12;
    const fairleadX = halfBreadth(d, fairleadStation) * 0.82;
    for (const side of [-1, 1]) {
      const fairlead = V(side * fairleadX, fairleadY, fairleadZ);
      beam(assembly, clew, fairlead, 0.009, materials.rope,
        'headsail-sheet-' + (index + 1) + '-' + side);
    }
  }
}
