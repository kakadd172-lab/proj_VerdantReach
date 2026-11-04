/**
 * Dedicated xebec ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/xebec.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Xebec = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/xebec.js',
);

export const id = Xebec.id;
export const design = Xebec.design;
export const structure = Xebec.structure;
export const generate = Xebec.generate;
export const generateXebec = generate;

export default Xebec;
