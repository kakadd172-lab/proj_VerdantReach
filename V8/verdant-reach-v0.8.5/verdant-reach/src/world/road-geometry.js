/**
 * Shared terrain-conforming road ribbon utilities.
 *
 * Road centre-lines are planning data, not render geometry. Always resample
 * them before rendering and sample the terrain at every cross-section vertex;
 * otherwise a long box or quad can float over ridges or sink into hollows.
 */

export function resampleRoadPath(path, maxSpacing = 4) {
  if (!Array.isArray(path) || path.length < 2) return [];
  const spacing = Math.max(0.5, Number(maxSpacing) || 4);
  const points = [];
  const first = path[0];
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.z)) return [];
  points.push({ x: first.x, z: first.z });

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    if (!Number.isFinite(end?.x) || !Number.isFinite(end?.z)) continue;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.001) continue;
    const divisions = Math.max(1, Math.ceil(length / spacing));
    for (let step = 1; step <= divisions; step += 1) {
      const t = step / divisions;
      points.push({
        x: start.x + dx * t,
        z: start.z + dz * t,
      });
    }
  }
  return points;
}

/**
 * Build an indexed ribbon whose vertices sit just above the sampled heightfield.
 * A shallow crown sheds water to both edges. Returned arrays are plain JS arrays
 * so this module can be tested without a WebGL/Three.js context.
 */
export function buildDrapedRoadData(path, heightAt, options = {}) {
  if (typeof heightAt !== 'function') throw new TypeError('heightAt must be a function');
  const maxSpacing = Math.max(0.75, Number(options.maxSpacing) || 4);
  const width = Math.max(1.2, Number(options.width) || 4);
  const clearance = Math.max(0.02, Number(options.clearance) || 0.12);
  const camberRatio = Math.max(0, Math.min(0.08, Number(options.camberRatio) || 0.025));
  const crossSegments = Math.max(2, Math.min(8, Math.round(Number(options.crossSegments) || 4)));
  const halfWidth = width * 0.5;
  const crownRise = halfWidth * camberRatio;
  const points = resampleRoadPath(path, maxSpacing);
  const positions = [];
  const indices = [];
  if (points.length < 2) return { points, positions, indices, width };

  const verticesPerSection = crossSegments + 1;
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    let dx = next.x - previous.x;
    let dz = next.z - previous.z;
    let tangentLength = Math.hypot(dx, dz);
    if (tangentLength < 1e-6) {
      dx = points[index].x - previous.x;
      dz = points[index].z - previous.z;
      tangentLength = Math.hypot(dx, dz) || 1;
    }
    dx /= tangentLength;
    dz /= tangentLength;

    // For a +Z road, positive lateral values point toward +X.
    const normalX = dz;
    const normalZ = -dx;
    for (let column = 0; column <= crossSegments; column += 1) {
      const lateral = column / crossSegments * 2 - 1;
      const x = points[index].x + normalX * halfWidth * lateral;
      const z = points[index].z + normalZ * halfWidth * lateral;
      const ground = Number(heightAt(x, z));
      if (!Number.isFinite(ground)) throw new Error('Terrain returned a non-finite road elevation');
      const crown = crownRise * (1 - Math.abs(lateral));
      positions.push(x, ground + clearance + crown, z);
    }
  }

  for (let section = 0; section < points.length - 1; section += 1) {
    const currentBase = section * verticesPerSection;
    const nextBase = (section + 1) * verticesPerSection;
    for (let column = 0; column < crossSegments; column += 1) {
      const a = currentBase + column;
      const b = nextBase + column;
      // Winding faces upward for a route travelling along +Z.
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  return { points, positions, indices, width };
}
