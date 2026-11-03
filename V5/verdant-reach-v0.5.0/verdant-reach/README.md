# Verdant Reach v0.5.0 — Creative & Survival Update

Verdant Reach is an original, non-voxel, browser-based 3D fantasy RPG prototype built on Three.js. Version 0.5.0 upgrades the existing v0.4.0 project in place. It preserves the procedural terrain generator, streamed chunk renderer, player/camera controller, saved-world library, Wayfarer's Circuit, world systems, and IndexedDB save database.

This release adds two per-world game modes, a persistent in-game Creative World Builder, Survival needs, and the first autonomous maritime cargo-ship visualization. It is a playable prototype, not yet a content-complete open-world RPG.

## Run locally

Requirements for the Vite workflow: Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

**Windows static-server option:** double-click `run-static.bat`, then open `http://localhost:8000`. This serves the project files directly and loads Three.js r187 from jsDelivr, so it needs an internet connection. Keep using the same host and port if you want to access saves already stored by this browser: IndexedDB data is scoped to the site origin.

Production build:

```bash
npm run build
npm run preview
```

Automated tests:

```bash
npm test
```

## Starting a world

Choose **Survival** or **Creative** in the main menu, enter a seed, and select **Begin your journey**. The chosen mode is stored in that world's save. Loading an existing world restores its saved mode; old v0.1–v0.4 saves without a mode field default to Survival. To play the same seed in both modes, use different seeds because saves are keyed by seed.

The **Saved Worlds** library remains available from the main menu. It lists normal saves and the protected, fixed-seed **Wayfarer's Circuit** test slot. The test slot continues to use its original seed and ordered 12-step course.

## Controls

| Input | Action |
|---|---|
| `W A S D` / arrow keys | Move relative to the camera |
| `Shift` | Run while stamina remains |
| Mouse drag | Rotate camera through 360° |
| Mouse wheel | Zoom |
| `E` | Gather, speak, use a market, harvest wildlife, or gather water at a riverbank |
| `F` | Send a resonance pulse to a nearby undiscovered waystone |
| `Space` | Strike a nearby hostile wisp (Survival only) |
| `R` | Mount or dismount a nearby horse, cart, or coastal skiff |
| `I` / `Tab` | Inventory and field crafting |
| `J` | Journey journal |
| `M` | Exploration chart |
| `G` | Local realm information |
| `C` | Character skills and training |
| `B` | Open the Creative World Builder (Creative only) |
| `Esc` | Pause or close a panel |

## Survival mode

- Hunger and thirst drain during active play and are shown in the HUD.
- Eat trail rations or harvested game meat from the inventory panel.
- Drink a fresh-water flask from the inventory panel, or use `E` at a generated riverbank when no other interactable is in range.
- Running increases thirst drain slightly. Hot conditions can also increase water demand.
- Letting either need reach zero causes gradual, non-lethal health pressure; health does not fall below one from needs alone.
- Existing health, stamina, equipment, crafting, gathering, combat, quests, transportation, weather, and economy systems remain available.

## Creative mode — World Builder

Creative worlds show a **CREATE** button in the right-hand in-game rail. Press `B` to open the same editor.

### Summon entities

Choose an entity, set its scale, then use **Summon near me** or **Place ahead**. The current catalogue includes:

- Nature: rock, boulder, crystal, tree, pine tree, ancient tree, tree grove, flower patch.
- Wildlife models: deer, hare, wolf, bear, boar, crane.
- People: villager, merchant, guard.
- Travel: horse, cart, rowboat, sailing ship, large ship.
- Structures: hut, watchtower, ruin, bridge, campfire, treasure chest, well, mine.
- Settlements: village and port.

Summoned props, people, animals and vehicle/ship models are persistent placed models; they are not automatically converted into autonomous NPCs, wildlife agents, drivable vehicles, or player-controlled ships. Summoning a **village** or **port** is different: it creates a real settlement record with generated buildings, residents, a market/economy state, and (for a port) eligibility for the maritime route system.

The editor bounds the number of stored summoned models to keep save size and scene cost finite. **Clear nearby creations** removes nearby creative models and custom settlements, including their associated port routes and voyages.

### Biome painter

- Choose a biome and brush radius, then paint around the player.
- Restore natural biome generation within a radius.
- Biome paint is saved as a deterministic overlay and is reapplied when chunks reload.
- Painting changes biome classification and the resulting surface/vegetation appearance. It deliberately does **not** change terrain elevation, continental land/water shape, river paths, climate, or hydrology.

### World atmosphere and utilities

- Set the world hour from 00:00 to 23:00.
- Force clear, overcast, rain, storm, snow or fog, or return to natural seed/time-driven weather.
- Restore health, stamina, hunger and thirst.
- Grant a test bundle of food, water, building materials and crafting resources.
- Teleport to the world's starting location.
- Clear nearby creations and save the world immediately.

Creative edits are stored with the world seed and survive chunk unloading, re-entry, and browser restarts through the existing save system.

