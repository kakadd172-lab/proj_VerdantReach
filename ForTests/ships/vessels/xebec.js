/**
 * Dedicated xebec model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/xebec.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Xebec = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/xebec.js',
);

export const id = Xebec.id;
export const design = Xebec.design;
export const structure = Xebec.structure;
export const createModel = Xebec.createModel;
export const generate = Xebec.generate;
export const createXebecModel = createModel;
export const generateXebec = generate;

export default Xebec;
