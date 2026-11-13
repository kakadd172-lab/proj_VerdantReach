export function buildCanvasSail(ctx, name, mastId, corners, fullness = 0.09, parent = ctx.root, axis = 'z') {
  const { part, mesh, materials, THREE, V, tube } = ctx;
  const control = part(name, parent);
  control.userData.sailControl = { mastId, clothPart: 'cloth-' + name };
  const cloth = part('cloth-' + name, control);
  const points = corners.map(point => point?.isVector3 ? point.clone() : V(...point));
  const span = (points[0].distanceTo(points[3]) + points[1].distanceTo(points[2])) * 0.5;
  const height = (points[0].distanceTo(points[1]) + points[3].distanceTo(points[2])) * 0.5;
  const rows = 18, columns = 24, positions = [], indices = [];
  const reference = Math.max(0.35, span, height * 0.52);
  const camber = reference * THREE.MathUtils.clamp(fullness, 0.035, 0.15);
  const chordPower = 1.22, verticalPower = 0.88, twistFactor = 0.018;

  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      const lower = points[0].clone().lerp(points[3], u);
      const upper = points[1].clone().lerp(points[2], u);
      const p = lower.lerp(upper, v);
      const chord = Math.pow(Math.max(0, Math.sin(Math.PI * u)), chordPower);
      const vertical = Math.pow(Math.max(0, Math.sin(Math.PI * v)), verticalPower);
      const belly = camber * chord * vertical * (1 + 0.10 * (1 - 2 * u));
      const twist = reference * twistFactor * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * (v - 0.5);
      if (axis === 'x') { p.x += belly; p.z += twist; }
      else { p.z += belly; p.x += twist; }
      positions.push(p.x, p.y, p.z);
    }
  }

  const stride = columns + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * stride + col;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const canvas = mesh(cloth, geometry, materials.sail, 'sail-shaped-cloth');
  canvas.userData.sailCloth = { rows, columns, axis };

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
    for (let step = 0; step <= 24; step++) line.push(pointAt(step / 24, seam / 4));
    tube(seams, line, 0.006, materials.sailShade, 'sail-reef-seam-' + seam, 28);
  }
  for (let seam = 1; seam <= 2; seam++) {
    const line = [];
    for (let step = 0; step <= 24; step++) line.push(pointAt(seam / 3, step / 24));
    tube(seams, line, 0.006, materials.sailShade, 'sail-panel-seam-' + seam, 28);
  }
  return control;
}
