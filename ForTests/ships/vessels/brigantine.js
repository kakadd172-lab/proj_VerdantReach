/**
 * Dedicated brigantine model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/brigantine.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Brigantine = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/brigantine.js',
);

export const id = Brigantine.id;
export const design = Brigantine.design;
export const structure = Brigantine.structure;
export const createModel = Brigantine.createModel;
export const generate = Brigantine.generate;
export const createBrigantineModel = createModel;
export const generateBrigantine = generate;

export default Brigantine;
