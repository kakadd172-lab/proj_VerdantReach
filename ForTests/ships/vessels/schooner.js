/**
 * Dedicated schooner model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/schooner.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Schooner = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/schooner.js',
);

export const id = Schooner.id;
export const design = Schooner.design;
export const structure = Schooner.structure;
export const createModel = Schooner.createModel;
export const generate = Schooner.generate;
export const createSchoonerModel = createModel;
export const generateSchooner = generate;

export default Schooner;
