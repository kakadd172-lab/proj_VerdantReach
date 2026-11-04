# ForTests modular ship modules

This folder is the editor-side ship collection. Each vessel has its own module
under `vessels/`; the editor routes model creation through that module rather
than calling an all-ships generator directly.

## Layout

```text
ships/
├── index.js
├── README.md
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

Every `vessels/<id>.js` file exports its own design and structure references,
a `createModel()` function, and a named generator (for example,
`createSloopModel()` and `generateSloop()`). Calling that function creates a
new, separate Three.js ship model instance, with that vessel's own hull form,
framing, deck, stern and bow works, masts, rigging, sails, fittings and
editable component hierarchy.

The historical dimensions, rig and structural profile remain authoritative in
the matching game source module at
`V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/<id>.js`.
The per-vessel ForTests module calls that ship's actual game generator, so
editor and game designs cannot silently drift apart.

## Shared geometry

`shared/define-vessel.js` connects each dedicated generator to the v0.8.6
model engine. The engine reuses common Three.js geometry-building routines and
the editable component API, but generates a distinct model instance using the
selected vessel's own design and structure data. This avoids maintaining 16
copies of low-level geometry code without turning the ships into one generic
design.

To change a vessel's permanent design, edit its matching game source module.
To experiment in the editor, use the design controls; those runtime overrides
stay in `ForTests/design-overrides.json`.
