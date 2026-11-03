import { BLOCK } from '../world/blocks.js';

export function raycastVoxels(world, origin, direction, maxDistance = 7) {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);
  const stepX = direction.x > 0 ? 1 : (direction.x < 0 ? -1 : 0);
  const stepY = direction.y > 0 ? 1 : (direction.y < 0 ? -1 : 0);
  const stepZ = direction.z > 0 ? 1 : (direction.z < 0 ? -1 : 0);
  const deltaX = stepX === 0 ? Infinity : Math.abs(1 / direction.x);
  const deltaY = stepY === 0 ? Infinity : Math.abs(1 / direction.y);
  const deltaZ = stepZ === 0 ? Infinity : Math.abs(1 / direction.z);
  let maxX = stepX === 0 ? Infinity : ((stepX > 0 ? x + 1 - origin.x : origin.x - x) * deltaX);
  let maxY = stepY === 0 ? Infinity : ((stepY > 0 ? y + 1 - origin.y : origin.y - y) * deltaY);
  let maxZ = stepZ === 0 ? Infinity : ((stepZ > 0 ? z + 1 - origin.z : origin.z - z) * deltaZ);
  let distance = 0;
  let previous = null;
  let normal = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < 128 && distance <= maxDistance; i++) {
    const id = world.getBlock(x, y, z);
    if (id !== BLOCK.AIR && id !== BLOCK.WATER) {
      return { x, y, z, id, previous, normal, distance };
    }
    previous = { x, y, z };
    if (maxX < maxY && maxX < maxZ) {
      x += stepX; distance = maxX; maxX += deltaX; normal = { x: -stepX, y: 0, z: 0 };
    } else if (maxY < maxZ) {
      y += stepY; distance = maxY; maxY += deltaY; normal = { x: 0, y: -stepY, z: 0 };
    } else {
      z += stepZ; distance = maxZ; maxZ += deltaZ; normal = { x: 0, y: 0, z: -stepZ };
    }
  }
  return null;
}
