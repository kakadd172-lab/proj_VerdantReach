import { hullPoint, hullLongitudinalZ, keelY, deckSurfaceY, halfBreadth, sectionBreadthRatio, V } from '../../architecture/hull-geometry.js';

function finishGeometry(geometry) {
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function buildSideSurface(d, ctx, hullRoot, side, stations = 144, sections = 56) {
  const { THREE, part, mesh, materials } = ctx;
  const group = part(side < 0 ? 'hull-skin-port' : 'hull-skin-starboard', hullRoot);
  const positions = [];
  const indices = [];

  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    for (let j = 0; j <= sections; j++) {
      const point = hullPoint(d, t, j / sections, side);
      positions.push(point.x, point.y, point.z);
    }
  }

  const stride = sections + 1;
  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < sections; j++) {
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
  mesh(group, geometry, materials.hull,
    side < 0 ? 'wargalion-faired-port-hull-surface' : 'wargalion-faired-starboard-hull-surface');
}

function buildEndClosure(d, ctx, hullRoot, station, name, outwardSign) {
  const { THREE, mesh, materials } = ctx;
  const vertical = 56;
  const breadth = 40;
  const positions = [];
  const indices = [];

  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    const sectionY = hullPoint(d, station, v, 1);
    const half = halfBreadth(d, station) * sectionBreadthRatio(d, station, v);
    for (let col = 0; col <= breadth; col++) {
      const u = -1 + 2 * col / breadth;
      positions.push(u * half, sectionY.y, hullLongitudinalZ(d, station, v));
    }
  }

  const stride = breadth + 1;
  for (let row = 0; row < vertical; row++) {
    for (let col = 0; col < breadth; col++) {
      const a = row * stride + col;
      const b = a + stride;
      if (outwardSign > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  finishGeometry(geometry);
  mesh(hullRoot, geometry, materials.hull, name);
}

export function buildHull(d, ctx) {
  const root = ctx.part('hull');
  buildSideSurface(d, ctx, root, -1);
  buildSideSurface(d, ctx, root, 1);

  // The forefoot and stern closure use the exact same raked station mapping
  // as the side skins; this avoids the old square, floating end caps.
  buildEndClosure(d, ctx, root, 0.000, 'wargalion-bow-hull-closure', -1);
  buildEndClosure(d, ctx, root, 1.000, 'wargalion-stern-transom-shell', 1);

  const { tube, materials } = ctx;
  const keelson = [];
  for (let i = 0; i <= 128; i++) {
    const t = 0.004 + 0.992 * i / 128;
    keelson.push(V(0, keelY(d, t) - 0.025, hullLongitudinalZ(d, t, 0)));
  }
  tube(root, keelson, Math.max(0.045, d.beamUnits * 0.0045),
    materials.lower, 'inner-keelson-reference', 144);
}
