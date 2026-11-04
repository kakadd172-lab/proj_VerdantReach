/**
 * Dedicated frigate ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/frigate.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Frigate = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/frigate.js',
);

export const id = Frigate.id;
export const design = Frigate.design;
export const structure = Frigate.structure;
export const generate = Frigate.generate;
export const generateFrigate = generate;

export default Frigate;
