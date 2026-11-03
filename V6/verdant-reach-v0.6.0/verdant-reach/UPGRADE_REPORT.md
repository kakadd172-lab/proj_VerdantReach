# Verdant Reach v0.6.0 — Upgrade Report

## Summary

Version 0.6.0 upgrades the existing v0.5.0 project in place. It preserves the deterministic world generator/version, streamed chunks, player and camera systems, Saved Worlds, Wayfarer's Circuit, Creative/Survival mode state, existing RPG/civilization/ecosystem systems, and the existing IndexedDB save database.

The primary feature is an Age of Sail layer: four distinct historically informed procedural ship models are available in Creative mode and are used by autonomous maritime cargo voyages. The Creative editor also gains object selection and manipulation with bounded session undo/redo. Historical Creative vessels can be boarded and sailed with class-specific handling.

## Implemented

### Historical ship catalogue and models

- Added four ship design records: coastal packet sloop, Mercurio-style brigantine, Bluenose-inspired schooner, and Iberian merchant galleon.
- Each record includes length, beam, draft/gameplay draft note, length-to-beam ratio, mast count, mast heights, rig description, design notes and reference URLs.
- Added procedural smooth multi-station swept hull geometry and a separate deck mesh.
- Added class-specific hull silhouette details, railings, keel, stern/bow details, masts, yards, sails and rigging lines.
- Rig identities differ: one-mast gaff sloop; square foremast/fore-and-aft main brigantine; two-mast fore-and-aft schooner; square fore/main plus lateen mizzen galleon.
- Models retain owned geometry/material references and have a shared deterministic disposal function used when deleting Creative entities and removing maritime actors.
- Models are stylized and proportion-informed, not reconstructed from original ship lines plans.

### Player sailing and Creative vessel placement

- Historical ship types can be summoned from the Creative entity catalogue.
- Placement samples the hull footprint at multiple fore/aft and lateral offsets. A ship is rejected when any sample would overlap land or the shallowest sampled seabed does not satisfy its draft clearance.
- The player can board a nearby Creative-placed ship using `R`, steer using the existing movement controls, and disembark at suitable shallow shore locations.
- Transport save data includes vessel type and deck height; old skiffs and old save records remain supported.
- Movement profiles vary by ship class for speed, acceleration, turning and draft. Wind modifies travel speed, and movement has lightweight momentum/coasting behaviour.
- Ship hulls bob and roll slightly in the visual actor layer.

### Autonomous maritime trade visualization

- Cargo voyages store selected ship type and use it when creating the voyage's ship model.
- Ship class selection depends on route distance and cargo type.
- Reverse-direction shipments reverse the path array rather than traversing the route backwards incorrectly.
- Voyage paths cache segment lengths at actor creation. Only a bounded number of nearby voyages are rendered; distant voyages continue in the existing persisted simulation without a ship mesh.

### Creative object editor

- Added selection of nearby Creative objects.
- Added move ahead, rotate by 15 degrees, duplicate and delete actions.
- Added bounded session-level undo/redo for object creation and transform operations.
- Saved entity ID, kind, location, yaw and scale remain persisted through the existing world-edit save envelope.
- Ship model deletion now explicitly disposes owned geometries and materials.

### Geography and performance carry-forward

- Existing deterministic watershed/lake/river features retained.
- River data includes deterministic waterfall drop locations; the actor renderer creates stylized falling-water geometry.
- Existing background/coarse distant settlement simulation retained.
- Maritime actor rendering culls distant voyages, caps visible vessels and caches route-segment data to reduce frame-loop work.
- Original world generator version is unchanged.

## Reference dimensions and caveats

| Type | Model hull length × beam | Model L:B | Rig | Draft parameter |
|---|---:|---:|---|---:|
| Sloop | 21.0 × 5.6 m | 3.75 | 1-mast gaff + headsail | 2.2 m (game parameter) |
| Brigantine | 30.0 × 8.5 m | 3.53 | Square fore; fore-and-aft main with topsail | 3.2 m (game parameter) |
| Schooner | 43.6 × 8.2 m | 5.32 | 2-mast fore-and-aft gaff | 4.8 m reference-derived |
| Galleon | 30.5 × 10.0 m | 3.05 | Square fore/main; lateen mizzen | 4.1 m (game parameter) |

