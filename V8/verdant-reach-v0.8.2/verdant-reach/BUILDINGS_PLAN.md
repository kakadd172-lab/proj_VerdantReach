# Verdant Reach v0.8.3 — Building Models and Architecture Plan

## Goal
The next release is a dedicated architecture and settlement-model pass. v0.8.2 changes roads only; the current building catalogue and meshes remain intact until this plan is implemented.

## Scale and proportion rules
Use the player as the scale reference, with a typical adult character height of about 1.7–1.8 m. These are game-world modelling targets, not universal historical measurements:
- Door clear height: about 1.8–2.0 m; width about 0.8–1.1 m.
- Ground-floor room height: about 2.4–3.0 m; upper floors about 2.2–2.7 m.
- Small rural dwelling: roughly 5–8 m wide, 7–11 m deep, one storey plus roof; wall/eaves height about 2.8–4 m.
- Townhouse: roughly 6–10 m wide, 8–14 m deep, two or three storeys.
- Workshop or inn: roughly 8–12 m wide and 10–16 m deep, with larger doors and service yards.
- Warehouse or granary: roughly 10–16 m wide and 14–24 m deep, with tall ground-floor openings and loading access.
- Civic hall: larger footprint, but doors, stairs, windows and occupants must still use the same human scale.

## Architectural families
1. Timber-framed houses with visible posts, braces, infill panels, overhanging upper floors and locally appropriate roof pitches.
2. Stone and lime-mortar masonry houses with deep-set windows and durable plinths.
3. Earth/adobe or wattle-and-daub buildings with plastered surfaces, timber lintels and weather-protective eaves.
4. Coastal port buildings with salt-weathered timber, shutters, raised storage floors and broad loading doors.
5. Farmsteads with a dwelling, byre/stable, barn, fenced yard, well and crop/storage structures.
6. Distinct inns, workshops, smithies, bakeries, warehouses, guild halls, town halls, chapels and religious buildings.

## Modelling rules
- Establish one shared human-scale measurement system for doors, stairs, windows, floors, railings, furniture and NPCs.
- Model visible wall thickness at doors and window reveals rather than drawing openings as decals on a paper-thin facade.
- Roof pitch and covering should vary with local rainfall, wind exposure and available material.
- Foundations should sit on sampled terrain. Small unevenness can use a plinth; steep or highly irregular sites should be rejected or terraced rather than floating.
- Building collision footprints must match visible geometry, and doors/porches must remain accessible from streets.
- Use instancing or merged geometry for repeated structural parts; dispose of owned geometries when streamed settlements unload.
- Keep silhouettes readable at a distance and reserve joinery, roof edges, shutters, beams and masonry for closer LODs.

## Historical material guidance
Historic England's traditional-building guidance describes historic materials such as earth, stone, brick and timber, and explains that construction methods and roof forms reflect local climate, available materials, craft skills, wealth and local practice. This supports regional variation rather than a universal building kit.

References:
- Historic England, *Properties of Traditional Building Construction*: https://historicengland.org.uk/advice/technical-advice/retrofit-and-energy-efficiency-in-historic-buildings/traditional-buildings-and-energy-efficiency/properties-of-traditional-building-construction/
- Historic England, *Traditional Buildings and Energy Efficiency*: https://historicengland.org.uk/advice/technical-advice/retrofit-and-energy-efficiency-in-historic-buildings/traditional-buildings-and-energy-efficiency/
- Historic England, *Practical Building Conservation: Roofing*: https://historicengland.org.uk/images-books/publications/roofing-conservation/roofing-marketing-spread/

## v0.8.3 implementation checklist
- [ ] Build a modular house kit: foundation, plinth, walls, floors, posts, lintels, doors, windows, shutters, roof frame and roof covering.
- [ ] Add at least four architectural families and several roof variants.
- [ ] Add distinct models for inns, workshops, smithies, bakeries, granaries, warehouses, stables, barns, halls and chapels.
- [ ] Replace generic scale with character-relative measurements and validate every model against the player.
- [ ] Add terrain-aware building placement and footprint slope/relief tests.
- [ ] Add collision footprints and accessible entrances.
- [ ] Add settlement density/wealth/biome rules so villages, market towns, ports and fortified cities have different silhouettes.
- [ ] Add deterministic seed tests for proportions, non-overlap, placement and model bounds.
- [ ] Add visual review scenes for rural, urban, coastal, upland and marsh settlements.

## Source caution
Historical architecture varied substantially by region, period, wealth, available materials and building use. The dimensions above are game-design targets to establish scale; they should be refined against specific reference buildings once the game's principal culture and historical period are fixed.