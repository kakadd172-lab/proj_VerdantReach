import {
  createCannonModel,
  CANNON_PROFILES,
  CANNON_PART_NAMES,
  getCannonProfile
} from '../vessels/cannons/index.js';
import CANNON_9_DEFAULTS from './cannons/9-pounder/editor-defaults.js';
import CANNON_18_DEFAULTS from './cannons/18-pounder/editor-defaults.js';
import CANNON_36_DEFAULTS from './cannons/36-pounder/editor-defaults.js';

export const MISC_MODEL_REGISTRY_VERSION = '0.1.0';

const CANNON_DEFAULTS = Object.freeze({
  '9-pounder': CANNON_9_DEFAULTS,
  '18-pounder': CANNON_18_DEFAULTS,
  '36-pounder': CANNON_36_DEFAULTS
});

export const MISC_MODEL_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'miscellaneous',
    label: 'Miscellaneous',
    items: Object.freeze([
      Object.freeze({
        id: 'cannon',
        label: 'Cannon',
        variantLabel: 'Cannon variant',
        variants: Object.freeze([
          Object.freeze({ id: '9-pounder', label: '9-pounder' }),
          Object.freeze({ id: '18-pounder', label: '18-pounder' }),
          Object.freeze({ id: '36-pounder', label: '36-pounder' })
        ])
      })
    ])
  })
]);

export const MISC_MODEL_IDS = Object.freeze(
  Object.keys(CANNON_DEFAULTS).map(variant => 'misc-cannon-' + variant)
);

export const MISC_MODEL_CATALOGUE = Object.freeze({
  cannon: Object.freeze({
    id: 'cannon',
    label: 'Cannon',
    variants: Object.freeze(Object.keys(CANNON_PROFILES))
  })
});

export function isMiscModelId(id) {
  return MISC_MODEL_IDS.includes(String(id || ''));
}

export function getMiscModelDefinition(id) {
  const match = /^misc-cannon-(9|18|36)-pounder$/.exec(String(id || ''));
  if (!match) return null;
  const variant = match[1] + '-pounder';
  const profile = getCannonProfile(variant);
  if (!profile) return null;
  return {
    id: 'misc-cannon-' + variant,
    category: 'miscellaneous',
    itemId: 'cannon',
    variantId: variant,
    label: profile.label,
    hullLength: profile.barrelLengthMetres,
    beam: profile.carriageWidthMetres,
    draft: profile.wheelRadiusMetres,
    freeboard: profile.bodyRadiusMetres * 2,
    masts: [],
    hullProfile: 'Standalone, non-functional visual model.',
    reference: 'Miscellaneous model catalogue · editable visual asset.',
    partNames: [...CANNON_PART_NAMES]
  };
}

export function getMiscModelDefaults(id) {
  const definition = getMiscModelDefinition(id);
  return definition ? (CANNON_DEFAULTS[definition.variantId] || null) : null;
}

export function createMiscModel(id, componentTransforms = {}, savedState = {}) {
  const definition = getMiscModelDefinition(id);
  if (!definition) throw new Error('Unknown miscellaneous model: ' + String(id));
  return createCannonModel(definition.variantId, componentTransforms, savedState);
}
