# Modular component-first ship runtime

## Runtime layout

All 16 vessels now have an independent folder under `src/world/ships/vessels/<id>/`.
Each folder owns:
- `<id>.js`: vessel definition, public generator entry point, and architecture-driven assembly.
- `editor-defaults.js`: per-vessel baseline editor data, loaded by the generator.
- `architecture/layout.js`: coordinate convention, component mounts, dependency graph, assembly order and mast stations.
- `architecture/hull-geometry.js`: the vessel's own hull-line and deck/keel equations.
- `generators/`: independent hull, keel, stem, deck, planking, frames, stern, cabins, bow, steering, deck equipment, anchors, sails, mast, rigging and ship-specific generators.

The game runtime's registry is `src/world/ships/index.js`. It calls the selected vessel's `createModel()` method; it does not pass every vessel through one shared geometry builder.

## Compatibility

Existing game systems may continue importing:
- `src/world/ship-designs.js`
- `src/world/ship-structures.js`
- `src/world/ship-models.js`
- `src/world/ship-hull-parameterization.js`

These paths are compatibility facades. The model-builder facade delegates to the vessel registry. The structure/hull math modules remain available to older callers and tests, but new vessel geometry is implemented in each vessel's own architecture and generator files.

## Saved component state

Each `editor-defaults.js` file can hold design, structure and component-state defaults specific to that vessel. Creative-mode entity state remains separately saved by the game's world-editing system. Geometry algorithm changes belong in the vessel's individual generator files.

## Adding a vessel

1. Create `vessels/<id>/`.
2. Add `<id>.js`, `editor-defaults.js`, `architecture/layout.js`, `architecture/hull-geometry.js` and the required component generators.
3. Register the module in `vessels/index.js`.
4. Add a runtime test that creates the vessel, checks its editable hierarchy and disposes its geometry/materials.
