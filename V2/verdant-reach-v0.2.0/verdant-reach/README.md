# Verdant Reach — Living World Upgrade (v0.2.0)

Verdant Reach is an original, non-voxel, browser-based 3D fantasy RPG prototype built on Three.js. This release upgrades the existing v0.1.0 project in place: it preserves the terrain-generation contract and save database, while adding a first playable layer of settlements, local populations, trade, wildlife, weather, transport, and combat.

This is a playable vertical slice of a living-world architecture, **not yet a fully simulated planet or a content-complete open-world RPG**. The feature and limitation lists below distinguish working systems from foundations that still need deeper simulation.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

**Windows static-server option:** double-click `run-static.bat`, then open `http://localhost:8000`. This loads Three.js r187 from jsDelivr, so it requires an internet connection.

Create a production build with:

```bash
npm run build
npm run preview
```

Run automated tests with:

```bash
npm test
```

## Controls

| Input | Action |
|---|---|
| `W A S D` / arrow keys | Move relative to the camera |
| `Shift` | Run while stamina remains |
| Mouse drag | Rotate camera through 360° |
| Mouse wheel | Zoom |
| `E` | Gather, speak, use a market, or harvest nearby wildlife |
| `F` | Send a resonance pulse to a nearby undiscovered waystone |
| `Space` | Strike a nearby hostile wisp |
| `R` | Mount or dismount a nearby horse, cart, or coastal skiff |
| `I` / `Tab` | Inventory and field crafting |
| `J` | Journey journal |
| `M` | Exploration chart |
| `G` | Local realm information |
| `C` | Character skills and training |
| `Esc` | Pause or close a panel |

## Implemented in v0.2.0

### World and geography

- The original global-coordinate terrain generator, deterministic seed behavior, continuous terrain meshes, chunk streaming, floating origin, and existing terrain generation version are preserved.
- `WorldIntelligence` adds deterministic regional identity labels, locally generated drainage/river ribbons, settlement suitability scoring, a starter settlement, and repeatable nearby settlement/road-link queries.
- The world actor layer renders river ribbons, procedural settlements, simple houses, wells, stalls, crop plots, road links, and travelling caravans.
- Existing chunk generation and instanced vegetation remain in place; the world does not switch to voxels or independent random terrain tiles.

### Civilizations and economy

- Settlements have persistent population, named residents, professions, a local leader, food stores, wealth, stability/prosperity, farms, workshops, and market stock.
- Resident NPCs use simple time-of-day work, market, and home destinations. Talking can increase a resident relationship.
- Known settlements advance in coarse daily steps rather than running every resident at full detail while far away.
- Markets support buying travel rations and selling moonleaf or game meat. Commerce skill affects prices; market wealth and stock constrain transactions.
- Nearby settlements can exchange a small amount of stock through deterministic coarse trade events.

### Ecosystems and world events

- Local biome-based wildlife populations include deer, boar, hare, foxes, wolves, goats, and cranes where suitable.
- Wildlife has deterministic local population cells, simple wandering/flee behavior, coarse daily population updates, harvesting rewards, and persisted harvest state.
- Time advances in-world. The weather sampler uses seed, location, time, and climate to select weather, temperature, wind, and seasonal conditions.
- Rain, storm, and snow have local particle visuals; fog, sky color, lighting, and tree foliage respond to current conditions and season.

### Travel and RPG

- The transport controller supports horse, cart, and shallow-water skiff modes with terrain/slope traversal constraints, travel-distance tracking, and mounted-state persistence.
- Character progression includes health, stamina, XP, levels, skill points, and training in foraging, tracking, endurance, commerce, navigation, and combat.
- Inventory, field crafting, a waystone quest chain, local markets, relationship records, and a basic hostile-wisp combat loop are functional.
- Wisp encounters are deterministic by world cell, have saved health/defeated state, can be struck, award XP/materials, and apply throttled contact damage. Combat is intentionally stylized and non-graphic.

### Persistence and compatibility

- The existing IndexedDB store and key structure are retained; v0.2.0 appends a `worldSystems` save object for civilization, ecosystem, transport, and combat state.
- Character fields are defaulted when missing, so older v0.1.0 saves remain loadable without changing the terrain-generation version.
- The current save includes player position, RPG progress, collected items, explored sectors, world time, settlement state, resident relationships, wildlife harvests/population cells, mount state, and defeated-enemy state.
- Mounted vehicles save their last world position and can be reconstructed when the player reloads far from the original settlement actor cache.

## Architecture map