- The schooner model is inspired by Bluenose and uses registry-derived hull dimensions and mast heights.
- The galleon proportions use the Santa Maria del Pilar reference dimensions and a representative galleon rig arrangement.
- The brigantine dimensions use the Mercurio reconstruction; spar heights are game-model proportions.
- The sloop is an archetype: the length is an estimate based on documented packet sloop deck lengths; beam, draft and mast height are game estimates.
- Historical ship types are not single standardized designs. The model catalogue labels reference vessels and estimates to avoid implying universal dimensions.

Research links:

- [Fitz Henry Lane Online / Cape Ann Museum — Sloop](https://www.fitzhenrylaneonline.org/historical_material/index.php?section=Sloop&type=Vessel+Types)
- [Museum of Maritime Archaeology, Caorle — Mercurio reconstruction](https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/)
- [The Maritime Atlas — Bluenose data method](https://themaritimeatlas.ca/Bluenose/data-method)
- [The Mariners' Museum — Galleon](https://exploration.marinersmuseum.org/watercraft/galleon/)
- [German Historical Museum — Galleon reference dimensions](https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/)

## Files added

- `src/world/ship-designs.js` — historic-reference design specification and helpers.
- `src/world/ship-models.js` — procedural ship meshes, rigging and resource disposal.
- `tests/ship-systems-v06.test.js` — ship design, maritime class selection, transport, Creative editor, model source contract, version and waterfall tests.

## Files modified

- `index.html` — v0.6.0 title/version and cache-busted module path.
- `package.json` — version 0.6.0.
- `src/main.js` — Creative ship placement, selection/transforms, boarding, disembarkation and saved transport integration.
- `src/entities/player.js` — ship-specific sailing control, wind modifier, coasting and deck positioning.
- `src/systems/transport.js` — saved vessel type/deck state and class-specific movement profile.
- `src/systems/maritime.js` — ship class assignment and voyage path direction.
- `src/world/creative-entities.js` — historical ship construction/disposal.
- `src/world/world-actors.js` — historical trade ship rendering, culling, cached path segments and waterfalls.
- `src/world/world-intelligence.js` — deterministic waterfall sites in generated river data.
- `src/systems/world-editing.js` — historical ship kinds and object-edit history.
- `src/ui/interface.js` and `src/styles.css` — ship catalogue, editor transform/history controls and version label.
- `README.md` — updated user guide and known limitations.

## Tests and verification

- Automated test suite: **53 passed, 0 failed** (`node --test tests/*.test.js`).
- JavaScript syntax: passed for all files under `src/` and `tests/` using `node --check`.
- Relative imports: 34 JavaScript files inspected; no missing relative imports.
- HTML IDs: 60 IDs checked; no duplicate IDs.
- Static HTTP and archive integrity checks are run before release.
- Production Vite build and full interactive browser playthrough are not verified in this environment because dependencies are not installed and the npm registry was unreachable during prior install attempts. Do not treat passing Node tests as a substitute for visual/GPU runtime QA.

## Known limitations

- Models are procedural, stylized 3D meshes and have not been visually verified in a full browser session here. They are not exact CAD models, scans, or lines-plan reconstructions.
- Rigging is static, with simplified sail geometry. Sail trim, tacking, dynamic sail billow, individual rope animation, crew and rigging damage are not implemented.
- Sailing controls use class-specific speed/acceleration/turn rates, wind modifier and coasting; full hydrodynamics, waves, currents, rudder response and realistic collision are not implemented.
- Player boarding is supported for Creative-placed historic ships. A Survival ship purchase/ownership economy is not included yet.
- Cargo voyages use historic vessel models; route finding remains bounded and is not a global ocean navigation system.
- Creative undo/redo is session-only and covers object creation/transforms, not biome paint, settlement changes or other simulation events.
- Waterfall visuals are simplified curtains over deterministic drop sites, not fluid simulation.
- No full terrain LOD/occlusion/worker pipeline or measured desktop GPU benchmark was completed.

## Recommended next milestone

v0.7.0 should deepen the player RPG and maritime economy: ship ownership/purchase in Survival, crew and port services, faction standing, more quests and dungeons, richer NPC interaction, followed by a dedicated visual QA/performance pass.
