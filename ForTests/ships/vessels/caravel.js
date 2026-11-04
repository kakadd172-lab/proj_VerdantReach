/**
 * Dedicated caravel model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/caravel.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Caravel = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/caravel.js',
);

export const id = Caravel.id;
export const design = Caravel.design;
export const structure = Caravel.structure;
export const createModel = Caravel.createModel;
export const generate = Caravel.generate;
export const createCaravelModel = createModel;
export const generateCaravel = generate;

export default Caravel;
