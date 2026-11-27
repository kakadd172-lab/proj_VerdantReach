import * as THREE from 'three';

export const GeometryHelpers = {
  /**
   * Sweeps a rectangular timber cross-section along a 3D CatmullRomCurve3.
   */
  createCurvedTimber(points, width, height, segments = 24, taperFn = null) {
    const curve = new THREE.CatmullRomCurve3(points);
    const frames = curve.computeFrenetFrames(segments, false);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const worldUp = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPointAt(t);
      const tangent = frames.tangents[i].clone().normalize();
      let side = new THREE.Vector3().crossVectors(worldUp, tangent);
      if (side.lengthSq() < 1e-5) {
        side = new THREE.Vector3(1, 0, 0);
      } else {
        side.normalize();
      }
      const up = new THREE.Vector3().crossVectors(tangent, side).normalize();

      const scale = taperFn ? taperFn(t) : 1.0;
      const w = halfW * scale;
      const h = halfH * scale;

      const corners = [
        p.clone().addScaledVector(side, -w).addScaledVector(up, -h),
        p.clone().addScaledVector(side, w).addScaledVector(up, -h),
        p.clone().addScaledVector(side, w).addScaledVector(up, h),
        p.clone().addScaledVector(side, -w).addScaledVector(up, h),
      ];

      for (let c = 0; c < 4; c++) {
        positions.push(corners[c].x, corners[c].y, corners[c].z);
        const n = corners[c].clone().sub(p).normalize();
        normals.push(n.x, n.y, n.z);
        uvs.push(t * 4, c / 4);
      }
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 4;
      const b = (i + 1) * 4;
      for (let c = 0; c < 4; c++) {
        const next = (c + 1) % 4;
        indices.push(a + c, b + c, b + next);
        indices.push(a + c, b + next, a + next);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  },

  /**
   * Builds a catenary-sagged rope tube between two 3D points.
   */
  createRopeSegment(p1, p2, radius = 0.018, sag = 0.12, segments = 10) {
    const mid = p1.clone().lerp(p2, 0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    return new THREE.TubeGeometry(curve, segments, radius, 5, false);
  },

  /**
   * Builds a tapered cylindrical spar (mast or yardarm) aligned along +Y.
   */
  createTaperedSpar(bottomR, topR, length, radialSegs = 12) {
    const geo = new THREE.CylinderGeometry(topR, bottomR, length, radialSegs, 1);
    geo.translate(0, length * 0.5, 0);
    return geo;
  },
};
