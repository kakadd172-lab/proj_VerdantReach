export function buildCanvasSail(ctx, name, mastId, corners, fullness = 0.09, parent = ctx.root, axis = 'z') {
  const { part, mesh, materials, THREE, V, tube } = ctx;
  const control = part(name, parent);
  control.userData.sailControl = { mastId, clothPart: 'cloth-' + name };
  const cloth = part('cloth-' + name, control);
  const points = corners.map(point => point?.isVector3 ? point.clone() : V(...point));
  if (points.length !== 4) throw new TypeError('A sail surface requires four boundary control corners.');

  const collapsedFoot = points[0].distanceTo(points[3]) < 1e-6;
  const span = (points[0].distanceTo(points[3]) + points[1].distanceTo(points[2])) * 0.5;
  const height = (points[0].distanceTo(points[1]) + points[3].distanceTo(points[2])) * 0.5;
  const rows = 20, columns = 28, positions = [], indices = [];
  const reference = Math.max(0.35, span, height * 0.52);
  const camber = reference * THREE.MathUtils.clamp(fullness, 0.045, 0.145);
  const chordPower = 1.12, verticalPower = 0.92, twistFactor = 0.022;

  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      const lower = points[0].clone().lerp(points[3], u);
      const upper = points[1].clone().lerp(points[2], u);
      const p = lower.lerp(upper, v);
      const chordProfile = Math.pow(Math.max(0, Math.sin(Math.PI * u)), chordPower);
      const spanProfile = Math.pow(Math.max(0, Math.sin(Math.PI * v)), verticalPower);
      const belly = camber * chordProfile * spanProfile * (1 + 0.08 * (1 - 2 * u));
      const twist = reference * twistFactor * Math.sin(Math.PI * u)
        * Math.sin(Math.PI * v) * (v - 0.5);
      if (axis === 'x') { p.x += belly; p.z += twist; }
      else { p.z += belly; p.x += twist; }
      positions.push(p.x, p.y, p.z);
    }
  }

  const stride = columns + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * stride + col;
      const b = a + stride;
      if (collapsedFoot && row === 0) {
        // The first grid row is a single tack point on a triangular sail.
        // Retain one non-degenerate triangle per column instead of a zero-area pair.
        indices.push(a, b + 1, b);
      } else {
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const canvas = mesh(cloth, geometry, materials.sail, 'sail-shaped-cloth');
  canvas.userData.sailCloth = {
    rows, columns, axis,
    topology: collapsedFoot ? 'triangular-with-collapsed-foot' : 'quadrilateral',
    supportEdge: 'luff',
    fullness
  };

  const seams = part('panel-seams-' + name, control);
  const pointAt = (u, v) => {
    const x = THREE.MathUtils.clamp(u, 0, 1) * columns;
    const y = THREE.MathUtils.clamp(v, 0, 1) * rows;
    const x0 = Math.floor(x), x1 = Math.min(columns, x0 + 1);
    const y0 = Math.floor(y), y1 = Math.min(rows, y0 + 1);
    const fx = x - x0, fy = y - y0;
    const read = (cx, cy) => {
      const offset = (cy * stride + cx) * 3;
      return new THREE.Vector3(positions[offset], positions[offset + 1], positions[offset + 2]);
    };
    return read(x0, y0).lerp(read(x1, y0), fx).lerp(
      read(x0, y1).lerp(read(x1, y1), fx), fy
    );
  };

  for (let seam = 1; seam <= 3; seam++) {
    const line = [];
    for (let step = 0; step <= 28; step++) line.push(pointAt(step / 28, seam / 4));
    tube(seams, line, 0.0045, materials.sailShade, 'sail-reef-seam-' + seam, 32);
  }
  for (let seam = 1; seam <= 2; seam++) {
    const line = [];
    for (let step = 0; step <= 28; step++) line.push(pointAt(seam / 3, step / 28));
    tube(seams, line, 0.0045, materials.sailShade, 'sail-panel-seam-' + seam, 32);
  }
  return control;
}
