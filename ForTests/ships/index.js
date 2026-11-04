/**
 * ForTests ship registry.
 *
 * Every entry points to one dedicated vessel module. This registry contains
 * no combined geometry definitions; it only selects the correct per-vessel
 * generator and provides a consistent lookup API for the editor.
 */
import Sloop from './vessels/sloop.js';
import Schooner from './vessels/schooner.js';
import Brigantine from './vessels/brigantine.js';
import Brig from './vessels/brig.js';
import Snow from './vessels/snow.js';
import Cutter from './vessels/cutter.js';
import Frigate from './vessels/frigate.js';
import Barque from './vessels/barque.js';
import Caravel from './vessels/caravel.js';
import Carrack from './vessels/carrack.js';
import Galleon from './vessels/galleon.js';
import Fluyt from './vessels/fluyt.js';
import Xebec from './vessels/xebec.js';
import Junk from './vessels/junk.js';
import FirstRate from './vessels/first-rate.js';
import Pinnace from './vessels/pinnace.js';

export const VESSEL_MODULE_LIST = Object.freeze([
  Sloop,
  Schooner,
  Brigantine,
  Brig,
  Snow,
  Cutter,
  Frigate,
  Barque,
  Caravel,
  Carrack,
  Galleon,
  Fluyt,
  Xebec,
  Junk,
  FirstRate,
  Pinnace,
]);

export const VESSEL_MODULES = Object.freeze(Object.fromEntries(
  VESSEL_MODULE_LIST.map((vessel) => [vessel.id, vessel]),
));

export const VESSEL_IDS = Object.freeze(VESSEL_MODULE_LIST.map((vessel) => vessel.id));

export const VESSEL_SPECS = Object.freeze(Object.fromEntries(
  VESSEL_MODULE_LIST.map((vessel) => [vessel.id, vessel.source]),
));

export const SHIP_GENERATORS = Object.freeze(Object.fromEntries(
  VESSEL_MODULE_LIST.map((vessel) => [vessel.id, vessel.generate]),
));

export function getVesselModule(type) {
  const id = String(type ?? '').replace(/^ship-/, '');
  return VESSEL_MODULES[id] ?? null;
}

export function getShipGenerator(type) {
  return getVesselModule(type)?.generate ?? null;
}

/** Create a model through the selected vessel's dedicated editor module. */
export function createShip(type) {
  const vessel = getVesselModule(type);
  if (!vessel) throw new Error('No ForTests ship module registered for: ' + String(type));
  return vessel.generate();
}
