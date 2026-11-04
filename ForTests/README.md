# Verdant Reach v0.8.6 — Modular Ship Design Studio

The editor in this folder now runs the **actual v0.8.6 game ship system**. The preview adapters import the game's vessel definitions, structure profiles, shared hull mathematics, shared model builder and per-vessel generator registry from:

`V8/verdant-reach-v0.8.6/verdant-reach/src/world/ships/`

There is no second, copied ship catalogue in ForTests. Changes made in the editor are runtime overrides and are saved to `ForTests/design-overrides.json`; they do not rewrite the source vessel files or the main game.\n\nThe adapters preserve the exact `?v=0.8.6` module URLs used by the game builder, so editor overrides and generated vessels share one runtime state.

## What the studio can do

- Preview all 16 game vessels through their dedicated per-vessel generators.
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
git switch --track origin/chatgpt-v0.8.6-modular-ship-generators
cd ForTests
npm install
npm run check:modules
npm test
npm run build
npm run smoke
npm run dev
```

The ForTests `postinstall` installs the v0.8.6 game's Three.js dependency as well, because the preview imports those source files directly. The editor's Vite server is configured to read the v0.8.6 folder while keeping ForTests as its root and save destination.

Open `http://127.0.0.1:5174/`.

## Editing workflow

1. Choose one of the 16 vessels.
2. Select a component from the list or click it in the 3D viewport.
3. Use W / E / R for Move / Rotate / Scale, or enter numeric transforms.
4. Adjust hull and structure values in the design controls.
5. Use Ctrl+Z / Ctrl+Y to undo/redo across vessels and edit types.
6. Save to `design-overrides.json` or export a JSON backup.

## Source ownership

- `ship-designs.js`, `ship-structures.js`, `ship-hull-parameterization.js`, and `ship-models.js` in ForTests are thin adapters to the game source.
- The browser creates ships through the v0.8.6 `ships/index.js` generator registry.
- Each vessel's own definition and generator entry point lives in `src/world/ships/vessels/<id>.js`.
- The shared construction engine lives in `src/world/ships/core/ship-model-builder.js`.

To change a ship's permanent source design, edit that vessel's file under v0.8.6. To experiment safely, use the editor controls; those changes remain local to ForTests until deliberately promoted.
