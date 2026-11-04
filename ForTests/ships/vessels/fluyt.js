/**
 * Dedicated fluyt ship module for the ForTests Ship Design Studio.
 *
 * This file is the editor-side model/generator entry point for this vessel.
 * Its historical specification and geometry recipe come from the matching
 * game source module, while its output is a separate editable Three.js model.
 */
import SourceVessel from '../../../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/fluyt.js';
import { defineTestVessel } from '../shared/define-vessel.js';

export const Fluyt = defineTestVessel(
  SourceVessel,
  'ForTests/ships/vessels/fluyt.js',
);

export const id = Fluyt.id;
export const design = Fluyt.design;
export const structure = Fluyt.structure;
export const generate = Fluyt.generate;
export const generateFluyt = generate;

export default Fluyt;
