/**
 * Dedicated pinnace model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/pinnace.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Pinnace = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/pinnace.js',
);

export const id = Pinnace.id;
export const design = Pinnace.design;
export const structure = Pinnace.structure;
export const createModel = Pinnace.createModel;
export const generate = Pinnace.generate;
export const createPinnaceModel = createModel;
export const generatePinnace = generate;

export default Pinnace;
