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
## 0.8.8 — distinct deck layouts and working-ship fittings

Every vessel now owns a separate `buildSignatureDeckFeatures()` routine and a
list of named `detailParts`, which are registered as editable editor components.
The additions are vessel-specific rather than a shared prop preset:

- Sloop and schooner: cabins, binnacle, cargo boom, deck winch/capstan and mast partners.
- Brigantine, brig and snow: quarterdeck access, companionways, mast partners and working deck machinery; the snow also has its separate trysail-mast support.
- Cutter and pinnace: open cockpit/boat details, windlass or removable mast step, tiller and oarlock infrastructure.
- Caravel, carrack and galleon: different forecastle/beakhead arrangements, mast partners, stern walkways and capstans.
- Fluyt and barque: cargo hatch coamings, winches, deckhouses and loading booms.
- Xebec and junk: rowing thwarts and oarlocks or broad cargo covers, raised bulwark treatment and an axial-rudder tiller.
- Frigate and first-rate hull forms: converted to non-combat passenger/transport presentation layouts, without generated deck-gun or gunport geometry.

Each module sets its own strake-row and deck-seam density. Deck seams now follow
its calculated deck-edge breadth instead of a fixed generic multiplier. These
are original parametric reconstructions informed by the reference notes; they are
not traced historical lines plans. All new named detail groups are registered
through the editor's existing per-part transform, hide, detach and save-state API.
