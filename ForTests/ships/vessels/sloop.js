/**
 * Dedicated sloop model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/sloop.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Sloop = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/sloop.js',
);

export const id = Sloop.id;
export const design = Sloop.design;
export const structure = Sloop.structure;
export const createModel = Sloop.createModel;
export const generate = Sloop.generate;
export const createSloopModel = createModel;
export const generateSloop = generate;

export default Sloop;
