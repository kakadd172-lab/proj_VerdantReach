import test from 'node:test';
import assert from 'node:assert/strict';

import { CollisionWorld } from '../src/world/collision.js';
import {
  createFreeCityCollisionBodies,
  createRuinedCastleCollisionBodies,
} from '../src/world/settlement-models.js';
import { buildFreeCityPlan, buildRuinedCastlePlan } from '../src/world/settlement-layouts.js';

const flatGenerator = {
  heightAt() { return 14; },
  sample() {
    return {
      height: 14, slope: 0.08, biome: 'grassland',
      fieldSuitability: 0.8, floodplain: 0.05,
    };
  },
};

test('free-city wall segments block the player but preserve all four gate passages', () => {
  const settlement = { id: 'collision-city', type: 'freeCity', x: 0, z: 0, seed: 14523, elevation: 14 };
  const plan = buildFreeCityPlan(settlement, flatGenerator);
  const bodies = createFreeCityCollisionBodies(settlement, flatGenerator);
  const world = new CollisionWorld(24);
  world.setBodies('city', bodies);

  const wallPanel = bodies.find((body) => body.kind === 'city-wall');
  assert.ok(wallPanel, 'city wall panels have collision proxies');
  assert.equal(world.isCircleFree(wallPanel.x, wallPanel.z, 0.6), false);
  for (const gate of plan.gates) {
    assert.equal(
      world.isCircleFree(gate.x, gate.z, 0.6),
      true,
      gate.name + ' must remain open to foot traffic',
    );
  }
  assert.ok(bodies.some((body) => body.kind === 'city-building'));
  assert.ok(bodies.some((body) => body.kind === 'landmark'));
});

test('ruined-castle curtain walls block movement while the gate approach remains open', () => {
  const site = { id: 'collision-ruin', name: 'Test Ruin', x: 0, z: 0, seed: 48291 };
  const plan = buildRuinedCastlePlan(site);
  const bodies = createRuinedCastleCollisionBodies(site, flatGenerator);
  const world = new CollisionWorld(24);
  world.setBodies('ruin', bodies);
  const gateCandidates = world.queryCircle(plan.gate.x, plan.gate.z, 0.6);
  console.log('RUIN_GATE_COLLIDERS', JSON.stringify(gateCandidates.map(body => ({
    id: body.id, type: body.type, x: body.x, z: body.z,
    radius: body.radius, halfWidth: body.halfWidth, halfDepth: body.halfDepth, yaw: body.yaw,
  }))));

  const wall = bodies.find((body) => body.kind === 'castle-wall');
  assert.ok(wall, 'castle walls have collision proxies');
  assert.equal(world.isCircleFree(wall.x, wall.z, 0.6), false);
  assert.equal(
    world.isCircleFree(plan.gate.x, plan.gate.z, 0.6),
    true,
    'the outer wall, gatehouse and barbican openings should form a traversable entrance',
  );
  assert.ok(bodies.some((body) => body.kind === 'castle-tower'));
  assert.ok(bodies.some((body) => body.kind === 'castle-pier'));
});
