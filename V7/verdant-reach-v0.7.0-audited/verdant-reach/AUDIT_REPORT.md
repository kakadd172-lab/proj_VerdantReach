# Verdant Reach v0.7.0 — Post-release audit

## Scope

This audit rechecked the actual v0.7.0 source tree, existing automated tests, deterministic world plans, city/castle geometry inputs, regional road routing, teleport destination ordering, HTML contracts, module syntax/imports, representative multi-seed placement and local static-server responses. It did not replace the project or change its game version or terrain-generation version.

## Issues found and corrected

### Free-city layout and geometry

1. **Coordinate-space mismatch in collision tests.** Some building footprints were local to the city while road/landmark footprints were world-relative. The collision protection was therefore ineffective away from the world origin. All comparisons now use one consistent world-coordinate space.
2. **Residential overlaps.** Houses could intersect other houses, major civic buildings and street corridors. Placement now checks oriented footprints before accepting a house.
3. **Roads through civic buildings.** The street plan crossed some landmark footprints. Landmark positions and the road network were corrected, and geometry tests now prove road/landmark and landmark/landmark footprints do not intersect for the audit seed.
4. **Disconnected gate approaches.** The four main avenues previously stopped short of their wall gates. They now terminate at the actual deterministic gate centres.
5. **Oversized wall openings.** A prior gate-gap condition could remove too much of a polygon wall edge. The renderer now removes only short wall panels at each gate. A renderer-matched test confirms exactly two short panels are omitted at each of the four gates in the audit seed.
6. **Towers on gates.** Two of the ten wall towers were too close to gate vertices. Tower placement now selects positions between gates.
7. **City walls below sea level.** The city site check sampled an approximate radius and could miss actual jittered wall vertices or the terrain between them. It now samples the same seeded wall polygon and intervening segments used by the model.
8. **Floating/cutting city geometry.** Long wall, street and field meshes crossed uneven terrain as single slabs. They now use short terrain-following panels. Buildings use centre/corner elevation ranges and low plinths; steep or highly uneven house sites are rejected.
9. **Poor agricultural sites.** Farm plots could overlap each other, sit on wet ground or occupy steep terrain. Field sites are relocated deterministically and checked at their centre and rotated corners. Unsuitable plots are omitted, so the final count varies by terrain; the 16-seed audit sample produced 11–14 plots in cities that were placed.
10. **Incorrect settlement metadata.** The saved city building count could disagree with the generated city plan. It now uses the actual generated count. Repeated plan requests are cached per settlement and generator.
11. **Regional roads crossing city walls.** The regional road graph previously routed to the city centre, which could make a route intersect the curtain wall away from a gate. Routes now use the gate facing the connected settlement and start/end outside the wall. A multi-seed regression test validates the gate endpoints.

### Ruined castles

1. **Stale footprint metadata.** The ruin record previously reported a 174 m radius despite the enlarged fortress using a 238 m nominal radius. Metadata now reports 238 m.
2. **Insufficient site sampling.** The castle site selector now checks the actual seeded outer/inner walls, moat, barbican and keep footprint, including terrain between polygon vertices.
3. **Flat keep and wall sections.** Long flat wall meshes could float or cut through slopes. Curtain walls, moat segments, barbican and keep facades now use short terrain-following panels.

### Three.js runtime compatibility

1. **Deprecated frame timer.** The game still instantiated `THREE.Clock`, producing the deprecation warning reported during v0.6 testing. The animation loop now uses `THREE.Timer`, connects it to the document visibility lifecycle and updates it with the animation-frame timestamp before reading delta time.
2. **Removed soft shadow enum.** The renderer still selected `THREE.PCFSoftShadowMap`, which has been removed/deprecated in the current Three.js line. It now selects `THREE.PCFShadowMap`.

### Creative teleport and test-world compatibility

1. **Teleport water destinations.** Waterfall and lake entries are kept as independent destination records rather than one overwriting the other.
2. **Search distance.** Destination results are filtered by actual straight-line distance after their rectangular spatial query.
3. **Nearest natural teleport destination.** The search previously stopped scanning part of each later grid row after it had found one candidate of each natural type. It now scans the complete bounded grid and retains the closest candidate per type.
4. **World landmark persistence on resume.** `WorldIntelligence` was being anchored to the player's saved current position. After a long journey, this could relocate the procedural starter settlement, free city and regional ruin on reload. It now uses the persisted `worldStartPosition`; a regression test checks stable coordinates after a simulated distant resume.
5. **Wayfarer's Circuit.** Its fixed player landing remains `(-786, -251)`. Regression checks confirm the prepared test region still has a nearby free city and abandoned castle.

