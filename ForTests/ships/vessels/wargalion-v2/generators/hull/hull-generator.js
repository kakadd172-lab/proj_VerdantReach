import { hullPoint } from '../../architecture/hull-surface.js';
import { WARGALION_V2_HULL_STATIONS } from '../../architecture/blueprint-data.js';

function makeSideSkin(d, ctx, parent, side) {
  const { THREE, mesh, materials } = ctx;
  const longitudinal = 144;
  const vertical = 40;
  const positions = [];
  const indices = [];

  for (let row = 0; row <= longitudinal; row++) {
    const t = row / longitudinal;
    for (let col = 0; col <= vertical; col++) {
      const v = col / vertical;
      const p = hullPoint(d, t, v, side);
      positions.push(p.x, p.y, p.z);
    }
  }

  const stride = vertical + 1;
  for (let row = 0; row < longitudinal; row++) {
    for (let col = 0; col < vertical; col++) {
      const a = row * stride + col;
      const b = a + stride;
      const c = a + 1;
      const e = b + 1;
      if (side > 0) indices.push(a, c, b, c, e, b);
      else indices.push(a, b, c, c, b, e);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const surface = mesh(parent, geometry, materials.hull,
    side > 0 ? 'wargalion-v2-starboard-hull-surface' : 'wargalion-v2-port-hull-surface');
  surface.userData.surfaceAuthority = 'architecture/hull-surface.js';
  surface.userData.stationSourceCount = WARGALION_V2_HULL_STATIONS.length;
}

export function buildHull(d, ctx) {
  const hull = ctx.part('hull');
  const port = ctx.part('hull-skin-port', hull);
  const starboard = ctx.part('hull-skin-starboard', hull);
  makeSideSkin(d, ctx, port, -1);
  makeSideSkin(d, ctx, starboard, 1);
  hull.userData.surfaceAuthority = 'architecture/hull-surface.js';
  hull.userData.linesPlanFamilies = ['stations', 'waterlines', 'buttocks'];
  hull.userData.offsetState = 'reconstruction-estimates-not-calibrated';
}
