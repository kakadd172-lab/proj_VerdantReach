export function buildCanvasSail(ctx, name, mastId, corners, fullness = 0.085, parent = ctx.root, axis = 'z') {
  const { part, mesh, materials, THREE, V, tube } = ctx;
  const control = part(name, parent);
  control.userData.sailControl = { mastId, clothPart: 'cloth-' + name };
  const cloth = part('cloth-' + name, control);
  const points = corners.map(p => p?.isVector3 ? p.clone() : V(...p));
  const rows = 16, columns = 22, positions = [], indices = [];
  const span = (points[0].distanceTo(points[3]) + points[1].distanceTo(points[2])) * 0.5;
  const camber = Math.max(0.3, span) * fullness;

  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      const low = points[0].clone().lerp(points[3], u);
      const high = points[1].clone().lerp(points[2], u);
      const p = low.lerp(high, v);
      const belly = camber * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      if (axis === 'x') p.x += belly;
      else p.z += belly;
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
  mesh(cloth, geometry, materials.sail, 'sail-shaped-cloth');

  // A persistent sample grid lets the editor furl each sail around its real
  // mast-side/luff edge rather than assuming a horizontal or vertical axis.
  const canvas = cloth.children.find(object => object.isMesh && object.name === 'sail-shaped-cloth');
  canvas.userData.sailCloth = { rows, columns, axis };

  const seams = part('panel-seams-' + name, control);
  for (let i = 1; i <= 3; i++) {
    const line = [];
    const row = Math.round(rows * i / 4);
    for (let col = 0; col <= columns; col++) {
      const k = (row * stride + col) * 3;
      line.push(V(positions[k], positions[k + 1] + 0.006, positions[k + 2]));
    }
    tube(seams, line, 0.006, materials.sailShade, 'sail-panel-seam', 26);
  }
  return control;
}
