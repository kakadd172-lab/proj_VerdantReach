import { V } from '../../architecture/hull-surface.js';
import {
  aftercastleHalfWidth, aftercastleWallY, aftercastleWallZ, aftercastleTransomZ
} from './aftercastle-geometry.js';

function addSideWindow(d, ctx, parent, side, t, tier, index) {
  const { box, beam, materials } = ctx;
  const v = 0.57;
  const half = aftercastleHalfWidth(d, t, tier, v);
  const width = tier.id === 1 ? 0.58 : tier.id === 2 ? 0.50 : 0.42;
  const height = tier.id === 1 ? 0.48 : 0.42;
  const x = side * (half + 0.025);
  const y = aftercastleWallY(d, t, tier, v);
  const z = aftercastleWallZ(d, t, tier, v);
  box(parent, 0.055, height, width, materials.glass,
    'aftercastle-side-window-' + tier.id + '-' + side + '-' + index).position.set(x, y, z);
  for (const dz of [-width * 0.54, width * 0.54]) {
    beam(parent, V(x, y - height * 0.55, z + dz), V(x, y + height * 0.55, z + dz),
      0.028, materials.trim, 'castle-window-jamb');
  }
  for (const dy of [-height * 0.55, height * 0.55]) {
    beam(parent, V(x, y + dy, z - width * 0.54), V(x, y + dy, z + width * 0.54),
      0.028, materials.trim, 'castle-window-rail');
  }
  beam(parent, V(x, y - height * 0.52, z), V(x, y + height * 0.52, z),
    0.022, materials.trim, 'castle-window-mullion');
}

function addAftWindow(d, ctx, parent, tier, u, index) {
  const { box, beam, materials } = ctx;
  const v = 0.57;
  const half = aftercastleHalfWidth(d, tier.t1, tier, v);
  const width = tier.id === 1 ? 0.52 : tier.id === 2 ? 0.44 : 0.36;
  const height = tier.id === 1 ? 0.42 : 0.36;
  const z = aftercastleTransomZ(d, tier, u * 0.78, v) + 0.15;
  const x = u * half * 0.78;
  const y = aftercastleWallY(d, tier.t1, tier, v);
  box(parent, width, height, 0.055, materials.glass,
    'aftercastle-aft-window-' + tier.id + '-' + index).position.set(x, y, z);
  for (const dx of [-width * 0.55, width * 0.55]) {
    beam(parent, V(x + dx, y - height * 0.55, z), V(x + dx, y + height * 0.55, z),
      0.026, materials.trim, 'aft-window-jamb');
  }
  for (const dy of [-height * 0.55, height * 0.55]) {
    beam(parent, V(x - width * 0.55, y + dy, z), V(x + width * 0.55, y + dy, z),
      0.026, materials.trim, 'aft-window-rail');
  }
  beam(parent, V(x, y - height * 0.52, z), V(x, y + height * 0.52, z),
    0.022, materials.trim, 'aft-window-mullion');
}

export function buildAftercastleWindows(d, ctx, parent, tiers) {
  for (const tier of tiers) {
    const stations = tier.id === 1 ? [0.735, 0.795, 0.855, 0.915]
      : tier.id === 2 ? [0.825, 0.885, 0.935] : [0.900, 0.930];
    for (const side of [-1, 1]) {
      stations.forEach((t, i) => addSideWindow(d, ctx, parent, side, t, tier, i + 1));
    }
    const aft = tier.id === 1 ? [-0.65, -0.22, 0.22, 0.65]
      : tier.id === 2 ? [-0.52, 0, 0.52] : [-0.38, 0.38];
    aft.forEach((u, i) => addAftWindow(d, ctx, parent, tier, u, i + 1));
  }
}
