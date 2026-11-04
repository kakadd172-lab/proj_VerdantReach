/**
 * Dedicated sloop ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
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
export const generate = Sloop.generate;
export const generateSloop = generate;

export default Sloop;
