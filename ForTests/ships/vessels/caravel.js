/**
 * Dedicated caravel ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/caravel.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Caravel = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/caravel.js',
);

export const id = Caravel.id;
export const design = Caravel.design;
export const structure = Caravel.structure;
export const generate = Caravel.generate;
export const generateCaravel = generate;

export default Caravel;
