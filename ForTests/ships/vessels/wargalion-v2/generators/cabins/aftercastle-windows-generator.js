import { hullPoint, deckLevelY } from '../../architecture/hull-surface.js';

function addWindow(d, ctx, parent, side, t, tier, index) {
  const { box, beam, materials, V } = ctx;
  const half = Math.abs(hullPoint(d, t, 1, side).x) * tier.widthScale;
  const z = hullPoint(d, t, 1, side).z;
  const baseY = deckLevelY(d, t, 'quarterdeck') + tier.baseOffset;
  const width = 0.42, height = 0.34;
  const x = side * (half + 0.025), y = baseY + tier.wallHeight * 0.58;
  box(parent, 0.045, height, width, materials.glass,
    'aftercastle-side-window-pane-' + tier.id + '-' + side + '-' + index).position.set(x, y, z);
  for (const dz of [-width * 0.53, width * 0.53]) {
    beam(parent, V(x, y - height * 0.56, z + dz), V(x, y + height * 0.56, z + dz),
      0.021, materials.trim, 'aftercastle-window-jamb');
  }
  for (const dy of [-height * 0.56, height * 0.56]) {
    beam(parent, V(x, y + dy, z - width * 0.53), V(x, y + dy, z + width * 0.53),
      0.021, materials.trim, 'aftercastle-window-rail');
  }
}

export function buildAftercastleWindows(d, ctx, parent, tiers) {
  for (const tier of tiers) {
    const stations = tier.id === 1 ? [0.755, 0.815, 0.875, 0.935]
      : tier.id === 2 ? [0.845, 0.910, 0.955] : [0.925, 0.958];
    for (const side of [-1, 1]) {
      for (let i = 0; i < stations.length; i++) addWindow(d, ctx, parent, side, stations[i], tier, i + 1);
    }
  }
}
