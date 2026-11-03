# Verdant Reach v0.6.0 — The Age of Sail

Verdant Reach v0.6.0 upgrades the existing v0.5.0 browser RPG. It preserves the existing procedural terrain generator, streamed world, player/camera, Saved Worlds library, Wayfarer's Circuit, Creative/Survival modes, and IndexedDB save database.

## Run locally

### Windows static server

1. Extract/open the `verdant-reach` folder.
2. Double-click `run-static.bat`.
3. Open `http://localhost:8000`.

This route serves the files but uses the Three.js CDN import, so it needs an internet connection.

### Vite development server

```bash
npm install
npm run dev
```

Build and tests:

```bash
npm run build
npm test
```

## v0.6.0 highlights

### Four historically informed sailing-vessel models

The Creative catalogue and the autonomous maritime trade actor renderer now use four distinct procedural Three.js models. These are stylized game meshes based on documented hull dimensions and rig layouts, not scans or engineering-grade reconstructions from original ship lines plans.

| Ship | Reference hull length × beam | L:B | Rig identity | Draft used by game |
|---|---:|---:|---|---:|
| Coastal packet sloop | 21.0 × 5.6 m | 3.75:1 | One gaff mainsail, boom and headsail | 2.2 m* |
| Mercurio-style brigantine | 30.0 × 8.5 m | 3.53:1 | Square foremast; fore-and-aft main with square topsail | 3.2 m* |
| Bluenose-inspired schooner | 43.6 × 8.2 m | 5.32:1 | Two fore-and-aft gaff rigs, taller mainmast | 4.8 m |
| Iberian merchant galleon | 30.5 × 10.0 m | 3.05:1 | Square fore/main, lateen mizzen, raised stern | 4.1 m* |

`*` Drafts are gameplay/model parameters rather than verified historical measurements for the named reference vessel. The sloop's length is an archetype estimate based on documented packet-sloop lengths; its beam, draft and mast height are game-design estimates. Brigantine spar heights are game-proportioned. The schooner dimensions and mast heights are based on Bluenose registry-derived figures. The galleon dimensions follow the Santa Maria del Pilar reference; historical galleons varied significantly by date and region.

Historical design references:

