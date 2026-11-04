import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionWorld, boxCollider, circleCollider } from '../src/world/collision.js';

test('circle colliders keep actors outside rocks and round towers', () => {
  const world = new CollisionWorld(8);
  world.setBodies('rocks', [circleCollider('granite', 0, 0, 2)]);
  assert.equal(world.isCircleFree(5, 0, 0.5), true);
  assert.equal(world.isCircleFree(2.2, 0, 0.5), false);
  const resolved = world.resolveCircle(0, 0, 0.5);
  assert.equal(resolved.collided, true);
  assert.ok(Math.hypot(resolved.x, resolved.z) >= 2.5);
});

test('oriented wall boxes stop an actor from crossing thin panels', () => {
  const world = new CollisionWorld(12);
  world.setBodies('wall', [boxCollider('panel', 0, 0, 3, 0.35, Math.PI / 4)]);
  const result = world.moveCircle(-8, 0, 16, 0, 0.6);
  assert.equal(result.collided, true);
  assert.ok(world.isCircleFree(result.x, result.z, 0.6));
});

test('movement slides along a long wall while its normal component is blocked', () => {
  const world = new CollisionWorld(12);
  world.setBodies('wall', [boxCollider('long-panel', 0, 0, 30, 0.5, 0)]);
  const result = world.moveCircle(-4, -5, 8, 8, 0.6);
  assert.equal(result.collided, true);
  assert.ok(result.x > 2, 'the actor travels along the wall instead of stopping completely');
  assert.ok(result.z < 0, 'the actor remains on the approach side of the wall');
  assert.ok(world.isCircleFree(result.x, result.z, 0.6));
});

test('starting inside a collider is resolved deterministically', () => {
  const world = new CollisionWorld();
  world.setBodies('structure', [boxCollider('keep-wall', 0, 0, 8, 2)]);
  const first = world.resolveCircle(0, 0, 0.6);
  const second = world.resolveCircle(0, 0, 0.6);
  assert.deepEqual({ x: first.x, z: first.z }, { x: second.x, z: second.z });
  assert.equal(world.isCircleFree(first.x, first.z, 0.6), true);
});

test('overlapping blockers are iteratively separated', () => {
  const world = new CollisionWorld();
  world.setBodies('fort', [
    boxCollider('north', 0, -2, 8, 1),
    boxCollider('west', -2, 0, 1, 8),
    circleCollider('tower', 2, 2, 2),
  ]);
  const resolved = world.resolveCircle(0, 0, 0.55, { maxIterations: 12 });
  assert.equal(resolved.collided, true);
  assert.equal(world.isCircleFree(resolved.x, resolved.z, 0.55), true);
});

test('owner replacement and removal leave no stale spatial-hash entries', () => {
  const world = new CollisionWorld(8);
  world.setBodies('chunk:0:0', [circleCollider('rock', 0, 0, 3)]);
  assert.equal(world.size, 1);
  world.setBodies('chunk:0:0', [circleCollider('new-rock', 20, 20, 2)]);
  assert.equal(world.size, 1);
  assert.equal(world.isCircleFree(0, 0, 0.5), true);
  assert.equal(world.isCircleFree(20, 20, 0.5), false);
  assert.equal(world.removeBodies('chunk:0:0'), 1);
  assert.equal(world.size, 0);
  assert.equal(world.isCircleFree(20, 20, 0.5), true);
});

test('ignoreIds lets a mounted actor ignore its own vehicle collider', () => {
  const world = new CollisionWorld();
  world.setBodies('creative:ship-1', [boxCollider('ship', 0, 0, 8, 18, 0, { sourceId: 'ship-1' })]);
  assert.equal(world.isCircleFree(0, 0, 0.6), false);
  assert.equal(world.isCircleFree(0, 0, 0.6, { ignoreIds: ['ship-1'] }), true);
});

test('spatial hash returns nearby colliders without scanning remote chunks', () => {
  const world = new CollisionWorld(16);
  const bodies = [];
  for (let i = 0; i < 2000; i += 1) bodies.push(circleCollider('rock-' + i, i * 40, i * -30, 1));
  world.setBodies('landscape', bodies);
  assert.equal(world.queryCircle(0, 0, 3).length, 1);
  assert.equal(world.size, 2000);
});
