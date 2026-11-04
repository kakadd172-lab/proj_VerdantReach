/**
 * Dedicated frigate model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/frigate.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Frigate = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/frigate.js',
);

export const id = Frigate.id;
export const design = Frigate.design;
export const structure = Frigate.structure;
export const createModel = Frigate.createModel;
export const generate = Frigate.generate;
export const createFrigateModel = createModel;
export const generateFrigate = generate;

export default Frigate;
