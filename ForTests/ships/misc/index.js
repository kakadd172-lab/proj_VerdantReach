import {
  createCannonModel,
  CANNON_PROFILES,
  CANNON_PART_NAMES,
  getCannonProfile
} from '../vessels/cannons/index.js';
import { createBarrelModel } from './barrels/index.js';
import { createCrateModel } from './crates/index.js';
import { createLanternModel } from './lanterns/index.js';
import { createBollardModel } from './fittings/index.js';
import CANNON_9_DEFAULTS from './cannons/9-pounder/editor-defaults.js';
import CANNON_18_DEFAULTS from './cannons/18-pounder/editor-defaults.js';
import CANNON_36_DEFAULTS from './cannons/36-pounder/editor-defaults.js';
import BARREL_DEFAULTS from './barrels/editor-defaults.js';
import CRATE_DEFAULTS from './crates/editor-defaults.js';
import LANTERN_DEFAULTS from './lanterns/editor-defaults.js';
import BOLLARD_DEFAULTS from './fittings/editor-defaults.js';

export const MISC_MODEL_REGISTRY_VERSION = '0.2.0';

const DEFINITIONS = Object.freeze({
  'misc-cannon-9-pounder': { id:'misc-cannon-9-pounder', itemId:'cannon', variantId:'9-pounder', label:'Cannon · 9-pounder', kind:'cannon' },
  'misc-cannon-18-pounder': { id:'misc-cannon-18-pounder', itemId:'cannon', variantId:'18-pounder', label:'Cannon · 18-pounder', kind:'cannon' },
  'misc-cannon-36-pounder': { id:'misc-cannon-36-pounder', itemId:'cannon', variantId:'36-pounder', label:'Cannon · 36-pounder', kind:'cannon' },
  'misc-prop-barrel': { id:'misc-prop-barrel', itemId:'barrel', label:'Cargo Barrel', kind:'barrel', dimensions:[1.05,.82,.82], partNames:['barrel-body','barrel-top','barrel-bottom','stave-set','hoop-top','hoop-middle','hoop-bottom'] },
  'misc-prop-crate': { id:'misc-prop-crate', itemId:'crate', label:'Cargo Crate', kind:'crate', dimensions:[.95,.82,.82], partNames:['crate-core','front-planks','rear-planks','port-planks','starboard-planks','top-planks','corner-braces','iron-fasteners'] },
  'misc-prop-lantern': { id:'misc-prop-lantern', itemId:'lantern', label:'Deck Lantern', kind:'lantern', dimensions:[.48,.48,.82], partNames:['lantern-base','lantern-frame','lantern-glass','lantern-roof','lantern-vent','lantern-handle'] },
  'misc-prop-bollard': { id:'misc-prop-bollard', itemId:'fitting', label:'Mooring Bollard', kind:'fitting', dimensions:[.55,.55,.75], partNames:['bollard-foot','bollard-stem','bollard-head','bollard-collar','mounting-bolts'] }
});

const DEFAULTS = Object.freeze({
  'misc-cannon-9-pounder': CANNON_9_DEFAULTS,
  'misc-cannon-18-pounder': CANNON_18_DEFAULTS,
  'misc-cannon-36-pounder': CANNON_36_DEFAULTS,
  'misc-prop-barrel': BARREL_DEFAULTS,
  'misc-prop-crate': CRATE_DEFAULTS,
  'misc-prop-lantern': LANTERN_DEFAULTS,
  'misc-prop-bollard': BOLLARD_DEFAULTS
});

export const MISC_MODEL_IDS = Object.freeze(Object.keys(DEFINITIONS));

export const MISC_MODEL_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'miscellaneous',
    label: 'Miscellaneous',
    items: Object.freeze([
      Object.freeze({ id:'cannon', label:'Cannon', variants:Object.freeze([
        Object.freeze({id:'9-pounder',label:'9-pounder'}),
        Object.freeze({id:'18-pounder',label:'18-pounder'}),
        Object.freeze({id:'36-pounder',label:'36-pounder'})
      ])}),
      Object.freeze({id:'barrel',label:'Cargo Barrel',variants:Object.freeze([Object.freeze({id:'default',label:'Standard'})])}),
      Object.freeze({id:'crate',label:'Cargo Crate',variants:Object.freeze([Object.freeze({id:'default',label:'Standard'})])}),
      Object.freeze({id:'lantern',label:'Deck Lantern',variants:Object.freeze([Object.freeze({id:'default',label:'Standard'})])}),
      Object.freeze({id:'fitting',label:'Mooring Bollard',variants:Object.freeze([Object.freeze({id:'default',label:'Standard'})])})
    ])
  })
]);

export const MISC_MODEL_CATALOGUE = Object.freeze({
  cannon:Object.freeze({id:'cannon',label:'Cannon',variants:Object.freeze(Object.keys(CANNON_PROFILES))}),
  barrel:Object.freeze({id:'barrel',label:'Cargo Barrel',variants:Object.freeze(['default'])}),
  crate:Object.freeze({id:'crate',label:'Cargo Crate',variants:Object.freeze(['default'])}),
  lantern:Object.freeze({id:'lantern',label:'Deck Lantern',variants:Object.freeze(['default'])}),
  fitting:Object.freeze({id:'fitting',label:'Mooring Bollard',variants:Object.freeze(['default'])})
});

export function isMiscModelId(id) {
  return Object.hasOwn(DEFINITIONS, String(id || ''));
}

export function getMiscModelDefinition(id) {
  const key=String(id||'');
  const entry=DEFINITIONS[key];
  if(!entry)return null;
  if(entry.kind==='cannon'){
    const profile=getCannonProfile(entry.variantId);
    if(!profile)return null;
    return {
      id:key,category:'miscellaneous',itemId:entry.itemId,variantId:entry.variantId,
      label:profile.label,hullLength:profile.barrelLengthMetres,beam:profile.carriageWidthMetres,
      draft:profile.wheelRadiusMetres,freeboard:profile.bodyRadiusMetres*2,masts:[],
      hullProfile:'Standalone non-functional display asset',
      reference:'Miscellaneous catalogue · independently editable model.',
      partNames:[...CANNON_PART_NAMES]
    };
  }
  return {
    id:key,category:'miscellaneous',itemId:entry.itemId,label:entry.label,
    hullLength:entry.dimensions[0],beam:entry.dimensions[1],draft:entry.dimensions[2],
    freeboard:entry.dimensions[2]*.55,masts:[],hullProfile:'Independent editable maritime prop',
    reference:'Original Verdant Reach maritime prop generator.',
    partNames:[...entry.partNames]
  };
}

export function getMiscModelDefaults(id) {
  return isMiscModelId(id) ? (DEFAULTS[id] || null) : null;
}

export function createMiscModel(id, componentTransforms = {}, savedState = {}) {
  const key=String(id||'');
  const entry=DEFINITIONS[key];
  if(!entry)throw new Error('Unknown miscellaneous model: '+key);
  switch(entry.kind){
    case 'cannon': return createCannonModel(entry.variantId,componentTransforms,savedState);
    case 'barrel': return createBarrelModel(componentTransforms,savedState);
    case 'crate': return createCrateModel(componentTransforms,savedState);
    case 'lantern': return createLanternModel(componentTransforms,savedState);
    case 'fitting': return createBollardModel(componentTransforms,savedState);
    default: throw new Error('No generator registered for '+key);
  }
}
