/**
 * Dedicated galleon model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/galleon.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Galleon = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/galleon.js',
);

export const id = Galleon.id;
export const design = Galleon.design;
export const structure = Galleon.structure;
export const createModel = Galleon.createModel;
export const generate = Galleon.generate;
export const createGalleonModel = createModel;
export const generateGalleon = generate;

export default Galleon;
