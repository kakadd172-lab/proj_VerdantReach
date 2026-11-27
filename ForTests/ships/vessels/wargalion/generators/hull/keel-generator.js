import { keelY, hullLongitudinalZ, V } from '../../architecture/hull-geometry.js';

export function buildKeel(d, ctx) {
  const { THREE, part, mesh, materials } = ctx;
  const group = part('keel');
  const stations = 112;
  const ringSize = 4;
  const positions = [];
  const indices = [];
  const path = [];

  for (let i = 0; i <= stations; i++) {
    const t = 0.008 + 0.984 * i / stations;
    path.push(V(0, keelY(d, t) - d.keelDetails.pointOffset,
      hullLongitudinalZ(d, t, 0)));
  }

  const baseWidth = Math.max(d.keelDetails.minimumRadius * 1.6,
    d.beamUnits * d.keelDetails.radiusFactor * 1.7);
  const baseDepth = Math.max(d.keelDetails.minimumRadius * 1.5,
    d.beamUnits * d.keelDetails.radiusFactor * 1.45);

  for (let i = 0; i <= stations; i++) {
    const before = path[Math.max(0, i - 1)];
    const after = path[Math.min(stations, i + 1)];
    const tangent = after.clone().sub(before).normalize();
    const side = V(1, 0, 0);
    const up = tangent.clone().cross(side).normalize();
    const t = i / stations;
    const taper = 0.38 + 0.62 * Math.pow(Math.sin(Math.PI * t), 0.38);
    const halfWidth = baseWidth * taper * 0.5;
    const halfDepth = baseDepth * taper * 0.5;
    const centre = path[i];

    const corners = [
      [-1, -1], [1, -1], [1, 1], [-1, 1]
    ];
    for (const [sx, sy] of corners) {
      const point = centre.clone()
        .addScaledVector(side, sx * halfWidth)
        .addScaledVector(up, sy * halfDepth);
      positions.push(point.x, point.y, point.z);
    }
  }

  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < ringSize; j++) {
      const a = i * ringSize + j;
      const b = i * ringSize + (j + 1) % ringSize;
      const c = (i + 1) * ringSize + j;
      const e = (i + 1) * ringSize + (j + 1) % ringSize;
      indices.push(a, b, c, b, e, c);
    }
  }

  const startCentre = positions.length / 3;
  positions.push(path[0].x, path[0].y, path[0].z);
  const endCentre = positions.length / 3;
  positions.push(path[stations].x, path[stations].y, path[stations].z);
  for (let j = 0; j < ringSize; j++) {
    indices.push(startCentre, (j + 1) % ringSize, j);
    const offset = stations * ringSize;
    indices.push(endCentre, offset + j, offset + (j + 1) % ringSize);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh(group, geometry, materials.lower, 'tapered-keel-timber');
  group.userData.keelSweep = { stations, section: 'bevelled-rectangular', baseWidth, baseDepth };
}
