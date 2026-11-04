/**
 * Dedicated brigantine ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/brigantine.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Brigantine = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/brigantine.js',
);

export const id = Brigantine.id;
export const design = Brigantine.design;
export const structure = Brigantine.structure;
export const generate = Brigantine.generate;
export const generateBrigantine = generate;

export default Brigantine;
