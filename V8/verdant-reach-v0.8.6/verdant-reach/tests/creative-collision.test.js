import test from 'node:test';
import assert from 'node:assert/strict';

import { CollisionWorld } from '../src/world/collision.js';
import { getCreativeEntityColliders } from '../src/world/creative-entities.js';

test('solid creative props publish collision footprints at their placed coordinates', () => {
  const kinds = [
    'rock','boulder','crystal','tree','pine-tree','ancient-tree','tree-grove',
    'hut','watchtower','ruin','mine','cart','rowboat','campfire','treasure-chest','well',
    'deer','wolf','bear','horse','villager','merchant','guard',
  ];
  for (const kind of kinds) {
    const record = { id: 'placed-' + kind, kind, x: 128, z: -64, yaw: 0.4, scale: 1 };
    const bodies = getCreativeEntityColliders(record);
    assert.ok(bodies.length > 0, kind + ' should have at least one collision body');
    const world = new CollisionWorld();
    world.setBodies(record.id, bodies);
    for (const body of bodies) {
      assert.equal(
        world.isCircleFree(body.x, body.z, 0.15),
        false,
        kind + ' body ' + body.id + ' must block its occupied centre',
      );
    }
  }
});

test('placed bridges keep their deck walkable but block movement through the side rails', () => {
  const record = { id: 'bridge-1', kind: 'bridge', x: 0, z: 0, yaw: 0, scale: 1 };
  const world = new CollisionWorld();
  world.setBodies(record.id, getCreativeEntityColliders(record));
  assert.equal(world.isCircleFree(0, 0, 0.55), true, 'the bridge deck remains walkable');
  assert.equal(world.isCircleFree(0, 1.8, 0.55), false, 'the side rails prevent walking off the bridge');
  assert.equal(world.isCircleFree(0, -1.8, 0.55), false, 'both bridge rails are solid');
});

test('creative ship collision footprint follows its vessel dimensions and yaw', () => {
  const record = { id: 'ship-1', kind: 'ship-sloop', x: 30, z: 40, yaw: Math.PI / 2, scale: 1 };
  const bodies = getCreativeEntityColliders(record);
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].type, 'box');
  assert.ok(bodies[0].halfDepth > bodies[0].halfWidth, 'the hull footprint is longer than it is wide');
  assert.ok(Math.abs(bodies[0].yaw - (record.yaw + Math.PI)) < 1e-9);
});
