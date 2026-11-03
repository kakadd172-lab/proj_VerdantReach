# Verdant Reach v0.8.1 — Caribbean Age of Sail

Verdant Reach v0.8.1 is a focused follow-up to the v0.8.0 Caribbean Age-of-Sail release. It improves shipyard editing continuity, saved component restoration and release verification while retaining the existing articulated fleet and world systems. Existing procedural terrain, world streaming, Creative/Survival modes, settlement systems, world saves, player transport and the Wayfarer’s Circuit remain in the project.

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
