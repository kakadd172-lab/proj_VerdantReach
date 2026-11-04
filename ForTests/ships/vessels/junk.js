/**
 * Dedicated junk model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/junk.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Junk = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/junk.js',
);

export const id = Junk.id;
export const design = Junk.design;
export const structure = Junk.structure;
export const createModel = Junk.createModel;
export const generate = Junk.generate;
export const createJunkModel = createModel;
export const generateJunk = generate;

export default Junk;
