/**
 * Dedicated galleon ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/galleon.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Galleon = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/galleon.js',
);

export const id = Galleon.id;
export const design = Galleon.design;
export const structure = Galleon.structure;
export const generate = Galleon.generate;
export const generateGalleon = generate;

export default Galleon;
