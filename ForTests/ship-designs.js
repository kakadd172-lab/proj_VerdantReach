/**
 * Ship Design Studio adapter.
 * The editor consumes the actual v0.8.6 game catalogue; it does not keep a
 * second copy of the vessel designs.
 *
 * Keep the version query identical to the game builder's imports. Otherwise
 * the browser creates a second ES module instance with a separate override
 * store, and editor changes will not reach generated ships.
 */
export * from '../V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-designs.js?v=0.8.6';
