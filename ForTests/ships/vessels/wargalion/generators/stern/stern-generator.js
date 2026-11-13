import { deckSurfaceY, halfBreadth, V } from '../../architecture/hull-geometry.js';

export function buildStern(d, ctx) {
  const { THREE, part, mesh, box, beam, tube, materials } = ctx;
  const shell = part('sternworks');
  const gallery = part('stern-gallery', shell);
  const windows = part('stern-windows', shell);
  const aftZ = d.hullLengthUnits * 0.455;
  const tiers = d.sternTiers;
  tiers.forEach((tier, index) => {
    const group = part('stern-tier-' + (index + 1), shell);
    const width = d.beamUnits * tier.w;
    const depth = d.hullLengthUnits * tier.d;
    const height = tier.h * (4 / 3);
    const baseY = deckSurfaceY(d, 0.94) + tiers.slice(0, index).reduce((sum, item) => sum + item.h * (4 / 3) + 0.10, 0);
    const z0 = aftZ - depth * 0.5 + index * depth * 0.13;
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.5, 0);
    shape.lineTo(-width * 0.5, height * 0.62);
    shape.quadraticCurveTo(-width * 0.48, height * 1.02, -width * 0.24, height * 1.02);
    shape.lineTo(width * 0.24, height * 1.02);
    shape.quadraticCurveTo(width * 0.5, height * 0.98, width * 0.5, height * 0.70);
    shape.lineTo(width * 0.5, 0);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 3,
      bevelSize: Math.min(0.10, width * 0.012), bevelThickness: 0.06, curveSegments: 12
    });
    geometry.translate(0, baseY, z0);
    mesh(group, geometry, materials.hull, 'tapered-galleon-aftercastle-tier');
    const beltY = baseY + height * 0.13;
    beam(gallery, V(-width * 0.54, beltY, z0 + depth * 0.92),
      V(width * 0.54, beltY, z0 + depth * 0.92), 0.045, materials.trim, 'stern-gallery-moulding');
    const count = Math.max(3, Math.floor(width / 0.85));
    for (let i = 0; i < count; i++) {
      const x = -width * 0.36 + width * 0.72 * i / Math.max(1, count - 1);
      const y = baseY + height * 0.42;
      const pane = box(windows, 0.34, 0.48, 0.055, materials.glass, 'aft-gallery-window');
      pane.position.set(x, y, z0 + depth + 0.025);
      for (const sign of [-1, 1]) {
        beam(windows, V(x + sign * 0.21, y - 0.29, z0 + depth + 0.06),
          V(x + sign * 0.21, y + 0.29, z0 + depth + 0.06), 0.025, materials.brass, 'window-jamb');
      }
      beam(windows, V(x - 0.21, y + 0.29, z0 + depth + 0.06),
        V(x + 0.21, y + 0.29, z0 + depth + 0.06), 0.025, materials.brass, 'window-head');
      beam(windows, V(x - 0.21, y - 0.29, z0 + depth + 0.06),
        V(x + 0.21, y - 0.29, z0 + depth + 0.06), 0.025, materials.brass, 'window-sill');
    }
    for (const side of [-1, 1]) {
      const x = side * (width * 0.51);
      const railY = baseY + height * 0.30;
      const line = [V(x, railY, z0), V(x, railY, z0 + depth)];
      tube(gallery, line, 0.035, materials.trim, 'quarter-gallery-rail', 12);
      for (let p = 0; p < 6; p++) {
        const z = z0 + depth * (0.08 + 0.84 * p / 5);
        beam(gallery, V(x, railY - 0.32, z), V(x, railY + 0.02, z),
          0.022, materials.trim, 'gallery-baluster');
      }
    }
    const balcony = box(gallery, width * 1.08, 0.10, depth * 0.96, materials.deck, 'stern-gallery-balcony');
    balcony.position.set(0, baseY + height * 0.16, z0 + depth * 0.70);
  });
  const transom = part('stern-transom', shell);
  const transomLine = [];
  for (let i = 0; i <= 20; i++) {
    const u = -1 + 2 * i / 20;
    transomLine.push(V(u * halfBreadth(d, 0.99) * 0.95, deckSurfaceY(d, 0.99) + 0.10, d.hullLengthUnits * 0.5 + 0.12));
  }
  tube(transom, transomLine, 0.07, materials.trim, 'heavy-transom-beam', 24);
}
