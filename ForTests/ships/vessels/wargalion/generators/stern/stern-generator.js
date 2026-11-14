import {
  createPchipTable, interpolatePchip, deckSurfaceY, halfBreadth,
  hullLongitudinalZ, V
} from '../../architecture/hull-geometry.js';
import { WARGALION_STERN_STATIONS } from '../../architecture/blueprint-data.js';

const sternAxis = WARGALION_STERN_STATIONS.map(item => item.station);
const sternWidthTable = createPchipTable(sternAxis, WARGALION_STERN_STATIONS.map(item => item.widthRatio));
const sternHeightTable = createPchipTable(sternAxis, WARGALION_STERN_STATIONS.map(item => item.wallHeight));

function profileAt(t) {
  return {
    widthRatio: interpolatePchip(sternWidthTable, t),
    wallHeight: interpolatePchip(sternHeightTable, t)
  };
}

function sideHalfWidth(d, t, v = 1) {
  const p = profileAt(t);
  return d.beamUnits * 0.5 * p.widthRatio * (1 - 0.025 * v);
}

function sternStationGeometry(d, t, v, side) {
  const profile = profileAt(t);
  const baseY = deckSurfaceY(d, t);
  const halfWidth = sideHalfWidth(d, t, v);
  const camber = 0.025 * Math.sin(Math.PI * Math.max(0, Math.min(1, v)));
  return V(side * halfWidth, baseY + profile.wallHeight * v + camber,
    hullLongitudinalZ(d, t, 1));
}

function makeSideWall(d, ctx, parent, side, t0, t1, name) {
  const { THREE, mesh, materials } = ctx;
  const along = 36;
  const vertical = 16;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = t0 + (t1 - t0) * i / along;
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
    const y = deckSurfaceY(d, t) + profile.wallHeight * 0.56;
    const half = sideHalfWidth(d, t, 0.56);
    const x = side * (half + 0.010);
    const z = hullLongitudinalZ(d, t, 0.57);
    const paneWidth = 0.38;
    const paneHeight = Math.min(0.48, profile.wallHeight * 0.20);

    const pane = box(windows, 0.035, paneHeight, paneWidth,
      materials.glass, 'quarter-gallery-side-window');
    pane.position.set(x, y, z);

    const z0 = z - paneWidth * 0.5;
    const z1 = z + paneWidth * 0.5;
    const y0 = y - paneHeight * 0.5;
    const y1 = y + paneHeight * 0.5;
    for (const edgeZ of [z0, z1]) {
      beam(windows, V(x, y0, edgeZ), V(x, y1, edgeZ),
        0.016, materials.brass, 'side-window-jamb');
    }
    for (const edgeY of [y0, y1]) {
      beam(windows, V(x, edgeY, z0), V(x, edgeY, z1),
        0.016, materials.brass, 'side-window-moulding');
    }
  }
}

function addAftWindows(d, ctx, windows) {
  const { box, beam, materials } = ctx;
  const t = 0.994;
  const profile = profileAt(t);
  const baseY = deckSurfaceY(d, t);
  const y = baseY + profile.wallHeight * 0.54;
  const half = sideHalfWidth(d, t, 0.54);
  const z = hullLongitudinalZ(d, t, 0.54) + 0.035;
  const count = 5;
  const paneWidth = Math.min(0.30, half * 0.22);
  const paneHeight = Math.min(0.38, profile.wallHeight * 0.18);

  for (let i = 0; i < count; i++) {
    const x = -half * 0.74 + half * 1.48 * i / (count - 1);
    const pane = box(windows, paneWidth, paneHeight, 0.035,
      materials.glass, 'stern-gallery-window');
    pane.position.set(x, y, z);
    for (const side of [-1, 1]) {
      beam(windows, V(x + side * paneWidth * 0.52, y - paneHeight * 0.52, z + 0.025),
        V(x + side * paneWidth * 0.52, y + paneHeight * 0.52, z + 0.025),
        0.016, materials.brass, 'stern-window-jamb');
    }
    beam(windows, V(x - paneWidth * 0.52, y + paneHeight * 0.52, z + 0.025),
      V(x + paneWidth * 0.52, y + paneHeight * 0.52, z + 0.025),
      0.016, materials.brass, 'stern-window-head');
    beam(windows, V(x - paneWidth * 0.52, y - paneHeight * 0.52, z + 0.025),
      V(x + paneWidth * 0.52, y - paneHeight * 0.52, z + 0.025),
      0.016, materials.brass, 'stern-window-sill');
  }
}

