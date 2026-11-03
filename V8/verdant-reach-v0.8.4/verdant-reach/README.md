# Verdant Reach v0.8.4 — Caribbean Age of Sail

Verdant Reach v0.8.4 combines post-review galleon refinements with more populated towns, remodelled houses, richer markets and improved castle detailing. It retains the v0.8.3 fleet catalogue, v0.8.2 roads and earlier world systems.

## Play online

The v0.8.4 review build can be published with GitHub Pages at:

https://kakadd172-lab.github.io/proj_VerdantReach/

Publish the production `dist` folder from this version to the repository's `gh-pages` branch after reviewing the release.

## Run locally

### Windows static server
1. Extract the project.
2. Open the `verdant-reach` folder.
3. Double-click `run-static.bat`.
4. Open `http://localhost:8000`.

The static server loads Three.js from the configured CDN, so an internet connection is required unless that dependency is cached.

### Vite development server
```bash
npm install
npm run dev
```

### Automated tests
```bash
npm test
```

## v0.8.4 settlement-life and architecture updates

- Visible resident rosters: 32 in free cities, 16 in ports, 12 in market towns and 8 in villages.
- Residents have simple walk cycles and move between homes, markets, workplaces and the shore.
- Free-city markets contain 12 varied awning stalls; smaller settlements receive additional stalls and displayed goods.
- Houses gain plinths, timber framing, upper-storey overhangs, framed windows, shutters, gabled roofs and chimneys.
- Castle walls gain parapets, crenellations, stronger gatehouses and keep corner details.
- Galleon aftercastles become narrower and stepped; triangular headsails now meet their stays correctly.

## v0.8.1 shipyard improvements

- The selected vessel, linked component and mast remain selected when the Creative panel refreshes or is reopened during the same play session.
- Saved component translations and rotations are displayed in metres and degrees when their part is selected.
- Saved rudder angle, sail trim and mast lean are loaded into their corresponding editor controls.
- Transform values can be copied and pasted between components during the editing session. Pasted values are staged until the Apply button is used.
- Translation inputs snap to 0.1 m, and the shipyard shows the selected vessel's length, beam, draft, principal mast count, era and rig.
- Saved detached-part hierarchy is restored before local component offsets are reapplied.
- Page, stylesheet and ship-module cache keys advance to v0.8.1.

## v0.8.0 fleet foundation

### New fleet
- 14 representative vessel families: Caribbean merchant sloop, West Indies schooner, brigantine, brig, snow, cutter, frigate, barque, caravel, carrack/nao, galleon, fluyt, xebec and ship’s pinnace.
- Reference dimensions and rig details are distinguished from game reconstruction estimates. The fleet spans multiple centuries and regions; it is not a claim to cover every ship type ever built.
- Hull length, beam, draft and deck height use the same 1 metre = 4/3 world-unit scale as the 1.8 m player character.
- Parametric hulls use 56 longitudinal stations and 24 cross-section segments, with class-specific hull fullness, entry, stern form, tumblehome, sheer, bow rise, camber and draft.
- Distinct sail plans: square, gaff, lateen, brigantine and snow trysail arrangements, with auxiliary masts where appropriate.

### Articulated ship anatomy
- Hull, strakes, deck, keel, sternworks, galleries, bowworks, rudder, helm/wheel, anchors and railings are separate named groups.
- Mast lower sections, topmasts, mast steps/platforms, individual sail cloths, yards, booms, gaffs, lateen yards, head sails, shrouds, ratlines, stays, braces and sheets are independently addressable groups.
- Creative Shipyard can unlink/relink a component, hide/show it, move/rotate/reset its local transform, and adjust rudder angle, sail trim and mast lean.
- Selected larger vessels also have individually selectable decorative closed hull-port shutters; these are non-functional exterior details.
- Ship component state survives world saves and Creative duplication. Undo/redo remains a session-level editor feature.
- Sail animation and steering animate the appropriate component groups; this is not a full aerodynamic or hydrodynamic simulation.

### Historical reference catalogue
- Creative ship cards show each vessel’s dimensions, era, rig, hull-profile note, reference basis and source links.
- `SHIP_RESEARCH.md` documents each vessel and explains which dimensions are documented examples versus reconstruction estimates.
- *Pirates: Plague of the Dead* is a broad atmosphere reference only; all models and geometry are original and generated procedurally.

### Compatibility
- Legacy `sailing-ship` records still map to the sloop design and `large-ship` records map to the galleon design.
- Existing save database, world seeds, terrain-generation version, Creative/Survival mode, and persistent world edits are retained.
- The save metadata version advances to `0.8.0`; missing ship-part state defaults safely.

