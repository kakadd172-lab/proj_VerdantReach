import { VESSEL_SPECS, VESSEL_IDS, getVesselSpec } from './vessels/index.js?v=0.8.6';
import { createShipModel, disposeShipModel, shipModelSummary } from './core/ship-model-builder.js?v=0.8.6';

export { VESSEL_SPECS, VESSEL_IDS, getVesselSpec };
export { createShipModel, disposeShipModel, shipModelSummary };

const generators = Object.freeze(Object.fromEntries(
  VESSEL_IDS.map((id) => [id, () => {
    const specification = VESSEL_SPECS[id];
    const ship = specification.generate(createShipModel);
    ship.userData.shipGeneratorId = id;
    ship.userData.shipDefinitionPath = 'src/world/ships/vessels/' + id + '.js';
    return ship;
  }]),
));

export const SHIP_GENERATORS = generators;

export function getShipGenerator(type) {
  return SHIP_GENERATORS[String(type ?? '').replace(/^ship-/, '')] ?? null;
}

/** Create a vessel through its dedicated generator module. */
export function createShip(type) {
  const id = String(type ?? '').replace(/^ship-/, '');
  const generator = getShipGenerator(id);
  if (!generator) throw new Error('No dedicated ship generator registered for: ' + String(type));
  return generator();
}
