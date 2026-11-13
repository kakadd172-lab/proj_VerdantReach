import { deckSurfaceY, halfBreadth, V } from '../../architecture/hull-geometry.js';

/**
 * The aftercastle is a continuous tapered structure, divided into editable
 * longitudinal sections only at fair, shared frame stations. It is not a stack
 * of independent rectangular cabins.
 *
 * Each entry is [station, full-width / beam, wall-height].
 * The rising deck profile is supplied by the hull/deck station geometry.
 */
const STERN_WALL_PROFILE = Object.freeze([
  [0.690, 0.64, 2.45],
  [0.735, 0.65, 2.70],
  [0.780, 0.62, 2.72],
  [0.820, 0.58, 2.78],
  [0.855, 0.53, 2.82],
  [0.890, 0.48, 3.05],
  [0.925, 0.42, 3.20],
  [0.955, 0.36, 2.88],
  [0.980, 0.30, 2.15],
  [1.000, 0.25, 1.20]
]);

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = (a, b, value) => {
  const u = clamp((value - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a, b, u) => a + (b - a) * u;

function profileAt(t) {
  let index = 1;
  while (index < STERN_WALL_PROFILE.length - 1 && t > STERN_WALL_PROFILE[index][0]) index += 1;
  const a = STERN_WALL_PROFILE[index - 1];
  const b = STERN_WALL_PROFILE[index];
  const u = smoothstep(a[0], b[0], t);
  return {
    widthRatio: lerp(a[1], b[1], u),
    wallHeight: lerp(a[2], b[2], u)
  };
}

function sternStationGeometry(d, t, v, side) {
  const profile = profileAt(t);
  const baseY = deckSurfaceY(d, t);
  const z = (t - 0.5) * d.hullLengthUnits;
  // Very slight upper narrowing produces a moulded side, not a vertical box.
  const halfWidth = d.beamUnits * 0.5 * profile.widthRatio * (1 - 0.035 * v);
  const camber = 0.035 * Math.sin(Math.PI * clamp(v));
  return V(side * halfWidth, baseY + profile.wallHeight * v + camber, z);
}

function makeSideWall(d, ctx, parent, side, t0, t1, name) {
  const { THREE, mesh, materials } = ctx;
  const along = 30;
  const vertical = 12;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = lerp(t0, t1, i / along);
    for (let j = 0; j <= vertical; j++) {
      const p = sternStationGeometry(d, t, j / vertical, side);
      positions.push(p.x, p.y, p.z);
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
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh(parent, geometry, materials.hull,
    side < 0 ? name + '-port-continuous-wall' : name + '-starboard-continuous-wall');
}

function addSideWindows(d, ctx, windows, side, stations) {
  const { box, beam, materials } = ctx;
  for (const t of stations) {
    const profile = profileAt(t);
    const baseY = deckSurfaceY(d, t);
    const x = side * (d.beamUnits * 0.5 * profile.widthRatio + 0.045);
    const y = baseY + profile.wallHeight * 0.57;
    const z = (t - 0.5) * d.hullLengthUnits;
    const paneWidth = 0.46;
    const paneHeight = Math.min(0.58, profile.wallHeight * 0.23);

    const pane = box(windows, 0.065, paneHeight, paneWidth,
      materials.glass, 'quarter-gallery-side-window');
    pane.position.set(x, y, z);

    const z0 = z - paneWidth * 0.5;
    const z1 = z + paneWidth * 0.5;
    const y0 = y - paneHeight * 0.5;
    const y1 = y + paneHeight * 0.5;
    for (const edgeZ of [z0, z1]) {
      beam(windows, V(x, y0, edgeZ), V(x, y1, edgeZ),
        0.024, materials.brass, 'side-window-jamb');
    }
    for (const edgeY of [y0, y1]) {
      beam(windows, V(x, edgeY, z0), V(x, edgeY, z1),
        0.024, materials.brass, 'side-window-moulding');
    }
  }
}

function addAftWindows(d, ctx, windows) {
  const { box, beam, materials } = ctx;
  const t = 0.994;
  const profile = profileAt(t);
  const z = d.hullLengthUnits * 0.5 + 0.045;
  const yBase = deckSurfaceY(d, t);
  const halfWidth = d.beamUnits * 0.5 * profile.widthRatio;
  const y = yBase + profile.wallHeight * 0.54;
  const count = 5;
  const spacing = halfWidth * 1.52 / (count - 1);

  for (let i = 0; i < count; i++) {
    const x = -halfWidth * 0.76 + spacing * i;
    const pane = box(windows, 0.34, 0.48, 0.065,
      materials.glass, 'stern-gallery-window');
    pane.position.set(x, y, z);
    for (const side of [-1, 1]) {
      beam(windows, V(x + side * 0.19, y - 0.26, z + 0.04),
        V(x + side * 0.19, y + 0.26, z + 0.04),
        0.024, materials.brass, 'stern-window-jamb');
    }
    beam(windows, V(x - 0.19, y + 0.26, z + 0.04),
      V(x + 0.19, y + 0.26, z + 0.04),
      0.024, materials.brass, 'stern-window-head');
    beam(windows, V(x - 0.19, y - 0.26, z + 0.04),
      V(x + 0.19, y - 0.26, z + 0.04),
      0.024, materials.brass, 'stern-window-sill');
  }
}

function makeCastleEndWall(d, ctx, parent, t, name, outwardSign) {
  const { THREE, mesh, materials } = ctx;
  const profile = profileAt(t);
  const baseY = deckSurfaceY(d, t);
  const half = d.beamUnits * 0.5 * profile.widthRatio;
  const z = (t - 0.5) * d.hullLengthUnits + outwardSign * 0.035;
  const across = 28, vertical = 16;
  const positions = [];
  const indices = [];

  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    for (let col = 0; col <= across; col++) {
      const u = -1 + 2 * col / across;
      const crown = 0.10 * (1 - u * u);
      positions.push(
        u * half,
        baseY + profile.wallHeight * v + crown * v,
        z
      );
    }
  }

  const stride = across + 1;
  for (let row = 0; row < vertical; row++) {
    for (let col = 0; col < across; col++) {
      const a = row * stride + col;
      const b = a + stride;
      if (outwardSign > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh(parent, geometry, materials.hull, name);
}

function makeCastleRoof(d, ctx, parent) {
  const { THREE, part, mesh, materials } = ctx;
  const roof = part('sterncastle-roof', parent);
  const along = 48, across = 24;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = 0.690 + 0.310 * i / along;
    const profile = profileAt(t);
    const baseY = deckSurfaceY(d, t) + profile.wallHeight;
    const half = d.beamUnits * 0.5 * profile.widthRatio;
    const z = (t - 0.5) * d.hullLengthUnits;
    for (let j = 0; j <= across; j++) {
      const u = -1 + 2 * j / across;
      const camber = 0.075 * (1 - u * u);
      positions.push(u * half, baseY + camber, z);
    }
  }

  const stride = across + 1;
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * stride + j;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh(roof, geometry, materials.deck, 'continuous-sterncastle-roof-deck');

  for (const side of [-1, 1]) {
    const rail = [];
    for (let i = 0; i <= 48; i++) {
      const t = 0.690 + 0.310 * i / 48;
      const profile = profileAt(t);
      const half = d.beamUnits * 0.5 * profile.widthRatio;
      const z = (t - 0.5) * d.hullLengthUnits;
      const y = deckSurfaceY(d, t) + profile.wallHeight + 0.48;
      rail.push(V(side * half, y, z));
    }
    ctx.tube(roof, rail, 0.036, materials.trim,
      side < 0 ? 'sterncastle-roof-rail-port' : 'sterncastle-roof-rail-starboard', 52);
  }
  return roof;
}

function addQuarterGalleries(d, ctx, gallery) {
  const { beam, tube, materials } = ctx;
  for (const side of [-1, 1]) {
    const deckEdge = [];
    const handrail = [];
    const span = 42;
    for (let i = 0; i <= span; i++) {
      const t = 0.735 + 0.245 * i / span;
      const profile = profileAt(t);
      const baseY = deckSurfaceY(d, t);
      const z = (t - 0.5) * d.hullLengthUnits;
      const half = d.beamUnits * 0.5 * profile.widthRatio;
      const x = side * (half + 0.32);
      // Balconies follow the curvature of the stern and rise with the decks.
      const y = baseY + profile.wallHeight * 0.32;
      deckEdge.push(V(x, y, z));
      handrail.push(V(x, y + 0.46, z));
      if (i % 4 === 0) {
        beam(gallery, V(x, y, z), V(x, y + 0.46, z),
          0.026, materials.trim, 'quarter-gallery-baluster');
      }
    }
    tube(gallery, deckEdge, 0.055, materials.trim, 'quarter-gallery-walkway-edge', 48);
    tube(gallery, handrail, 0.043, materials.trim, 'quarter-gallery-handrail', 48);
  }
}

export function buildStern(d, ctx) {
  const { THREE, part, mesh, beam, tube, materials } = ctx;
  const shell = part('sternworks');
  const gallery = part('stern-gallery', shell);
  const windows = part('stern-windows', shell);
  const transom = part('stern-transom', shell);

  // These contiguous longitudinal sections share end stations and fair into
  // one uninterrupted stern profile. Their separate groups remain editable.
  const intervals = [
    [0.690, 0.820],
    [0.820, 0.910],
    [0.910, 1.000]
  ];

  intervals.forEach(([t0, t1], index) => {
    const group = part('stern-tier-' + (index + 1), shell);
    const mid = (t0 + t1) * 0.5;
    const p = profileAt(mid);
    group.userData.sternTier = {
      t0, t1,
      width: d.beamUnits * p.widthRatio,
      depth: (t1 - t0) * d.hullLengthUnits,
      height: p.wallHeight,
      baseY: deckSurfaceY(d, mid),
      z0: (t0 - 0.5) * d.hullLengthUnits,
      z1: (t1 - 0.5) * d.hullLengthUnits,
      roofFrames: Array.from({ length: 6 }, (_, frameIndex) => {
        const t = t0 + (t1 - t0) * (0.10 + 0.16 * frameIndex);
        const section = profileAt(t);
        return {
          t,
          halfWidth: d.beamUnits * 0.5 * section.widthRatio,
          baseY: deckSurfaceY(d, t),
          wallHeight: section.wallHeight,
          z: (t - 0.5) * d.hullLengthUnits
        };
      })
    };

    for (const side of [-1, 1]) {
      makeSideWall(d, ctx, group, side, t0, t1, 'sterncastle-tier-' + (index + 1));
    }
  });

  // A continuous crowned transom crown closes the aftercastle silhouette.
  const transomLine = [];
  const end = profileAt(0.999);
  const half = d.beamUnits * 0.5 * end.widthRatio;
  const baseY = deckSurfaceY(d, 0.999);
  for (let i = 0; i <= 28; i++) {
    const u = -1 + 2 * i / 28;
    transomLine.push(V(
      u * half,
      baseY + end.wallHeight + 0.10 * (1 - u * u),
      d.hullLengthUnits * 0.499
    ));
  }
  tube(transom, transomLine, 0.060, materials.trim, 'stern-transom-crown', 34);

  makeCastleEndWall(d, ctx, transom, 0.690, 'sterncastle-forward-bulkhead', -1);
  makeCastleEndWall(d, ctx, transom, 0.999, 'sterncastle-after-transom-wall', 1);
  makeCastleRoof(d, ctx, shell);

  addSideWindows(d, ctx, windows, -1, [0.755, 0.785, 0.845, 0.875, 0.925, 0.955]);
  addSideWindows(d, ctx, windows, 1, [0.755, 0.785, 0.845, 0.875, 0.925, 0.955]);
  addAftWindows(d, ctx, windows);
  addQuarterGalleries(d, ctx, gallery);

  // Two long stringers visually bind the side wall sections and their decks.
  for (const side of [-1, 1]) {
    const upper = [];
    const lower = [];
    for (let i = 0; i <= 42; i++) {
      const t = 0.705 + 0.285 * i / 42;
      const profile = profileAt(t);
      const x = side * (d.beamUnits * 0.5 * profile.widthRatio + 0.035);
      const z = (t - 0.5) * d.hullLengthUnits;
      const y = deckSurfaceY(d, t) + profile.wallHeight * 0.18;
      lower.push(V(x, y, z));
      upper.push(V(x, y + profile.wallHeight * 0.12, z));
    }
    tube(shell, lower, 0.035, materials.trim, 'sterncastle-lower-stringer', 46);
    tube(shell, upper, 0.032, materials.trim, 'sterncastle-upper-stringer', 46);
  }

  // A light transom sill follows the breadth of the final hull station.
  const sill = [];
  const sternHalf = halfBreadth(d, 0.995) * 0.94;
  const sternY = deckSurfaceY(d, 0.995) + 0.08;
  for (let i = 0; i <= 24; i++) {
    const u = -1 + 2 * i / 24;
    sill.push(V(u * sternHalf, sternY, d.hullLengthUnits * 0.499));
  }
  tube(transom, sill, 0.060, materials.trim, 'stern-transom-moulding', 30);
}
