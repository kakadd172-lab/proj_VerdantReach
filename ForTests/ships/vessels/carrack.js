/**
 * Dedicated carrack model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/carrack.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Carrack = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/carrack.js',
);

export const id = Carrack.id;
export const design = Carrack.design;
export const structure = Carrack.structure;
export const createModel = Carrack.createModel;
export const generate = Carrack.generate;
export const createCarrackModel = createModel;
export const generateCarrack = generate;

export default Carrack;
