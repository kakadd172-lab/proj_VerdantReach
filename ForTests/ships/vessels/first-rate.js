/**
 * Dedicated first-rate ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/first-rate.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const FirstRate = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/first-rate.js',
);

export const id = FirstRate.id;
export const design = FirstRate.design;
export const structure = FirstRate.structure;
export const generate = FirstRate.generate;
export const generateFirstRate = generate;

export default FirstRate;
