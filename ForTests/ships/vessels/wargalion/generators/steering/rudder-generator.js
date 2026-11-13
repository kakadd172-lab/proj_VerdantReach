import { deckY, V } from '../../architecture/hull-geometry.js';

export function buildRudder(d, ctx) {
  const { part, box, beam, materials } = ctx;
  const rudder = part('rudder');
  const z = d.hullLengthUnits * 0.5 + d.rudderDetails.pivotOffset;
  rudder.position.set(0, 0, z);
  const blade = box(rudder, d.beamUnits * 0.105, d.draftUnits * 0.78, 0.24,
    materials.lower, 'broad-rudder-blade');
  blade.position.set(0, -d.draftUnits * 0.34, 0);
  beam(rudder, V(0, -d.draftUnits * 0.40, 0), V(0, deckY(d, 0.96) * 0.46, 0),
    d.beamUnits * 0.012, materials.trim, 'rudder-stock');
}
