/**
 * Dedicated pinnace ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/pinnace.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Pinnace = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/pinnace.js',
);

export const id = Pinnace.id;
export const design = Pinnace.design;
export const structure = Pinnace.structure;
export const generate = Pinnace.generate;
export const generatePinnace = generate;

export default Pinnace;
