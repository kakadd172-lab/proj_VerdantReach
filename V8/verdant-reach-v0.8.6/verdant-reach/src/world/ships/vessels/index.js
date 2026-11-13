import Sloop from './sloop/sloop.js';
import Schooner from './schooner/schooner.js';
import Brigantine from './brigantine/brigantine.js';
import Brig from './brig/brig.js';
import Snow from './snow/snow.js';
import Cutter from './cutter/cutter.js';
import Frigate from './frigate/frigate.js';
import Barque from './barque/barque.js';
import Caravel from './caravel/caravel.js';
import Carrack from './carrack/carrack.js';
import Galleon from './galleon/galleon.js';
import WarGalleon2 from './war-galleon-2/war-galleon-2.js';
import Fluyt from './fluyt/fluyt.js';
import Xebec from './xebec/xebec.js';
import Junk from './junk/junk.js';
import FirstRate from './first-rate/first-rate.js';
import Pinnace from './pinnace/pinnace.js';

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
  'war-galleon-2': WarGalleon2,
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
