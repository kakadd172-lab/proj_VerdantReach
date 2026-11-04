/**
 * Dedicated brig model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/brig.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Brig = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/brig.js',
);

export const id = Brig.id;
export const design = Brig.design;
export const structure = Brig.structure;
export const createModel = Brig.createModel;
export const generate = Brig.generate;
export const createBrigModel = createModel;
export const generateBrig = generate;

export default Brig;
