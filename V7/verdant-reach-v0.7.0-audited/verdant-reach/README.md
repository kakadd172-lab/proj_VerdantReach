# Verdant Reach v0.7.0 — The Great Realms & Wildlands

Verdant Reach v0.7.0 upgrades the existing v0.6.0 browser RPG in place. It retains the original Three.js browser architecture, deterministic coordinate-based generation, streamed terrain, Creative/Survival modes, Creative object editor, historical sailing ships, Saved Worlds, Wayfarer's Circuit, and IndexedDB save database.

## Run locally

### Windows static server

1. Extract the project.
2. Open the `verdant-reach` folder.
3. Double-click `run-static.bat`.
4. Open `http://localhost:8000`.

The static server uses the browser-compatible ES modules from the Three.js CDN. An internet connection is required unless the dependency is separately cached.

### Vite development server

```bash
npm install
npm run dev
```

### Automated tests

```bash
npm test
```

## v0.7.0 highlights

### Great realms

- Procedural free cities have an approximately 1.02 km outer diameter, 800+ residential buildings in eligible regions (841–900 across the 15 generated cities in a 16-seed audit sample), eight major civic/religious landmarks, four gates, ten wall towers, 104 street segments, a market square and 11–14 suitable surrounding agricultural plots.
- City layouts are deterministic and use shared `InstancedMesh` batches for houses, walls, towers, roofs, roads and fields. The plan is cached per settlement/generator so metadata generation and rendering do not rebuild the same 900-building plan.
- Settlement metadata now reports the generated city plan's actual building count. Houses are checked against oriented house, civic-landmark and road footprints; sites are sampled against the actual seeded wall polygon.
- NPC professions, routines, homes and workplaces remain attached to the existing civilization simulation.

### Abandoned castles

- Large ruined fortresses include two defensive wards, a barbican, breached curtain walls, towers, a dry moat, roofless keep, courtyard well and rubble fields.
- The expanded fortress footprint is approximately 476 m across at its nominal radius, with variation in its polygonal wall outline.
- Ruins are deterministic, persist in world intelligence, appear in streamed actor regions and are available as Creative teleport destinations.

### Great wildlands

- Global-coordinate landform signals provide long ridge spines, connected upland massifs, branching ravine bands, sharp escarpment/cliff zones, meadows, fertile field suitability and floodplain potential.
- Terrain coloration and vegetation density respond to the landform signals.
- Steep mountain, ravine and cliff shoulders receive larger instanced rock outcrops.
- The existing river and waterfall network is exposed as Creative travel destinations alongside lake basins. Regional trade roads now approach free cities through their actual generated gate centres, then connect to the city’s internal avenue network.
- The terrain generator version is `vr-terrain-04`.

### Creative teleport selector

Press `B` in Creative mode. The grouped destination selector includes available nearby:

- Free Cities, ports, markets and villages.
- Abandoned castles.
- Mountain overlooks, ravines/gorges, cliff faces and grasslands/fields.
- River valleys, waterfalls and lakes.

The list is bounded by an 18 km search radius in the editor, sorted by actual player distance, and chooses a dry, walkable, moderate-slope landing point near the selected landmark. Destination queries filter by straight-line distance rather than the square search bounds. This landing check is terrain-aware; it does not yet test building or wall collision because the player controller does not have static structure colliders.

### Compatibility

- The built-in Wayfarer's Circuit retains its fixed landing coordinate and prepared scenario. Regional landmarks are anchored to the saved world-start coordinate, so resuming from a distant player position does not move the starter settlement, free city or regional ruin.
- Existing saves keep their seed, player progression, settlements, world edits and mode data. The world generator advances to `vr-terrain-04`; newly generated or reloaded terrain will therefore use the improved terrain field. Persisted player/world edits remain coordinate-based.
- Save metadata records game version `0.7.0`.

## Controls

| Key | Action |
|---|---|
| WASD | Move |
| Shift | Run |
| Mouse drag | Rotate camera |
| Mouse wheel | Zoom |
| E | Interact / gather |
| F | Resonance ability |
| I / Tab | Inventory |
| J | Quest journal |
| M | World map |
| G | Realm panel |
| C | Character panel |
| B | Creative world builder (Creative mode) |
| R | Board / dismount transport |
| Space | Combat action |
| Esc | Pause / close panel |

## Important scope notes

- The cities and castles are original stylized low-poly procedural models informed by historical urban/fortification organization; they are not exact reconstructions of a named historical city or castle.
- The city has 800+ rendered building forms, while the existing population simulation represents a 4,000–12,000 person population with only seven persistent named NPC agents per free city. The rest of the population is statistical; this is not yet a crowded, fully animated metropolis.
- Ravines and cliffs are heightfield landforms. They do not create true terrain overhangs or caves.
- Rivers remain generated by the existing deterministic downhill channel system; v0.7 adds river/lake/waterfall destinations and more visible floodplain response, not a complete physically based hydrology simulation.
- The player controller currently checks terrain height and slope but does not collide with houses, city walls, castle walls, rocks or other static environment geometry. The player can walk through these models; physical collision and building access are future work.
- The Creative destination list is a proximity-based navigation tool, not a fully explored/discovered-only map system.

## Post-release audit

See `AUDIT_REPORT.md` for the v0.7.0 source audit, corrected gate-connected regional roads, nearest-landmark teleport selection, world-start persistence fix, and explicitly documented remaining limitations.

## Test status

Run `npm test` for deterministic generation, large-city/castle geometry, landform fields, teleport categories, legacy-save behavior and the existing game-system tests. The post-release audited source currently passes 75 automated tests. A successful production build and complete visual browser playthrough remain unverified in the audit environment because Vite and the Three.js package are not installed locally and the headless WebGL renderer could not initialize. The static server and source checks pass.
