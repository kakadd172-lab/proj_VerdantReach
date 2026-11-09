import Sloop from './vessels/sloop.js';
import Schooner from './vessels/schooner.js';
import Brigantine from './vessels/brigantine/brigantine.js';
import Brig from './vessels/brig/brig.js';
import Snow from './vessels/snow.js';
import Cutter from './vessels/cutter.js';
import Frigate from './vessels/frigate.js';
import Barque from './vessels/barque/barque.js';
import Caravel from './vessels/caravel/caravel.js';
import Carrack from './vessels/carrack/carrack.js';
import Galleon from './vessels/galleon.js';
import Fluyt from './vessels/fluyt.js';
import Xebec from './vessels/xebec.js';
import Junk from './vessels/junk.js';
import FirstRate from './vessels/first-rate.js';
import Pinnace from './vessels/pinnace.js';
import {SHIP_DESIGN_MODULE_VERSION,SHIP_STRUCTURE_MODULE_VERSION,SHIP_PART_BASE_NAMES,getShipDesignFromSpec,getShipStructureFromSpec,setDesignOverrideForSpec,setStructureOverrideForSpec} from './shared/vessel-definition.js';
import {SHIP_EDITOR_KIT_VERSION,disposeShipModel,shipModelSummary as summarizeShipDesign} from './shared/ship-editor-kit.js';
export const SHIP_MODEL_MODULE_VERSION=SHIP_EDITOR_KIT_VERSION;
export const VESSEL_MODULE_LIST=Object.freeze([Sloop,Schooner,Brigantine,Brig,Snow,Cutter,Frigate,Barque,Caravel,Carrack,Galleon,Fluyt,Xebec,Junk,FirstRate,Pinnace]);
export const VESSEL_MODULES=Object.freeze(Object.fromEntries(VESSEL_MODULE_LIST.map(v=>[v.id,v])));
export const VESSEL_IDS=Object.freeze(VESSEL_MODULE_LIST.map(v=>v.id));
export const VESSEL_SPECS=Object.freeze(Object.fromEntries(VESSEL_MODULE_LIST.map(v=>[v.id,v.definition])));
export const SHIP_DESIGNS=Object.freeze(Object.fromEntries(VESSEL_MODULE_LIST.map(v=>[v.id,v.design])));
export const HISTORICAL_SHIP_KINDS=Object.freeze(VESSEL_IDS.map(id=>'ship-'+id));
export {SHIP_DESIGN_MODULE_VERSION,SHIP_STRUCTURE_MODULE_VERSION,SHIP_PART_BASE_NAMES,SHIP_EDITOR_KIT_VERSION,disposeShipModel};
const legacyKindMap=Object.freeze({'sailing-ship':'sloop','large-ship':'galleon'});
export function getVesselModule(type){return VESSEL_MODULES[String(type??'').replace(/^ship-/,'')]??null;}
export function getShipGenerator(type){return getVesselModule(type)?.generate??null;}
export const SHIP_GENERATORS=Object.freeze(Object.fromEntries(VESSEL_MODULE_LIST.map(v=>[v.id,v.generate])));
export function createShipModel(type,transforms={},state={}){const v=getVesselModule(type);if(!v)throw new Error('No dedicated ForTests ship generator for: '+String(type));return v.createModel(transforms,state);}
export const createShip=createShipModel;
export function getShipDesign(type){const v=getVesselModule(type);return v?getShipDesignFromSpec(v.definition):null;}
export function setShipDesignOverrides(type,patch={}){const v=getVesselModule(type);return v?setDesignOverrideForSpec(v.definition,patch):false;}
export function resetShipDesignOverrides(type){return setShipDesignOverrides(type,{});}
export function getShipStructureBlueprint(type){const v=getVesselModule(type);return v?getShipStructureFromSpec(v.definition):null;}
export function setShipStructureOverrides(type,patch={}){const v=getVesselModule(type);return v?setStructureOverrideForSpec(v.definition,patch):false;}
export function resetShipStructureOverrides(type){return setShipStructureOverrides(type,{});}
export function shipModelSummary(type){return summarizeShipDesign(getShipDesign(type));}
export function getShipTypeFromCreativeKind(kind){const value=String(kind??'');if(Object.hasOwn(legacyKindMap,value))return legacyKindMap[value];const id=value.startsWith('ship-')?value.slice(5):'';return Object.hasOwn(VESSEL_MODULES,id)?id:null;}
export function describeShipDimensions(d){return d?d.hullLength.toFixed(1)+' m × '+d.beam.toFixed(1)+' m · '+d.lengthBeamRatio.toFixed(2)+':1':'';}
export function getShipDesignPartNames(type){return getShipDesign(type)?.partNames??[];}
export function getShipRigMastNames(type){return getShipDesign(type)?.masts.map(m=>m.id)??[];}
