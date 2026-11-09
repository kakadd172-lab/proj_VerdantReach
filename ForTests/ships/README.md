# ForTests Ships

All **16 vessels** in the shipyard now use the same component-first folder architecture. Each vessel owns its geometry algorithms, component generators, mast-instance entry points, and assembly plan. The shared folder is limited to low-level editor lifecycle and definition/override support.

## Vessel folders

Every vessel has its own folder under `vessels/`:

- `barque/`
- `brig/`
- `brigantine/`
- `caravel/`
- `carrack/`
- `cutter/`
- `first-rate/`
- `fluyt/`
- `frigate/`
- `galleon/`
- `junk/`
- `pinnace/`
- `schooner/`
- `sloop/`
- `snow/`
- `xebec/`

Each vessel folder contains:

- `<vessel>.js`: the vessel definition, public generator facade, imports its own editor defaults, and exposes its architecture-driven assembler.
- `editor-defaults.js`: the saved default design, structure, and component-state data written by the Ship Design Studio. It is loaded automatically when that vessel is generated; it does not replace or combine the vessel's part-generator source files.
- `architecture/layout.js`: coordinate convention, component mounts, assembly order, dependency graph, and individual mast stations / scale factors.
- `architecture/hull-geometry.js`: that vessel's own deck-height, keel-depth, half-breadth, and hull-section equations.
- `generators/`: separate ship-local builders for the hull, keel, stem, deck, frames, hull and deck planking, stern, cabins, bow, rudder, helm, railings, deck equipment, anchors, sail cloth, headsails, mast structures, and standing rigging.
- `generators/masts/<mast>-generator.js`: a dedicated entry point for every mast fitted to that vessel.
- `generators/special/` (where needed): ship-specific additions such as a fluyt cargo deck and spritsail, schooner deckhouse, snow trysail supports, or xebec oar banks.

The assembly facade follows `architecture/layout.js` in order and exposes the architecture on the finished model as `userData.shipArchitecture`. Component geometry is not routed through a universal hull, sail, cabin, or mast builder. Each vessel retains its own shape functions, sail profile, dimensions, rig plan, palette, and special features.

## Shared support

The `shared/` directory contains only editor/support infrastructure:

- `ship-editor-kit.js`: generic Three.js primitives/materials, editable component API, state save/restore, sail animation hooks, and cleanup. It contains no vessel geometry algorithms.
- `vessel-definition.js`: validation, metadata derivation, and per-vessel editor overrides. Every vessel declares its own editor module path.

## Customizing and saving a ship

Use the Ship Design Studio for component transforms, visibility, detachment, rudder and sail state, and exposed design/structure parameters. **Save to ship files** writes those values into that vessel's `editor-defaults.js` module; the generator imports and applies those values on every new model build. Export is a separate JSON backup, and importing a backup creates a draft until it is saved.

To change the actual geometry algorithm or add/change component geometry, edit the matching generator inside that ship's folder. Update that ship's `architecture/layout.js` when a component mount, dependency, mast station, or assembly order changes. A change in one vessel's generator should not change another vessel.

The architecture makes components independently inspectable and replaceable; it does not claim the generated meshes are museum-scanned CAD models or exact surviving lines plans.
