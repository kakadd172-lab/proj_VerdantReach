/**
 * Dedicated junk ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
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
export const generate = Junk.generate;
export const generateJunk = generate;

export default Junk;