## Controls

| Key | Action |
|---|---|
| WASD | Move / steer while aboard a vessel |
| Shift | Run on foot |
| Mouse drag | Rotate camera |
| Mouse wheel | Zoom |
| E | Interact / gather |
| I / Tab | Inventory |
| J | Quest journal |
| M | World map |
| B | Creative world builder (Creative mode) |
| R | Board / dismount transport |
| Esc | Pause / close panel |

## Known limitations and verification

- The hulls are proportionally informed procedural reconstructions, not exact CAD models based on complete surviving lines plans. Some rigging geometry and secondary fittings are stylized.
- The fleet contains 14 representative types, not every historically documented vessel family. The xebec and fluyt are included as wider Atlantic/Mediterranean visitors rather than common Caribbean types.
- Sail trim, mast lean, rudder motion and sail flutter are component-level game approximations, not a physically complete wind/sail solver.
- No ship artillery, projectile system, or naval combat is part of this ship-model release. Decorative closed gunport shutters on selected hulls are static exterior fittings only.
- A production build and full graphical playthrough must be distinguished from source-level testing. See `UPGRADE_REPORT.md` for the tests actually run and any environment limitations.

## v0.8.2 roads and routes

- Terrain-weighted A* routing uses a finer 42 m planning grid by default, penalising steep ground, escarpments, ravines, ridgelines, marshes and floodplains.
- Diagonal corner-cutting is prevented, route grades are checked, and smoothing is accepted only when sampled segments remain buildable.
- The planner no longer invents a straight road when no valid terrain route is found.
- Regional roads and city avenues use dense terrain-draped cross-sections with a shallow crown and gravel shoulders.
- River crossings are raised above sampled water and receive timber deck boards and simple rails.
- Streamed road geometry is disposed when settlements unload.
- No ZIP archive is generated; changes are committed directly to GitHub.

## Next release: v0.8.4 buildings and architecture

The following release is reserved for a dedicated building-model pass: human-scale doors and windows, realistic floor heights, wall thickness, roof pitch by climate/material, structural foundations, timber framing, masonry and plaster variants, warehouses, inns, workshops, civic halls, farmsteads and regional architectural styles. The design brief and references are in `BUILDINGS_PLAN.md`.

## v0.8.4 ship-generator overhaul

- Adds a distinct structural blueprint for each of the 14 catalogue vessels, including frame count, maximum-beam station, forebody/aftbody taper, cross-section character and rigging proportions.
- Replaces the previous generic longitudinal hull taper with blueprint-driven 72-station × 28-section hull lofts.
- Adds individually selectable internal transverse frames and a longitudinal keelson; hide the hull in Creative mode to inspect the structural skeleton.
- Preserves vessel-specific mast placement and rig types while scaling shroud/ratline layout from the design data.
- Adds smooth full, reefed and furled sail deployment per mast; deployment state is saved with Creative ship state.
- Historical dimensions remain evidence-labelled; undocumented offsets and complete lines plans are still reconstruction estimates.


## v0.8.4 ship generator

- Each of the 14 vessel families has its own structural blueprint and rigging proportions.
- Hulls use 72 longitudinal stations × 28 cross-section segments.
- Internal transverse frames and the keelson can be inspected by hiding the outer hull in Creative mode.
- The shipyard supports full, reefed and furled sail states per mast, saved with the vessel.

The source-level static launcher remains available as `run-static.bat`. It is unchanged by the Pages build configuration.


## v0.8.4 completion pass

The completion branch extends the review build without changing the save metadata version:

- Free cities now render a covered, open-sided civic market with 12 individually detailed stalls, display goods and awnings instead of counters hidden inside a solid hall.
- Ports, market towns and villages now receive 7, 6 and 3 market stalls respectively; duplicate empty counters have been removed.
- Visible resident rosters are 64 in free cities, 24 in ports, 18 in market towns and 12 in villages. Traders are distributed around the market district during business hours.
- Ruined castles gain broken crenellations, flanking gatehouse towers and reinforced keep-corner piers.
- Browser cache keys are advanced for the changed game entry point and runtime modules.

- The galleon sterncastle is redesigned from stacked solid cuboids into three connected tapered, chamfered deckhouse tiers with framed transom and side windows, open side galleries, railings, projecting decks, a glazed stern lantern and a brass transom ornament.
- The redesigned stern components remain under the `sternworks` hierarchy so Creative editor detach/relink and saved component transforms continue to work.
- A runtime galleon-model regression test verifies the generated stern tiers, window details, lantern, geometry and component hierarchy.