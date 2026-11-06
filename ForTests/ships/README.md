# ForTests Ships

Every file in `vessels/` owns a complete, independent geometry generator for
one vessel. Each builds its own hull form, surface, deck, framing, stern, bow,
rudder/helm, fittings, anchors, and rig/sails from its own design profile.

Each vessel also owns its own `halfBreadth()`, `deckY()`, `keelY()`,
`hullPoint()`, and `deckBreadthRatio()` calculations. The hull section is
parameterized from the keel centreline up to both gunwales. Its own deck-edge
breadth calculation is reused by the deck mesh, keeping the deck and hull shell
joined without a generic beam multiplier.

The `shared/` directory contains only editor/support infrastructure:

- `ship-editor-kit.js`: generic Three.js primitives/materials, editable
  component API, state save/restore, sail animation hooks, and cleanup. No
  vessel geometry algorithms live here.
- `vessel-definition.js`: validation, metadata derivation, and per-vessel
  editor overrides.

There is no shared geometry engine or generic hull algorithm. The removed
`ship-model-builder.js` and `hull-math.js` files are intentionally absent.
`index.js` only registers modules and dispatches a request to the chosen
vessel's own `createModel()` function.

To add a ship, implement its geometry in a new `vessels/<id>.js` module, then
register it in `index.js`. Keep museum measurements, archaeological evidence,
and reconstructed details clearly distinguished in the vessel's `reference`,
`sources`, and `modelScaleNote` fields.
