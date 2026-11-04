/**
 * Dedicated barque model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/barque.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Barque = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/barque.js',
);

export const id = Barque.id;
export const design = Barque.design;
export const structure = Barque.structure;
export const createModel = Barque.createModel;
export const generate = Barque.generate;
export const createBarqueModel = createModel;
export const generateBarque = generate;

export default Barque;
