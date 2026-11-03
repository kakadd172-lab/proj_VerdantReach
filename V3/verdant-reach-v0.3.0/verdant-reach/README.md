# Verdant Reach — Living World Expansion (v0.3.0)

Verdant Reach is an original, non-voxel, browser-based 3D fantasy RPG prototype built on Three.js. Version 0.3.0 upgrades the existing v0.2.0 project in place. It retains the original terrain generator, streamed chunk renderer, player/camera controls, RPG progression, IndexedDB save store, and world-generation version while deepening geography, roads, civilization simulation, wildlife ecology, and persistent trade.

This is a playable living-world prototype, **not yet a fully simulated planet or content-complete open-world RPG**. The implementation and remaining limitations are separated below.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

**Windows static-server option:** double-click `run-static.bat`, then open `http://localhost:8000`. This loads Three.js r187 from jsDelivr and requires an internet connection.

Production build:

```bash
npm run build
npm run preview
```

Automated tests:

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

## Implemented in v0.3.0

### Geography and hydrology

- The original visible terrain sampler and `WorldGenerator.version` are retained. A separate smoothed drainage-height field lets water-routing logic ignore high-frequency surface bumps without changing existing terrain elevations.
- River traces are deterministic from global source cells, continue downstream through neighboring terrain samples, and can terminate at ocean outlets or generated basin lakes. Lake geometry is included in the river-water mesh.
- Climate samples now expose wind exposure and a broad upwind rain-shadow term. Temperature remains elevation/latitude-aware, while rainfall contributes to biome classification.
- Continent/region naming now uses deterministic nearest-anchor regions at a continental scale instead of selecting a random label independently in every small region cell. This is a procedural regional identity system, not tectonic plate simulation or a perfect connected-landmass classifier.
- Road links use deterministic A* over a terrain cost field. Slope and high elevation raise travel cost; deep water is avoided. Route geometry follows the path and can place bridge decking at generated river crossings. A bounded deterministic corridor fallback is used where the path search cannot find a route.

### Civilizations and settlement life

- Settlement state retains population, food, grain, wealth, stability, prosperity, stock, farms, workshops, leadership, and named residents.
- NPC schedules now differ by profession: farmers work fields, traders staff the market, fishers visit the shore, guards patrol, and other workers use profession-specific work areas. Residents return home or gather at the commons at appropriate hours.
- Daily settlement simulation accounts for seasonal farming, fishing yields, consumption, workshops, market stocks, and economic changes.
- Under sustained food stress, a settlement can send a non-leader resident to a nearby known settlement with better food reserves. The resident's identity is preserved, the destination assignment and offsets are updated, and migration events are saved.
- The actor layer reconciles resident identities after migration so one NPC is not rendered twice when both towns are loaded.

### Trade and transport networks

- Nearby settlements are linked with a deterministic minimum spanning road network rooted near the local network centre, avoiding duplicate nearest-neighbour road segments.
- Persistent cargo convoys transfer actual market stock (rations, fish, herbs, and timber). Goods are removed from the origin at departure, payment is reserved at dispatch, and goods/payment are settled on arrival.
- Convoy contracts, route IDs, cargo manifests, departure/arrival days, and delivery status survive saves. Unloaded destinations still receive completed shipments when the coarse simulation advances.
- Active cargo convoys are rendered on their road path with visible cargo crates. Existing player horse, cart, and skiff modes remain unchanged.

### Ecosystems

- Habitat cells now track food and water indices, carrying capacity, predator pressure, seasonal migration drift, and population state.
- Predators can pursue nearby prey; prey flee from nearby predators. A successful predation event removes a prey animal from the persisted population without awarding player loot.
- Harvested and predated wildlife IDs, population pressure, and predation totals are saved. Existing wildlife IDs remain compatible with v0.2.0 saves.

### RPG, weather, and persistence

- Existing player movement, camera, skills, inventory, crafting, markets, quests, weather visuals, combat, and mounted transportation are retained.
- Existing IndexedDB database/store names and key structure are unchanged.
- The save version is now `0.3.0`; the terrain generation version is unchanged. Optional migration, cargo-convoy, expanded ecosystem, and climate data are added with defaults for old records.

## Architecture map

