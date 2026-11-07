# Historical ship-model research audit

**Research date:** 7 November 2026  
**Scope:** `ForTests/` only. This audit covers every generator registered in `ships/index.js`.

## Acceptance standard

A model only counts as an imported fleet asset when its complete model file is available, the model is actually the named vessel class, its design is compatible with the requested historical period, its licence permits the intended game use, and the actual mesh has been inspected locally. A search result, render, museum photo, cross-section, web viewer, or generator screenshot does not satisfy those checks.

The requested visual target is wooden Age-of-Sail vessels broadly from the 1600s through the 1800s, with convincing proportions and a useful hierarchy of hull, deck, masts, spars, sails and rigging. Models outside that period may be useful for study but are not counted as final assets.

## Candidate models reviewed

| Candidate | What the source actually establishes | Licence / format | Decision |
|---|---|---|---|
| [Caravel Ship — Ginny Sutton](https://sketchfab.com/3d-models/caravel-ship-c9819a0e8a57429f888b74978219fb7a) | Explicitly based on a 15th-century Portuguese caravel; 75.7k triangles and 38.9k vertices | CC BY; Sketchfab page offers a model download | **Type-specific reference only.** It predates the requested 1600s–1800s period and its file has not been imported or inspected locally. Creator attribution is required. |
| [Chinese Junk Ship — Nisa Nurul Azizah](https://sketchfab.com/3d-models/chinese-junk-ship-a331d56c34ff4d958763114dc8e7c275) | Described as a Chinese merchant vessel travelling to Sumatra during the Sriwijaya period; 23.4k triangles and 11.8k vertices | CC BY; Sketchfab page offers a model download | **Type-specific reference only.** The stated historical context is earlier than the requested period. The file has not been imported or inspected locally. Creator attribution is required. |
| [Ship Model of a Sailing Merchant Vessel — Smithsonian](https://www.si.edu/object/ship-model-sailing-merchant-vessel:nmah_1314306) | Museum record describes a commonplace three-masted, square-rigged cargo-vessel model associated with 19th-century sailing; the physical model was made circa 1910–1920 | CC0 metadata; museum object record, not a downloadable 3D ship file | **Visual/history reference only.** It is not a model file that can be imported into Shipyard Studio. |
| [Merchant Schooner 3 — gogiart](https://sketchfab.com/3d-models/merchant-schooner-3-4be7f7564de947a0ad3fb57a54292c3b) | Source explicitly says the ship is fictitious; 479.4k triangles | CC BY; download includes OBJ and DAE | **Rejected as a historical match.** The licence is not the issue; the model is fictional and has no verified period/vessel reconstruction. |
| [18th Century Merchant Ship — Open3DModel listing](https://open3dmodel.com/3d-models/3d-model-18th-century-merchant-ship_109474.html) | Listing claims an 18th-century merchant ship | 3ds Max/V-Ray only; listing states personal or education use | **Not accepted.** It does not provide a game-compatible glTF/GLB file, and the stated terms are not sufficient for the game's intended distribution. |

## Generator-by-generator coverage

The following list matches the live registry in `ships/index.js` exactly.

| Generator | Current asset status |
|---|---|
| `sloop` | No accepted, period-verified model file yet. |
| `schooner` | A downloadable model labelled “Merchant Schooner 3” was reviewed, but its creator says it is fictional; rejected as a historical match. |
| `brigantine` | No accepted, period-verified model file yet. |
| `brig` | No accepted, period-verified model file yet. |
| `snow` | No accepted, period-verified model file yet. |
| `cutter` | No accepted, period-verified model file yet. |
| `frigate` | No third-party model is being sourced for this combat-class entry in this pass. |
| `barque` | A Smithsonian record is useful historical context, but it is an object record rather than a downloadable 3D ship file. |
| `caravel` | A real 15th-century Portuguese caravel model is available under CC BY; it is earlier than the target period and is reference-only for now. |
| `carrack` | No accepted, period-verified model file yet. |
| `galleon` | No verified civilian merchant galleon file accepted yet. |
| `fluyt` | No accepted complete, downloadable, period-verified fluyt model file yet. |
| `xebec` | No accepted, period-verified civilian merchant model file yet. |
| `junk` | A Chinese merchant junk model is available under CC BY, but its stated context is earlier than the target period; reference-only for now. |
| `first-rate` | No third-party model is being sourced for this combat-class entry in this pass. |
| `pinnace` | No accepted, period-verified model file yet. |

## Current repository state

- The three earlier modern demo models (recreational yacht assembly, fishing trawler and motor cruiser) have been removed from the default preset gallery.
- The procedural generators remain available.
- The local GLB/glTF importer remains available.
- External source pages are documented separately from local imports.
- **No external model binary has been committed as a historical preset in this pass.** That distinction is intentional: the actual files were not obtained and inspected here.

## What is required before a candidate becomes a preset

1. Obtain the complete downloadable model file and any companion textures/buffers.
2. Confirm the exact ship type and period from the creator or reliable historical source.
3. Check the licence and record any attribution.
4. Open the actual file in Shipyard Studio and inspect front, rear, both sides, top and three-quarter views.
5. Check that the hull, deck, masts, sails and rigging have a useful editable hierarchy.
6. Optimise file size and mesh complexity for browser/game use without damaging the silhouette.
7. Add the verified file under `ForTests/`, register it as a preset, and capture a new browser screenshot.

Until those checks are complete, it remains a research candidate—not an imported ship.
