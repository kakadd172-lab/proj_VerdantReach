/**
 * Dedicated schooner ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/schooner.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Schooner = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/schooner.js',
);

export const id = Schooner.id;
export const design = Schooner.design;
export const structure = Schooner.structure;
export const generate = Schooner.generate;
export const generateSchooner = generate;

export default Schooner;
