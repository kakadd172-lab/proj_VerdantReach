/**
 * Compatibility entry point for older Sloop imports.
 *
 * The canonical Sloop definition and component-first generator live in
 * ./sloop/sloop.js. Keeping this adapter means an older import path cannot
 * accidentally expose the retired Caribbean merchant-sloop specification.
 */
import CanonicalSloop from './sloop/sloop.js';

export const Sloop = Object.freeze({
  ...CanonicalSloop,
  generate(factoryOrTransforms = {}, savedState = {}) {
    if (typeof factoryOrTransforms === 'function') {
      return factoryOrTransforms('sloop');
    }
    return CanonicalSloop.createModel(factoryOrTransforms, savedState);
  },
});

export default Sloop;
