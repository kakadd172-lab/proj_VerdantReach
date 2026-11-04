/**
 * Dedicated barque ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/barque.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Barque = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/barque.js',
);

export const id = Barque.id;
export const design = Barque.design;
export const structure = Barque.structure;
export const generate = Barque.generate;
export const generateBarque = generate;

export default Barque;
