import {
  createPchipTable, interpolatePchip, deckSurfaceY, halfBreadth,
  hullLongitudinalZ, V
} from '../../architecture/hull-geometry.js';
import { WARGALION_STERN_STATIONS } from '../../architecture/blueprint-data.js';

const sternAxis = WARGALION_STERN_STATIONS.map(item => item.station);
const sternWidthTable = createPchipTable(
  sternAxis, WARGALION_STERN_STATIONS.map(item => item.widthRatio)
);
const sternHeightTable = createPchipTable(
  sternAxis, WARGALION_STERN_STATIONS.map(item => item.wallHeight)
);

function profileAt(t) {
  return {
    widthRatio: interpolatePchip(sternWidthTable, t),
    wallHeight: interpolatePchip(sternHeightTable, t)
  };
}

function halfWidthAt(d, t, scale = 1) {
  return d.beamUnits * 0.5 * profileAt(t).widthRatio * scale;
}

function tierHeightAt(t, tier) {
  return Math.max(0.62, profileAt(t).wallHeight * tier.heightScale);
}

function finishGeometry(geometry) {
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeSideWall(d, ctx, parent, side, tier) {
  const { THREE, mesh, materials } = ctx;
  const along = 56;
  const vertical = 18;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = tier.t0 + (tier.t1 - tier.t0) * i / along;
    const wallHeight = tierHeightAt(t, tier);
    const half = halfWidthAt(d, t, tier.widthScale);
    const baseY = deckSurfaceY(d, t) + tier.baseOffset;
    const z = hullLongitudinalZ(d, t, 1);

    for (let j = 0; j <= vertical; j++) {
      const v = j / vertical;
      const sheer = 0.025 * Math.sin(Math.PI * v);
      positions.push(
        side * half,
        baseY + wallHeight * v + sheer,
        z
      );
    }
  }

  const stride = vertical + 1;
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < vertical; j++) {
      const a = i * stride + j;
      const b = a + stride;
      if (side > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  finishGeometry(geometry);
  mesh(parent, geometry, materials.hull,
    'sterncastle-tier-' + tier.id + '-continuous-wall-' + (side < 0 ? 'port' : 'starboard'));
}

function makeCastleEndWall(d, ctx, parent, t, tier, name, offsetSign) {
  const { THREE, mesh, materials } = ctx;
  const across = 32;
  const vertical = 18;
  const half = halfWidthAt(d, t, tier.widthScale);
  const wallHeight = tierHeightAt(t, tier);
  const baseY = deckSurfaceY(d, t) + tier.baseOffset;
  const z = hullLongitudinalZ(d, t, 1) + offsetSign * 0.035;
  const positions = [];
  const indices = [];

  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    for (let col = 0; col <= across; col++) {
      const u = -1 + 2 * col / across;
      const crown = 0.075 * (1 - u * u) * v;
      positions.push(
        u * half,
        baseY + wallHeight * v + crown,
        z
      );
    }
  }

  const stride = across + 1;
  for (let row = 0; row < vertical; row++) {
    for (let col = 0; col < across; col++) {
      const a = row * stride + col;
      const b = a + stride;
      if (offsetSign > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  finishGeometry(geometry);
  mesh(parent, geometry, materials.hull, name);
}

function makeTierRoof(d, ctx, roof, tier) {
  const { THREE, mesh, materials, tube } = ctx;
  const along = 52;
  const across = 24;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = tier.t0 + (tier.t1 - tier.t0) * i / along;
    const half = halfWidthAt(d, t, tier.widthScale);
    const y = deckSurfaceY(d, t) + tier.baseOffset + tierHeightAt(t, tier);
    const z = hullLongitudinalZ(d, t, 1);
    for (let j = 0; j <= across; j++) {
      const u = -1 + 2 * j / across;
      const camber = 0.075 * (1 - u * u);
      positions.push(u * half, y + camber, z);
    }
  }

  const stride = across + 1;
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  finishGeometry(geometry);
  mesh(roof, geometry, materials.deck, 'sterncastle-tier-roof-' + tier.id);

  for (const side of [-1, 1]) {
    const rail = [];
    for (let i = 0; i <= 48; i++) {
      const t = tier.t0 + (tier.t1 - tier.t0) * i / 48;
      const half = halfWidthAt(d, t, tier.widthScale);
      const y = deckSurfaceY(d, t) + tier.baseOffset + tierHeightAt(t, tier) + 0.31;
      rail.push(V(side * half, y, hullLongitudinalZ(d, t, 1)));
    }
    tube(roof, rail, 0.027, materials.trim,
      'sterncastle-tier-roof-rail-' + tier.id + '-' + side, 52);
  }
}

function addSideWindows(d, ctx, windows, tier) {
  const { box, beam, materials } = ctx;
  const stations = [0.815, 0.852, 0.889, 0.926];

  for (const side of [-1, 1]) {
    for (const [index, t] of stations.entries()) {
      if (t < tier.t0 || t > tier.t1) continue;
      const half = halfWidthAt(d, t, tier.widthScale);
      const wallHeight = tierHeightAt(t, tier);
      const baseY = deckSurfaceY(d, t) + tier.baseOffset;
      const x = side * (half + 0.018);
      const y = baseY + wallHeight * 0.55;
      const z = hullLongitudinalZ(d, t, 1);
      const paneWidth = 0.39;
      const paneHeight = 0.34;

      const pane = box(windows, 0.040, paneHeight, paneWidth,
        materials.glass, 'quarter-gallery-side-window');
      pane.position.set(x, y, z);

      for (const edgeZ of [z - paneWidth * 0.54, z + paneWidth * 0.54]) {
        beam(windows, V(x, y - paneHeight * 0.56, edgeZ),
          V(x, y + paneHeight * 0.56, edgeZ),
          0.018, materials.brass, 'quarter-gallery-window-jamb');
      }
      for (const edgeY of [y - paneHeight * 0.56, y + paneHeight * 0.56]) {
        beam(windows, V(x, edgeY, z - paneWidth * 0.54),
          V(x, edgeY, z + paneWidth * 0.54),
          0.018, materials.brass, 'quarter-gallery-window-moulding');
      }
      beam(windows, V(x, y, z - paneWidth * 0.48),
        V(x, y, z + paneWidth * 0.48),
        0.012, materials.brass, 'quarter-gallery-window-muntin-' + index);
    }
  }
}

function addAftTransomWindows(d, ctx, windows, tier) {
  const { box, beam, materials } = ctx;
  const t = tier.t1 - 0.003;
  const half = halfWidthAt(d, t, tier.widthScale);
  const wallHeight = tierHeightAt(t, tier);
  const baseY = deckSurfaceY(d, t) + tier.baseOffset;
  const y = baseY + wallHeight * 0.55;
  const z = hullLongitudinalZ(d, t, 1) + 0.055;
  const paneWidth = Math.min(0.33, half * 0.23);
  const paneHeight = 0.31;

  for (let i = 0; i < 5; i++) {
    const x = -half * 0.73 + half * 1.46 * i / 4;
    const pane = box(windows, paneWidth, paneHeight, 0.035,
      materials.glass, 'stern-gallery-transom-window');
    pane.position.set(x, y, z);

    for (const side of [-1, 1]) {
      beam(windows, V(x + side * paneWidth * 0.54, y - paneHeight * 0.55, z + 0.025),
        V(x + side * paneWidth * 0.54, y + paneHeight * 0.55, z + 0.025),
        0.016, materials.brass, 'stern-gallery-window-jamb');
    }
    beam(windows, V(x - paneWidth * 0.54, y + paneHeight * 0.55, z + 0.025),
      V(x + paneWidth * 0.54, y + paneHeight * 0.55, z + 0.025),
      0.016, materials.brass, 'stern-gallery-window-head');
    beam(windows, V(x - paneWidth * 0.54, y - paneHeight * 0.55, z + 0.025),
      V(x + paneWidth * 0.54, y - paneHeight * 0.55, z + 0.025),
      0.016, materials.brass, 'stern-gallery-window-sill');
  }
}

function addQuarterGalleries(d, ctx, gallery, tier) {
  const { THREE, beam, tube, mesh, materials } = ctx;

  for (const side of [-1, 1]) {
    const along = 48;
    const positions = [];
    const indices = [];
    const outerRail = [];
    const lowerRail = [];

    for (let i = 0; i <= along; i++) {
      const t = 0.775 + 0.215 * i / along;
      const half = halfWidthAt(d, t, tier.widthScale);
      const baseY = deckSurfaceY(d, t) + tier.baseOffset + 0.075;
      const z = hullLongitudinalZ(d, t, 1);
      const innerX = side * (half - 0.035);
      const outerX = side * (half + 0.46);
      positions.push(innerX, baseY, z, outerX, baseY, z);
      outerRail.push(V(outerX, baseY + 0.46, z));
      lowerRail.push(V(outerX, baseY + 0.19, z));

      if (i % 4 === 0) {
        beam(gallery, V(side * (half + 0.06), baseY - 0.45, z),
          V(outerX, baseY, z), 0.042, materials.trim, 'gallery-cantilever-support');
        beam(gallery, V(outerX, baseY, z), V(outerX, baseY + 0.46, z),
          0.024, materials.trim, 'quarter-gallery-baluster');
      }
    }

    for (let i = 0; i < along; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    finishGeometry(geometry);
    mesh(gallery, geometry, materials.deck, 'quarter-gallery-walkway-surface');
    tube(gallery, outerRail, 0.043, materials.trim, 'quarter-gallery-walkway-edge', 52);
    tube(gallery, lowerRail, 0.021, materials.trim, 'quarter-gallery-lower-rail', 52);
    tube(gallery, outerRail, 0.039, materials.trim, 'quarter-gallery-handrail', 52);
  }
}

function makeStringers(d, ctx, parent, side, tier) {
  const { tube, materials } = ctx;
  for (const fraction of [0.14, 0.88]) {
    const line = [];
    for (let i = 0; i <= 44; i++) {
      const t = tier.t0 + (tier.t1 - tier.t0) * i / 44;
      const half = halfWidthAt(d, t, tier.widthScale);
      const wallHeight = tierHeightAt(t, tier);
      const y = deckSurfaceY(d, t) + tier.baseOffset + wallHeight * fraction;
      line.push(V(side * (half + 0.012), y, hullLongitudinalZ(d, t, 1)));
    }
    tube(parent, line, fraction > 0.5 ? 0.031 : 0.022,
      materials.trim, 'sterncastle-tier-' + tier.id + '-stringer-' + side + '-' + fraction, 48);
  }
}

export function buildStern(d, ctx) {
  const { part, tube, materials } = ctx;
  const shell = part('sternworks');
  const gallery = part('stern-gallery', shell);
  const windows = part('stern-windows', shell);
  const transom = part('stern-transom', shell);
  const roof = part('sterncastle-roof');

  const tiers = [
    { id: 1, t0: 0.690, t1: 0.995, baseOffset: 0.00, heightScale: 0.74, widthScale: 1.00 },
    { id: 2, t0: 0.790, t1: 0.995, baseOffset: 1.58, heightScale: 0.43, widthScale: 0.84 },
    { id: 3, t0: 0.885, t1: 0.995, baseOffset: 2.55, heightScale: 0.34, widthScale: 0.67 }
  ];

  for (const tier of tiers) {
    const group = part('stern-tier-' + tier.id, shell);
    const mid = (tier.t0 + tier.t1) * 0.5;
    group.userData.sternTier = {
      ...tier,
      width: d.beamUnits * profileAt(mid).widthRatio * tier.widthScale,
      depth: (tier.t1 - tier.t0) * d.hullLengthUnits,
      height: tierHeightAt(mid, tier),
      baseY: deckSurfaceY(d, mid) + tier.baseOffset,
      z0: hullLongitudinalZ(d, tier.t0, 1),
      z1: hullLongitudinalZ(d, tier.t1, 1),
      roofFrames: Array.from({ length: 8 }, (_, frameIndex) => {
        const t = tier.t0 + (tier.t1 - tier.t0) * (0.08 + 0.12 * frameIndex);
        return {
          t,
          halfWidth: halfWidthAt(d, t, tier.widthScale),
          baseY: deckSurfaceY(d, t),
          baseOffset: tier.baseOffset,
          wallHeight: tierHeightAt(t, tier),
          z: hullLongitudinalZ(d, t, 1)
        };
      })
    };

    for (const side of [-1, 1]) {
      makeSideWall(d, ctx, group, side, tier);
      makeStringers(d, ctx, group, side, tier);
    }

    const forwardName = tier.id === 1
      ? 'sterncastle-forward-bulkhead'
      : 'sterncastle-tier-' + tier.id + '-forward-bulkhead';
    const aftName = tier.id === 3
      ? 'sterncastle-after-transom-wall'
      : 'sterncastle-tier-' + tier.id + '-aft-wall';
    makeCastleEndWall(d, ctx, group, tier.t0, tier, forwardName, -1);
    makeCastleEndWall(d, ctx, transom, tier.t1, tier, aftName, 1);
    makeTierRoof(d, ctx, roof, tier);
  }

  addSideWindows(d, ctx, windows, tiers[1]);
  addAftTransomWindows(d, ctx, windows, tiers[2]);
  addQuarterGalleries(d, ctx, gallery, tiers[1]);

  const transomCrown = [];
  const upperTier = tiers[2];
  const aftT = upperTier.t1 - 0.002;
  const aftHalf = halfWidthAt(d, aftT, upperTier.widthScale);
  const aftY = deckSurfaceY(d, aftT) + upperTier.baseOffset + tierHeightAt(aftT, upperTier);
  const aftZ = hullLongitudinalZ(d, aftT, 1) + 0.045;
  for (let i = 0; i <= 32; i++) {
    const u = -1 + 2 * i / 32;
    transomCrown.push(V(u * aftHalf, aftY + 0.075 * (1 - u * u), aftZ));
  }
  tube(transom, transomCrown, 0.041, materials.trim, 'sterncastle-upper-transom-crown', 38);

  shell.userData.aftercastleProfile = {
    tierCount: tiers.length,
    arrangement: 'three-stepped-aftercastle-levels-with-projecting-quarter-galleries',
    stationSource: 'WARGALION_STERN_STATIONS'
  };
  roof.userData.roofStages = tiers.map(tier => ({
    id: tier.id, t0: tier.t0, t1: tier.t1,
    widthScale: tier.widthScale, baseOffset: tier.baseOffset
  }));
}
