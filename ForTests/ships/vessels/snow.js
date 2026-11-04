/**
 * Dedicated snow model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/snow.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Snow = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/snow.js',
);

export const id = Snow.id;
export const design = Snow.design;
export const structure = Snow.structure;
export const createModel = Snow.createModel;
export const generate = Snow.generate;
export const createSnowModel = createModel;
export const generateSnow = generate;

export default Snow;
