import { deckY, hullPoint, V } from '../../architecture/hull-geometry.js';

/**
 * Deck fittings and framed gunports for War Galleon II.
 * Cannons are separate editor entities and are deliberately not generated here.
 */
export function buildDeckEquipment(d, ctx) {
  const { part, beam, box, materials } = ctx;
  const fittings = part('deck-fittings');

  for (let hatch = 0; hatch < 2; hatch += 1) {
    const station = 0.32 + hatch * 0.13;
    const z = (station - 0.5) * d.hullLengthUnits;
    const group = part('cargo-hatch-' + hatch, fittings);
    const size = d.beamUnits * 0.2;
    const cover = box(group, size, 0.12, size * 0.84, materials.plank, 'hatch-cover');
    cover.position.set(0, deckY(d, station) + 0.12, z);
  }

  const gunLevels = [0.74, 0.52];
  const portHeight = Math.max(0.48, d.deckHeightUnits * 0.24);
  const portLength = Math.max(0.68, d.beamUnits * 0.055);

  for (let level = 0; level < gunLevels.length; level += 1) {
    for (const side of [-1, 1]) {
      const count = 12;
      for (let index = 0; index < count; index += 1) {
        const station = 0.16 + (index / Math.max(1, count - 1)) * 0.68;
        const point = hullPoint(d, station, Math.asin(2 * gunLevels[level] - 1));
        const x = side * (Math.abs(point.x) + 0.045);
        const y = point.y;
        const z = point.z;

        const port = box(
          fittings, 0.065, portHeight * 0.78, portLength * 0.78,
          materials.lower, 'gunport-' + level + '-' + side + '-' + index
        );
        port.position.set(x, y, z);

        const frameX = side * (Math.abs(point.x) + 0.095);
        const halfHeight = portHeight * 0.5;
        const halfLength = portLength * 0.5;
        beam(fittings, V(frameX, y - halfHeight, z - halfLength), V(frameX, y - halfHeight, z + halfLength), 0.026, materials.trim, 'gunport-sill');
        beam(fittings, V(frameX, y + halfHeight, z - halfLength), V(frameX, y + halfHeight, z + halfLength), 0.026, materials.trim, 'gunport-lintel');
        beam(fittings, V(frameX, y - halfHeight, z - halfLength), V(frameX, y + halfHeight, z - halfLength), 0.026, materials.trim, 'gunport-jamb');
        beam(fittings, V(frameX, y - halfHeight, z + halfLength), V(frameX, y + halfHeight, z + halfLength), 0.026, materials.trim, 'gunport-jamb');
      }
    }
  }
}