## Multi-seed audit observations

Sixteen deterministic seeds (`AUDIT-01` through `AUDIT-16`) were sampled after the placement fallback was added. Fifteen produced a regional free city and all sixteen produced a regional ruined castle.

- Residential building counts in the 15 generated cities: **841–900**.
- Suitable outer agricultural plots: **11–14**, depending on local terrain suitability.
- Regional city distance from the spawn: **2.21–10.61 km**.
- All generated city records report the actual plan building count. Mean `WorldIntelligence` construction time was about **333 ms** in this Node test environment; this is a CPU sample, not a browser frame-rate result.
- The Wayfarer's Circuit keeps the fixed landing and prepared tutorial route.

One of the sixteen sampled seeds (`AUDIT-13`) did not produce a suitable free city within the local/fallback search radius. A nearby free city is therefore common but not guaranteed in every starting region; unsuitable coastal or steep sites continue to be rejected. This is a procedural placement outcome, not a deterministic-generation error.

## Verification results

- **75/75 automated tests passed** (`npm test`).
- All **38** JavaScript source/test modules pass `node --check`.
- All relative JavaScript imports resolve.
- `index.html` parses; it contains **60 unique IDs and no duplicates**.
- Local static HTTP checks returned **200** for the page, main entry point, settlement model, settlement layout and landform module.
- ZIP integrity is checked in the release packaging step. A separate gate-to-gate road regression test now associates path endpoints with the actual sorted `link.a` / `link.b` order, avoiding a false failure when the spanning-tree root is not the first test fixture passed by the caller.

### Not verified

- `npm run build` cannot run in this environment because the Vite executable is absent (`vite: not found`). The Three.js package is also absent from local `node_modules`, and the earlier npm registry connectivity issue prevented installing dependencies.
- A complete graphical browser playthrough, WebGL visual inspection and frame-rate profiling have not been completed. The static server check proves the files are served, not that the full browser scene renders correctly.

## Remaining limitations / items not to mistake for finished systems

- Cities have hundreds of rendered building forms but do **not** have hundreds of individually simulated/animated residents. The civilization model keeps a smaller persistent named-NPC population to control simulation cost.
- City models are stylized procedural low-poly models, not handcrafted architectural reconstructions with full accessible interiors.
- Ravines and cliffs are continuous heightfield formations. True overhangs, caves and undercuts are not implemented by a heightfield.
- River paths use the existing deterministic downhill channel/drainage field. This is not a full physical watershed, sediment transport or erosion solver.
- Regional A* roads now connect the active settlement network through Free City gates. A precomputed planet-scale trade-road graph covering every distant city is not yet implemented.
- Distant settlement simulation remains coarse/statistical. No measured large-scale NPC/ship/wildlife frame budget is available yet.
- A free city has seven persistent named NPC agents; the rest of its large population is represented statistically rather than as visible individual residents.
- Player movement has no static colliders for houses, city walls, castle structures or large rocks. Players can pass through these models. The teleport landing search checks dry, moderate-slope terrain but does not test structure overlap.
- Terrain LOD, occlusion culling and worker-based background mesh generation remain unfinished performance work.

## Files modified by the audit

- `src/world/settlement-layouts.js`
- `src/world/world-intelligence.js`
- `src/world/settlement-models.js`
- `src/main.js`
- `tests/realms-wildlands-v07.test.js`
- `README.md`
- `UPGRADE_REPORT.md`

No save database schema or terrain-generation version was changed by this post-release audit.


## Current post-audit status

The audit fix set changes `src/world/world-intelligence.js`, `src/main.js`, `tests/realms-wildlands-v07.test.js`, `README.md`, `UPGRADE_REPORT.md` and `AUDIT_REPORT.md`. The earlier geometry and placement fixes in `src/world/settlement-layouts.js` and `src/world/settlement-models.js` remain part of the audited v0.7.0 source. No persistent save schema was changed.
