# Verdant Reach v0.4.0 — Upgrade Report

## Summary

Version 0.4.0 upgrades the existing Verdant Reach v0.3.0 project in place. It preserves the original terrain generation version, seeded world sampler, chunk streaming, player and camera controls, existing RPG systems, and IndexedDB save database. The main additions are a saved-world library in the main menu and a protected, fixed-seed, sequential field-test world.

## Implemented

### Saved Worlds

- Added a **Saved Worlds** view to the main menu.
- Reads records from the existing IndexedDB `verdant-reach-save-v1` database and `worlds` object store, plus the existing localStorage fallback.
- Merges duplicate IndexedDB/localStorage records by normalized seed key, retaining the newest `savedAt` record.
- Shows world name, seed, saved timestamp, world day/time, and character level where available.
- Loads an existing save from its card and deletes ordinary saved worlds from both persistence backends after confirmation.
- Pins a protected built-in test slot at the top of the list even before it has been entered. The reserved test slot is not deletable through the menu.

### Wayfarer's Circuit test world

- Fixed seed: `WAYFARER-TEST-040`.
- Adds a compact deterministic scenario layer over the existing generated world rather than replacing the terrain generator.
- Includes Trialstead, Greenmead Market, Tidewatch Port, a visible scenario stream and basin, nearby wildlife, a practice wisp, a horse/cart mount, a coastal skiff, and a road/bridge inspection point.
- Fresh entries receive finite starter supplies and skill points for exercising trade, gathering, crafting, progression, and transport. Re-entering the world does not grant the supplies again.
- Provides 12 ordered stages: regional survey, waystone attunement, gathering, village conversation, market trade, crafting, wildlife harvesting, practice combat, road/bridge inspection, mounting, skiff boarding, and weather inspection.
- Stages advance only through the relevant existing gameplay action or by reaching a visit marker. The route is not a set of freely clickable completion buttons.
- Stores completed stage IDs in the normal world save record and resumes progress on re-entry.

### Integration and compatibility

- Extends the existing interface and main game loop; no duplicate game controller or save database was introduced.
- Normal world generation and spawning remain unchanged for non-test seeds.
- The save envelope adds optional `worldName`, `worldKind`, and `worldSystems.fieldTest` fields. Existing save database/store names and the seed key remain unchanged.
- Existing v0.1–v0.3 worlds continue to load; missing v0.4 fields are treated as absent/default values.
- The terrain generation version was not changed.

## Files changed or added

- `index.html` — Saved Worlds menu view, test-course HUD, v0.4 labeling.
- `src/main.js` — saved-world actions, field-test setup/progression/save integration.
- `src/ui/interface.js` — saved-world cards, menu navigation, course guide.
- `src/styles.css` — saved-world and course-guide styling.
- `src/systems/persistence.js` — uses the existing store to list, merge, and delete records.
- `src/world/field-test-world.js` — deterministic scenario settlements, stream, and course layout.
- `src/world/field-test-course.js` — ordered 3D route markers and progress persistence.
- `src/world/world-actors.js` — immediate refresh hook for newly seeded scenario actors.
- `package.json` and `README.md` — version and documentation updates.
- `tests/field-test-world.test.js` — scenario and saved-world regression coverage.

## Verification

- `npm test`: **33 passed, 0 failed**.
- JavaScript syntax checked for all source and test modules.
- Relative imports checked against the project tree.
- Package metadata and static HTTP file delivery checked.
- ZIP archive integrity checked after packaging.
- `npm run build` was attempted; the environment does not currently have Vite installed. Dependency installation could not complete because the npm registry was unreachable (`EAI_AGAIN`).
- A full browser playthrough, visual rendering review, and hardware performance benchmark have not been verified in this environment.

## Remaining limitations

- The test area's scenario stream is a curated local demonstration feature; it is not a replacement for globally solved hydrology.
- The test port and boat demonstrate local player boarding; autonomous ship routes and maritime cargo shipping remain incomplete.
- The route exposes existing road/bridge generation, but a complete regional road network with traffic simulation is still future work.
- Test NPCs use the current settlement resident and schedule systems; full dialogue trees, relationship quests, and autonomous pathfinding remain incomplete.
- The guided circuit validates key interactions in sequence, but it is not a comprehensive tutorial for every future RPG system.
- The saved-world view is a basic world library; save-slot renaming, cloud synchronization, multiple manual backups, and save conflict recovery are not implemented.

## Recommended next milestone

For v0.5.0, focus on autonomous world simulation and transportation: NPC navigation with schedule transitions, road-following caravan movement across region boundaries, coastal ship routes with cargo manifests, and background settlement/ecosystem simulation at lower fidelity for unloaded regions. Add a browser-based visual test pass before expanding content further.
