# ForTests Ships

The `vessels/` directory is the independent source of truth for this editor's
16 ship definitions and generator entry points. Each file contains the complete
base specification for one vessel and exports its own `create<Name>Model()`
and `generate<Name>()` functions.

The `shared/` directory contains only generic systems:
- `ship-model-builder.js`: reusable Three.js geometry and editable part API.
- `hull-math.js`: vessel-independent parametric hull calculations.
- `vessel-definition.js`: validation, shared metadata, runtime overrides and
  the connection from an individual vessel specification to the builder.

No file in this folder imports vessel definitions from the main game. To add a
ship, create one new `vessels/<id>.js` file and register it in `index.js`.
