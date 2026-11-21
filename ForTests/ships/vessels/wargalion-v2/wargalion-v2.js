import EDITOR_DEFAULTS from './editor-defaults.js';
import { resolveVesselForGeneration } from '../../shared/vessel-definition.js';
import { createShipContext, finishShipModel } from '../../shared/ship-editor-kit.js';
import { WARGALION_V2_ARCHITECTURE } from './architecture/layout.js';
import { WARGALION_V2_SOURCE } from './architecture/blueprint-data.js';
import { buildHull } from './generators/hull/hull-generator.js';
import { buildKeel } from './generators/hull/keel-generator.js';
import { buildStem } from './generators/hull/stem-generator.js';
import { buildSternpost } from './generators/hull/sternpost-generator.js';
import { buildTransom } from './generators/hull/transom-generator.js';
import { buildDeck } from './generators/decks/deck-generator.js';
import { buildAftercastle } from './generators/cabins/aftercastle-generator.js';
import { buildForecastleBulwark } from './generators/cabins/forecastle-bulwark-generator.js';

/**
 * Hull-and-cabin stage only. Mast and rigging geometry are intentionally not
 * generated in this version; the editor still receives the standard model
 * lifecycle and each physical assembly remains independently editable.
 */
export const WargalionV2Definition = Object.freeze({
  id: 'wargalion-v2',
  editorModulePath: 'ForTests/ships/vessels/wargalion-v2/wargalion-v2.js',
  gameDefinitionPath: 'src/world/ships/vessels/wargalion-v2.js',
  editorDefaults: EDITOR_DEFAULTS,
  design: Object.freeze({
    id: 'wargalion-v2',
    label: 'Wargalion V2',
    era: 'Late 16th-century Portuguese-built galleon reconstruction study',
    hullLength: 39.0,
    beam: 11.7,
    draft: 4.5,
    freeboard: 2.96,
    mouldedDepth: 6.2,
    rig: 'Deferred — hull and cabin geometry stage only; no mast or rigging meshes yet.',
    hullProfile: 'PCHIP-faired hull with 6.20 m scaled moulded depth, maximum breadth at the waterline, inward-tapered upper sides, connected keel, pronounced sheer and a fine bow run.',
    hullFormNote: 'The 6.20 m working moulded depth is scaled from Casado Soto’s 5.60 m estimate at 35.24 m length to the 39.0 m working model scale. Station ordinates remain reconstruction estimates, not digitized archival offsets. The widest section is constrained to the waterline, with inward-tapered topsides.'
    modelScaleNote: '39.0 × 11.7 m is the working scale reported for the San Martín model in Revista General de Marina (2007). Revista de Historia Naval (2012) cites Casado Soto’s estimated 35.24 × 10.51 × 5.60 m dimensions. The 6.20 m moulded depth is derived by proportional scaling to the 39.0 m working length; it is not a separately recorded measurement.'
    reference: 'San Martín / São Martinho is the historical reference, but Wargalion V2 is a reconstruction study rather than a claim to reproduce a verified original shipyard plan.',
    sources: WARGALION_V2_SOURCE.sources.map(source => ({ label: source.title, url: source.url })),
    hull: {
      bowRake: 0.038,
      sternRake: 0.034,
      deckCamber: 0.065,
      forecastleRise: 0.52,
      quarterdeckRise: 0.72
    },
    sternwork: 'three narrowing aftcastle levels with framed timber walls, stepped decks and projecting stern galleries',
    sternTiers: [],
    masts: [],
    headsails: 0,
    oars: false,
    keelDetails: { label: 'V2 shaped keel', minimumRadius: 0.12 },
    rudderDetails: { label: 'deferred to later modelling stage' },
    editorPartNames: [...WARGALION_V2_ARCHITECTURE.editorPartNames]
  }),
  structure: Object.freeze({
    frameCount: 28,
    frameSpacing: 'future internal structure will be sampled from the shared hull surface',
    surfaceAuthority: './architecture/hull-surface.js'
  })
});

function assembleWargalionV2(transforms = {}, savedState = {}) {
  const vessel = resolveVesselForGeneration(WargalionV2Definition);
  const ctx = createShipContext(vessel, {
    hull: 0x74543a,
    lower: 0x403026,
    plank: 0x98704a,
    deck: 0xc1a174,
    trim: 0x57402d,
    brass: 0xb68b48,
    iron: 0x515b5d,
    glass: 0x83aeb2,
    rope: 0x755a3d
  });

  const generators = {
    hull: () => buildHull(vessel.design, ctx),
    keel: () => buildKeel(vessel.design, ctx),
    stem: () => buildStem(vessel.design, ctx),
    sternpost: () => buildSternpost(vessel.design, ctx),
    transom: () => buildTransom(vessel.design, ctx),
    deck: () => buildDeck(vessel.design, ctx),
    'forecastle-bulwark': () => buildForecastleBulwark(vessel.design, ctx),
    aftercastle: () => buildAftercastle(vessel.design, ctx)
  };

  for (const component of WARGALION_V2_ARCHITECTURE.assemblyOrder) {
    const generate = generators[component];
    if (typeof generate !== 'function') throw new Error('Wargalion V2 assembly is missing: ' + component);
    generate();
  }

  const root = finishShipModel(ctx, transforms, savedState);
  root.userData.shipArchitecture = WARGALION_V2_ARCHITECTURE;
  root.userData.shipAssemblyOrder = [...WARGALION_V2_ARCHITECTURE.assemblyOrder];
  root.userData.vesselProvenance = WARGALION_V2_SOURCE;
  root.userData.hullStage = 'hull-and-cabins';
  return root;
}

export function createWargalionV2Model(transforms = {}, savedState = {}) {
  return assembleWargalionV2(transforms, savedState);
}
export function generateWargalionV2(transforms = {}, savedState = {}) {
  return createWargalionV2Model(transforms, savedState);
}

export const WargalionV2 = Object.freeze({
  id: WargalionV2Definition.id,
  editorDefaults: EDITOR_DEFAULTS,
  definition: WargalionV2Definition,
  design: WargalionV2Definition.design,
  structure: WargalionV2Definition.structure,
  editorModulePath: WargalionV2Definition.editorModulePath,
  architecture: WARGALION_V2_ARCHITECTURE,
  createModel: createWargalionV2Model,
  generate: generateWargalionV2
});
export const id = WargalionV2.id;
export const design = WargalionV2.design;
export const structure = WargalionV2.structure;
export const createModel = WargalionV2.createModel;
export const generate = WargalionV2.generate;
export default WargalionV2;
