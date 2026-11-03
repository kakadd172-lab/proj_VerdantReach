# Verdant Reach v0.5.0 — Upgrade Report

## Summary

Version 0.5.0 upgrades the existing Verdant Reach v0.4.0 project in place. The original procedural terrain generator, streamed chunk renderer, player controller, camera, Saved Worlds library, fixed-seed Wayfarer's Circuit, existing RPG/world systems, and IndexedDB save database are retained.

The main additions are per-world Survival/Creative modes, a persistent Creative World Builder, Survival hunger/thirst, biome overlays, custom village/port creation, and maritime cargo-voyage simulation.

## Implemented

### Game modes and save compatibility

- Added Survival and Creative selection to the new-world menu.
- Stores `gameMode` in each world save. Loading a saved world restores its stored mode rather than replacing it with the currently selected menu option.
- Existing v0.1–v0.4 saves without a mode field default to Survival.
- Existing IndexedDB database name, object store, seed key and localStorage fallback are unchanged.
- Existing world terrain seed and `WorldGenerator.version` remain unchanged.

### Survival mode

- Added persistent hunger and thirst meters to the HUD.
- Needs drain during active gameplay; running and hot conditions increase thirst demand.
- Inventory actions consume trail rations/game meat and fresh-water flasks.
- Pressing `E` with no nearby interactable at a generated river channel or lake shore allows the player to collect fresh water. The interaction no longer treats arbitrary low-elevation ground as a water source.
- Empty needs create gradual, non-lethal health pressure; needs alone cannot reduce health below one.
- Creative mode disables needs, refills stamina during play, and slowly restores health.

### Creative World Builder

- Added a `CREATE` button in the in-game rail and the `B` keyboard shortcut, available only in Creative worlds.
- Added a catalogue for rocks, boulders, crystals, trees, tree groves, flowers, wildlife display models, villagers/merchants/guards, mounts/vehicles, boats/ships, structures, bridges, props, villages and ports.
- Supports near-player and forward placement with adjustable model scale.
- Creative summon records have stable IDs, are stored in the world save, and are reconstructed when the world is loaded again.
- Summoned display models use global world coordinates and move with the floating-origin scene root. Distant models are visibility-culled.
- The stored summon list is bounded to 320 records to limit save and scene growth.
- Added a circular biome painter with radius selection and a restore-natural-biome action. Overlays are deterministic and persistent. They affect biome classification and dependent surface/vegetation appearance, but preserve terrain height, naturalBiome, land/water shape, climate fields and hydrology.
- Added world-hour control and forced clear/overcast/rain/storm/snow/fog weather, plus a return-to-natural setting.
- Added character restoration, starter supply grant, teleport-to-world-start, clear-nearby-creations and immediate save utilities.
- `clear-nearby-creations` removes associated custom settlement/civilization data and maritime routes/voyages when it deletes a custom port.

### Custom settlements and maritime trade

- Summoning a village or port creates a real `WorldIntelligence` settlement record rather than a static building model.
- Custom settlements are registered into the existing civilization system with residents, generated buildings and market/economic state.
- Ports must pass a coastal-site suitability check; failed placement reports an error and does not leave a false settlement record.
- `MaritimeSystem` builds bounded water-only A* paths between known ports, dispatches shipments using actual settlement market stock/wealth, persists cargo manifests and in-flight voyages, and settles transfers at delivery.
- The actor system renders ships travelling along active maritime cargo paths.
- Removing a custom port removes its maritime routes and dependent active voyages.

## Files changed or added

### Added

- `src/systems/game-mode.js` — per-world game mode resolution and legacy default.
- `src/systems/world-needs.js` — Survival needs and persistence.
- `src/systems/world-editing.js` — Creative summon catalogue and persistent world edits.
- `src/systems/maritime.js` — water routes and cargo voyages.
- `src/world/creative-entities.js` — 3D display models for Creative summons.
- `tests/creative-survival-v05.test.js` — mode, needs, editor, biome overlay, custom settlement, maritime and cleanup tests.

### Modified

- `index.html` — mode picker, needs HUD, Creative entry point, v0.5 labeling and updated module cache key.
- `src/main.js` — mode lifecycle, Survival update, Creative editor actions, persistent edits, maritime coordination, water-source interaction and save integration.
- `src/ui/interface.js` — mode selection, needs HUD/actions and Creative World Builder panel.
- `src/styles.css` — mode picker, needs bars and Creative panel styling.
- `src/world/terrain.js` — persistent biome overlay sampling without changing natural terrain height.
- `src/world/world-manager.js` — `invalidateAll()` for rebuilding chunks after biome painting.
- `src/world/world-intelligence.js` — custom settlement creation/removal and saved settlement restoration.
- `src/systems/civilization.js` — custom settlement cleanup from economy and NPC relationship state.
- `src/world/world-actors.js` — maritime ship visualization and safe disposal of ship-owned geometry.
- `package.json` — version updated to 0.5.0.
- `README.md` — usage, controls, architecture, implementation details and limitations.

## Verification

- `npm test`: **44 passed, 0 failed**. This includes all 33 pre-existing v0.4 tests and 11 new v0.5 tests.
- `node --check` passed for all `.js` files under `src/` and `tests/`.
- Relative imports were checked across 31 JavaScript files; all local targets exist.
- Static HTTP smoke checks returned HTTP 200 for `/`, `/src/main.js?v=0.5.0`, and `/src/world/creative-entities.js`.
- The ZIP archive was integrity-checked after creation.
- `npm run build` was attempted and returned `vite: not found` because `node_modules` is not installed in this environment. Dependency installation previously could not reach the npm registry (`EAI_AGAIN`). A production bundle therefore has not been verified.
- Chromium is present, but the project has not had a complete interactive visual playthrough or a real-hardware rendering/performance test. Static HTTP success is not claimed as a browser playtest.

## Known limitations

- Creative animals, villagers, merchants, guards, mounts, vehicles and ship summons are persistent display models, not live AI/vehicle agents. Generated ecosystem animals and settlement NPCs continue to use their existing simulation systems. Custom villages/ports, however, are actual settlement records with residents/economies.
- Creative biome paint changes biome classification and dependent rendering/vegetation only. It does not sculpt heightmaps, change climate, or recalculate waterways.
- The editor currently has near/forward placement, model scale, circular biome painting, time/weather controls, healing, supply grants, teleport, nearby clear and save. It does not yet provide mouse-ray placement, selection and per-object transform tools, deletion of one selected object, duplication, undo/redo, prefabs or terrain sculpting.
- Maritime routes are bounded water-only paths between known ports. Global ocean navigation, player-steerable sailing, wind/rigging physics, crew AI and storm damage are not implemented.
- Survival needs cover hunger, thirst, running/heat-related thirst demand and health pressure. Disease, sleep, body temperature, equipment wear and food quality are not yet implemented.
- The editor's stored model count is bounded; custom settlement counts are currently governed by the underlying world/settlement data rather than a complete settlement-building budget.
- Production build, full browser playthrough, visual regression and hardware profiling remain outstanding.

## Recommended next milestone

For v0.6.0, expand the Creative editor with selection, movement, rotation, duplication, undo/redo and reusable prefabs. In parallel, improve NPC navigation/interactions, add player-controlled sailing, extend hydrology and introduce a dedicated background simulation scheduler for distant regions.
