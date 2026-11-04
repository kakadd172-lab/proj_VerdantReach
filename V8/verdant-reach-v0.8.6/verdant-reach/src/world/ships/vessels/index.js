import Sloop from './sloop.js';
import Schooner from './schooner.js';
import Brigantine from './brigantine.js';
import Brig from './brig.js';
import Snow from './snow.js';
import Cutter from './cutter.js';
import Frigate from './frigate.js';
import Barque from './barque.js';
import Caravel from './caravel.js';
import Carrack from './carrack.js';
import Galleon from './galleon.js';
import Fluyt from './fluyt.js';
import Xebec from './xebec.js';
import Junk from './junk.js';
import FirstRate from './first-rate.js';
import Pinnace from './pinnace.js';

export const VESSEL_SPECS = Object.freeze({
  'sloop': Sloop,
  'schooner': Schooner,
  'brigantine': Brigantine,
  'brig': Brig,
  'snow': Snow,
  'cutter': Cutter,
  'frigate': Frigate,
  'barque': Barque,
  'caravel': Caravel,
  'carrack': Carrack,
  'galleon': Galleon,
  'fluyt': Fluyt,
  'xebec': Xebec,
  'junk': Junk,
  'first-rate': FirstRate,
  'pinnace': Pinnace,
});

export const VESSEL_IDS = Object.freeze(Object.keys(VESSEL_SPECS));

export function getVesselSpec(type) {
  return VESSEL_SPECS[String(type ?? '').replace(/^ship-/, '')] ?? null;
}
