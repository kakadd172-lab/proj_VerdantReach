/**
 * Dedicated cutter ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/cutter.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Cutter = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/cutter.js',
);

export const id = Cutter.id;
export const design = Cutter.design;
export const structure = Cutter.structure;
export const generate = Cutter.generate;
export const generateCutter = generate;

export default Cutter;
