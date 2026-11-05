# Verdant Reach — Standalone Modular Ship Design Studio

The ForTests studio now owns a standalone fleet of 16 independently authored
vessel modules under `ships/vessels/`. Every vessel file owns its complete
ship-specific design specification, hull form, structural and framing
parameters, stern and keel details, rudder profile, mast arrangement, rigging
plan, and individual model/generator functions.

The four previous top-level adapter files are no longer required or present:
`ship-designs.js`, `ship-structures.js`,
`ship-hull-parameterization.js`, and `ship-models.js`.

## Layout

```text
ForTests/
├── preview.js
├── tests/
├── ships/
│   ├── index.js
│   ├── README.md
│   ├── shared/
│   │   ├── vessel-definition.js
│   │   ├── ship-model-builder.js
│   │   └── hull-math.js
│   └── vessels/
│       ├── sloop.js
│       ├── schooner.js
│       ├── brigantine.js
│       ├── brig.js
│       ├── snow.js
│       ├── cutter.js
│       ├── frigate.js
│       ├── barque.js
│       ├── caravel.js
│       ├── carrack.js
│       ├── galleon.js
│       ├── fluyt.js
│       ├── xebec.js
│       ├── junk.js
│       ├── first-rate.js
│       └── pinnace.js
└── ...
```

## Per-vessel ownership

Each file in `ships/vessels/` contains its own immutable base definition.
That includes historical reference notes and dimensions, hull fullness and
entry, sheer and keel shape, beam stations and frame profile, stern tiers,
keel/rudder proportions, mast positions and heights, rig types, sail counts,
and ship-specific options. It exports a separately named `create<Name>Model()`
and `generate<Name>()` entry point.

The shared `ships/shared/ship-model-builder.js` is a generic geometry engine:
it contains reusable routines for lofted hulls, decks, framing, planking,
stern/bow structures, masts, yards, rigging, sails, deck fittings and the
editable component API. It receives a complete vessel definition; it does not
look up ship designs by ID and contains no central vessel catalogue. Geometry
choices that differ by ship are data in that ship's own module.

`ships/shared/hull-math.js` contains ship-agnostic parametric hull math.
`ships/shared/vessel-definition.js` validates per-vessel definitions, derives
common display metadata, and maintains editor-only parameter overrides.
`ships/index.js` only registers the individual modules and exposes the editor
API; it does not hold the fleet's design data.

The ForTests runtime does not import the main game's per-vessel sources. The
actual game remains unchanged; this is an independent editor/test collection.

## Editor capabilities

- Preview all 16 vessel modules from their independent vessel files.
- Inspect the editable component hierarchy, mesh counts, materials and transformed bounds.
- Move, rotate and scale parts with TransformControls or precise numeric inputs.
- Use Local/World transform space, snapping, camera presets, component focus and fullscreen viewport mode.
- Search, hide/show, isolate, detach/relink and reset components.
- Undo/Redo across vessel changes, imported configurations, parameter edits and component transforms.
- Adjust each vessel's own hull and structural parameters.
- Inspect hull cross-sections with a movable clipping plane.
- Measure point-to-point spans directly on the 3D model.
- Compare the principal dimensions of two vessels side by side.
- Save local overrides to `design-overrides.json`, import a JSON backup, or export JSON.
- Capture the viewport as a PNG image.
- Inspect wireframe, grid and shadow modes.

The editor uses a calmer, collapsible workspace layout. The game title screen also
has a responsive comfort-focused redesign; the Survival/Creative selectors,
seed entry, saved-world library and existing start actions remain intact.

## Setup

Requires Node.js 22+, npm, and a WebGL-capable browser.

```powershell
cd D:\Projects\VerdantReach
git fetch origin
git switch --track -c chatgpt-v0.8.6-editor-menu-refresh origin/chatgpt-v0.8.6-editor-menu-refresh
git pull --ff-only origin chatgpt-v0.8.6-editor-menu-refresh
cd ForTests
npm install
npm run check:modules
npm test
npm run build
npx playwright install chromium
npm run smoke
npm run dev
```

Open `http://127.0.0.1:5174/`.

Experiments are saved in `design-overrides.json`; they do not rewrite a
vessel's base definition unless you deliberately edit and promote that file.
