/**
 * Dedicated snow ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/snow.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Snow = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/snow.js',
);

export const id = Snow.id;
export const design = Snow.design;
export const structure = Snow.structure;
export const generate = Snow.generate;
export const generateSnow = generate;

export default Snow;
