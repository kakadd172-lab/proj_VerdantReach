# Ship visual and sailing audit

Run `npm run visual-audit` to start the Vite editor in headless Chromium and
capture the registered fleet. The output is written to `visual-audit/` as PNG
screenshots plus `report.json`.

The GitHub Actions workflow verifies vessel modules, runs geometry/editor tests,
builds the production editor, and performs a browser-based visual audit. The
latest sailing audit also exercises the Sloop wind and steering test bench.

## What the browser audit exercises

- Vessel loading and viewport/camera views.
- Multi-component drag-box selection.
- Wind-from direction presets and wind speed.
- Gust toggle, pause/resume and simulation reset.
- Mast heel direction reversal: starboard wind heels to port, and port wind
  heels to starboard.
- Mast return towards neutral after wind is disabled.
- Sail full/reef/furl controls and their status readout.
- Rudder angle control, helm wheel linkage readout, and steering reset.
- Absence of uncaught browser page errors.

## What to inspect visually

The audit is a geometry-review aid, not a substitute for inspecting the models
interactively or checking historically accurate vessel references. When
reviewing sailing articulation, check that shroud/backstay lower ends remain
at the hull, the masthead ends follow the mast, and chainplates stay stationary.
When reviewing sail deployment, inspect the entire edge assembly: canvas,
panel seams and boltropes should gather around the tack together.

The wind response is a preview animation system, not a full aerodynamic or
hull-stability simulation. Its angular limits are deliberately restrained and
should not be treated as a validated real-world sailing model.

The output folders and screenshots are generated test artifacts; do not commit
them as vessel defaults or replace the saved `editor-defaults.js` modules
with visual-audit state.
