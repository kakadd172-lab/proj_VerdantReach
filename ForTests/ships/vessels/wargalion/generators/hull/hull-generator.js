import { hullPoint, keelY, deckY, halfBreadth, sectionBreadthRatio, V } from '../../architecture/hull-geometry.js';

function finishGeometry(geometry) {
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function buildSideSurface(d, ctx, hullRoot, side, stations = 128, sections = 48) {
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
      if (side > 0) {
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      } else {
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
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
  const vertical = 48;
  const breadth = 36;
  const positions = [];
  const indices = [];

  for (let row = 0; row <= vertical; row++) {
    const v = row / vertical;
    const bottom = keelY(d, station);
    const top = deckY(d, station);
    const y = bottom + (top - bottom) * v;
    const half = halfBreadth(d, station) * sectionBreadthRatio(d, station, v);
    for (let col = 0; col <= breadth; col++) {
      const u = -1 + 2 * col / breadth;
      positions.push(u * half, y, (station - 0.5) * d.hullLengthUnits);
    }
  }

  const stride = breadth + 1;
  for (let row = 0; row < vertical; row++) {
    for (let col = 0; col < breadth; col++) {
      const a = row * stride + col;
      const b = a + stride;
      if (outwardSign > 0) {
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      } else {
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
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

  // Close the forefoot and broad afterbody with actual surfaces.
  buildEndClosure(d, ctx, root, 0.000, 'wargalion-bow-hull-closure', -1);
  buildEndClosure(d, ctx, root, 1.000, 'wargalion-stern-transom-shell', 1);

  // The keelson reference sits inside the faired skin and follows the keel run.
  const { tube, materials } = ctx;
  const keelLine = [];
  for (let i = 0; i <= 96; i++) {
    const t = 0.004 + 0.992 * i / 96;
    keelLine.push(V(0, keelY(d, t) - 0.025, (t - 0.5) * d.hullLengthUnits));
  }
  tube(root, keelLine, Math.max(0.055, d.beamUnits * 0.006),
    materials.lower, 'inner-keelson-reference', 112);
}
