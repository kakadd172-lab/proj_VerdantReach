import * as THREE from 'three';
import { BLOCK, BLOCK_BY_ID, isSolid } from '../world/blocks.js';
import { raycastVoxels } from './raycast.js';

export function interactWithBlock({
  button, world, camera, player, hotbarSlots, selectedSlot, inventory,
  onInventoryChanged, onMessage
}) {
  if (!player?.pointerLocked || !world) return null;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const hit = raycastVoxels(world, camera.position, direction, 7);
  if (!hit) return null;

  if (button === 0) {
    const block = BLOCK_BY_ID[hit.id];
    if (!block?.mineable || performance.now() - player.lastBreak < 90) return hit;
    player.lastBreak = performance.now();
    if (world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR)) {
      if (hit.id !== BLOCK.WATER && hit.id !== BLOCK.BEDROCK) {
        inventory.set(hit.id, (inventory.get(hit.id) || 0) + 1);
        onInventoryChanged?.();
        onMessage?.(`${block.name} +1`);
      }
    }
  } else if (button === 2) {
    const id = hotbarSlots[selectedSlot];
    const count = inventory.get(id) || 0;
    if (count <= 0) { onMessage?.('That slot is empty'); return hit; }
    if (!isSolid(id) || !isSolid(hit.id)) return hit;

    // Place on the face being targeted, not in the block itself or an
    // arbitrary previous ray cell. A valid face normal is exactly one axis
    // step away from the hit block.
    const normal = hit.normal;
    const isFaceNormal = normal &&
      Number.isInteger(normal.x) && Number.isInteger(normal.y) && Number.isInteger(normal.z) &&
      Math.abs(normal.x) + Math.abs(normal.y) + Math.abs(normal.z) === 1;
    if (!isFaceNormal) return hit;

    const x = hit.x + normal.x;
    const y = hit.y + normal.y;
    const z = hit.z + normal.z;

    // Never replace an existing voxel. Placement is allowed only in air,
    // and never where it would overlap the player's collision capsule.
    if (world.getBlock(x, y, z) !== BLOCK.AIR || player.intersectsBlock(x, y, z)) return hit;
    if (world.setBlock(x, y, z, id)) {
      inventory.set(id, count - 1);
      onInventoryChanged?.();
    }
  }
  return hit;
}
