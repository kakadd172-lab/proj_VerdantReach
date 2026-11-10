# Verdant Reach — Independent Ship Design Studio

This workspace is deliberately isolated under `ForTests/`. The main game and
its ship implementation are not changed by this refactor.

All 16 vessel types generate their geometry independently and now use
component-first folders under `ships/vessels/<id>/`. Each vessel has its own
definition, architecture blueprint, saved editor-defaults module, and separate
ship-local component generators. No vessel passes its specification into a
generic ship geometry engine.

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
│       ├── sloop/
│       │   ├── sloop.js
│       │   ├── editor-defaults.js
│       │   ├── architecture/
│       │   └── generators/
│       ├── schooner/
│       ├── brigantine/
│       ├── brig/
│       ├── snow/
│       ├── cutter/
│       ├── frigate/
│       ├── barque/
│       ├── caravel/
│       ├── carrack/
│       ├── galleon/
│       ├── fluyt/
│       ├── xebec/
│       ├── junk/
│       ├── first-rate/
│       └── pinnace/
└── ...
```

## Per-vessel generation

Each vessel owns its historical/reference notes, dimensions, hull/structure
proportions, architecture blueprint, and component generators. Edit the
relevant component generator inside `ships/vessels/<id>/generators/` and update
that vessel's `architecture/layout.js` when mount points, dependencies, mast
stations or assembly order change. The registry only selects the vessel-specific
module; it does not provide a shared geometry builder.

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
- Test wind-from direction and speed, gusts, pause/resume and reset without
  changing saved vessel defaults.
- Watch every mast's live heel/rake around its mast-step pivot; mast-supporting
  stays adjust while deck ends remain fixed.
- Steer the rudder with the test slider and see the helm wheel follow its axle
  pivot through the configured steering ratio.
- Set all sails full, reefed or furled; canvas, panel seams and boltropes gather
  together towards each sail's tack.

## Local setup on Windows

Requirements: Node.js 22 or newer, npm, Git, and a WebGL-capable browser.
The existing project checkout is assumed to be `D:\Projects\VerdantReach`.

Open PowerShell and switch to the testing/infrastructure branch:

```powershell
cd D:\Projects\VerdantReach
git status --short
git fetch origin
git switch test-integrity-infrastructure
git pull --ff-only origin test-integrity-infrastructure
```

If the local branch does not exist yet, create it from the remote branch:

```powershell
git switch --track -c test-integrity-infrastructure origin/test-integrity-infrastructure
```

Install the shipyard dependencies (first setup, or after dependency changes):

```powershell
cd D:\Projects\VerdantReach\ForTests
npm install --no-audit --no-fund
```

Run the quick checks before opening the editor:

```powershell
npm run check:modules
npm test
npm run build
npx playwright install chromium
npm run smoke
```

Start the local preview:

```powershell
npm run dev
```

Open `http://127.0.0.1:5174/`. Leave that PowerShell window running while
using the studio; press `Ctrl+C` there to stop the server.

### Open a vessel directly

The preview supports direct-review links:

- Barque side: `http://127.0.0.1:5174/?ship=barque&camera=side`
- Barque bow: `http://127.0.0.1:5174/?ship=barque&camera=bow`
- Barque stern: `http://127.0.0.1:5174/?ship=barque&camera=stern`
- Barque top: `http://127.0.0.1:5174/?ship=barque&camera=top`

Add `&part=hull` (or another component name) to preselect a component. Supported
camera values are `side`, `bow`, `stern`, and `top`.

### Run a focused visual audit

Install Playwright's Chromium browser once:

```powershell
npx playwright install chromium
```

Stop the manually running preview with `Ctrl+C`, then run:

```powershell
npm run audit:barque
```

The script starts its own Vite server and writes screenshots plus
`visual-audit/report.json` inside `ForTests/`. It captures a front-quarter
view and side, bow, stern and top views for Barque. To inspect another vessel,
run `npm run audit:vessel -- brig` (or another vessel id). To audit the whole
fleet, run `npm run visual-audit`.

### Persistent vessel authoring

Each vessel folder contains an `editor-defaults.js` module alongside its own
`<vessel>.js`, `architecture/`, and `generators/` files. The vessel definition
imports that defaults module, and the shared model lifecycle applies its design,
structure and component-state defaults when that vessel is generated.

Use **Save to ship files** in the local editor to write the effective design of
all vessels into their own `ships/vessels/<id>/editor-defaults.js` files. The
local Vite save endpoint validates vessel IDs, component names, transform values
and state types before writing. It writes each module atomically and clears the
old shared `design-overrides.json` migration file after a successful save. The
editor reloads from the saved modules, so the preview checks the files that will
actually be committed.

**Export backup** downloads a full-fleet JSON backup; it does not write project
files. **Import JSON** loads a draft into the editor; it does not write project
files until Save is pressed. **Restore generator originals** replaces only the
selected vessel's `editor-defaults.js` with an empty defaults manifest. It does
not modify that vessel's part-generator source.

