# Verdant Reach v0.7.0 — Upgrade Report

## Summary

Version 0.7.0 expands the existing v0.6.0 project with larger free cities, expanded ruined castles, improved global landform signals, stronger terrain decoration, and a grouped Creative teleport selector. The upgrade retains the current Three.js game loop, seeded world coordinates, chunk streaming, save database, Creative/Survival modes, historical ship catalog and sailing foundations.

## Implemented

### Large free cities

- Approximately 1.02 km nominal diameter, 510 m radius.
- Deterministic irregular city plan containing 800+ houses in eligible regions (841–900 across 15 generated cities in a 16-seed audit sample), eight major landmarks, four gates, ten wall towers, 104 road segments and 11–14 suitable outer agricultural plots, depending on terrain suitability.
- Major civic/religious forms: cathedral, guildhall, council hall, market hall, bell tower, river exchange, mint and arsenal.
- Four radial gates and outer wall segments; city streets include radial connections and two ring roads. Regional A* trade roads now select the gate facing the connected settlement and join the road at the gate instead of routing through the city centre.
- Shared instancing batches reduce draw-call growth; the model is created once per loaded settlement actor and removed when streamed out.
- `buildingCount` metadata is computed from the generated layout instead of using a stale smaller estimate.
- Free-city population/economy uses the existing civilization system and food-production normalization.

### Larger abandoned castles

- Nominal footprint radius 238 m (approximately 476 m across).
- 24-point outer curtain wall, 16-point inner ward, 10-point barbican, 12 wall towers, 4 deterministic breaches, 64 rubble groups, dry moat ring and a 58 × 54 × 48 m roofless keep.
- Ruin teleport approach is moved outside the enlarged outer wall.

### Terrain / wildlands

- Reuses global-coordinate deterministic signals in `src/world/landforms.js` for mountain ridge spines/massifs, ravine lines, escarpment/cliff bands, meadows, floodplains and field suitability.
- Terrain surface tint now responds to floodplain potential as well as slope, rock exposure, ravine intensity and field suitability.
- Instanced rock outcrops are concentrated on exposed mountain, ravine and cliff shoulders.
- Existing grass, flowers and small crop patches remain seeded by chunk coordinate and respond to biome/field suitability.
- Existing river/waterfall/lake data is surfaced in the Creative travel selector.
- The terrain generation version is `vr-terrain-04`; existing saved seeds and coordinate-based edits remain stored. Terrain newly generated/reloaded under v0.7 uses the new height field and may therefore differ slightly from previous terrain in affected locations.

### Creative teleport

- Grouped destination categories: Free Cities, Ports, Markets, Villages, Abandoned Castles, Mountain Overlooks, Ravines & Gorges, Cliff Faces, Grasslands & Fields, River Valleys, and Waterfalls & Lakes (only where present nearby).
- Search radius used by the Creative panel is 18 km.
- Settlement and ruin candidates are filtered by actual Euclidean distance after their rectangular spatial query.
- River, lake and waterfall destinations are selected deterministically from the existing river system.
- The existing teleport landing search chooses safe nearby land rather than teleporting directly into the destination geometry or a water surface.

### Wayfarer's Circuit compatibility

- The built-in `WAYFARER-TEST-040` spawn remains anchored at (-786, -251), preserving the prepared test route and its staged tasks.
- The existing scenario settlement, river and road tests remain in the suite. The regional road graph preserves the Wayfarer test area's original fixed landing, and regional landmarks are anchored to the saved world-start coordinate when a world is resumed.

## Verification

- **75/75 automated tests passed**, including the existing v0.6 gameplay coverage and new v0.7/audit tests for city plan determinism/scale, castle footprint/wards/keep, terrain conformance, multi-seed city placement, gate-connected regional roads, nearest natural teleport destinations, grouped teleport categories and UI wiring, original-world anchor stability, regional gate-to-gate roads, nearest-landmark selection and current Three.js Timer/shadow APIs.
- All 38 JavaScript source/test modules passed `node --check`; all relative imports resolve; the HTML parser found 60 unique IDs with no duplicates. Deprecated `THREE.Clock` and `THREE.PCFSoftShadowMap` use has been removed in favor of `THREE.Timer` and `THREE.PCFShadowMap`.
- All relative imports resolved.
- Static HTTP smoke check returned HTTP 200 for `index.html`, `src/main.js`, `src/world/settlement-models.js`, `src/world/settlement-layouts.js` and `src/world/landforms.js`.
- **Production Vite build not verified:** `npm run build` could not start because the Vite executable is not installed (`vite: not found`); the `three` package is also unavailable in local `node_modules`. A complete graphical browser playthrough is not verified. The local headless Chromium attempt could not initialize its graphics stack, so this is not a claim that the browser scene rendered successfully.

## Not fully implemented

- Cities are large stylized procedural models, not individually handcrafted historical reconstructions.
- The population system keeps exactly seven named actor agents per free city rather than rendering every resident of a 4,000–12,000 population city.
- The player controller has no static collision for city houses, walls, castle walls or large rocks; movement currently checks terrain only.
- Ravines and cliffs are heightfield forms; true overhang meshes, caves and physically simulated erosion remain future work.
- v0.7 does not replace the river generator with a fully simulated watershed solver; river paths, lake basins and waterfall placement remain part of the existing deterministic channel architecture.
- Terrain LOD, full occlusion culling and background worker-based mesh generation remain future performance milestones.

## Post-release audit addendum

The source was re-audited after the original v0.7 package. Corrections include city-local/world-coordinate collision consistency, civic-footprint and street clearance, terrain-following city/castle construction, gate-sized wall openings, gate-connected regional roads (including city-to-city routes), nearest-per-category Creative teleport selection, stable original-world landmark anchoring on resume, and migration to the current Three.js timer/shadow APIs. See `AUDIT_REPORT.md` for the full findings and limitations.