function makeCastleEndWall(d, ctx, parent, t, name, outwardSign) {
  const { THREE, mesh, materials } = ctx;
  const profile = profileAt(t);
  const across = 32, vertical = 18;
  const positions = [];
  const indices = [];

  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    const half = sideHalfWidth(d, t, v);
    const baseY = deckSurfaceY(d, t);
    for (let col = 0; col <= across; col++) {
      const u = -1 + 2 * col / across;
      const crown = 0.075 * (1 - u * u);
      positions.push(
        u * half,
        baseY + profile.wallHeight * v + crown * v,
        hullLongitudinalZ(d, t, v) + outwardSign * 0.025
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
  const along = 56, across = 28;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= along; i++) {
    const t = 0.690 + 0.310 * i / along;
    const profile = profileAt(t);
    const baseY = deckSurfaceY(d, t) + profile.wallHeight;
    const half = sideHalfWidth(d, t, 1);
    const z = hullLongitudinalZ(d, t, 1);
    for (let j = 0; j <= across; j++) {
      const u = -1 + 2 * j / across;
      const camber = 0.055 * (1 - u * u);
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
    for (let i = 0; i <= 56; i++) {
      const t = 0.690 + 0.310 * i / 56;
      const profile = profileAt(t);
      const half = sideHalfWidth(d, t, 1);
      const z = hullLongitudinalZ(d, t, 1);
      const y = deckSurfaceY(d, t) + profile.wallHeight + 0.36;
      rail.push(V(side * half, y, z));
    }
    ctx.tube(roof, rail, 0.030, materials.trim,
      side < 0 ? 'sterncastle-roof-rail-port' : 'sterncastle-roof-rail-starboard', 60);
  }
  return roof;
}

function addQuarterGalleries(d, ctx, gallery) {
  const { THREE, beam, tube, mesh, materials } = ctx;
  for (const side of [-1, 1]) {
    const along = 44;
    const positions = [];
    const indices = [];
    const inner = [];
    const outer = [];
    const handrail = [];

    for (let i = 0; i <= along; i++) {
      const t = 0.735 + 0.245 * i / along;
      const profile = profileAt(t);
      const baseY = deckSurfaceY(d, t) + profile.wallHeight * 0.32;
      const z = hullLongitudinalZ(d, t, 0.32);
      const innerX = side * sideHalfWidth(d, t, 0.32);
      const outerX = side * (sideHalfWidth(d, t, 0.32) + 0.24);
      inner.push(V(innerX, baseY, z));
      outer.push(V(outerX, baseY, z));
      handrail.push(V(outerX, baseY + 0.38, z));
      positions.push(innerX, baseY, z, outerX, baseY, z);
      if (i % 4 === 0) {
        beam(gallery, V(outerX, baseY, z), V(outerX, baseY + 0.38, z),
          0.022, materials.trim, 'quarter-gallery-baluster');
      }
    }

    for (let i = 0; i < along; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const deckGeometry = new THREE.BufferGeometry();
    deckGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    deckGeometry.setIndex(indices);
    deckGeometry.computeVertexNormals();
    deckGeometry.computeBoundingBox();
    deckGeometry.computeBoundingSphere();
    mesh(gallery, deckGeometry, materials.deck, 'quarter-gallery-walkway-surface');
    tube(gallery, outer, 0.043, materials.trim, 'quarter-gallery-walkway-edge', 48);
    tube(gallery, handrail, 0.038, materials.trim, 'quarter-gallery-handrail', 48);
  }
}

export function buildStern(d, ctx) {
  const { part, tube, materials } = ctx;
  const shell = part('sternworks');
  const gallery = part('stern-gallery', shell);
  const windows = part('stern-windows', shell);
  const transom = part('stern-transom', shell);

  // Three editor components share station boundaries but form one fair
  // aftercastle side profile: lower counter, quarter-gallery tier and poop.
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
      z0: hullLongitudinalZ(d, t0, 1),
      z1: hullLongitudinalZ(d, t1, 1),
      roofFrames: Array.from({ length: 6 }, (_, frameIndex) => {
        const t = t0 + (t1 - t0) * (0.10 + 0.16 * frameIndex);
        const section = profileAt(t);
        return {
          t,
          halfWidth: sideHalfWidth(d, t, 1),
          baseY: deckSurfaceY(d, t),
          wallHeight: section.wallHeight,
          z: hullLongitudinalZ(d, t, 1)
        };
      })
    };

    for (const side of [-1, 1]) {
      makeSideWall(d, ctx, group, side, t0, t1, 'sterncastle-tier-' + (index + 1));
    }
  });

  const aft = profileAt(0.999);
  const transomLine = [];
  for (let i = 0; i <= 32; i++) {
    const u = -1 + 2 * i / 32;
    transomLine.push(V(
      u * sideHalfWidth(d, 0.999, 1),
      deckSurfaceY(d, 0.999) + aft.wallHeight + 0.075 * (1 - u * u),
      hullLongitudinalZ(d, 0.999, 1) + 0.025
    ));
  }
  tube(transom, transomLine, 0.045, materials.trim, 'stern-transom-crown', 38);

  makeCastleEndWall(d, ctx, transom, 0.690, 'sterncastle-forward-bulkhead', -1);
  makeCastleEndWall(d, ctx, transom, 1.000, 'sterncastle-after-transom-wall', 1);
  makeCastleRoof(d, ctx, shell);

  addSideWindows(d, ctx, windows, -1, [0.755, 0.825, 0.895, 0.945]);
  addSideWindows(d, ctx, windows, 1, [0.755, 0.825, 0.895, 0.945]);
  addAftWindows(d, ctx, windows);
  addQuarterGalleries(d, ctx, gallery);

  for (const side of [-1, 1]) {
    const upper = [];
    const lower = [];
    for (let i = 0; i <= 48; i++) {
      const t = 0.705 + 0.285 * i / 48;
      const profile = profileAt(t);
      const x = side * (sideHalfWidth(d, t, 0.18) + 0.025);
      const z = hullLongitudinalZ(d, t, 0.18);
      const y = deckSurfaceY(d, t) + profile.wallHeight * 0.18;
      lower.push(V(x, y, z));
      upper.push(V(x, y + profile.wallHeight * 0.12, z));
    }
    tube(shell, lower, 0.026, materials.trim, 'sterncastle-lower-stringer', 52);
    tube(shell, upper, 0.023, materials.trim, 'sterncastle-upper-stringer', 52);
  }

  const sill = [];
  const sternHalf = halfBreadth(d, 0.995) * 0.94;
  const sternY = deckSurfaceY(d, 0.995) + 0.045;
  const sternZ = hullLongitudinalZ(d, 0.995, 1);
  for (let i = 0; i <= 28; i++) {
    const u = -1 + 2 * i / 28;
    sill.push(V(u * sternHalf, sternY, sternZ));
  }
  tube(transom, sill, 0.040, materials.trim, 'stern-transom-moulding', 34);
}