Component transforms, visibility, detachment, sail deployment/trim, mast lean,
rudder state and design/structure overrides are stored as data defaults. They
remain isolated to the corresponding vessel. Edits to geometry algorithms still
belong in that vessel's individual `generators/` files.

## Sailing articulation and wind test bench

Open the **Wind & steering test bench** in the preview editor.

- **Wind direction** is a wind-from angle relative to the vessel: 0° bow,
  90° starboard, 180° stern, and 270° port. The compass readout and presets
  use the same convention.
- **Wind speed** ranges from 0 to 30 knots. The optional gust switch varies
  the applied visual wind pressure. Pause freezes the current animation pose;
  Reset test returns wind, sails and steering to their default test state.
- Each mast has a nested **mast-step pivot**. Wind applies limited sideways
  heel (up to 2.5°) and fore-and-aft rake (up to 1.2°), and the live readout
  shows the actual angles for every mast.
- Standing shrouds and backstays follow their masthead attachment while their
  lower ends remain fixed at the hull. Their existing tube geometry is updated
  in place; it is not rebuilt on every animation frame.
- Each rudder rotates about its stock pivot. The helm wheel rotates about its
  axle and follows the rudder angle using that vessel's configured ratio.
- **Set full**, **Reef sails**, and **Furl sails** act on every mast in the
  selected vessel. The canvas, panel seams and boltropes share one deployment
  group and gather around the sail tack. Sail deployment is stored as
  per-vessel component state.

This is an editor/visual test system, not a full aerodynamic, hull-stability or
navigation simulation. The direction response and angular limits are tunable
preview values; they should be treated as animation controls until a separate
gameplay wind-and-sailing physics model is implemented.

## Barque-first review pass

Start with the Barque before changing the other four component-first vessels:

1. **Side** — length-to-beam impression, keel rocker, sheer, bow entry,
   counter/stern overhang, rudder position, and mast rake/spacing.
2. **Top** — maximum beam position, bow taper, stern run, deck area, mast
   stations, yard widths, and sail overlap.
3. **Bow and stern** — stem rake, bowsprit alignment, transom/counter width,
   aft-cabin silhouette, gallery and rudder clearance.
4. **Rigging** — square courses and upper sails on fore/main, fore-and-aft
   mizzen, stays, shrouds, and headsail spacing.
5. **Components** — select hull, deck, each mast, sails, rudder and stern
   cabin in the part inspector to confirm they remain independently editable.

Record visual issues before changing formulas. The current model is a
parametric reconstruction, not museum-scanned CAD; check the reference notes
before changing historically significant hull or rig proportions.

When reviewing mast movement, inspect both the mast's heel/rake and the
shroud/backstay lower endpoints. When reviewing furling, check that the cloth,
seams and boltropes collapse together without moving the tack.

## Sailing articulation and rigging refinement — 0.8.10

The preview adds wind direction/speed, gusts, pause/resume, and a safe test
reset. All 16 vessels now receive nested mast-step, rudder-stock and helm-axle
pivots through the shared editor lifecycle. Mast heel/rake remains separate
from saved editor transforms, the helm wheel follows the rudder, and
mast-supporting rigging adjusts in place while holding its hull attachment.

Sail deployment now has full, reefed and furled modes in the preview. The
entire sail assembly (canvas, panel seams and boltropes) gathers around the
tack, and resetting a sail restores its full deployment without overwriting
saved editor defaults.

## Visual refinement pass — 0.8.9

The editor now writes validated per-vessel defaults modules, loads those modules
as part of each vessel's generator lifecycle, supports full-fleet backup/import,
and can restore one vessel to its original generator defaults.

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


### Folded-back cabin silhouettes

Aft cabins are shaped in vessel-local proportions from each hull's beam, stern
deck height and stern-tier dimensions. Their side profile rises at the forward
bulkhead and folds down in successive rearward roof panels, with visible fold
ribs, side windows and trim. The small craft keep their open-boat forms rather
than receiving an invented enclosed cabin. The galleon, carrack and first-rate
retain their multi-tier aftercastles and carry the folded roof profile on the
upper cabin; the schooner's low deckhouse uses its own folded profile.


### Fleet-wide sail proportion pass

All 16 independent rig generators now derive sail cloth fullness from the
actual sail span and height, rather than a tiny fixed displacement. Square
courses, topsails and topgallants are spaced over more of the mast and sized
from hull length, with a broad lower course and progressively narrower upper
sails. Gaff and trysail panels use taller, more balanced trapezoids; lateen
yards and sails have a longer working span; Chinese junk sails have broader
trapezoidal cloth and nine individually generated battens. Headsails are
placed as a staggered fan along the fore stay. Mast lower/top sections are
also tapered instead of using constant-diameter rods.

The geometry tests check that generated cloth has real three-dimensional
fullness and usable sail area, and that square lower courses remain in scale
with each hull.


## Component-first fleet

All 16 vessels use per-vessel folders under `ships/vessels/<id>/`. Each folder
owns its ship definition, architecture, individual component generators and
`editor-defaults.js` file. The registry selects each ship's module; it does not
provide a common geometry generator.
