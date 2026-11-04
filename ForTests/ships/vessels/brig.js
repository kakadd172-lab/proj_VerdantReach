/**
 * Dedicated brig ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/brig.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Brig = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/brig.js',
);

export const id = Brig.id;
export const design = Brig.design;
export const structure = Brig.structure;
export const generate = Brig.generate;
export const generateBrig = generate;

export default Brig;
