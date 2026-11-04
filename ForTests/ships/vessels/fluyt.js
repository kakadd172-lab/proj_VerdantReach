/**
 * Dedicated fluyt model and generator module for the ForTests Ship Design Studio.
 *
 * This file provides this vessel's own design reference, model creation
 * function and named generator. Its historical data and detailed Three.js
 * construction recipe are owned by the matching v0.8.6 game vessel module.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/fluyt.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Fluyt = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/fluyt.js',
);

export const id = Fluyt.id;
export const design = Fluyt.design;
export const structure = Fluyt.structure;
export const createModel = Fluyt.createModel;
export const generate = Fluyt.generate;
export const createFluytModel = createModel;
export const generateFluyt = generate;

export default Fluyt;
