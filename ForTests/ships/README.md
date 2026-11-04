# ForTests modular ship modules

This folder is the editor-side ship collection. Each vessel has its own module
under `vessels/`; the editor routes model creation through that module instead
of calling a single all-ships generator directly.

## Layout

```text
ships/
├── index.js
├── shared/
│   └── define-vessel.js
└── vessels/
    ├── sloop.js
    ├── schooner.js
    ├── brigantine.js
    ├── brig.js
    ├── snow.js
    ├── cutter.js
    ├── frigate.js
    ├── barque.js
    ├── caravel.js
    ├── carrack.js
    ├── galleon.js
    ├── fluyt.js
    ├── xebec.js
    ├── junk.js
    ├── first-rate.js
    └── pinnace.js
```

## What each vessel module owns

Each `vessels/<id>.js` file has its own editor module identity, vessel
specification reference, design and structure exports, and named generator
(for example, `generateSloop` or `generateGalleon`). Its generator produces
a distinct Three.js ship model with that vessel's hull shape, framing, decks,
stern and bow works, masts, rigging, sails, fittings, and editable component
hierarchy.

The historical specification remains in the matching game module at
`V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/<id>.js`.
This is deliberate: the editor and game share one authoritative design rather
than drifting copies.

## Shared geometry

`shared/define-vessel.js` connects each dedicated generator to the v0.8.6
model engine. The engine reuses geometry-building functions and the editable
component API, but builds a separate model instance for the selected vessel.
The shared engine is not a single generic ship: it reads that vessel's own
design and structure values.

To change a vessel's permanent design, edit its matching game source module.
To experiment in the editor, use the design controls; those runtime overrides
stay in `ForTests/design-overrides.json`.
