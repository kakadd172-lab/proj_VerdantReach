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


## Proportion refinement

Each module now owns four independent hull-shape functions:

- `halfBreadth()` controls the longitudinal run of the waterline and the
  distribution of beam from bow through midbody to stern.
- `hullPoint()` controls the vessel's vertical cross-section, bilge fullness,
  deck-edge breadth, flare and tumblehome. Each profile parameterizes its
  section from the keel centreline to both gunwales, so the top edge reaches
  the deck rather than pinching to the centreline.
- `deckBreadthRatio()` returns the exact deck-edge breadth implied by that
  vessel's own tumblehome and flare; the deck surface uses the same value so
  the planking and hull shell meet without a generic width multiplier.
- `deckY()` controls that vessel's sheer and its separate bow and stern rise.
- `keelY()` controls the rocker and how the keel approaches the ends; the
  deepest midbody section reaches the stated design draft.

The profiles are deliberately not shared presets. A fluit keeps a fuller lower
body and a narrower upper deck; a xebec remains long and fine; a junk carries
a broader, flatter lower section; and the pinnace remains a small open tender.
The rig and fitting functions also remain inside the corresponding vessel file.

### Reference policy

Dimensions copied from a named museum model or documented vessel are identified
in that vessel's `reference` and `sources` fields. A type-wide reconstruction
or an unpreserved hull/rig offset is marked as an estimate. Ratios are checked
against the selected reference variant, not treated as universal rules for
every ship carrying the same historical name.

Examples used in this refinement include:

- The Dutch frigate `'t Hart`: 30.8 m length and 8.4 m beam, from the
  archaeological study of the wreck identification.
- The early fluit `Witte Swaen` (1636): estimated 32.75 ± 2% m length and
  6.7 ± 2% m breadth, with evidence for a three-mast arrangement. The fluyt
  generator uses this early, long-and-narrow reference rather than blending
  its dimensions with a later, broader museum-model variant.
- A circa-1490 Portuguese caravel model at Royal Museums Greenwich: 65 ft by
  23 ft, illustrated as a four-masted redonda form.
- The 1856 barque `Ravensworth`: 131 ft length by 29 ft beam, with a
  documented three-masted barque rig.
- The 1838 William Symonds 32-foot pinnace design: used as the tender's length
  reference, while the remaining dimensions are explicitly reconstructed.

These references constrain scale and silhouette; they are not claims that a
parametric mesh is a traced original lines plan.

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
git switch --track -c chatgpt-v0.8.7-vessel-proportion-refinement origin/chatgpt-v0.8.7-vessel-proportion-refinement
git pull --ff-only origin chatgpt-v0.8.7-vessel-proportion-refinement
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
