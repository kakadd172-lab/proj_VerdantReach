/**
 * Dedicated carrack ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/carrack.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Carrack = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/carrack.js',
);

export const id = Carrack.id;
export const design = Carrack.design;
export const structure = Carrack.structure;
export const generate = Carrack.generate;
export const generateCarrack = generate;

export default Carrack;