| File | Responsibility |
|---|---|
| `src/main.js` | Application lifecycle, update/render loop, save integration, and system coordination |
| `src/world/noise.js` | Seeded noise, fBm, ridged noise, and domain warping |
| `src/world/terrain.js` | Existing terrain/climate sampler plus separate smoothed drainage-height sampler |
| `src/world/biomes.js` | Biome classification |
| `src/world/chunk.js` | Continuous terrain chunks, vegetation, water, waystones, and collectibles |
| `src/world/world-manager.js` | Chunk streaming, work queue, unloading, interactions, and floating origin |
| `src/world/world-intelligence.js` | Continental/region identities, deterministic rivers/lakes, settlement placement, A* road routes, and bridge intersections |
| `src/world/world-actors.js` | Settlement buildings, resident actors, wildlife, hostiles, vehicles, roads, bridges, and cargo caravans |
| `src/world/weather-visuals.js` | Local weather particle field |
| `src/entities/player.js` | Player controller, terrain following, and mounted movement profiles |
| `src/systems/rpg.js` | Character stats, skills, inventory, crafting, XP, and quests |
| `src/systems/civilization.js` | Settlement economy, NPC schedules, migration, resident relationships, and persistent cargo shipments |
| `src/systems/ecosystem.js` | Habitat cells, carrying capacity, predator pressure, migration drift, predation, harvesting, and persistence |
| `src/systems/weather.js` | Deterministic location/time/season weather sampling |
| `src/systems/transport.js` | Horse/cart/skiff modes, traversal rules, and mounted state |
| `src/systems/combat.js` | Deterministic hostile encounters, strikes, damage/recovery, and defeated-state persistence |
| `src/systems/persistence.js` | IndexedDB saves with localStorage fallback |
| `src/ui/interface.js` | Existing menu/HUD/panels plus inventory, market, realm, character, and skill actions |
| `tests/world-generation.test.js` | Terrain, seed, biome, and quest regression tests |
| `tests/world-systems.test.js` | Persistence, geography, routes, civilization, trade, ecology, weather, transport, and combat tests |

## Known limitations — not yet complete

- **Hydrology:** rivers are deterministic continuous traces with generated lake basins and ocean terminals, but there is no globally solved flow-accumulation grid, guaranteed tributary hierarchy, validated outlet for every stream, realistic waterfalls, floodplains, erosion, or groundwater simulation. Some lowland traces may terminate inland without a lake.
- **Continents:** nearest-anchor identities provide stable broad regional names; they do not guarantee that every contiguous landmass receives exactly one identity or that islands are assigned by plate geology.
- **Settlements:** building placement is procedural and terrain-filtered, but layouts are still compact radial clusters rather than fully developed street/block plans. Road routes are local and fallback corridors are not guaranteed to be bridge-engineered across every water feature.
- **Civilization scale:** daily simulation applies to settlements that have been discovered/registered. It is not a background simulation of every possible settlement in the infinite world. Migration is a coarse identity-preserving transfer, not a full migration journey with needs, route hazards, or family units.
- **Trade:** shipments persist and transfer real stock between known markets, but there is no route-risk model, bandit interception, caravan escort, ship cargo route, or dynamic commodity pricing by region.
- **Transportation:** horse, cart, and skiff movement remain the existing kinematic controller modes. They do not yet have full rigid-body physics, wind-driven sailing, crew, autonomous open-ocean navigation, or maritime trade schedules.
- **Ecology:** predator pursuit, prey flight, seasonal drift, carrying capacity, predation, and harvesting are implemented at local-cell scale. There is no full species-specific breeding model, long-distance migration corridors, fishing simulation, or ecosystem feedback into settlement production.
- **Weather:** weather remains deterministic and local/time-sampled. There is no global storm-front advection, persistent snow accumulation, soil moisture simulation, or terrain erosion response.
- **RPG content:** equipment, factions, dungeons, advanced enemy tactics, companion systems, larger questlines, and full combat depth remain future work.
- **Performance:** chunk streaming, instanced vegetation, local actor refresh, bounded A*, and coarse distant simulation remain in place. Web Workers, multi-resolution terrain LOD, occlusion culling, a dedicated simulation LOD scheduler, and measured GPU profiling targets are not yet implemented.

## Verification status

- `npm test`: **27 passed, 0 failed**.
- JavaScript syntax checked for the app modules and tests.
- Relative import paths checked against the source tree.
- Package metadata and ZIP integrity checked.
- `npm run build` was attempted but could not run because Vite is not installed in this environment. Network access to the npm registry was unavailable, so dependencies could not be installed here.
- A full browser playthrough, rendered screenshot review, and real-hardware performance measurement remain unverified.
