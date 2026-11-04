import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDrapedRoadData, resampleRoadPath } from '../src/world/road-geometry.js';

test('road centre-lines are resampled without gaps and retain exact endpoints', () => {
  const path = [{ x: 0, z: 0 }, { x: 13, z: 0 }, { x: 13, z: 7 }];
  const points = resampleRoadPath(path, 4);
  assert.deepEqual(points[0], path[0]);
  assert.deepEqual(points.at(-1), path.at(-1));
  for (let i = 1; i < points.length; i += 1) {
    assert.ok(Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z) <= 4.001);
  }
});

test('road surface samples the terrain across its full width and follows ridges and hollows', () => {
  const heightAt = (x, z) => 4 + Math.sin(x * 0.35) * 1.8 + Math.cos(z * 0.2) * 0.9;
  const data = buildDrapedRoadData([{ x: 0, z: 0 }, { x: 0, z: 24 }], heightAt, {
    width: 6, maxSpacing: 3, clearance: 0.12, crossSegments: 4,
  });
  assert.ok(data.points.length >= 9);
  assert.equal(data.positions.length / 3, data.points.length * 5);
  for (let section = 0; section < data.points.length; section += 1) {
    const base = section * 5;
    for (let column = 0; column < 5; column += 1) {
      const offset = (base + column) * 3;
      const x = data.positions[offset];
      const y = data.positions[offset + 1];
      const z = data.positions[offset + 2];
      assert.ok(y >= heightAt(x, z) + 0.12 - 1e-6);
    }
  }
  assert.ok(data.indices.length > 0);
  assert.ok(data.indices.every((index) => index >= 0 && index < data.positions.length / 3));
});

test('road crown rises gently at the centre to shed water toward both shoulders', () => {
  const data = buildDrapedRoadData([{ x: 0, z: 0 }, { x: 0, z: 8 }], () => 10, {
    width: 8, clearance: 0.1, camberRatio: 0.025, crossSegments: 4,
  });
  const middle = data.positions[7];
  const left = data.positions[1];
  const right = data.positions[13];
  assert.ok(middle > left);
  assert.ok(middle > right);
});

test('invalid route samples are rejected rather than creating malformed road geometry', () => {
  assert.deepEqual(resampleRoadPath([{ x: NaN, z: 0 }, { x: 5, z: 5 }]), []);
  assert.throws(() => buildDrapedRoadData([{ x: 0, z: 0 }, { x: 0, z: 5 }], () => NaN), /non-finite/);
});