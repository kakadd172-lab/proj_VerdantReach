# Verdant Reach — Independent Ship Design Studio

This workspace is deliberately isolated under `ForTests/`. The main game and
its ship implementation are not changed by this refactor.

All 16 vessel types now generate their geometry independently. Each file in
`ships/vessels/` owns its own hull breadth and cross-section mathematics,
surface loft, deck plan, framing/planking, stern, bow, rudder/helm, railings,
anchors, deck fittings, and rig/sail construction. A vessel does not pass its
specification into a generic ship geometry engine.

## Layout

```text
ForTests/
├── index.html
├── preview.js
├── tests/
├── ships/
│   ├── index.js
│   ├── README.md
│   ├── shared/
│   │   ├── vessel-definition.js
│   │   └── ship-editor-kit.js
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

## Per-vessel generation

Each vessel module contains its historical/reference notes, dimensions,
hull/structure proportions, and complete geometry-generation functions. The
sixteen hull breadth algorithms are separately authored; hull section math,
stern treatment, bow arrangement, rig layout, and fittings are local to each
vessel file. To change a galleon, edit `ships/vessels/galleon.js`; that does
not route through a central hull or ship builder.

The shared directory is intentionally limited to support code:

- `vessel-definition.js` validates immutable ship specifications and applies
  editor-only dimension/structure overrides.
- `ship-editor-kit.js` provides low-level Three.js primitives/materials,
  editable component state, animation hooks, summary metadata, and resource
  disposal. It contains no hull, deck, stern, bow, or rig generation routine.

The old `ship-model-builder.js` and `hull-math.js` shared geometry engine files
have been removed. The ship registry in `ships/index.js` only registers the
sixteen generator modules and exposes the editor API.

## Editor capabilities

- Preview all 16 independently generated vessel models.
- Inspect editable components, mesh counts, materials, transformed bounds,
  hull dimensions and model metadata.
- Move, rotate and scale parts with TransformControls or numeric inputs.
- Use local/world transform space, snapping, camera presets, component focus,
  and fullscreen viewport mode.
- Search, hide/show, isolate, detach/relink and reset components.
- Undo/redo edits, imports, design overrides and transforms.
- Tune each vessel's dimensions and structure independently.
- Inspect hull cross-sections, measure spans, and compare two ship dimensions.
- Save/import/export JSON designs and capture the viewport as a PNG.
- Toggle wireframe, grid and shadows.

## Setup

Requires Node.js 22+, npm, and a WebGL-capable browser.

```powershell
cd D:\Projects\VerdantReach
git fetch origin
git switch --track -c chatgpt-v0.8.7-independent-vessel-generators origin/chatgpt-v0.8.7-independent-vessel-generators
git pull --ff-only origin chatgpt-v0.8.7-independent-vessel-generators
cd ForTests
npm install
npm run check:modules
npm test
npm run build
npx playwright install chromium
npm run smoke
npm run dev
```

Open `http://127.0.0.1:5174/`. Experiments are saved in
`design-overrides.json`; they do not rewrite the base vessel definition.


## Visual refinement pass — 0.8.8

The galleon, carrack, and first-rate now build their stern tiers as locally
authored tapered, bevelled extrusions instead of plain rectangular blocks.
Their stern windows have individual trim and mullions, with gallery balconies
and railings. The galleon and carrack also have raised forecastle deck surfaces
and bulwarks. Their gun decks now place framed, outward-facing gunports directly
on the vessel's own hull surface, with separate cannon assemblies.

These additions remain in the three vessel modules. No shared hull or stern
geometry builder has been introduced.


### Capital-ship form pass

The galleon, carrack and first-rate use individually shaped, bevelled stern-tier
shells with stronger shoulder taper. Their stern galleries now include separate
port and starboard window banks, mouldings, pilasters, projecting walkways,
balustrades and visible corbel supports. Galleon and carrack forecastles also
have raised side sheathing and an aft bulkhead connecting the higher deck to
the hull structure. The larger ships' gunports are laid onto the hull section
surface with separate frames and editable cannon assemblies.