- Sloop: [Fitz Henry Lane Online / Cape Ann Museum — Sloop](https://www.fitzhenrylaneonline.org/historical_material/index.php?section=Sloop&type=Vessel+Types)
- Brigantine: [Museum of Maritime Archaeology, Caorle — Mercurio reconstruction](https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/)
- Schooner: [The Maritime Atlas — Bluenose data method](https://themaritimeatlas.ca/Bluenose/data-method)
- Galleon: [The Mariners' Museum — Galleon](https://exploration.marinersmuseum.org/watercraft/galleon/) and [German Historical Museum — Galleon dimensions](https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/)

#### Model construction

- Swept multi-station smooth hull mesh, deck surface, keel, rudder, rails, hull strakes and ship-specific stern/bow details.
- Individual mast counts, mast heights, spars, square/gaff/lateen sail shapes, bowsprit and galleon castle silhouette.
- Each model owns its geometries/materials and has a matching disposal path for editor deletions and actor cleanup.
- Hull dimensions are documented in metres. The visual hull loft is stylized from representative ratios and reference proportions; it is not a traced historical lines plan.

### Creative World Builder

In a Creative world press `B` or use the `CREATE` HUD button.

- Summon sloop, brigantine, schooner and galleon, as well as the existing environmental props, wildlife, NPC display models, vehicles, structures, villages and ports.
- Ship placement checks multiple points along the hull footprint against terrain/water depth and rejects a location that is too shallow for the vessel's draft.
- Select nearby creations, move them ahead, rotate them, duplicate them, delete them, and use session-level Undo/Redo for object creation/transforms.
- Persistent summoned objects retain global position, yaw and scale in the existing save data.
- Undo/Redo history is bounded and session-only; saved object changes persist, but the undo stack does not survive reload.
- Villages/ports remain actual settlement records, not merely decorative models.

### Player sailing

- Board a Creative-placed historical ship with `R` when nearby; press `R` again to disembark when the vessel is at a suitable shallow shore.
- Vessel type and deck height are saved with the existing transport state.
- Each ship class has different cruise speed, acceleration and turn response. Wind influences movement, and the hull has lightweight momentum/coasting and bob/roll effects.
- Deep-draft placement requires deeper water. The schooner and galleon are more demanding than the small sloop.
- Existing horse/cart/skiff movement and old save data remain supported.

This is a playable sailing foundation, not a naval simulator: sail trim, tacking, hydrodynamic resistance, wave spectra, crew operations, collision damage and full maritime pathfinding are not implemented.

### Autonomous maritime trade

- Active trade voyages carry a saved `shipType` and render the corresponding historical model.
- Ship selection varies by route length and cargo, rather than every route using one generic boat.
- Reverse-direction shipments reverse their path correctly.
- Nearby voyage visuals are distance-culled; the actor layer limits the active rendered maritime ships and caches route-segment lengths.

### Geography and world simulation carried forward

- Existing deterministic global terrain and chunk streaming are retained.
- Rivers expose deterministic waterfall sites where generated channels have sufficiently large drops; the renderer adds stylized falling-water curtains.
- Existing regional settlement, NPC, ecosystem, climate, cargo and distant coarse simulation systems remain.
- No terrain generation version bump is made, so original seeds retain their terrain geography.

## Controls

| Input | Action |
|---|---|
| `W A S D` / arrow keys | Move relative to camera |
| `Shift` | Run on foot / faster travel where supported |
| Mouse drag | Rotate camera through 360° |
| Mouse wheel | Zoom |
| `E` | Interact, gather, trade, speak, harvest or collect fresh water at a valid shore |
| `F` | Resonance pulse for waystone discovery |
| `Space` | Strike a nearby hostile wisp (Survival only) |
| `R` | Mount/dismount horse, cart, skiff or nearby Creative-placed historical vessel |
| `I` / `Tab` | Inventory and field crafting |
| `J` | Journey journal |
| `M` | Exploration chart |
| `G` | Local realm information |
| `C` | Character skills and training |
| `B` | Creative World Builder (Creative only) |
| `Esc` | Pause or close a panel |

## Save compatibility

- Existing IndexedDB database, object store, seed key and localStorage fallback remain unchanged.
- `WorldGenerator.version` is not bumped; existing seeded geography is retained.
- New `vesselType` and `deckHeight` transport fields are optional. Old saves default to the legacy transport behaviour.
- Existing Creative entity records are still loaded; new ship kinds add no destructive migration.

## Main code areas

| File | Responsibility |
|---|---|
| `src/world/ship-designs.js` | Reference dimensions, rig specifications, source notes and ship class selection helpers |
| `src/world/ship-models.js` | Procedural Three.js ship hull/deck/rig model construction and resource disposal |
| `src/world/creative-entities.js` | Creative entity construction and disposal, including historical ships |
| `src/systems/transport.js` | Mount state, saved vessel identity, vessel-specific movement profiles and water traversal |
| `src/systems/maritime.js` | Persistent port routes, cargo manifests, voyage states and class selection |
| `src/world/world-actors.js` | NPC/wildlife/vehicle actors, waterfall geometry, nearby maritime-vessel rendering |
| `src/systems/world-editing.js` | Persistent Creative objects and session-level object undo/redo |
| `src/main.js` | Game loop, world loading, editor actions, ship placement/boarding and save/load coordination |
| `src/ui/interface.js` | Main menu, HUD, Creative editor, ship catalogue and RPG panels |

## Verification

- Automated tests: **53 passed, 0 failed** (`node --test tests/*.test.js`).
- `node --check` passed for all JavaScript under `src/` and `tests/`.
- Relative imports were checked across the source/test tree; no missing relative imports were found.
- HTML ID audit found no duplicate IDs.
- The source ZIP is checked for archive integrity before release.
- A production Vite build and complete graphical browser playthrough are not verified in this environment because dependencies are not installed and the npm registry was previously unreachable. Automated tests are not a substitute for interactive visual testing.

## Known limitations

- The models are original procedural stylized 3D meshes, not exact reconstructions from shipwrights' lines plans, scanned artefacts or CAD drawings.
- Rigging is simplified geometry; sails do not dynamically trim, reef, billow or animate with individual wind direction.
- Sailing uses differentiated speeds, turning, acceleration and a lightweight wind modifier, not full physical sailing simulation.
- Player boarding currently applies to Creative-placed historic ships; it does not add a ship-purchase or ship-ownership economy in Survival.
- Trade voyages use historical ship visuals and cargo state, but their route solver remains bounded and is not a global ocean-current/navigation solver.
- Creative undo/redo covers object creation and transforms in the current editing session. It is not a persistent transaction history and does not cover biome brushes or settlement simulation.
- Waterfall visuals are stylized curtains over deterministic drop sites, not a fluid simulation.
- Terrain LOD, Web Workers, occlusion culling, measured GPU profiling and full browser playthrough remain future work.

## Suggested v0.7.0 focus

A broader RPG/content milestone: faction reputation, deeper quests and dungeons, Survival ship ownership/purchase, ship crew and port services, more detailed NPC interaction, plus a dedicated visual QA and performance pass on representative desktop hardware.