| File | Responsibility |
|---|---|
| `src/main.js` | Existing application entry, lifecycle, input, update/render loop, and system integration |
| `src/world/noise.js` | Seeded gradient noise, fBm, ridged noise, and domain warping |
| `src/world/terrain.js` | Existing global terrain/climate sampler; generation version deliberately preserved |
| `src/world/biomes.js` | Biome classification and presentation metadata |
| `src/world/chunk.js` | Continuous terrain chunks, vegetation/rocks, water, waystones, and collectibles |
| `src/world/world-manager.js` | Chunk streaming, prioritized work, unloading, nearby interactions, and floating origin |
| `src/world/world-intelligence.js` | Deterministic regional queries, drainage ribbons, settlement placement, and road links |
| `src/world/world-actors.js` | Near-player settlement, NPC, wildlife, hostile, road, caravan, and vehicle visuals/updates |
| `src/world/weather-visuals.js` | Local weather particle field |
| `src/entities/player.js` | Player controller, terrain following, and mounted movement profiles |
| `src/systems/rpg.js` | Character stats, skills, inventory, crafting, XP, and quests |
| `src/systems/civilization.js` | Settlement economy, named residents, relationships, coarse simulation, and trading |
| `src/systems/ecosystem.js` | Habitat populations, coarse ecological updates, harvest, and persistence |
| `src/systems/weather.js` | Deterministic location/time/season weather sampling |
| `src/systems/transport.js` | Horse/cart/skiff mode, traversal rules, and mounted state |
| `src/systems/combat.js` | Deterministic hostile encounters, strike/damage/recovery, and defeat persistence |
| `src/systems/persistence.js` | IndexedDB saves with localStorage fallback |
| `src/ui/interface.js` | Existing menu/HUD/panels plus market, crafting, realm, and skill actions |
| `tests/world-generation.test.js` | Original terrain and quest regression tests |
| `tests/world-systems.test.js` | Living-world, persistence, transport, weather, trade, skills, and combat tests |

## Known limitations — not yet complete

The systems above are foundations and local simulations. The following requirements from the long-term project vision remain incomplete:

- **Hydrology:** generated river ribbons/channels are deterministic and queryable, but there is not yet a full drainage-basin graph with tributaries, lakes, waterfalls, floodplains, ocean mouths, erosion, and watershed validation. Regional identity labels are coarse procedural labels, not plate-tectonic or connected-component continent classification.
- **Civilization scale:** daily simulation is coarse and applies to settlements that have been discovered/registered. Undiscovered settlements are generated when queried/visited; the entire infinite world is not running a background civilization simulation. NPC routines are simple local movement targets, not full needs-based schedules or robust navigation/pathfinding. Leadership and faction reputation data are foundations, not a complete political simulation.
- **Trade and roads:** markets and stock transfers work at a simplified resource level. Road and caravan visuals connect nearby settlements, but roads are not yet slope/water-aware navigation graphs; bridge engineering, cargo manifests, route risk, and ship trade schedules are absent.
- **Transportation:** horse, cart, and skiff are functional player movement modes with basic traversal constraints and saved mount state. They do not yet have rigid-body physics, sailing/wind handling, crew, autonomous ship route networks, or full vehicle navigation. The skiff is a coastal/shallow-water prototype, not a complete open-ocean sailing system.
- **Ecology:** biome-based wildlife, local population persistence, wandering/fleeing, and harvesting work. Full predator/prey food webs, realistic migration, breeding by species, fishing, hunting tools, and ecosystem effects on settlement economies remain future work.
- **Weather:** weather is deterministic and climate-aware at a regional/time scale; it is not a global atmospheric simulation. There is no persistent snow accumulation, soil moisture, erosion response, storm front simulation, or full environmental damage model.
- **RPG content:** the game has functional skill progression, inventory, crafting recipes, trading, a small quest chain, and a basic wisp encounter. It does not yet have a broad equipment/loot catalog, functional armor and weapon progression UI, faction questlines, dungeons, bosses, companions, or a complete combat AI/tactics system.
- **Performance:** chunk streaming and local actor refresh limit active world content, and vegetation uses instancing. Web Workers, terrain LOD meshes, hierarchical occlusion culling, GPU profiling, and measured hardware frame-rate targets are not implemented yet.
- **Browser verification:** automated logic tests and source checks are included, but a full interactive browser playthrough and production-bundle test still need to be run in an environment where npm dependencies can be installed.

## Verification status for this source package

- `npm test`: **21 tests passing** (terrain, generation determinism, world-intelligence queries, civilization persistence/simulation/trade, wildlife persistence, weather/seasons, transport, old-save migration/crafting, skills, and combat).
- JavaScript syntax checks: passed across all source and test files.
- Relative import checks: all local JavaScript imports resolve.
- `package.json`: valid JSON.
- `npm run build`: **not verified**. The environment did not have `vite` installed; the preceding `npm install` attempt could not reach the npm registry (`EAI_AGAIN`). Install dependencies locally before treating a production build or browser run as validated.
