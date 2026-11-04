# Verdant Reach v0.8.6 — Modular Ship Design Studio

The editor runs the **actual v0.8.6 game ship system** through a dedicated
ForTests ship collection. The editor-side modules live in `ForTests/ships/`;
each vessel has its own file under `ForTests/ships/vessels/`, with an
individual generator entry point. The folder's registry and shared adapter
route those generators to the matching game vessel definitions and the
shared game model builder.

## Ship module layout

```text
ForTests/
└── ships/
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

Every vessel module creates a distinct model instance with that ship's own
hull, framing, deck, stern and bow work, masts, rigging, sails, fittings and
editable component hierarchy. The historical design and structure data remain
owned by the matching game source file, so the editor cannot silently drift
away from what the game actually creates. Common Three.js geometry routines
remain in the shared v0.8.6 model engine; this avoids 16 duplicated engines
while preserving a dedicated generator for every vessel.

## What the studio can do

- Preview all 16 game vessels through their dedicated per-vessel modules.
- Inspect the same editable component hierarchy used by the game.
- Move, rotate and scale components with Three.js TransformControls or numeric fields.
- Use Local/World transform space, snapping, camera presets and framing.
- Search, hide/show, isolate, detach/relink and reset components.
- Reset all components or restore a vessel's catalogue design.
- Undo/Redo design parameter edits, component transforms and vessel switches in one history.
- Adjust real game design and structural parameters through runtime overrides.
- Save overrides locally to `design-overrides.json` or export a JSON backup.
- Inspect wireframe, grid and shadow display modes.

## Requirements

- Node.js 22 or newer.
- npm.
- A browser with WebGL support.

## Install and run

From the repository root:

```powershell
cd D:\Projects\VerdantReach
git fetch origin
git switch chatgpt-v0.8.6-modular-ship-generators
git pull --ff-only origin chatgpt-v0.8.6-modular-ship-generators
cd ForTests
npm install
npm run check:modules
npm test
npm run build
npm run smoke
npm run dev
```

The ForTests `postinstall` installs the v0.8.6 game's Three.js dependency as
well, because the preview imports those source files directly. The editor's
Vite server is configured to read the v0.8.6 folder while keeping ForTests as
its root and save destination.

Open `http://127.0.0.1:5174/`.

## Editing workflow

1. Choose one of the 16 vessels.
2. Select a component from the list or click it in the 3D viewport.
3. Use W / E / R for Move / Rotate / Scale, or enter numeric transforms.
4. Adjust hull and structure values in the design controls.
5. Use Ctrl+Z / Ctrl+Y to undo/redo across vessels and edit types.
6. Save to `design-overrides.json` or export a JSON backup.

## Source ownership

- `ForTests/ships/vessels/<id>.js` provides one editor-side module and named
  generator for each ship.
- `ForTests/ships/index.js` is the editor's vessel registry.
- `ForTests/ships/shared/define-vessel.js` connects each module to the shared
  v0.8.6 model builder.
- The authoritative ship definition (design and structure) remains in
  `V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/vessels/<id>.js`.
- The reusable model-construction engine lives in
  `V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/core/ship-model-builder.js`.

To change a ship's permanent source design, edit that vessel's game file. To
experiment safely, use the editor controls; those changes remain local to
ForTests until deliberately promoted.