## v0.5.0 implementation details

- `WorldNeedsSystem` stores Survival hunger/thirst and integrates with the existing RPG inventory and save envelope.
- `WorldEditSystem` stores placed entity records, bounded biome overlays, custom settlement records, and editor sequence IDs.
- The terrain sampler applies the most recent biome overlay at a coordinate while retaining its original height and natural biome sample.
- `WorldIntelligence` creates custom villages/ports through its existing settlement model; `CivilizationSystem` registers their residents and market state.
- `MaritimeSystem` computes bounded water-only port routes, reserves real market cargo/payment at dispatch, advances in-flight voyages, and persists delivery state. The actor layer displays the moving cargo ships.
- Creative models are positioned in global world coordinates and follow floating-origin rebasing. Distant creative models are hidden outside the active visibility radius.
- Existing save database/store names and seed keys remain unchanged. New save fields are optional and old saves load with Survival defaults.

## Architecture map

| File | Responsibility |
|---|---|
| `src/main.js` | App lifecycle, player loop, mode selection, creative actions, world save/load and system coordination |
| `src/systems/game-mode.js` | New-world mode selection and legacy-save fallback |
| `src/systems/world-needs.js` | Survival hunger, thirst, food/water use and needs persistence |
| `src/systems/world-editing.js` | Persistent summon catalogue, biome overlay records and custom settlements |
| `src/systems/maritime.js` | Port routes, cargo dispatch, voyages, delivery and persistence |
| `src/world/creative-entities.js` | Three-dimensional display models for Creative summons |
| `src/world/terrain.js` | Deterministic terrain/climate sampling and biome-overlay lookup |
| `src/world/world-manager.js` | Chunk streaming, queue, invalidation, unloading and floating origin |
| `src/world/world-intelligence.js` | Regional identity, rivers/lakes, settlements, road routing and custom settlement placement |
| `src/world/world-actors.js` | Settlement, NPC, wildlife, vehicle, caravan and maritime-ship actors |
| `src/systems/civilization.js` | Settlement populations, NPC routines, migration, market state and land cargo convoys |
| `src/systems/ecosystem.js` | Habitat, wildlife populations, predator pressure and persistence |
| `src/systems/weather.js` | Seed/time/region-based weather and seasons |
| `src/systems/rpg.js` | Character stats, skills, inventory, crafting, XP and quests |
| `src/systems/persistence.js` | Existing IndexedDB/localStorage world persistence and saved-world library |
| `src/ui/interface.js` | Main menu, mode picker, Saved Worlds, HUD, Creative editor and RPG panels |

## Verification status

- `npm test`: **44 passed, 0 failed** (33 existing tests plus 11 v0.5-specific tests).
- `node --check` passed for all JavaScript source and test files.
- Relative imports were checked across 31 JavaScript files; all resolve.
- HTML contract checks found no duplicate or missing required HUD/menu IDs. Static HTTP smoke checks returned HTTP 200 for the entry page, main game module and new Creative entity module.
- ZIP archive integrity was checked after packaging.
- `npm run build` was attempted, but cannot run in this environment because the Vite executable is not installed. The npm registry was unreachable during previous dependency-install attempts, so a production bundle could not be generated here.
- Chromium is installed, but a complete interactive visual playthrough and GPU performance benchmark have not been verified. Static HTTP checks are not a substitute for those checks.

## Known limitations

- Creative summoned creatures and people are display models, not autonomous AI agents. Existing procedurally generated wildlife/NPCs continue to use their own simulation systems.
- Creative summoned carts, horses, boats and ships are placed models, not mountable or directly player-steerable. Existing world transportation remains available separately. Autonomous maritime cargo vessels move along the water routes generated by the maritime economy system.
- Biome painting changes biome/material/vegetation selection only; it does not sculpt terrain or recalculate climate and waterways.
- The editor currently uses near-player placement, a fixed forward placement distance, circular biome brushes, and a clear-nearby action. It does not yet have mouse-ray placement, per-object selection/rotation/deletion, undo/redo, terrain sculpting, or copy/paste prefabs.
- Custom ports require a suitable generated coastal site. If no valid site is found around the requested location, the editor reports that placement failed instead of silently creating an inland port.
- Maritime route finding is bounded and water-only, not a global ocean navigation solver. Wind physics, ship crews, storms damaging vessels, player-controlled sailing, and persistent port-to-port schedules remain future work.
- Survival needs currently affect hunger, thirst, and health pressure. More advanced diseases, temperature exposure, sleep, equipment wear, and deeper food/water quality systems are not implemented.
- Production build, visual browser playthrough, and real-hardware profiling remain outstanding as described in Verification status.

## Recommended next milestone

For v0.6.0, focus on a more complete Creative editing workflow (select, move, rotate, duplicate, undo/redo and prefabs), autonomous NPC navigation and interaction, real player-controlled sailing, better hydrology, and a background simulation scheduler for distant regions.
