/**
 * Dedicated cutter model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/cutter.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Cutter = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/cutter.js',
);

export const id = Cutter.id;
export const design = Cutter.design;
export const structure = Cutter.structure;
export const createModel = Cutter.createModel;
export const generate = Cutter.generate;
export const createCutterModel = createModel;
export const generateCutter = generate;

export default Cutter;
