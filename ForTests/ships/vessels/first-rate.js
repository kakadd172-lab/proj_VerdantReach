/**
 * Dedicated first-rate model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/first-rate.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const FirstRate = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/first-rate.js',
);

export const id = FirstRate.id;
export const design = FirstRate.design;
export const structure = FirstRate.structure;
export const createModel = FirstRate.createModel;
export const generate = FirstRate.generate;
export const createFirstRateModel = createModel;
export const generateFirstRate = generate;

export default FirstRate;
